// CU-REP-05 (Profesor): rechazar y aprobar/firmar. BD falsa con transacciones y reversa, carpetas temporales reales,
// PDFs reales (generador + rúbrica agregada) y TSA falsa. Nunca se llama a FreeTSA ni a la red.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, PDFName, PDFDict } = require('pdf-lib');

const { rechazarReporte, aprobarReporte, CODIGOS_ERROR, MAX_CARACTERES_COMENTARIO } = require('./reportes-revision.service');
const { generarPdfReporteMensual, construirDatosPdf } = require('./reportes.pdf');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');
const { crearPng, resultadoEjemplo, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');

const PROFESOR_USUARIO = 50; // → profesor 1
const OTRO_PROFESOR_USUARIO = 51; // → profesor 2
// Correo que reportes.profesor.fixtures.js deriva por omisión para un profesor sin `correo_institucional` explícito
// (reorganización de almacenamiento: la rúbrica del profesor vive en uploads/profesores/<correo>/Rubrica/).
const CORREO_PROFESOR = `profesor${PROFESOR_USUARIO}@ipn.mx`;
const ALUMNO_USUARIO = 201; // alumno del reporte 1
const COORDINADORES = [70, 71];
const IP = '187.190.10.20';
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA-NO-ES-UN-SELLO-REAL').toString('base64');
const RUBRICA_PROFESOR = crearPng(300, 100, [200, 20, 20]);

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const archivos = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(base, path.join(e.parentPath ?? e.path, e.name))).sort()
  : []);
// Imágenes dibujadas en la página (XObjects de sus recursos): logos + rúbricas.
const imagenesDe = async (pdf) => {
  const documento = await PDFDocument.load(new Uint8Array(pdf));
  return documento.getPage(0).node.Resources().lookup(PDFName.of('XObject'), PDFDict).keys().length;
};

// El PDF que firmó el alumno (una sola vez para toda la suite: generarlo es lo más lento).
let pdfAlumnoPromesa = null;
const pdfDelAlumno = () => {
  pdfAlumnoPromesa ??= generarPdfReporteMensual(construirDatosPdf(resultadoEjemplo(), ACTIVIDADES_EJEMPLO), { rubricaAlumno: crearPng(400, 140) });
  return pdfAlumnoPromesa;
};

/**
 * Escenario: reporte 1 del profesor 50 (pendiente, con el PDF del alumno cifrado en disco y su hash registrado),
 * reporte 2 de otro profesor, rúbrica del profesor 50 guardada (salvo `sinRubrica`), TSA y notificaciones falsas.
 */
async function escenario(t, { sinRubrica = false, estado, hashAlumno, sinArchivo = false, rubricaBytes = RUBRICA_PROFESOR, bd: opcionesBd = {}, tsa } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseDocumentos = tmp('revision-docs-');
  const rutaBaseRubricas = tmp('revision-rubricas-');

  const pdfAlumno = Buffer.from(await pdfDelAlumno());
  const rutaAlumno = '2022630001/del-alumno.pdf';
  if (!sinArchivo) {
    fs.mkdirSync(path.join(rutaBaseDocumentos, '2022630001'), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, rutaAlumno), cifrarBuffer(pdfAlumno));
    fs.mkdirSync(path.join(rutaBaseDocumentos, '2022630002'), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, '2022630002/otro.pdf'), cifrarBuffer(Buffer.from('%PDF-del-otro-profesor')));
  }
  fs.mkdirSync(path.join(rutaBaseRubricas, CORREO_PROFESOR, 'Rubrica'), { recursive: true });
  fs.writeFileSync(path.join(rutaBaseRubricas, CORREO_PROFESOR, 'Rubrica/rubrica.enc'), cifrarBuffer(rubricaBytes));

  const reportes = [
    reporteMensual({ id: 1, profesorId: 1, estado, rutaArchivo: rutaAlumno, hashAlumno: hashAlumno ?? sha256(pdfAlumno), numero: 2 }),
    reporteMensual({ id: 2, profesorId: 2, rutaArchivo: '2022630002/otro.pdf', hashAlumno: sha256(Buffer.from('%PDF-del-otro-profesor')) }),
    reporteMensual({ id: 3, profesorId: 1, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR, rutaArchivo: '2022630003/x.pdf' }),
  ];
  const bd = crearBdProfesor({
    profesores: { [PROFESOR_USUARIO]: 1, [OTRO_PROFESOR_USUARIO]: 2 },
    reportes,
    escritura: true,
    usuarios: { [PROFESOR_USUARIO]: { rubrica_imagen: sinRubrica ? null : `${CORREO_PROFESOR}/Rubrica/rubrica.enc` } },
    coordinadores: COORDINADORES,
    ...opcionesBd,
  });

  const sellos = [];
  const notificaciones = [];
  const emisiones = [];
  const deps = {
    prisma: bd.prisma,
    rutaBaseDocumentos,
    rutaBaseRubricas,
    ip: IP,
    ahora: new Date('2026-09-21T15:00:00.000Z'),
    solicitarSelloTiempo: tsa ?? (async (hash) => { sellos.push(hash); return { token: TOKEN, fecha: new Date() }; }),
    crearNotificacion: async (datos) => { notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { emisiones.push({ usuarioId, evento, datos }); },
  };
  return {
    ...bd, reportes, pdfAlumno, rutaAlumno, rutaBaseDocumentos, rutaBaseRubricas, sellos, notificaciones, emisiones, deps,
    reporte: reportes[0],
    estadoActual: () => structuredClone(reportes),
    aprobar: (extra = {}, usuario = PROFESOR_USUARIO, id = 1, tipo = 'mensual') => aprobarReporte(usuario, tipo, id, { ...deps, ...extra }),
    // Sin argumentos usa valores normales; un `undefined` explícito se respeta (para probar entradas inválidas).
    rechazar: (...args) => {
      const dado = (i, defecto) => (args.length > i ? args[i] : defecto);
      return rechazarReporte(dado(1, PROFESOR_USUARIO), dado(3, 'mensual'), dado(2, 1), dado(0, 'Faltan actividades del segundo mes.'), { ...deps, ...dado(4, {}) });
    },
  };
}

const codigo = (c, status) => (err) => err.code === c && (status === undefined || err.status === status);
const revisionesDe = (reporte) => reporte.revision_reporte_mensual;
const sinCambios = (e, antes, mensaje = 'no cambia nada') => assert.deepEqual(e.estadoActual(), antes, mensaje);

// ══ RECHAZAR ══════════════════════════════════════════════════

test('rechazar: estado rechazado_profesor + revisión rechazada con motivo, fecha y revisor; sin firma, hash, IP ni TSA', async (t) => {
  const e = await escenario(t);
  const antes = revisionesDe(e.reporte).map((r) => ({ ...r }));
  const archivosAntes = archivos(e.rutaBaseDocumentos);

  const r = await e.rechazar('  Faltan las actividades del segundo mes.  ');

  assert.deepEqual(r, {
    reporte: { id: 1, numero: 2, estadoReporte: 'rechazado_profesor' },
    fechaRevision: '2026-09-21T15:00:00.000Z',
  });
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_PROFESOR);
  const nuevas = revisionesDe(e.reporte).slice(antes.length);
  assert.equal(nuevas.length, 1);
  assert.deepEqual({ ...nuevas[0], id: undefined }, {
    id: undefined,
    reporte_mensual_id: 1,
    usuario_id: PROFESOR_USUARIO,
    tipo_revisor: 'profesor',
    estado: 'rechazado',
    comentario: 'Faltan las actividades del segundo mes.',
    hash_documento: null,
    ruta_archivo: e.rutaAlumno, // no se genera PDF nuevo: el vigente (del alumno) que se está rechazando
    ip_firma: null,
    token_tsa: null,
    fecha: new Date('2026-09-21T15:00:00.000Z'),
  });
  assert.deepEqual(revisionesDe(e.reporte).slice(0, antes.length), antes, 'historial append-only: lo anterior intacto');
  assert.deepEqual(e.sellos, [], 'no se pide TSA');
  assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, 'no se genera ni se toca ningún archivo');
  assert.equal(e.reporte.documento.ruta_archivo, e.rutaAlumno, 'el documento no cambia');
});

test('rechazar: avisa al alumno con la notificación existente (destacando el reporte) y el evento reporte:actualizado', async (t) => {
  const e = await escenario(t);
  await e.rechazar();
  assert.deepEqual(e.notificaciones, [{
    usuarioId: ALUMNO_USUARIO,
    tipo: 'urgente',
    mensaje: 'Tu profesor rechazó el Reporte Mensual No. 2. Revisa el motivo y corrígelo.',
    rutaRelacionada: '/alumno/reportes?destacar=1',
  }]);
  assert.deepEqual(e.emisiones, [{ usuarioId: ALUMNO_USUARIO, evento: 'reporte:actualizado', datos: { reporteId: 1 } }]);
});

test('rechazar: el motivo es obligatorio (vacío, espacios, sin cuerpo, no texto) y tiene tope; no se cambia nada', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const malo of [undefined, null, '', '   \n\t ', 42, { texto: 'x' }, ['x']]) {
    await assert.rejects(e.rechazar(malo), codigo(CODIGOS_ERROR.COMENTARIO_REQUERIDO, 400), String(malo));
  }
  await assert.rejects(e.rechazar('x'.repeat(MAX_CARACTERES_COMENTARIO + 1)), codigo(CODIGOS_ERROR.COMENTARIO_MUY_LARGO, 400));
  sinCambios(e, antes);
  assert.deepEqual(e.notificaciones, []);
  await e.rechazar('x'.repeat(MAX_CARACTERES_COMENTARIO)); // el tope exacto sí se acepta
});

test('rechazar: solo reportes propios — ajeno, inexistente, global, tipo desconocido o id inválido → el mismo 404, sin cambios', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  await assert.rejects(e.rechazar(undefined, PROFESOR_USUARIO, 2), esperado);
  await assert.rejects(e.rechazar(undefined, OTRO_PROFESOR_USUARIO, 1), esperado);
  await assert.rejects(e.rechazar(undefined, PROFESOR_USUARIO, 999), esperado);
  for (const [tipo, id] of [['global', 1], ['semanal', 1], ['__proto__', 1], ['mensual', 'abc'], ['mensual', 0], ['mensual', '1.5'], ['mensual', undefined]]) {
    await assert.rejects(e.rechazar(undefined, PROFESOR_USUARIO, id, tipo), esperado, `${tipo}/${String(id)}`);
  }
  await assert.rejects(e.rechazar(undefined, 999), (err) => err.status === 404 && /perfil de profesor/.test(err.message));
  sinCambios(e, antes);
  assert.deepEqual(e.notificaciones, []);
});

test('rechazar: solo reportes pendientes_revision_profesor — en cualquier otro estado → 409 sin cambios', async (t) => {
  for (const estado of Object.values(ESTADOS_REPORTE).filter((x) => x !== ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR)) {
    const e = await escenario(t, { estado });
    const antes = e.estadoActual();
    await assert.rejects(e.rechazar(), (err) => err.status === 409 && err.code === CODIGOS_ERROR.REPORTE_NO_PENDIENTE && err.estadoReporte === estado, estado);
    sinCambios(e, antes, estado);
  }
});

test('rechazar: si falla el registro, la transacción se revierte completa (estado y revisión) y no se avisa a nadie', async (t) => {
  const e = await escenario(t, { bd: { fallos: { 'revision_reporte_mensual.create': new Error('BD caída') } } });
  const antes = e.estadoActual();
  await assert.rejects(e.rechazar(), /BD caída/);
  sinCambios(e, antes, 'el estado volvió a pendiente y no quedó revisión');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
});

test('rechazar: fail-open — si falla la notificación o el socket, el rechazo queda registrado', async (t) => {
  const registro = t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.rechazar('Motivo', PROFESOR_USUARIO, 1, 'mensual', {
    crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
    emitirAUsuario: () => { throw new Error('socket no inicializado'); },
  });
  assert.equal(r.reporte.estadoReporte, 'rechazado_profesor');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_PROFESOR);
  assert.equal(registro.mock.callCount(), 2);
});

test('rechazar: dos rechazos simultáneos — solo uno se registra, el otro recibe 409 y hay una única revisión nueva', async (t) => {
  const e = await escenario(t);
  const antes = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.rechazar('Uno'), e.rechazar('Dos')]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find((r) => r.status === 'rejected').reason.code, CODIGOS_ERROR.REPORTE_NO_PENDIENTE);
  assert.equal(revisionesDe(e.reporte).length, antes + 1);
  assert.equal(e.notificaciones.length, 1);
});

// ══ APROBAR Y FIRMAR ══════════════════════════════════════════

test('aprobar: parte del PDF EXACTO almacenado (no regenera), agrega solo la rúbrica y hash/TSA/archivo/BD son de ESE mismo Buffer', async (t) => {
  const e = await escenario(t);
  const recibidos = [];
  const agregarReal = require('./reportes.pdf').agregarRubricaProfesor;
  const agregarRubrica = async (pdf, rubrica) => { recibidos.push({ pdf: Buffer.from(pdf), rubrica: Buffer.from(rubrica) }); return agregarReal(pdf, rubrica); };
  const antesRevisiones = revisionesDe(e.reporte).map((r) => ({ ...r }));

  const r = await e.aprobar({ agregarRubrica });

  assert.deepEqual(r, { reporte: { id: 1, numero: 2, estadoReporte: 'pendiente_revision_coordinador' }, fechaRevision: '2026-09-21T15:00:00.000Z' });
  // Entrada: los bytes exactos del PDF del alumno descifrado y la rúbrica guardada del profesor.
  assert.equal(recibidos.length, 1);
  assert.equal(Buffer.compare(recibidos[0].pdf, e.pdfAlumno), 0);
  assert.equal(Buffer.compare(recibidos[0].rubrica, RUBRICA_PROFESOR), 0);

  // Salida: el PDF final en disco es el que se hasheó y selló, y es el que apunta el documento.
  const rutaFinal = e.reporte.documento.ruta_archivo;
  assert.notEqual(rutaFinal, e.rutaAlumno);
  assert.match(rutaFinal, /^2022630001\/Reportes\/[0-9a-f-]{36}\.pdf$/);
  const final = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, rutaFinal)));
  assert.notEqual(Buffer.compare(final, e.pdfAlumno), 0);
  assert.equal(e.sellos.length, 1);
  assert.equal(e.sellos[0], sha256(final), 'la TSA recibió el hash del Buffer final');

  // Historial: solo se agrega la revisión del profesor; la firma del alumno queda intacta.
  const revisiones = revisionesDe(e.reporte);
  assert.deepEqual(revisiones.slice(0, antesRevisiones.length), antesRevisiones);
  assert.equal(revisiones.length, antesRevisiones.length + 1);
  assert.deepEqual({ ...revisiones.at(-1), id: undefined }, {
    id: undefined,
    reporte_mensual_id: 1,
    usuario_id: PROFESOR_USUARIO,
    tipo_revisor: 'profesor',
    estado: 'aprobado',
    comentario: null,
    hash_documento: sha256(final),
    ruta_archivo: rutaFinal, // el PDF nuevo que el profesor acaba de firmar
    ip_firma: IP,
    token_tsa: TOKEN,
    fecha: new Date('2026-09-21T15:00:00.000Z'),
  });
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);
});

test('aprobar: el PDF final es una página Carta con la firma del alumno y UNA imagen más (la rúbrica); el PDF del alumno sigue intacto en disco', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  const final = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.reporte.documento.ruta_archivo)));

  const documento = await PDFDocument.load(new Uint8Array(final));
  assert.equal(documento.getPageCount(), 1);
  const { width, height } = documento.getPage(0).getSize();
  assert.deepEqual([Math.round(width), Math.round(height)], [612, 792]);
  assert.equal(await imagenesDe(final), (await imagenesDe(e.pdfAlumno)) + 1);

  // El original firmado solo por el alumno se conserva (su hash sigue registrado en su revisión).
  const original = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.rutaAlumno)));
  assert.equal(Buffer.compare(original, e.pdfAlumno), 0);
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 2);
});

test('aprobar: avisa a cada coordinador (notificación existente + evento reporte:nuevo) destacando el reporte', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  assert.deepEqual(e.notificaciones.map((n) => n.usuarioId), COORDINADORES);
  assert.deepEqual(e.notificaciones[0], {
    usuarioId: 70,
    tipo: 'warning',
    mensaje: 'ANA GARCIA LOPEZ: el Reporte Mensual No. 2 fue aprobado por su profesor y espera tu validación.',
    rutaRelacionada: '/coordinacion/reportes?destacar=1',
  });
  assert.deepEqual(e.emisiones, COORDINADORES.map((usuarioId) => ({ usuarioId, evento: 'reporte:nuevo', datos: { reporteId: 1 } })));
});

test('aprobar: fail-open — si falla la notificación o el socket, la aprobación ya confirmada no se revierte', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.aprobar({
    crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
    emitirAUsuario: () => { throw new Error('socket no inicializado'); },
  });
  assert.equal(r.reporte.estadoReporte, 'pendiente_revision_coordinador');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);

  const sinLista = await escenario(t, { bd: { coordinadores: [] } });
  sinLista.prisma.coordinador.findMany = async () => { throw new Error('BD'); };
  await sinLista.aprobar();
  assert.equal(sinLista.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);
});

test('aprobar: sin rúbrica registrada → 409 RUBRICA_NO_REGISTRADA; no se sella, no se escribe y no se cambia nada', async (t) => {
  const e = await escenario(t, { sinRubrica: true });
  const antes = e.estadoActual();
  const archivosAntes = archivos(e.rutaBaseDocumentos);
  await assert.rejects(e.aprobar(), codigo(CODIGOS_ERROR.RUBRICA_NO_REGISTRADA, 409));
  assert.deepEqual(e.sellos, []);
  assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes);
  sinCambios(e, antes);
});

test('aprobar: una rúbrica guardada ilegible o que no es imagen no avanza nada (falla antes de la TSA)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t, { rubricaBytes: Buffer.from('esto no es una imagen') });
  const antes = e.estadoActual();
  await assert.rejects(e.aprobar(), codigo('IMAGEN_INVALIDA', 422));
  assert.deepEqual(e.sellos, []);
  sinCambios(e, antes);
});

test('aprobar: solo reportes propios y pendientes — ajeno/inexistente/global 404; otro estado 409; sin TSA ni lecturas de archivo', async (t) => {
  const e = await escenario(t);
  const lecturas = t.mock.method(fs.promises, 'readFile');
  const antes = e.estadoActual();
  const es404 = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  await assert.rejects(e.aprobar({}, PROFESOR_USUARIO, 2), es404);
  await assert.rejects(e.aprobar({}, OTRO_PROFESOR_USUARIO, 1), es404);
  await assert.rejects(e.aprobar({}, PROFESOR_USUARIO, 999), es404);
  await assert.rejects(e.aprobar({}, PROFESOR_USUARIO, 1, 'global'), es404);
  await assert.rejects(e.aprobar({}, PROFESOR_USUARIO, 'abc'), es404);
  await assert.rejects(e.aprobar({}, PROFESOR_USUARIO, 3), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  assert.equal(lecturas.mock.callCount(), 0);
  assert.deepEqual(e.sellos, []);
  sinCambios(e, antes);

  for (const estado of [ESTADOS_REPORTE.RECHAZADO_PROFESOR, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, ESTADOS_REPORTE.RECHAZADO_COORDINADOR]) {
    const otro = await escenario(t, { estado });
    await assert.rejects(otro.aprobar(), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409), estado);
    assert.deepEqual(otro.sellos, []);
  }
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
    assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
    assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, `${operacion}: el archivo nuevo se borró`);
    assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
  }
});

test('aprobar: el PDF almacenado debe ser el que firmó el alumno — hash distinto, archivo ausente o ilegible → no se firma ni se sella', async (t) => {
  t.mock.method(console, 'error', () => {});
  const alterado = await escenario(t, { hashAlumno: sha256(Buffer.from('otro pdf')) });
  await assert.rejects(alterado.aprobar(), codigo(CODIGOS_ERROR.ARCHIVO_INCONSISTENTE, 500));
  assert.deepEqual(alterado.sellos, []);

  const sinHash = await escenario(t);
  sinHash.reporte.revision_reporte_mensual = [];
  await assert.rejects(sinHash.aprobar(), codigo(CODIGOS_ERROR.ARCHIVO_INCONSISTENTE, 500));

  const ausente = await escenario(t, { sinArchivo: true });
  await assert.rejects(ausente.aprobar(), codigo('ARCHIVO_NO_DISPONIBLE', 404));

  for (const e of [alterado, sinHash, ausente]) {
    assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
    assert.deepEqual(e.sellos, []);
  }
});

test('aprobar: dos aprobaciones simultáneas — solo una avanza; la otra recibe 409 y su archivo se borra', async (t) => {
  const e = await escenario(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 25)); return { token: `${TOKEN}-${hash.slice(0, 6)}`, fecha: new Date() }; } });
  const antesRevisiones = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.aprobar(), e.aprobar()]);

  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find((r) => r.status === 'rejected').reason.code, CODIGOS_ERROR.REPORTE_NO_PENDIENTE);
  assert.equal(revisionesDe(e.reporte).length, antesRevisiones + 1, 'una sola revisión del profesor');
  assert.equal(e.notificaciones.length, COORDINADORES.length, 'solo se avisó una vez');
  // Solo quedan el PDF del alumno y el final registrado: el del perdedor se borró.
  const propios = archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/'));
  assert.equal(propios.length, 2);
  assert.ok(propios.includes(e.reporte.documento.ruta_archivo));
});

test('aprobar: si el reporte fue reemplazado mientras se firmaba (otro archivo en el documento) → 409 y no se pisa nada', async (t) => {
  const e = await escenario(t, {
    tsa: async (hash) => { e.reporte.documento.ruta_archivo = '2022630001/reenviado.pdf'; e.sellos.push(hash); return { token: TOKEN, fecha: new Date() }; },
  });
  await assert.rejects(e.aprobar(), codigo(CODIGOS_ERROR.REPORTE_NO_PENDIENTE, 409));
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.equal(e.reporte.documento.ruta_archivo, '2022630001/reenviado.pdf');
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 1, 'el archivo nuevo se borró');
});

test('aprobar: la IP sale de la conexión (nunca de un dato del cliente) y una IP inservible no se guarda', async (t) => {
  const e = await escenario(t);
  await e.aprobar({ ip: 'x'.repeat(60) });
  assert.equal(revisionesDe(e.reporte).at(-1).ip_firma, null);
});

test('aprobar y rechazar: solo lecturas y las escrituras previstas — nunca se borra ni se modifica una revisión (append-only)', async (t) => {
  const e = await escenario(t);
  await e.aprobar();
  const permitidas = new Set(['profesor.findUnique', 'usuario.findUnique', 'reporte_mensual.findFirst', '$transaction', 'reporte_mensual.updateMany', 'documento.updateMany', 'revision_reporte_mensual.create', 'coordinador.findMany']);
  assert.ok(e.operaciones.every((o) => permitidas.has(o)), e.operaciones.join(', '));
  assert.ok(!e.operaciones.some((o) => /delete|update\b/.test(o) && o.startsWith('revision_')));
  // El Prisma falso ni siquiera expone borrar/modificar revisiones: intentarlo falla.
  assert.throws(() => e.prisma.revision_reporte_mensual.deleteMany, /Operación no permitida/);
  assert.throws(() => e.prisma.revision_reporte_mensual.updateMany, /Operación no permitida/);
});
