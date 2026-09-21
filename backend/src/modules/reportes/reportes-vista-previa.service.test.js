// Vista previa (CU-REP-01, fase 5): BD falsa que registra cada operación, carpeta temporal para la rúbrica,
// sin BD real, Redis, red ni TSA.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');

const { generarVistaPreviaReporteMensual } = require('./reportes-vista-previa.service');
const { guardarRubrica } = require('./reportes.rubricas');
const { crearBdReporte, ahoraMx } = require('./reportes.vista-previa.fixtures');
const { crearPng, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');
const { MOTIVOS_BLOQUEO } = require('./reportes.shared');

const RUBRICA = crearPng(500, 180);

// Escenario con rúbrica ya registrada (por el flujo real de la fase 4) y carpeta temporal.
async function escenario(t, opciones = {}, { conRubrica = true } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'vista-previa-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const bd = crearBdReporte(opciones);
  if (conRubrica) await guardarRubrica(7, { buffer: RUBRICA }, { prisma: bd.prisma, rutaBase: base, ip: '10.0.0.1' });
  bd.operaciones.length = 0; // solo interesa lo que hace la vista previa
  const deps = { prisma: bd.prisma, ahora: bd.ahora, rutaBase: base };
  // Sin argumentos usa las actividades de ejemplo; con argumento (incluso undefined) usa exactamente ese valor.
  const vistaPrevia = (...args) => generarVistaPreviaReporteMensual(7, args.length ? args[0] : ACTIVIDADES_EJEMPLO, deps);
  return { ...bd, base, deps, vistaPrevia };
}

const archivosEn = (base) => fs.readdirSync(base, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name));

function textoDelPdf(buffer) {
  const archivo = path.join(os.tmpdir(), `vp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
  fs.writeFileSync(archivo, buffer);
  try {
    const r = spawnSync('pdftotext', ['-layout', archivo, '-'], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout : null;
  } catch {
    return null;
  } finally {
    fs.rmSync(archivo, { force: true });
  }
}

// Espías: la vista previa no debe escribir en disco ni tocar la red (TSA).
function vigilarEfectos(t) {
  const espias = {
    escrituras: [
      t.mock.method(fs.promises, 'writeFile'), t.mock.method(fs.promises, 'appendFile'), t.mock.method(fs.promises, 'mkdir'),
      t.mock.method(fs.promises, 'rm'), t.mock.method(fs.promises, 'unlink'), t.mock.method(fs.promises, 'rename'),
      t.mock.method(fs, 'writeFileSync'), t.mock.method(fs, 'appendFileSync'), t.mock.method(fs, 'createWriteStream'),
      t.mock.method(fs, 'mkdirSync'), t.mock.method(fs, 'unlinkSync'), t.mock.method(fs, 'renameSync'),
    ],
    red: t.mock.method(globalThis, 'fetch', async () => { throw new Error('la vista previa no debe usar la red'); }),
  };
  return () => {
    assert.equal(espias.escrituras.reduce((n, e) => n + e.mock.callCount(), 0), 0, 'no escribe en disco');
    assert.equal(espias.red.mock.callCount(), 0, 'no llama a la TSA ni a la red');
  };
}

const rechaza = (promesa, esperado) => assert.rejects(promesa, (err) => {
  for (const [k, v] of Object.entries(esperado)) assert.deepEqual(err[k], v, `${k}`);
  return true;
});

// ── Camino feliz ─────────────────────────────────────────────

test('genera el PDF de vista previa con los datos reales, las actividades y la rúbrica registrada', async (t) => {
  const e = await escenario(t);
  const { pdf, numeroReporte } = await e.vistaPrevia();

  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 5).toString('latin1'), '%PDF-');
  assert.equal(numeroReporte, 1);

  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.deepEqual([Math.round(width), Math.round(height)], [612, 792]);

  const texto = textoDelPdf(pdf);
  if (texto === null) return t.diagnostic('pdftotext no disponible: se omite la revisión del texto');
  const plano = texto.replace(/\s+/g, ' ');
  for (const esperado of [
    'REPORTE MENSUAL DE ACTIVIDADES NÚMERO: 1', 'Correspondiente al periodo mensual del: 16 de octubre de 2025 al 14 de noviembre de 2025',
    'ANA GARCIA LOPEZ', 'Ingeniería en Inteligencia Artificial', '2022630001', '85.5 %', '5512345678', 'ana.garcia@example.com',
    'Escuela Superior de Cómputo', 'Programa SISS de prueba', 'LUIS TORRES VEGA', 'Responsable Directo', 'Página 1 de 1',
    'Diseñé e implementé el módulo de consulta de reportes mensuales', 'ñandú',
  ]) assert.ok(plano.includes(esperado), `falta: ${esperado}`);
});

test('la rúbrica del alumno queda estampada en el PDF (logo IPN + logo ESCOM + rúbrica)', async (t) => {
  const e = await escenario(t);
  const { pdf } = await e.vistaPrevia();
  const doc = await PDFDocument.load(pdf);
  let imagenes = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && !o.dict.has(PDFName.of('SMaskInData'))
      && o.dict.get(PDFName.of('ColorSpace')) !== PDFName.of('DeviceGray')) imagenes += 1;
  }
  assert.equal(imagenes, 3);
});

test('las actividades se imprimen tal cual: un párrafo por línea, sin numerar', async (t) => {
  const e = await escenario(t);
  const { pdf } = await e.vistaPrevia('Primera actividad realizada\n\n  Segunda   actividad realizada  \nTercera');
  const texto = textoDelPdf(pdf);
  if (texto === null) return t.diagnostic('pdftotext no disponible');
  const zona = texto.split('Redacción en párrafos')[1].split('Elaboró')[0];
  assert.ok(/Primera actividad realizada\s+Segunda actividad realizada\s+Tercera/.test(zona), zona);
  assert.equal(/^\s*\d+[.)]\s/m.test(zona), false);
});

// ── Solo lectura: no firma, no envía, no persiste ────────────

test('la vista previa solo LEE: ninguna escritura en BD, ni documento/reporte/revisión, ni disco, ni red', async (t) => {
  const e = await escenario(t);
  const rubricaAntes = { ...e.usuarios[7] };
  const archivosAntes = archivosEn(e.base).map((f) => [f, fs.readFileSync(f).toString('hex')]);
  const verificarEfectos = vigilarEfectos(t);

  const resultado = await e.vistaPrevia();

  assert.deepEqual(e.escrituras(), [], 'sin create/update/delete/upsert');
  assert.equal(e.operaciones.some((op) => /documento|revision/.test(op)), false);
  assert.equal(e.operaciones.some((op) => op.startsWith('reporte_mensual.') && op !== 'reporte_mensual.findMany'), false);
  verificarEfectos();

  assert.deepEqual({ ...e.usuarios[7] }, rubricaAntes, 'la rúbrica del alumno no cambia');
  assert.deepEqual(archivosEn(e.base).map((f) => [f, fs.readFileSync(f).toString('hex')]), archivosAntes, 'el disco queda igual');
  assert.deepEqual(Object.keys(resultado).sort(), ['numeroReporte', 'pdf']);
});

test('no calcula ni devuelve hash ni sello de tiempo, y ni siquiera carga el módulo de la TSA', async (t) => {
  const e = await escenario(t);
  const resultado = await e.vistaPrevia();
  assert.equal(Object.keys(resultado).some((k) => /hash|sha|tsa|token|sello/i.test(k)), false);
  assert.equal(Object.keys(require.cache).some((ruta) => /timestampTsa/.test(ruta)), false, 'timestampTsa no se carga');
  const fuente = fs.readFileSync(path.join(__dirname, 'reportes-vista-previa.service.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/timestampTsa|createHash|sha256|cifrarBuffer|writeFile/i.test(fuente), false);
});

test('se puede pedir varias veces: no deja rastro que cambie el siguiente reporte', async (t) => {
  const e = await escenario(t);
  const primera = await e.vistaPrevia();
  const segunda = await e.vistaPrevia('Otra redacción distinta de las actividades del mes.');
  assert.equal(primera.numeroReporte, 1);
  assert.equal(segunda.numeroReporte, 1, 'sigue siendo el reporte 1: nada se persistió');
  assert.deepEqual(e.escrituras(), []);
});

// ── Errores ──────────────────────────────────────────────────

async function sinEfectos(t, e, fn) {
  const verificarEfectos = vigilarEfectos(t);
  const archivosAntes = archivosEn(e.base).length;
  await fn();
  assert.deepEqual(e.escrituras(), []);
  verificarEfectos();
  assert.equal(archivosEn(e.base).length, archivosAntes);
}

test('reporte no generable → 409 REPORTE_NO_GENERABLE con los motivos y sus mensajes', async (t) => {
  const e = await escenario(t, { bitacoras: [] });
  await sinEfectos(t, e, () => rechaza(e.vistaPrevia(), { status: 409, code: 'REPORTE_NO_GENERABLE' }));
  await assert.rejects(e.vistaPrevia(), (err) => {
    assert.deepEqual(err.motivosBloqueo.map((m) => m.codigo), [MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS]);
    assert.ok(err.motivosBloqueo.every((m) => typeof m.mensaje === 'string' && m.mensaje.length > 0));
    return true;
  });
});

test('cada bloqueo de la fase 1 impide la vista previa (datos que el PDF necesita)', async (t) => {
  const casos = [
    [{ correoPersonal: null }, MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL],
    [{ programa: '' }, MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS],
    [{ profesorUsuario: null }, MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE],
    [{ carrera: 'XYZ' }, MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA],
  ];
  for (const [cambios, motivo] of casos) {
    const e = await escenario(t, cambios);
    await assert.rejects(e.vistaPrevia(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === motivo), motivo);
  }
});

test('el periodo todavía abierto no permite vista previa', async (t) => {
  const e = await escenario(t);
  await assert.rejects(
    generarVistaPreviaReporteMensual(7, ACTIVIDADES_EJEMPLO, { ...e.deps, ahora: ahoraMx('2025-11-14') }),
    (err) => err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO),
  );
});

test('sin rúbrica registrada → 409 RUBRICA_NO_REGISTRADA (sin leer ni escribir archivos)', async (t) => {
  const e = await escenario(t, {}, { conRubrica: false });
  await sinEfectos(t, e, () => rechaza(e.vistaPrevia(), { status: 409, code: 'RUBRICA_NO_REGISTRADA' }));
});

test('un bloqueo del reporte tiene prioridad sobre la rúbrica faltante', async (t) => {
  const e = await escenario(t, { bitacoras: [] }, { conRubrica: false });
  await rechaza(e.vistaPrevia(), { code: 'REPORTE_NO_GENERABLE' });
});

test('actividades vacías o de tipo incorrecto → 400', async (t) => {
  const e = await escenario(t);
  for (const vacio of [undefined, null, '', ' \n \t\n']) {
    await sinEfectos(t, e, () => rechaza(e.vistaPrevia(vacio), { status: 400, code: 'ACTIVIDADES_VACIAS' }));
  }
  await rechaza(e.vistaPrevia(42), { status: 400, code: 'TEXTO_INVALIDO' });
  await rechaza(e.vistaPrevia({ texto: 'x' }), { status: 400, code: 'TEXTO_INVALIDO' });
});

test('actividades con caracteres que la fuente no dibuja → 400 CARACTERES_NO_SOPORTADOS con la lista', async (t) => {
  const e = await escenario(t);
  await assert.rejects(e.vistaPrevia('Terminé la tarea 😀 con éxito'), (err) => {
    assert.equal(err.status, 400);
    assert.equal(err.code, 'CARACTERES_NO_SOPORTADOS');
    assert.ok(err.caracteres.some((c) => c.caracter === '😀' && c.codigo === 'U+1F600'));
    return true;
  });
});

test('actividades que no caben → 422 ACTIVIDADES_EXCEDEN_ESPACIO; palabra demasiado ancha → 422 ACTIVIDADES_PALABRA_DEMASIADO_LARGA', async (t) => {
  const e = await escenario(t);
  const demasiado = Array.from({ length: 40 }, (_, i) => `Actividad ${i + 1}: revisé y documenté los requerimientos del módulo asignado.`).join('\n');
  await sinEfectos(t, e, () => assert.rejects(e.vistaPrevia(demasiado), (err) => {
    assert.equal(err.status, 422);
    assert.equal(err.code, 'ACTIVIDADES_EXCEDEN_ESPACIO');
    assert.ok(err.lineasMaximas > 0 && err.lineasRenderizadas > err.lineasMaximas);
    return true;
  }));
  await rechaza(e.vistaPrevia(`Consulté ${'documentos-del-proyecto/'.repeat(30)} completo`), { status: 422, code: 'ACTIVIDADES_PALABRA_DEMASIADO_LARGA' });
});

test('datos del alumno que no se pueden imprimir → 422 DATOS_NO_IMPRIMIBLES con el campo', async (t) => {
  const e = await escenario(t, { nombre: 'ANA 😀' });
  await assert.rejects(e.vistaPrevia(), (err) => err.status === 422 && err.code === 'DATOS_NO_IMPRIMIBLES' && err.campo === 'alumno.nombreCompleto');
});

test('rúbrica registrada pero ilegible en disco → 500 RUBRICA_NO_DISPONIBLE, sin generar PDF', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const [archivo] = archivosEn(e.base);
  fs.writeFileSync(archivo, Buffer.from('alterado'));
  await rechaza(e.vistaPrevia(), { status: 500, code: 'RUBRICA_NO_DISPONIBLE' });
});

test('alumno sin solicitud → 404', async (t) => {
  const e = await escenario(t, { sinAlumno: true }, { conRubrica: false });
  await rechaza(e.vistaPrevia(), { status: 404 });
});
