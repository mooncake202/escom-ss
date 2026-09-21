// CU-REP-07: reporte global. BD falsa con transacciones y bloqueos, carpetas temporales reales, PDFs reales y TSA falsa.
// Nunca se llama a FreeTSA ni a la red.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');

const {
  prepararReporteGlobal, generarVistaPreviaReporteGlobal, enviarReporteGlobal, CODIGOS_ERROR,
} = require('./reportes-global.service');
const { generarPdfReporteMensual } = require('./reportes.pdf');
const { guardarRubrica } = require('./reportes.rubricas');
const { crearBdEnvio, PROFESOR_USUARIO_ID } = require('./reportes.envio.fixtures');
const { crearPng, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');
const { HORAS_MINIMAS_REPORTE_GLOBAL, ESTADOS_REPORTE } = require('./reportes.shared');
const { utc } = require('./reportes.vista-previa.fixtures');

const RUBRICA = crearPng(500, 180);
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA-NO-ES-UN-SELLO-REAL').toString('base64');
const IP = '187.190.10.20';
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const hayPdftotext = spawnSync('pdftotext', ['-v']).error === undefined;

const archivosEn = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name))
  : []);

// `n` bitácoras de 4 horas aprobadas (las que suma AH), más las de estados que NO cuentan.
const bitacoras = (horas, extra = []) => [
  ...Array.from({ length: Math.floor(horas / 4) }, (_, i) => ({ id: i + 1, estado: 'aprobada', fecha_registro: utc('2025-10-16'), fecha_revision: new Date('2025-10-17T16:00:00.000Z'), horas_contabilizadas: 4 })),
  ...(horas % 4 ? [{ id: 9000, estado: 'aprobada', fecha_registro: utc('2025-10-17'), fecha_revision: new Date('2025-10-18T16:00:00.000Z'), horas_contabilizadas: horas % 4 }] : []),
  ...extra,
];
const NO_CUENTAN = [
  { id: 9101, estado: 'pendiente_revision', fecha_registro: utc('2026-01-05'), horas_contabilizadas: 4 },
  { id: 9102, estado: 'rechazada', fecha_registro: utc('2026-01-06'), horas_contabilizadas: 4 },
  { id: 9103, estado: 'en_curso', fecha_registro: utc('2026-01-07'), horas_contabilizadas: null },
];

/** Escenario: BD falsa con `horas` aprobadas, carpetas de rúbricas y documentos, y espías de PDF, TSA y avisos. */
async function escenario(t, { horas = HORAS_MINIMAS_REPORTE_GLOBAL, bd: opcionesBd = {}, conRubrica = true, tsa, generarPdf } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseRubricas = tmp('global-rubricas-');
  const rutaBaseDocumentos = tmp('global-docs-');
  const bd = crearBdEnvio({ bitacoras: bitacoras(horas, NO_CUENTAN), ...opcionesBd });
  if (conRubrica) await guardarRubrica(7, { buffer: RUBRICA }, { prisma: bd.prisma, rutaBase: rutaBaseRubricas, ip: '10.0.0.1' });
  bd.operaciones.length = 0;

  const eventos = [];
  const generados = [];
  const sellos = [];
  const generar = generarPdf ?? (async (datos, opciones) => {
    const pdf = await generarPdfReporteMensual(datos, opciones);
    generados.push({ datos, pdf: Buffer.from(pdf) });
    eventos.push('pdf');
    return pdf;
  });
  const sello = tsa ?? (async (hash) => { sellos.push(hash); eventos.push('tsa'); return { token: TOKEN, fecha: new Date() }; });
  const notificaciones = [];
  const emisiones = [];
  const deps = {
    prisma: bd.prisma, ahora: bd.ahora, ip: IP, rutaBaseRubricas, rutaBaseDocumentos, solicitarSelloTiempo: sello, generarPdf: generar,
    crearNotificacion: async (datos) => { notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { emisiones.push({ usuarioId, evento, datos }); },
  };
  return {
    ...bd, eventos, generados, sellos, notificaciones, emisiones, rutaBaseRubricas, rutaBaseDocumentos, deps,
    preparar: () => prepararReporteGlobal(7, { prisma: bd.prisma, ahora: bd.ahora }),
    // Sin argumentos usan las actividades de ejemplo; un `undefined` explícito se respeta (para probar entradas inválidas).
    vistaPrevia: (...args) => generarVistaPreviaReporteGlobal(7, args.length ? args[0] : ACTIVIDADES_EJEMPLO, { prisma: bd.prisma, ahora: bd.ahora, rutaBase: rutaBaseRubricas }),
    enviar: (...args) => enviarReporteGlobal(7, args.length ? args[0] : ACTIVIDADES_EJEMPLO, { ...deps, ...args[1] }),
  };
}

const nadaPersistido = (e) => {
  assert.deepEqual(e.db.documentos, [], 'sin documento');
  assert.deepEqual(e.db.globales, [], 'sin reporte global');
  assert.deepEqual(e.db.revisionesGlobales, [], 'sin revisión');
  assert.deepEqual(archivosEn(e.rutaBaseDocumentos), [], 'sin archivo en disco');
};

const codigos = (r) => r.motivosBloqueo.map((m) => m.codigo);

// ══ Habilitación: >= 480 h de bitácoras aprobadas ═════════════

test('480 h justas habilitan el global; 479 no; más de 480 sí — se suma horas_contabilizadas, no días', async (t) => {
  const justas = await (await escenario(t, { horas: 480 })).preparar();
  assert.equal(justas.puedeGenerar, true);
  assert.deepEqual(justas.horas, { acumuladas: 480, requeridas: 480, suficientes: true });
  assert.deepEqual(justas.motivosBloqueo, []);

  const menos = await (await escenario(t, { horas: 479 })).preparar();
  assert.equal(menos.puedeGenerar, false);
  assert.deepEqual(menos.horas, { acumuladas: 479, requeridas: 480, suficientes: false });
  assert.deepEqual(codigos(menos), ['HORAS_INSUFICIENTES']);
  assert.match(menos.motivosBloqueo[0].mensaje, /480 horas/);

  const mas = await (await escenario(t, { horas: 520 })).preparar();
  assert.equal(mas.puedeGenerar, true);
  assert.equal(mas.horas.acumuladas, 520, 'AH permite pasar de 480: se informan las horas reales');

  // 120 bitácoras de 4 h = 480; con horas exactas distintas de 4 (AH guarda las reales) se suman igual.
  const variadas = await escenario(t, { bd: { bitacoras: [{ id: 1, estado: 'aprobada', fecha_registro: utc('2025-10-16'), horas_contabilizadas: 200 }, { id: 2, estado: 'aprobada', fecha_registro: utc('2025-10-17'), horas_contabilizadas: 280 }] } });
  assert.equal((await variadas.preparar()).horas.acumuladas, 480);
});

test('solo cuentan las bitácoras APROBADAS: pendientes, rechazadas o en curso no suman', async (t) => {
  const e = await escenario(t, { horas: 476 }); // + 3 filas que no cuentan (4 h cada una si contaran)
  const r = await e.preparar();
  assert.equal(r.horas.acumuladas, 476);
  assert.equal(r.puedeGenerar, false);
  assert.equal(codigos(r).includes('HORAS_INSUFICIENTES'), true);
});

test('sin bitácoras aprobadas: 0 horas y bloqueado', async (t) => {
  const r = await (await escenario(t, { horas: 0 })).preparar();
  assert.equal(r.horas.acumuladas, 0);
  assert.equal(r.puedeGenerar, false);
});

test('la preparación es de solo lectura, no toca reportes mensuales y no consulta bitácoras una por una (suma en BD)', async (t) => {
  const e = await escenario(t);
  await e.preparar();
  assert.deepEqual(e.escrituras(), []);
  assert.ok(e.operaciones.includes('bitacora.aggregate'));
  assert.ok(!e.operaciones.includes('bitacora.findMany'));
  assert.ok(!e.operaciones.includes('reporte_mensual.findMany'), 'el global no depende de los reportes mensuales');
});

// ══ Periodo, datos y firma ════════════════════════════════════

test('periodo del global = fecha de inicio → fecha de fin del periodo oficial completo, NO hasta la fecha de generación', async (t) => {
  const e = await escenario(t);
  const r = await e.preparar();
  assert.deepEqual(r.reporte.periodo, {
    inicio: '2025-10-16', fin: '2026-05-14', inicioTexto: '16 de octubre de 2025', finTexto: '14 de mayo de 2026', esquema: 'completo',
  });
  assert.equal(r.reporte.titulo, 'Reporte global de actividades');
  assert.equal(r.reporte.tipo, 'global');
  // La "hoy" del fixture (20-nov-2025) es muy anterior al fin del periodo: no lo recorta.
  assert.equal(r.reporte.periodo.fin, '2026-05-14');
  assert.deepEqual([r.servicio.fechaInicio, r.servicio.fechaFin], ['2025-10-16', '2026-05-14']);
});

test('sin periodo oficial o sin fecha de término → bloqueado con su motivo (no se inventa el fin)', async (t) => {
  const sinPeriodo = await (await escenario(t, { bd: { sinPeriodo: true } })).preparar();
  assert.equal(sinPeriodo.puedeGenerar, false);
  assert.ok(codigos(sinPeriodo).includes('SIN_PERIODO_OFICIAL'));
  assert.equal(sinPeriodo.reporte.periodo, null);

  const sinFin = await (await escenario(t, { bd: { fechaFin: null } })).preparar();
  assert.equal(sinFin.puedeGenerar, false);
  assert.ok(codigos(sinFin).includes('FECHA_FIN_NO_DISPONIBLE'));
  assert.equal(sinFin.reporte.periodo, null);
});

test('faltan datos que el PDF imprime (correo, profesor, programa) → bloqueado; y se informa si falta la rúbrica', async (t) => {
  const sinCorreo = await (await escenario(t, { bd: { correoPersonal: null } })).preparar();
  assert.ok(codigos(sinCorreo).includes('SIN_CORREO_PERSONAL'));
  const sinProfesor = await (await escenario(t, { bd: { profesorUsuario: null } })).preparar();
  assert.ok(codigos(sinProfesor).includes('SIN_PROFESOR_RESPONSABLE'));

  const conRubrica = await (await escenario(t)).preparar();
  assert.deepEqual(conRubrica.firma, { tieneRubrica: true, requiereSubirRubrica: false });
  const sinRubrica = await (await escenario(t, { conRubrica: false })).preparar();
  assert.deepEqual(sinRubrica.firma, { tieneRubrica: false, requiereSubirRubrica: true });
});

test('un reporte mensual existente no bloquea el global; uno global sí (solo uno por solicitud)', async (t) => {
  const conMensual = await (await escenario(t, { bd: { reportesIniciales: [{ id: 1, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }] } })).preparar();
  assert.equal(conMensual.puedeGenerar, true);

  const conGlobal = await (await escenario(t, { bd: { globalesIniciales: [{ id: 1, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }] } })).preparar();
  assert.equal(conGlobal.puedeGenerar, false);
  assert.deepEqual(codigos(conGlobal), ['REPORTE_GLOBAL_YA_EXISTE']);
  assert.deepEqual(conGlobal.reporteExistente, { id: 1, estadoReporte: 'pendiente_revision_profesor', puedeModificar: false });

  const rechazado = await (await escenario(t, { bd: { globalesIniciales: [{ id: 1, estado_reporte: ESTADOS_REPORTE.RECHAZADO_PROFESOR }] } })).preparar();
  assert.equal(rechazado.reporteExistente.puedeModificar, true, 'un global rechazado se corrige con CU-REP-04');
});

// ══ Vista previa ══════════════════════════════════════════════

test('vista previa: usa la plantilla del mensual con título global, periodo completo y el resumen; NO muestra las 480 horas', { skip: !hayPdftotext && 'pdftotext no está instalado' }, async (t) => {
  const e = await escenario(t, { horas: 508 });
  const { pdf } = await e.vistaPrevia('Resumen final de todo el servicio social realizado.');

  const documento = await PDFDocument.load(new Uint8Array(pdf));
  assert.equal(documento.getPageCount(), 1);
  assert.deepEqual([Math.round(documento.getPage(0).getWidth()), Math.round(documento.getPage(0).getHeight())], [612, 792]);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'texto-global-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'a.pdf'), pdf);
  const texto = spawnSync('pdftotext', ['-layout', path.join(dir, 'a.pdf'), '-'], { encoding: 'utf8' }).stdout.replace(/\s+/g, ' ');

  for (const esperado of [
    'REPORTE GLOBAL DE ACTIVIDADES', 'Correspondiente al periodo del: 16 de octubre de 2025 al 14 de mayo de 2026',
    'Resumen final de todo el servicio social realizado.', 'Datos del Prestador o Prestadora', 'Elaboró', 'Autorizó', 'Sello del Prestatario',
    'Redacción en párrafos describiendo las actividades realizadas durante el periodo.',
  ]) assert.ok(texto.includes(esperado), `falta: ${esperado}`);
  for (const ausente of ['NÚMERO', 'periodo mensual', '480', '508', 'horas']) assert.equal(texto.includes(ausente), false, `sobra: ${ausente}`);
});

test('vista previa: solo con >= 480 h; sin rúbrica → 409; no escribe nada ni pide TSA', async (t) => {
  const corto = await escenario(t, { horas: 476 });
  await assert.rejects(corto.vistaPrevia(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === 'HORAS_INSUFICIENTES'));
  assert.deepEqual(corto.generados, []);

  const sinRubrica = await escenario(t, { conRubrica: false });
  await assert.rejects(sinRubrica.vistaPrevia(), (err) => err.status === 409 && err.code === 'RUBRICA_NO_REGISTRADA');

  const bien = await escenario(t);
  await bien.vistaPrevia();
  assert.deepEqual(bien.escrituras(), []);
  assert.deepEqual(bien.sellos, []);
  nadaPersistido(bien);
});

test('vista previa: actividades vacías o con caracteres no imprimibles se rechazan con los códigos de siempre', async (t) => {
  const e = await escenario(t);
  for (const malo of [undefined, null, '', '   ']) await assert.rejects(e.vistaPrevia(malo), (err) => err.code === 'ACTIVIDADES_VACIAS', String(malo));
  await assert.rejects(e.vistaPrevia('Actividad con emoji 😀'), (err) => err.code === 'CARACTERES_NO_SOPORTADOS');
});

// ══ Envío ═════════════════════════════════════════════════════

test('envío: mismo Buffer para hash, TSA, archivo cifrado y BD; documento reporte_global, reporte y revisión del alumno; pendiente_revision_profesor', async (t) => {
  const e = await escenario(t);
  const r = await e.enviar();

  assert.deepEqual(r.reporte, { id: r.reporte.id, numero: null, estadoReporte: 'pendiente_revision_profesor' });
  assert.equal(r.fechaEnvio, e.ahora.toISOString());
  assert.deepEqual(e.eventos, ['pdf', 'tsa'], 'primero el PDF, luego la TSA');

  // UN solo PDF: el que se generó es el hasheado, sellado, cifrado y registrado.
  assert.equal(e.generados.length, 1);
  const { pdf } = e.generados[0];
  const [archivo] = archivosEn(e.rutaBaseDocumentos);
  assert.equal(Buffer.compare(descifrarBuffer(fs.readFileSync(archivo)), pdf), 0, 'lo cifrado en disco es ese Buffer');
  assert.deepEqual(e.sellos, [sha256(pdf)], 'la TSA recibió el hash de ese Buffer');

  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.documentos[0].tipo_documento, 'reporte_global');
  assert.equal(e.db.documentos[0].estado_documento, 'vigente');
  assert.equal(e.db.documentos[0].alumno_id, '2022630001');
  assert.equal(path.relative(e.rutaBaseDocumentos, archivo).split(path.sep).join('/'), e.db.documentos[0].ruta_archivo);

  assert.equal(e.db.globales.length, 1);
  const [global] = e.db.globales;
  assert.deepEqual([global.documento_id, global.estado_reporte, global.solicitud_registro_id, global.actividades_resumen], [e.db.documentos[0].id, 'pendiente_revision_profesor', e.SOLICITUD_ID, ACTIVIDADES_EJEMPLO.split('\n').join('\n')]);
  assert.deepEqual(Object.keys(global).sort(), ['actividades_resumen', 'documento_id', 'estado_reporte', 'id', 'solicitud_registro_id'], 'solo las columnas del global: sin número, días ni horas');

  assert.equal(e.db.revisionesGlobales.length, 1);
  const { id, ...revision } = e.db.revisionesGlobales[0];
  assert.ok(id > 0);
  assert.deepEqual(revision, {
    reporte_global_id: global.id, usuario_id: 7, tipo_revisor: 'alumno', estado: 'aprobado', comentario: null,
    hash_documento: sha256(pdf), ip_firma: IP, token_tsa: TOKEN, fecha: e.ahora,
  });
  assert.deepEqual([e.db.reportes, e.db.revisiones], [[], []], 'no se crea nada mensual');
});

test('envío: el PDF lleva título global y el periodo completo; los datos impresos NO contienen las horas', async (t) => {
  const e = await escenario(t, { horas: 500 });
  await e.enviar();
  const { datos } = e.generados[0];
  assert.equal(datos.tipoReporte, 'global');
  assert.equal(datos.numeroReporte, null);
  assert.deepEqual(datos.periodo, { inicioTexto: '16 de octubre de 2025', finTexto: '14 de mayo de 2026' });
  assert.equal(/480|500|horas/i.test(JSON.stringify(datos)), false);
});

test('envío: la rúbrica del alumno registrada se aplica al PDF (sin pedir otra) y la TSA se pide una sola vez', async (t) => {
  const e = await escenario(t);
  await e.enviar();
  assert.equal(e.sellos.length, 1);
  assert.ok(!e.operaciones.includes('usuario.updateMany'), 'no se registra una rúbrica nueva');
  const sinRubrica = await escenario(t, { conRubrica: false });
  await assert.rejects(sinRubrica.enviar(), (err) => err.status === 409 && err.code === 'RUBRICA_NO_REGISTRADA');
  assert.deepEqual([sinRubrica.sellos, sinRubrica.eventos], [[], []]);
  nadaPersistido(sinRubrica);
});

test('envío: avisa al profesor con la notificación existente (destacando el reporte global) y el evento reporte:nuevo', async (t) => {
  const e = await escenario(t);
  const { reporte } = await e.enviar();
  assert.deepEqual(e.notificaciones, [{
    usuarioId: PROFESOR_USUARIO_ID,
    tipo: 'warning',
    mensaje: 'ANA GARCIA LOPEZ envió el Reporte Global para tu revisión.',
    rutaRelacionada: `/profesor/reportes?destacar=${reporte.id}&tipo=global`,
  }]);
  assert.deepEqual(e.emisiones, [{ usuarioId: PROFESOR_USUARIO_ID, evento: 'reporte:nuevo', datos: { reporteId: reporte.id } }]);
});

test('envío: fail-open — si falla la notificación o el socket, el envío confirmado no se revierte', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.enviar(ACTIVIDADES_EJEMPLO, {
    crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
    emitirAUsuario: () => { throw new Error('socket no inicializado'); },
  });
  assert.equal(r.reporte.estadoReporte, 'pendiente_revision_profesor');
  assert.equal(e.db.globales.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1);
});

// ── Validación en el backend ─────────────────────────────────

test('envío con menos de 480 h → 409 y NO se genera, sella ni guarda nada (la regla se valida en el backend)', async (t) => {
  const e = await escenario(t, { horas: 479 });
  await assert.rejects(e.enviar(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === 'HORAS_INSUFICIENTES'));
  assert.deepEqual([e.eventos, e.sellos, e.notificaciones], [[], [], []]);
  nadaPersistido(e);
  assert.deepEqual(e.escrituras(), []);
});

test('si las horas bajan de 480 mientras se firma (bajo el bloqueo) → 409, nada queda registrado y el archivo se borra', async (t) => {
  let e;
  e = await escenario(t, {
    tsa: async (hash) => { e.bitacoras.splice(0, 3); e.sellos.push(hash); return { token: TOKEN, fecha: new Date() }; }, // 480 → 468 h
  });
  await assert.rejects(e.enviar(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE');
  nadaPersistido(e);
  assert.ok(e.operaciones.includes('$transaction.rollback'));
});

test('si cambian los datos impresos mientras se firma → 409 DATOS_DEL_REPORTE_CAMBIARON y el archivo se borra', async (t) => {
  let e;
  e = await escenario(t, {
    tsa: async (hash) => { e.perfil.programa = 'Programa cambiado a mitad'; e.sellos.push(hash); return { token: TOKEN, fecha: new Date() }; },
  });
  await assert.rejects(e.enviar(), (err) => err.status === 409 && err.code === CODIGOS_ERROR.DATOS_DEL_REPORTE_CAMBIARON);
  nadaPersistido(e);
});

// ── Solo uno por solicitud ───────────────────────────────────

test('solo un global por solicitud: si ya existe → 409 antes de firmar; ningún segundo reporte ni archivo', async (t) => {
  const e = await escenario(t, { bd: { globalesIniciales: [{ id: 1, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }] } });
  await assert.rejects(e.enviar(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === 'REPORTE_GLOBAL_YA_EXISTE'));
  assert.deepEqual([e.sellos, e.db.globales.length, e.db.revisionesGlobales.length, archivosEn(e.rutaBaseDocumentos)], [[], 1, 0, []]);
});

test('envíos simultáneos: solo uno crea el global; los demás reciben 409, su archivo se borra y se avisa una sola vez', async (t) => {
  const e = await escenario(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 15)); return { token: TOKEN, fecha: new Date() }; } });
  const resultados = await Promise.allSettled([e.enviar(), e.enviar(), e.enviar()]);
  const bien = resultados.filter((r) => r.status === 'fulfilled');
  const mal = resultados.filter((r) => r.status === 'rejected');

  assert.equal(bien.length, 1);
  assert.equal(mal.length, 2);
  for (const r of mal) assert.ok(r.reason.status === 409 && ['REPORTE_YA_EXISTE', 'REPORTE_NO_GENERABLE'].includes(r.reason.code), r.reason.code);
  assert.equal(e.db.globales.length, 1, 'un único reporte global');
  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.revisionesGlobales.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1, 'los archivos de los que perdieron se borraron');
  assert.equal(e.notificaciones.length, 1);
});

// ── Todo o nada ──────────────────────────────────────────────

test('si la TSA falla (sin conexión o respuesta inservible) → 503 reintentable; no se toca disco ni BD', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const tsa of [async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); }, async () => ({ token: '' })]) {
    const e = await escenario(t, { tsa });
    await assert.rejects(e.enviar(), (err) => err.status === 503 && err.code === CODIGOS_ERROR.SELLO_TIEMPO_NO_DISPONIBLE && err.reintentable === true);
    nadaPersistido(e);
    assert.deepEqual(e.escrituras(), []);
    assert.deepEqual(e.notificaciones, []);
  }
});

test('si falla cualquier escritura de la transacción → reversa completa y el archivo se borra', async (t) => {
  for (const operacion of ['documento.create', 'reporte_global.create', 'revision_reporte_global.create']) {
    const e = await escenario(t, { bd: { fallos: { [operacion]: new Error(`falla ${operacion}`) } } });
    await assert.rejects(e.enviar(), new RegExp(`falla ${operacion}`));
    nadaPersistido(e);
    assert.ok(e.operaciones.includes('$transaction.rollback'), operacion);
    assert.deepEqual(e.notificaciones, []);
  }
});

test('commit dudoso: si la BD SÍ registró el documento, el archivo se conserva', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t, { bd: { falloTrasCommit: new Error('conexión perdida tras el commit') } });
  await assert.rejects(e.enviar(), /conexión perdida/);
  assert.equal(e.db.globales.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1, 'no se borra un archivo ya registrado');
});

test('las escrituras ocurren solo dentro de la transacción y después de tomar el bloqueo de la solicitud (lo hace cumplir la BD falsa)', async (t) => {
  const e = await escenario(t);
  await e.enviar();
  const indice = (op) => e.operaciones.indexOf(op);
  assert.ok(indice('$transaction.inicio') < indice('tx:$queryRaw(solicitud_registro)'));
  assert.ok(indice('tx:$queryRaw(solicitud_registro)') < indice('tx:$queryRaw(reporte_global)'));
  assert.ok(indice('tx:$queryRaw(reporte_global)') < indice('tx:documento.create'));
  assert.ok(indice('tx:documento.create') < indice('tx:reporte_global.create'));
  assert.ok(indice('tx:reporte_global.create') < indice('tx:revision_reporte_global.create'));
  assert.ok(indice('tx:revision_reporte_global.create') < indice('$transaction.commit'));
  assert.deepEqual(e.escrituras().filter((op) => !op.startsWith('tx:')), []);
  assert.ok(!e.operaciones.some((op) => /reporte_mensual\.create|revision_reporte_mensual/.test(op)));
});

test('el número de envíos previos del mensual no cambia el global (ni el global bloquea nuevos mensuales por sí solo)', async (t) => {
  const e = await escenario(t, { bd: { reportesIniciales: [{ id: 1, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }, { id: 2, num_reporte: 2, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }] } });
  await e.enviar();
  assert.equal(e.db.reportes.length, 2, 'los mensuales existentes no se tocan');
  assert.equal(e.db.globales.length, 1);
});
