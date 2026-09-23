// CU-REP-06 (Coordinación): validar (aprobar con el sello del prototipo) y rechazar. BD falsa con transacciones y reversa,
// carpeta temporal real, PDFs reales (generador + rúbrica + sello) y TSA falsa. Nunca se llama a FreeTSA ni a la red.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, PDFName, PDFDict } = require('pdf-lib');

const { rechazarReporte, aprobarReporte, CODIGOS_ERROR } = require('./reportes-validacion.service');
const { MAX_CARACTERES_COMENTARIO } = require('./reportes-revision.service');
const { generarPdfReporteMensual, construirDatosPdf, agregarRubricaProfesor } = require('./reportes.pdf');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');
const { crearPng, resultadoEjemplo, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');
const { leerSello: leerSelloReal } = require('./reportes.assets');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');

const COORDINADOR = 70;
const OTRO_COORDINADOR = 71;
const PROFESOR_USUARIO = 50; // es profesor, no coordinador
const ALUMNO_USUARIO = 201; // alumno del reporte 1
const PROFESOR_DEL_REPORTE = 301; // usuario del profesor del reporte 1
const IP = '187.190.10.20';
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA-NO-ES-UN-SELLO-REAL').toString('base64');
const SELLO_PNG = crearPng(200, 200, [10, 120, 30]);
const leerSelloDePrueba = () => ({ data: SELLO_PNG });

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const archivos = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(base, path.join(e.parentPath ?? e.path, e.name))).sort()
  : []);
// Imágenes dibujadas en la página (XObjects de sus recursos): logos + rúbricas + sello.
const imagenesDe = async (pdf) => (await PDFDocument.load(new Uint8Array(pdf))).getPage(0).node.Resources().lookup(PDFName.of('XObject'), PDFDict).keys().length;

// El PDF que aprobó el profesor (alumno + profesor), una sola vez para toda la suite: generarlo es lo más lento.
let pdfVigentePromesa = null;
const pdfVigente = () => {
  pdfVigentePromesa ??= generarPdfReporteMensual(construirDatosPdf(resultadoEjemplo(), ACTIVIDADES_EJEMPLO), { rubricaAlumno: crearPng(400, 140) })
    .then((pdf) => agregarRubricaProfesor(pdf, crearPng(300, 100, [200, 20, 20])));
  return pdfVigentePromesa;
};

const rev = (id, tipo, estado, fecha, extra = {}) => ({ id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: null, comentario: null, ...extra });

/**
 * Escenario: reporte 1 pendiente de validación (PDF alumno + profesor cifrado en disco y su hash en la aprobación del
 * profesor), 2 ya validado, 3 rechazado por Coordinación, 4 y 5 todavía con el profesor. Coordinadores 70 y 71.
 */
async function escenario(t, { estado = ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, hashProfesor, revisiones, sinArchivo = false, bd: opcionesBd = {}, tsa } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseDocumentos = tmp('validacion-docs-');
  const pdf = Buffer.from(await pdfVigente());
  const rutaVigente = '2022630001/vigente.pdf';
  if (!sinArchivo) {
    fs.mkdirSync(path.join(rutaBaseDocumentos, '2022630001'), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, rutaVigente), cifrarBuffer(pdf));
  }

  const historial = revisiones ?? [
    rev(9001, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z', { hash_documento: sha256('pdf solo del alumno') }),
    rev(9101, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z', { hash_documento: hashProfesor ?? sha256(pdf) }),
  ];
  const reportes = [
    reporteMensual({ id: 1, profesorId: 1, estado, rutaArchivo: rutaVigente, numero: 2, revisiones: historial }),
    reporteMensual({ id: 2, profesorId: 1, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR, rutaArchivo: '2022630002/x.pdf' }),
    reporteMensual({ id: 3, profesorId: 1, estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, rutaArchivo: '2022630003/x.pdf' }),
    reporteMensual({ id: 4, profesorId: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, rutaArchivo: '2022630004/x.pdf' }),
    reporteMensual({ id: 5, profesorId: 1, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, rutaArchivo: '2022630005/x.pdf' }),
  ];
  const bd = crearBdProfesor({
    profesores: { [PROFESOR_USUARIO]: 1 },
    reportes,
    escritura: true,
    coordinadores: [COORDINADOR, OTRO_COORDINADOR],
    ...opcionesBd,
  });

  const sellosDeTiempo = [];
  const notificaciones = [];
  const emisiones = [];
  const deps = {
    prisma: bd.prisma,
    rutaBaseDocumentos,
    ip: IP,
    ahora: new Date('2026-09-22T15:00:00.000Z'),
    leerSello: leerSelloDePrueba,
    solicitarSelloTiempo: tsa ?? (async (hash) => { sellosDeTiempo.push(hash); return { token: TOKEN, fecha: new Date() }; }),
    crearNotificacion: async (datos) => { notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { emisiones.push({ usuarioId, evento, datos }); },
  };
  // Sin opciones se usan valores normales; una clave presente se respeta aunque sea undefined (para probar entradas inválidas).
  const opcion = (o, clave, defecto) => (clave in o ? o[clave] : defecto);
  return {
    ...bd, reportes, pdf, rutaVigente, rutaBaseDocumentos, sellosDeTiempo, notificaciones, emisiones, deps,
    reporte: reportes[0],
    estadoActual: () => structuredClone(reportes),
    // aprobar({ usuario, id, tipo, deps }) · rechazar(comentario, { usuario, id, tipo, deps })
    aprobar: (o = {}) => aprobarReporte(opcion(o, 'usuario', COORDINADOR), opcion(o, 'tipo', 'mensual'), opcion(o, 'id', 1), { ...deps, ...o.deps }),
    rechazar: (...args) => {
      const o = args[1] ?? {};
      return rechazarReporte(opcion(o, 'usuario', COORDINADOR), opcion(o, 'tipo', 'mensual'), opcion(o, 'id', 1),
        args.length ? args[0] : 'Falta el detalle de las horas.', { ...deps, ...o.deps });
    },
  };
}

const codigo = (c, status) => (err) => err.code === c && (status === undefined || err.status === status);
const revisionesDe = (reporte) => reporte.revision_reporte_mensual;
const sinCambios = (e, antes, mensaje = 'no cambia nada') => assert.deepEqual(e.estadoActual(), antes, mensaje);
const es404 = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';

// ══ APROBAR ═══════════════════════════════════════════════════

test('aprobar: parte del PDF vigente EXACTO (no regenera), agrega solo el sello, y hash/TSA/archivo/BD son de ESE mismo Buffer', async (t) => {
  const e = await escenario(t);
  const recibidos = [];
  const agregarReal = require('./reportes.pdf').agregarSelloValidacion;
  const agregarSello = async (pdf, sello) => { recibidos.push({ pdf: Buffer.from(pdf), sello: Buffer.from(sello) }); return agregarReal(pdf, sello); };
  const antes = revisionesDe(e.reporte).map((r) => ({ ...r }));

  const r = await e.aprobar({ deps: { agregarSello } });

  assert.deepEqual(r, { reporte: { id: 1, numero: 2, estadoReporte: 'aprobado_coordinador' }, fechaRevision: '2026-09-22T15:00:00.000Z' });
  // Entrada: los bytes exactos del PDF vigente descifrado y el sello del prototipo.
  assert.equal(recibidos.length, 1);
  assert.equal(Buffer.compare(recibidos[0].pdf, e.pdf), 0);
  assert.equal(Buffer.compare(recibidos[0].sello, SELLO_PNG), 0);

  // Salida: el PDF final en disco es el que se hasheó y selló en el tiempo, y es el que apunta el documento.
  const rutaFinal = e.reporte.documento.ruta_archivo;
  assert.notEqual(rutaFinal, e.rutaVigente);
  assert.match(rutaFinal, /^2022630001\/Reportes\/[0-9a-f-]{36}\.pdf$/);
  const final = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, rutaFinal)));
  assert.notEqual(Buffer.compare(final, e.pdf), 0);
  assert.deepEqual(e.sellosDeTiempo, [sha256(final)], 'la TSA recibió el hash del Buffer final');

  // Historial: solo se agrega la revisión de Coordinación; alumno y profesor (hashes y sellos) quedan intactos.
  const revisiones = revisionesDe(e.reporte);
  assert.deepEqual(revisiones.slice(0, antes.length), antes);
  assert.equal(revisiones.length, antes.length + 1);
  assert.deepEqual({ ...revisiones.at(-1), id: undefined }, {
    id: undefined,
    reporte_mensual_id: 1,
    usuario_id: COORDINADOR,
    tipo_revisor: 'coordinador',
    estado: 'aprobado',
    comentario: null,
    hash_documento: sha256(final),
    ruta_archivo: rutaFinal, // el PDF nuevo que Coordinación acaba de sellar
    ip_firma: IP,
    token_tsa: TOKEN,
    fecha: new Date('2026-09-22T15:00:00.000Z'),
  });
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.APROBADO_COORDINADOR);
});

test('aprobar: el PDF final es una página Carta con las firmas previas y UNA imagen más (el sello); el PDF vigente anterior se conserva en disco', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  const final = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.reporte.documento.ruta_archivo)));

  const documento = await PDFDocument.load(new Uint8Array(final));
  assert.equal(documento.getPageCount(), 1);
  assert.deepEqual([Math.round(documento.getPage(0).getWidth()), Math.round(documento.getPage(0).getHeight())], [612, 792]);
  assert.equal(await imagenesDe(final), (await imagenesDe(e.pdf)) + 1);

  const anterior = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.rutaVigente)));
  assert.equal(Buffer.compare(anterior, e.pdf), 0, 'el PDF firmado por alumno y profesor sigue intacto');
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 2);
});

test('aprobar: con el sello institucional real (cifrado; reportes.assets.js lo descifra con AES-256-GCM) termina bien y el PDF conserva una página', async (t) => {
  const e = await escenario(t);
  // La función REAL de reportes.assets.js (no el doble `leerSelloDePrueba`), leyendo un .enc cifrado de verdad —
  // ya no un PNG en claro con SHA-256 fijo.
  const dirSello = fs.mkdtempSync(path.join(os.tmpdir(), 'validacion-sello-'));
  t.after(() => fs.rmSync(dirSello, { recursive: true, force: true }));
  const rutaSello = path.join(dirSello, 'sello-escom.enc');
  fs.writeFileSync(rutaSello, cifrarBuffer(SELLO_PNG));
  await e.aprobar({ deps: { leerSello: (opciones) => leerSelloReal({ ...opciones, rutaSello }) } });
  const final = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.reporte.documento.ruta_archivo)));
  assert.equal((await PDFDocument.load(new Uint8Array(final))).getPageCount(), 1);
  assert.equal(await imagenesDe(final), (await imagenesDe(e.pdf)) + 1);
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.APROBADO_COORDINADOR);
});

test('aprobar: avisa al alumno y al profesor con la notificación existente (destacando el reporte) y el evento reporte:actualizado', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  assert.deepEqual(e.notificaciones, [
    { usuarioId: ALUMNO_USUARIO, tipo: 'success', mensaje: 'Coordinación validó tu Reporte Mensual No. 2.', rutaRelacionada: '/alumno/reportes?destacar=1' },
    { usuarioId: PROFESOR_DEL_REPORTE, tipo: 'success', mensaje: 'Coordinación validó el Reporte Mensual No. 2 de ANA GARCIA LOPEZ.', rutaRelacionada: '/profesor/reportes?destacar=1' },
  ]);
  assert.deepEqual(e.emisiones, [
    { usuarioId: ALUMNO_USUARIO, evento: 'reporte:actualizado', datos: { reporteId: 1 } },
    { usuarioId: PROFESOR_DEL_REPORTE, evento: 'reporte:actualizado', datos: { reporteId: 1 } },
  ]);
});

test('aprobar: fail-open — si falla la notificación o el socket, la validación ya confirmada no se revierte', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.aprobar({
    deps: {
      crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
      emitirAUsuario: () => { throw new Error('socket no inicializado'); },
    },
  });
  assert.equal(r.reporte.estadoReporte, 'aprobado_coordinador');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.APROBADO_COORDINADOR);
});

test('aprobar: solo coordinadores — un profesor o un usuario sin perfil recibe 404 de perfil y nada cambia', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const usuario of [PROFESOR_USUARIO, 999, ALUMNO_USUARIO]) {
    await assert.rejects(e.aprobar({ usuario }), (err) => err.status === 404 && /perfil de coordinador/.test(err.message), String(usuario));
  }
  assert.deepEqual(e.sellosDeTiempo, []);
  sinCambios(e, antes);
});

test('aprobar: solo con reporte en pendiente_revision_coordinador — resuelto → 409; con el profesor / inexistente / otro tipo / id inválido → 404; sin TSA ni lecturas', async (t) => {
  const e = await escenario(t);
  const lecturas = t.mock.method(fs.promises, 'readFile');
  const antes = e.estadoActual();
  await assert.rejects(e.aprobar({ id: 2 }), (err) => err.status === 409 && err.code === CODIGOS_ERROR.REPORTE_NO_PENDIENTE && err.estadoReporte === 'aprobado_coordinador');
  await assert.rejects(e.aprobar({ id: 3 }), (err) => err.status === 409 && err.estadoReporte === 'rechazado_coordinador');
  for (const id of [4, 5, 999, 'abc', 0, undefined]) await assert.rejects(e.aprobar({ id }), es404, String(id));
  await assert.rejects(e.aprobar({ tipo: 'global' }), es404);
  await assert.rejects(e.aprobar({ tipo: 'semanal' }), es404);
  assert.equal(lecturas.mock.callCount(), 0);
  assert.deepEqual(e.sellosDeTiempo, []);
  sinCambios(e, antes);
});

test('aprobar: verifica el hash del PDF contra la ÚLTIMA aprobación del profesor — distinto, sin hash o solo rechazos → 500 y no se sella', async (t) => {
  t.mock.method(console, 'error', () => {});
  const otroHash = sha256('otro pdf');
  const casos = {
    'hash distinto': { hashProfesor: otroHash },
    'aprobación del profesor sin hash': { revisiones: [rev(9001, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'), rev(9101, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z')] },
    'sin aprobación del profesor (solo alumno)': { revisiones: [rev(9001, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z', { hash_documento: otroHash })] },
    'solo un rechazo del profesor': { revisiones: [rev(9102, 'profesor', 'rechazado', '2026-08-20T15:00:00.000Z', { comentario: 'x' })] },
  };
  for (const [nombre, opciones] of Object.entries(casos)) {
    const e = await escenario(t, opciones);
    const antes = e.estadoActual();
    await assert.rejects(e.aprobar(), codigo(CODIGOS_ERROR.ARCHIVO_INCONSISTENTE, 500), nombre);
    assert.deepEqual(e.sellosDeTiempo, [], nombre);
    sinCambios(e, antes, nombre);
  }
});

test('aprobar: entre varias aprobaciones del profesor cuenta la última; un rechazo posterior o un hash del alumno no la sustituyen', async (t) => {
  const e0 = await escenario(t);
  const bueno = sha256(e0.pdf);
  const viejaMala = rev(9101, 'profesor', 'aprobado', '2026-08-01T15:00:00.000Z', { hash_documento: sha256('ciclo anterior') });
  const nuevaBuena = rev(9103, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z', { hash_documento: bueno });
  const rechazoTardio = rev(9104, 'profesor', 'rechazado', '2026-08-21T15:00:00.000Z', { comentario: 'x' });
  const alumnoTardio = rev(9002, 'alumno', 'aprobado', '2026-08-22T15:00:00.000Z', { hash_documento: sha256('otro') });

  const bien = await escenario(t, { revisiones: [viejaMala, nuevaBuena, rechazoTardio, alumnoTardio] });
  await bien.aprobar();
  assert.equal(bien.reporte.estado_reporte, ESTADOS_REPORTE.APROBADO_COORDINADOR);

  t.mock.method(console, 'error', () => {});
  const mal = await escenario(t, { revisiones: [rev(9105, 'profesor', 'aprobado', '2026-08-01T15:00:00.000Z', { hash_documento: bueno }), rev(9106, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z', { hash_documento: sha256('la vigente es otra') })] });
  await assert.rejects(mal.aprobar(), codigo(CODIGOS_ERROR.ARCHIVO_INCONSISTENTE, 500));
});

test('aprobar: archivo del reporte ausente → 404 ARCHIVO_NO_DISPONIBLE y no se sella', async (t) => {
  const e = await escenario(t, { sinArchivo: true });
  const antes = e.estadoActual();
  await assert.rejects(e.aprobar(), codigo('ARCHIVO_NO_DISPONIBLE', 404));
  assert.deepEqual(e.sellosDeTiempo, []);
  sinCambios(e, antes);
});

test('aprobar: si el sello del prototipo falta o está alterado, falla antes de leer el PDF o pedir la TSA y no cambia nada', async (t) => {
  for (const codigoError of ['SELLO_ALTERADO', 'SELLO_NO_ENCONTRADO']) {
    const e = await escenario(t);
    const lecturas = t.mock.method(fs.promises, 'readFile');
    const antes = e.estadoActual();
    await assert.rejects(e.aprobar({ deps: { leerSello: () => { throw Object.assign(new Error('sello inservible'), { code: codigoError }); } } }), codigo(codigoError));
    assert.equal(lecturas.mock.callCount(), 0, 'no se leyó el PDF');
    assert.deepEqual([e.sellosDeTiempo, e.notificaciones], [[], []]);
    sinCambios(e, antes);
    lecturas.mock.restore();
  }
});

test('aprobar: un sello que no es una imagen válida no avanza nada (falla antes de la TSA)', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  await assert.rejects(e.aprobar({ deps: { leerSello: () => ({ data: Buffer.from('esto no es una imagen') }) } }), codigo('IMAGEN_INVALIDA', 422));
  assert.deepEqual(e.sellosDeTiempo, []);
  sinCambios(e, antes);
});

test('aprobar: si la TSA falla (sin conexión, respuesta inservible) → 503 reintentable y NO se avanza el estado ni queda archivo ni revisión', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const tsa of [
    async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); },
    async () => ({ token: '' }),
    async () => null,
  ]) {
    const e = await escenario(t, { tsa });
    const antes = e.estadoActual();
    const archivosAntes = archivos(e.rutaBaseDocumentos);
    await assert.rejects(e.aprobar(), (err) => err.status === 503 && err.code === CODIGOS_ERROR.SELLO_TIEMPO_NO_DISPONIBLE && err.reintentable === true && /no fue aprobado/.test(err.message));
    sinCambios(e, antes);
    assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, 'sin archivo nuevo');
    assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
    assert.ok(!e.operaciones.includes('$transaction'), 'ni siquiera se abre la transacción');
  }
});

test('aprobar: si falla la persistencia en BD, todo se revierte y el archivo nuevo se borra (sin aprobación parcial)', async (t) => {
  for (const operacion of ['revision_reporte_mensual.create', 'documento.updateMany']) {
    const e = await escenario(t, { bd: { fallos: { [operacion]: new Error('BD caída') } } });
    const antes = e.estadoActual();
    const archivosAntes = archivos(e.rutaBaseDocumentos);
    await assert.rejects(e.aprobar(), /BD caída/, operacion);
    sinCambios(e, antes, operacion);
    assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);
    assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, `${operacion}: el archivo nuevo se borró`);
    assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
  }
});

test('aprobar: dos aprobaciones simultáneas — solo una avanza; la otra recibe 409, su archivo se borra y se avisa una sola vez', async (t) => {
  const e = await escenario(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 25)); return { token: `${TOKEN}-${hash.slice(0, 6)}`, fecha: new Date() }; } });
  const antes = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.aprobar(), e.aprobar({ usuario: OTRO_COORDINADOR })]);

  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find((r) => r.status === 'rejected').reason.code, CODIGOS_ERROR.REPORTE_NO_PENDIENTE);
  assert.equal(revisionesDe(e.reporte).length, antes + 1, 'una sola revisión de Coordinación');
  assert.equal(e.notificaciones.length, 2, 'alumno y profesor, una sola vez');
  const propios = archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/'));
  assert.equal(propios.length, 2, 'el vigente anterior y el final registrado; el del perdedor se borró');
  assert.ok(propios.includes(e.reporte.documento.ruta_archivo));
});

test('aprobar: aprobar y rechazar a la vez — solo una resolución se registra', async (t) => {
  const e = await escenario(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 25)); return { token: TOKEN, fecha: new Date() }; } });
  const antes = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.aprobar(), e.rechazar('Motivo')]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(revisionesDe(e.reporte).length, antes + 1);
  assert.ok([ESTADOS_REPORTE.APROBADO_COORDINADOR, ESTADOS_REPORTE.RECHAZADO_COORDINADOR].includes(e.reporte.estado_reporte));
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, e.reporte.estado_reporte === ESTADOS_REPORTE.APROBADO_COORDINADOR ? 2 : 1);
});

test('aprobar: si el documento fue reemplazado mientras se validaba (otro archivo) → 409 y no se pisa nada', async (t) => {
  const e = await escenario(t, {
    tsa: async (hash) => { e.reporte.documento.ruta_archivo = '2022630001/reenviado.pdf'; e.sellosDeTiempo.push(hash); return { token: TOKEN, fecha: new Date() }; },
  });
  await assert.rejects(e.aprobar(), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);
  assert.equal(e.reporte.documento.ruta_archivo, '2022630001/reenviado.pdf');
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 1, 'el archivo nuevo se borró');
});

test('aprobar: la IP sale de la conexión y una IP inservible no se guarda', async (t) => {
  const e = await escenario(t);
  await e.aprobar({ deps: { ip: 'x'.repeat(60) } });
  assert.equal(revisionesDe(e.reporte).at(-1).ip_firma, null);
});

test('aprobar: no hay ownership — cualquier coordinador valida cualquier reporte de la bandeja', async (t) => {
  const e = await escenario(t);
  await e.aprobar({ usuario: OTRO_COORDINADOR });
  assert.equal(revisionesDe(e.reporte).at(-1).usuario_id, OTRO_COORDINADOR);
});

// ══ RECHAZAR ══════════════════════════════════════════════════

test('rechazar: estado rechazado_coordinador + revisión rechazada con motivo, fecha y revisor; sin PDF, sello, hash, IP ni TSA', async (t) => {
  const e = await escenario(t);
  const antes = revisionesDe(e.reporte).map((r) => ({ ...r }));
  const archivosAntes = archivos(e.rutaBaseDocumentos);
  let sellos = 0;
  let pdfs = 0;

  const r = await e.rechazar('  Falta el detalle de las horas.  ', {
    deps: {
      leerSello: () => { sellos += 1; return { data: SELLO_PNG }; },
      agregarSello: async () => { pdfs += 1; },
    },
  });

  assert.deepEqual(r, { reporte: { id: 1, numero: 2, estadoReporte: 'rechazado_coordinador' }, fechaRevision: '2026-09-22T15:00:00.000Z' });
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_COORDINADOR);
  const nuevas = revisionesDe(e.reporte).slice(antes.length);
  assert.equal(nuevas.length, 1);
  assert.deepEqual({ ...nuevas[0], id: undefined }, {
    id: undefined,
    reporte_mensual_id: 1,
    usuario_id: COORDINADOR,
    tipo_revisor: 'coordinador',
    estado: 'rechazado',
    comentario: 'Falta el detalle de las horas.',
    hash_documento: null,
    ruta_archivo: e.rutaVigente, // no se genera PDF nuevo: el vigente que se está rechazando
    ip_firma: null,
    token_tsa: null,
    fecha: new Date('2026-09-22T15:00:00.000Z'),
  });
  assert.deepEqual(revisionesDe(e.reporte).slice(0, antes.length), antes, 'historial append-only: lo anterior intacto');
  assert.deepEqual([sellos, pdfs, e.sellosDeTiempo], [0, 0, []], 'ni sello, ni PDF, ni TSA');
  assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, 'no se genera ni se toca ningún archivo');
  assert.equal(e.reporte.documento.ruta_archivo, e.rutaVigente, 'el documento no cambia');
});

test('rechazar: avisa al alumno y al profesor con la notificación existente y el evento reporte:actualizado', async (t) => {
  const e = await escenario(t);
  await e.rechazar();
  assert.deepEqual(e.notificaciones, [
    { usuarioId: ALUMNO_USUARIO, tipo: 'urgente', mensaje: 'Coordinación rechazó tu Reporte Mensual No. 2. Revisa el motivo y corrígelo.', rutaRelacionada: '/alumno/reportes?destacar=1' },
    { usuarioId: PROFESOR_DEL_REPORTE, tipo: 'urgente', mensaje: 'Coordinación rechazó el Reporte Mensual No. 2 de ANA GARCIA LOPEZ.', rutaRelacionada: '/profesor/reportes?destacar=1' },
  ]);
  assert.deepEqual(e.emisiones.map((x) => [x.usuarioId, x.evento]), [[ALUMNO_USUARIO, 'reporte:actualizado'], [PROFESOR_DEL_REPORTE, 'reporte:actualizado']]);
});

test('rechazar: el motivo es obligatorio (vacío, espacios, sin cuerpo, no texto) y tiene tope; no se cambia nada', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const malo of [undefined, null, '', '   \n\t ', 42, { texto: 'x' }, ['x']]) {
    await assert.rejects(e.rechazar(malo), codigo('COMENTARIO_REQUERIDO', 400), String(malo));
  }
  await assert.rejects(e.rechazar('x'.repeat(MAX_CARACTERES_COMENTARIO + 1)), codigo('COMENTARIO_MUY_LARGO', 400));
  sinCambios(e, antes);
  assert.deepEqual(e.notificaciones, []);
  await e.rechazar('x'.repeat(MAX_CARACTERES_COMENTARIO)); // el tope exacto sí se acepta
});

test('rechazar: solo coordinadores y solo reportes pendientes de validación — mismos 404/409 que aprobar, sin cambios', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const usuario of [PROFESOR_USUARIO, 999]) await assert.rejects(e.rechazar('Motivo', { usuario }), (err) => err.status === 404 && /perfil de coordinador/.test(err.message));
  for (const id of [4, 5, 999, 'abc', undefined]) await assert.rejects(e.rechazar('Motivo', { id }), es404, String(id));
  await assert.rejects(e.rechazar('Motivo', { tipo: 'global' }), es404);
  await assert.rejects(e.rechazar('Motivo', { id: 2 }), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  await assert.rejects(e.rechazar('Motivo', { id: 3 }), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  sinCambios(e, antes);
  assert.deepEqual(e.notificaciones, []);
});

test('rechazar: si falla el registro, la transacción se revierte completa (estado y revisión) y no se avisa a nadie', async (t) => {
  const e = await escenario(t, { bd: { fallos: { 'revision_reporte_mensual.create': new Error('BD caída') } } });
  const antes = e.estadoActual();
  await assert.rejects(e.rechazar(), /BD caída/);
  sinCambios(e, antes);
  assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
});

test('rechazar: fail-open — si falla la notificación o el socket, el rechazo queda registrado', async (t) => {
  const registro = t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.rechazar('Motivo', {
    deps: {
      crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
      emitirAUsuario: () => { throw new Error('socket no inicializado'); },
    },
  });
  assert.equal(r.reporte.estadoReporte, 'rechazado_coordinador');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_COORDINADOR);
  assert.equal(registro.mock.callCount(), 4, 'dos avisos, cada uno con su notificación y su socket');
});

test('rechazar: dos rechazos simultáneos — solo uno se registra y el otro recibe 409', async (t) => {
  const e = await escenario(t);
  const antes = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.rechazar('Uno'), e.rechazar('Dos', { usuario: OTRO_COORDINADOR })]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find((r) => r.status === 'rejected').reason.code, CODIGOS_ERROR.REPORTE_NO_PENDIENTE);
  assert.equal(revisionesDe(e.reporte).length, antes + 1);
});

test('un reporte rechazado por Coordinación ya no se puede aprobar (ni rechazar de nuevo)', async (t) => {
  const e = await escenario(t);
  await e.rechazar();
  await assert.rejects(e.aprobar(), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  await assert.rejects(e.rechazar(), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  assert.deepEqual(e.sellosDeTiempo, []);
});

test('aprobar y rechazar: solo lecturas y las escrituras previstas — nunca se borra ni se modifica una revisión (append-only)', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  const permitidas = new Set(['coordinador.findUnique', 'reporte_mensual.findFirst', '$transaction', 'reporte_mensual.updateMany', 'documento.updateMany', 'revision_reporte_mensual.create']);
  assert.ok(e.operaciones.every((o) => permitidas.has(o)), e.operaciones.join(', '));
  assert.throws(() => e.prisma.revision_reporte_mensual.deleteMany, /Operación no permitida/);
  assert.throws(() => e.prisma.revision_reporte_mensual.updateMany, /Operación no permitida/);
});
