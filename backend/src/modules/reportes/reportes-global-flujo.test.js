// CU-REP-07 dentro de los flujos de CU-REP-02..06: el reporte global sigue EXACTAMENTE la misma cadena que el mensual
// (alumno → profesor → coordinación, con rechazo y corrección), con las mismas garantías. Cada etapa se prueba con su BD falsa;
// los ids del mensual y del global se repiten a propósito para comprobar que nunca se confunden.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const { listarReportes: listarAlumno, obtenerSeguimiento, obtenerPdfReporte: pdfAlumno } = require('./reportes-seguimiento.service');
const { listarReportes: listarProfesor, obtenerDetalleReporte: detalleProfesor } = require('./reportes-profesor.service');
const { listarReportes: listarCoordinacion, obtenerDetalleReporte: detalleCoordinacion, obtenerPdfReporte: pdfCoordinacion } = require('./reportes-coordinacion.service');
const { aprobarReporte: aprobarProfesor, rechazarReporte: rechazarProfesor } = require('./reportes-revision.service');
const { aprobarReporte: aprobarCoordinacion, rechazarReporte: rechazarCoordinacion } = require('./reportes-validacion.service');
const { reenviarReporteCorregido, generarVistaPreviaCorreccion } = require('./reportes-correccion.service');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, reporteGlobal, crearBdProfesor, alumnoGrafo } = require('./reportes.profesor.fixtures');
const { crearPng } = require('./reportes.pdf.fixtures');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');

const ALUMNO = 201; // alumno de los reportes con id 1
const PROFESOR = 50; // → profesor 1 (usuario del profesor del reporte: 301)
const COORDINADOR = 70;
const RUBRICA = crearPng(300, 100, [200, 20, 20]);
const SELLO = crearPng(200, 200, [10, 120, 30]);
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA').toString('base64');
const IP = '187.190.10.20';
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rev = (id, tipo, estado, fecha, extra = {}) => ({
  id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: null, ip_firma: '10.0.0.1', token_tsa: `tok-${id}`, comentario: null,
  usuario: { nombre: tipo === 'alumno' ? 'ANA' : 'LUIS', apellidos: tipo === 'alumno' ? 'GARCIA LOPEZ' : 'TORRES VEGA' }, ...extra,
});

// Un PDF real de una página Carta: alcanza para agregarle la rúbrica del profesor o el sello sin generar la plantilla completa.
async function pdfBase() {
  const documento = await PDFDocument.create();
  documento.addPage([612, 792]);
  return Buffer.from(await documento.save());
}

function carpeta(t, prefijo) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const archivos = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(base, path.join(e.parentPath ?? e.path, e.name))).sort()
  : []);

const clon = (bd) => structuredClone({ reportes: bd.reportes, globales: bd.globales });

// ══ REP-02 / REP-03: seguimiento del alumno ═══════════════════

const HISTORIAL_GLOBAL = [
  rev(1, 'alumno', 'aprobado', '2027-02-20T15:00:00.000Z'),
  rev(2, 'profesor', 'rechazado', '2027-02-22T15:00:00.000Z', { comentario: 'Detalla los resultados del proyecto.' }),
  rev(3, 'alumno', 'aprobado', '2027-02-23T15:00:00.000Z'),
  rev(4, 'profesor', 'aprobado', '2027-02-24T15:00:00.000Z'),
  rev(5, 'coordinador', 'rechazado', '2027-02-26T15:00:00.000Z', { comentario: 'Falta el cierre del servicio.' }),
];

test('REP-03: el global aparece en Mis reportes con su periodo completo, sin número ni días/horas, y primero (cierra el servicio)', async (t) => {
  const { prisma } = crearBdProfesor({
    profesores: {},
    reportes: [reporteMensual({ id: 1, numero: 1, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR }), reporteMensual({ id: 2, alumnoUsuarioId: ALUMNO, boleta: '2022630001', solicitudId: 1001, numero: 2, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR })],
    globales: [reporteGlobal({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, revisiones: HISTORIAL_GLOBAL })],
  });
  const { reportes, total } = await listarAlumno(ALUMNO, { prisma });
  assert.equal(total, 3);
  assert.deepEqual(reportes.map((r) => [r.tipoReporte, r.id]), [['global', 1], ['mensual', 2], ['mensual', 1]]);
  const global = reportes[0];
  assert.deepEqual([global.numeroReporte, global.diasLaborados, global.horasReportadas], [null, null, null]);
  assert.deepEqual(global.periodo, { inicio: '2026-07-16', fin: '2027-02-17', inicioTexto: '16 de julio de 2026', finTexto: '17 de febrero de 2027', esquema: 'completo' });
  assert.equal(global.puedeCorregir, true);
  assert.deepEqual(global.ultimoRechazo, { etapa: 'coordinacion', fecha: '2027-02-26T15:00:00.000Z', motivo: 'Falta el cierre del servicio.', actor: { nombreCompleto: 'LUIS TORRES VEGA' } });
});

test('REP-02: el seguimiento del global reconstruye su historial REAL (rechazos incluidos) y no se confunde con el mensual del mismo id', async () => {
  const { prisma } = crearBdProfesor({
    profesores: {},
    reportes: [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR })],
    globales: [reporteGlobal({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, actividades: 'Resumen a corregir.', revisiones: HISTORIAL_GLOBAL })],
  });
  const s = await obtenerSeguimiento(ALUMNO, 'global', 1, { prisma });
  assert.equal(s.tipoReporte, 'global');
  assert.equal(s.titulo, 'Reporte global de actividades');
  assert.deepEqual(s.historial.map((h) => [h.etapa, h.resultado, h.motivo]), [
    ['alumno', 'enviado', null], ['profesor', 'rechazado', 'Detalla los resultados del proyecto.'], ['alumno', 'reenviado', null],
    ['profesor', 'aprobado', null], ['coordinacion', 'rechazado', 'Falta el cierre del servicio.'],
  ]);
  assert.equal(s.estadoReporte, 'rechazado_coordinador');
  assert.equal(s.actividades, 'Resumen a corregir.', 'se precarga el resumen (actividades_resumen)');
  assert.equal(s.ultimoRechazo.motivo, 'Falta el cierre del servicio.');
  const mensual = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma });
  assert.equal(mensual.estadoReporte, 'pendiente_revision_profesor', 'el mensual con el mismo id es otro reporte');
  assert.equal(mensual.historial.length, 1);
});

test('REP-02/03: el alumno no ve el global de otro alumno (mismo 404) y el PDF del global sale con su nombre', async (t) => {
  const base = carpeta(t, 'pdf-global-alumno-');
  fs.mkdirSync(path.join(base, 'g'), { recursive: true });
  fs.writeFileSync(path.join(base, 'g/1.pdf'), cifrarBuffer(Buffer.from('%PDF-global')));
  fs.writeFileSync(path.join(base, 'g/2.pdf'), cifrarBuffer(Buffer.from('%PDF-de-otro')));
  const { prisma } = crearBdProfesor({
    profesores: {},
    globales: [reporteGlobal({ id: 1, rutaArchivo: 'g/1.pdf' }), reporteGlobal({ id: 2, alumnoUsuarioId: 202, boleta: '2022630002', rutaArchivo: 'g/2.pdf' })],
  });
  const r = await pdfAlumno(ALUMNO, 'global', 1, { prisma, rutaBaseDocumentos: base });
  assert.equal(r.pdf.toString(), '%PDF-global');
  assert.equal(r.nombreArchivo, 'reporte-global-2022630001.pdf');
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  await assert.rejects(obtenerSeguimiento(ALUMNO, 'global', 2, { prisma }), esperado);
  await assert.rejects(pdfAlumno(ALUMNO, 'global', 2, { prisma, rutaBaseDocumentos: base }), esperado);
});

// ══ REP-04: corregir y reenviar un global rechazado ═══════════

async function escenarioCorreccion(t, { estado = ESTADOS_REPORTE.RECHAZADO_PROFESOR, revisiones } = {}) {
  const docs = carpeta(t, 'global-corr-docs-');
  const rubricas = carpeta(t, 'global-corr-rubricas-');
  fs.mkdirSync(path.join(docs, '2022630001'), { recursive: true });
  fs.writeFileSync(path.join(docs, '2022630001/anterior.pdf'), cifrarBuffer(Buffer.from('%PDF-global-anterior')));
  fs.mkdirSync(path.join(rubricas, String(ALUMNO)), { recursive: true });
  fs.writeFileSync(path.join(rubricas, `${ALUMNO}/firma.enc`), cifrarBuffer(RUBRICA));

  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, diasLaborados: 4, horasReportadas: 13, actividades: 'Mensual intacto.', rutaArchivo: '2022630001/mensual.pdf' })];
  const globales = [reporteGlobal({
    id: 1, estado, actividades: 'Resumen original.', rutaArchivo: '2022630001/anterior.pdf',
    revisiones: revisiones ?? [rev(1, 'alumno', 'aprobado', '2027-02-20T15:00:00.000Z'), rev(2, 'profesor', 'rechazado', '2027-02-22T15:00:00.000Z', { comentario: 'Más detalle.' })],
  })];
  const bd = crearBdProfesor({
    profesores: {}, reportes, globales, escritura: true,
    usuarios: { [ALUMNO]: { rubrica_imagen: `${ALUMNO}/firma.enc` } },
    alumnos: { [ALUMNO]: alumnoGrafo({ usuarioId: ALUMNO }) },
  });
  const sellos = [];
  const generados = [];
  const notificaciones = [];
  const deps = {
    prisma: bd.prisma, rutaBaseDocumentos: docs, rutaBaseRubricas: rubricas, ip: IP, ahora: new Date('2027-03-01T15:00:00.000Z'),
    generarPdf: async (datos, opciones) => { generados.push({ datos, rubrica: Buffer.from(opciones.rubricaAlumno) }); return Buffer.from(`%PDF-global-corregido\n${datos.actividades.texto}`); },
    solicitarSelloTiempo: async (hash) => { sellos.push(hash); return { token: TOKEN }; },
    crearNotificacion: async (d) => { notificaciones.push(d); },
    emitirAUsuario: () => {},
  };
  return { ...bd, docs, sellos, generados, notificaciones, deps, global: globales[0], mensual: reportes[0] };
}

test('REP-04 global: solo cambia el resumen; pasa a pendiente_revision_profesor con revisión NUEVA del alumno y el historial intacto', async (t) => {
  const e = await escenarioCorreccion(t);
  const antes = e.global.revision_reporte_global.map((r) => structuredClone(r));
  const mensualAntes = structuredClone(e.mensual);

  const r = await reenviarReporteCorregido(ALUMNO, 'global', 1, 'Resumen corregido con más detalle.', e.deps);

  assert.deepEqual(r.reporte, { id: 1, numero: null, estadoReporte: 'pendiente_revision_profesor' });
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.equal(e.global.actividades_resumen, 'Resumen corregido con más detalle.');
  assert.deepEqual(Object.keys(e.global).sort(), ['actividades_resumen', 'documento', 'documento_id', 'estado_reporte', 'id', 'revision_reporte_global', 'solicitud_registro', 'solicitud_registro_id'], 'sin columnas de snapshot');
  assert.deepEqual(e.global.revision_reporte_global.slice(0, antes.length), antes, 'revisiones, hashes y sellos anteriores intactos');
  const nueva = e.global.revision_reporte_global.at(-1);
  assert.deepEqual([nueva.tipo_revisor, nueva.estado, nueva.usuario_id, nueva.ip_firma, nueva.token_tsa], ['alumno', 'aprobado', ALUMNO, IP, TOKEN]);
  assert.deepEqual(e.mensual, mensualAntes, 'el mensual con el mismo id no se toca');
  // Mismo Buffer: hash, TSA, archivo y BD.
  const guardado = descifrarBuffer(fs.readFileSync(path.join(e.docs, e.global.documento.ruta_archivo)));
  assert.deepEqual([e.sellos, nueva.hash_documento], [[sha256(guardado)], sha256(guardado)]);
  assert.equal(archivos(e.docs).filter((a) => a.startsWith('2022630001/')).length, 1 + 1 + 0, 'el PDF anterior se conserva y se agrega el nuevo (más el del mensual, que no existe en disco)');
});

test('REP-04 global: el PDF usa el periodo completo, título global y la rúbrica ya registrada; se exige un cambio real', async (t) => {
  const e = await escenarioCorreccion(t);
  await assert.rejects(generarVistaPreviaCorreccion(ALUMNO, 'global', 1, 'Resumen original.', e.deps), (err) => err.code === 'SIN_CAMBIOS_EN_ACTIVIDADES');
  await generarVistaPreviaCorreccion(ALUMNO, 'global', 1, 'Otro resumen distinto.', e.deps);
  const { datos, rubrica } = e.generados[0];
  assert.equal(datos.tipoReporte, 'global');
  assert.equal(datos.numeroReporte, null);
  assert.deepEqual(datos.periodo, { inicioTexto: '16 de julio de 2026', finTexto: '17 de febrero de 2027' });
  assert.equal(Buffer.compare(rubrica, RUBRICA), 0);
  assert.equal(e.sellos.length, 0, 'la vista previa no sella');
});

test('REP-04 global tras rechazo de COORDINACIÓN: vuelve al profesor (nunca a coordinación) y avisa al profesor con la ruta del global', async (t) => {
  const e = await escenarioCorreccion(t, {
    estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
    revisiones: [rev(1, 'alumno', 'aprobado', '2027-02-20T15:00:00.000Z'), rev(4, 'profesor', 'aprobado', '2027-02-24T15:00:00.000Z'), rev(5, 'coordinador', 'rechazado', '2027-02-26T15:00:00.000Z', { comentario: 'x' })],
  });
  await reenviarReporteCorregido(ALUMNO, 'global', 1, 'Resumen corregido.', e.deps);
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.deepEqual(e.notificaciones, [{
    usuarioId: 301, tipo: 'warning', mensaje: 'ANA GARCIA LOPEZ corrigió y reenvió el Reporte Global para tu revisión.', rutaRelacionada: '/profesor/reportes?destacar=1&tipo=global',
  }]);
});

test('REP-04: un global pendiente o aprobado no se corrige (409); el id de un global no habilita corregir el mensual del mismo id', async (t) => {
  const pendiente = await escenarioCorreccion(t, { estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR });
  await assert.rejects(reenviarReporteCorregido(ALUMNO, 'global', 1, 'Otro resumen.', pendiente.deps), (err) => err.status === 409 && err.code === 'REPORTE_NO_CORREGIBLE');
  const e = await escenarioCorreccion(t);
  const antes = clon(e);
  await assert.rejects(reenviarReporteCorregido(202, 'global', 1, 'Otro resumen.', e.deps), (err) => err.status === 404);
  assert.deepEqual(clon(e), antes);
});

// ══ REP-05: el profesor revisa el global ══════════════════════

async function escenarioProfesor(t, { estado = ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, tsa } = {}) {
  const docs = carpeta(t, 'global-prof-docs-');
  const rubricas = carpeta(t, 'global-prof-rubricas-');
  const pdf = await pdfBase();
  fs.mkdirSync(path.join(docs, '2022630001'), { recursive: true });
  fs.writeFileSync(path.join(docs, '2022630001/alumno.pdf'), cifrarBuffer(pdf));
  fs.mkdirSync(path.join(rubricas, String(PROFESOR)), { recursive: true });
  fs.writeFileSync(path.join(rubricas, `${PROFESOR}/firma.enc`), cifrarBuffer(RUBRICA));

  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, rutaArchivo: '2022630001/mensual.pdf' })];
  const globales = [
    reporteGlobal({ id: 1, estado, rutaArchivo: '2022630001/alumno.pdf', hashAlumno: sha256(pdf) }),
    reporteGlobal({ id: 2, profesorId: 2, boleta: '2022630002', rutaArchivo: '2022630002/x.pdf', hashAlumno: sha256(pdf) }),
  ];
  const bd = crearBdProfesor({
    profesores: { [PROFESOR]: 1 }, reportes, globales, escritura: true, coordinadores: [COORDINADOR, 71],
    usuarios: { [PROFESOR]: { rubrica_imagen: `${PROFESOR}/firma.enc` } },
  });
  const sellos = [];
  const notificaciones = [];
  const deps = {
    prisma: bd.prisma, rutaBaseDocumentos: docs, rutaBaseRubricas: rubricas, ip: IP, ahora: new Date('2027-03-01T15:00:00.000Z'),
    solicitarSelloTiempo: tsa ?? (async (hash) => { sellos.push(hash); return { token: TOKEN }; }),
    crearNotificacion: async (d) => { notificaciones.push(d); },
    emitirAUsuario: () => {},
  };
  return { ...bd, docs, pdf, sellos, notificaciones, deps, global: globales[0], mensual: reportes[0] };
}

test('REP-05: el profesor ve el global en su lista y detalle (sin número ni snapshot), y no el de otro profesor', async (t) => {
  const e = await escenarioProfesor(t);
  const r = await listarProfesor(PROFESOR, { prisma: e.prisma });
  assert.deepEqual(r.pendientes.filter((x) => x.tipoReporte === 'global').map((x) => x.id), [1]);
  const d = await detalleProfesor(PROFESOR, 'global', 1, { prisma: e.prisma });
  assert.equal(d.titulo, 'Reporte global de actividades');
  assert.deepEqual([d.numeroReporte, d.diasLaborados, d.horasReportadas], [null, null, null]);
  await assert.rejects(detalleProfesor(PROFESOR, 'global', 2, { prisma: e.prisma }), (err) => err.status === 404);
});

test('REP-05: aprobar un global agrega SOLO la rúbrica al PDF exacto del alumno, mismo Buffer para hash/TSA/archivo/BD, y avisa a coordinación', async (t) => {
  const e = await escenarioProfesor(t);
  const antes = e.global.revision_reporte_global.map((r) => structuredClone(r));
  const mensualAntes = structuredClone(e.mensual);

  const r = await aprobarProfesor(PROFESOR, 'global', 1, e.deps);

  assert.deepEqual(r.reporte, { id: 1, numero: null, estadoReporte: 'pendiente_revision_coordinador' });
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);
  const final = descifrarBuffer(fs.readFileSync(path.join(e.docs, e.global.documento.ruta_archivo)));
  assert.notEqual(Buffer.compare(final, e.pdf), 0);
  assert.deepEqual(e.sellos, [sha256(final)]);
  assert.deepEqual(e.global.revision_reporte_global.slice(0, antes.length), antes, 'historial append-only');
  const nueva = e.global.revision_reporte_global.at(-1);
  assert.deepEqual([nueva.tipo_revisor, nueva.estado, nueva.hash_documento, nueva.token_tsa, nueva.usuario_id], ['profesor', 'aprobado', sha256(final), TOKEN, PROFESOR]);
  assert.deepEqual(e.mensual, mensualAntes, 'el mensual con el mismo id no se toca');
  assert.deepEqual(e.notificaciones.map((n) => [n.usuarioId, n.mensaje, n.rutaRelacionada]), [70, 71].map((u) => [u, 'ANA GARCIA LOPEZ: el Reporte Global fue aprobado por su profesor y espera tu validación.', '/coordinacion/reportes?destacar=1&tipo=global']));
});

test('REP-05: si falla la TSA, un global no avanza; una aprobación repetida recibe 409 (CAS) y no queda nada duplicado', async (t) => {
  t.mock.method(console, 'error', () => {});
  const sinTsa = await escenarioProfesor(t, { tsa: async () => { throw Object.assign(new Error('sin conexión'), { codigo: 'TSA_SIN_CONEXION', name: 'ErrorTsa' }); } });
  const antes = clon(sinTsa);
  await assert.rejects(aprobarProfesor(PROFESOR, 'global', 1, sinTsa.deps), (err) => err.status === 503 && err.reintentable === true);
  assert.deepEqual(clon(sinTsa), antes);
  assert.equal(archivos(sinTsa.docs).length, 1, 'sin archivo nuevo');

  const e = await escenarioProfesor(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 15)); return { token: `${TOKEN}-${hash.slice(0, 4)}` }; } });
  const resultados = await Promise.allSettled([aprobarProfesor(PROFESOR, 'global', 1, e.deps), aprobarProfesor(PROFESOR, 'global', 1, e.deps)]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(e.global.revision_reporte_global.filter((r) => r.tipo_revisor === 'profesor').length, 1);
  assert.equal(archivos(e.docs).filter((a) => a.startsWith('2022630001/')).length, 2, 'el PDF del alumno y el final; el del perdedor se borró');
});

test('REP-05: rechazar un global exige motivo, agrega la revisión del profesor y avisa al alumno con la ruta del global', async (t) => {
  const e = await escenarioProfesor(t);
  await assert.rejects(rechazarProfesor(PROFESOR, 'global', 1, '  ', e.deps), (err) => err.code === 'COMENTARIO_REQUERIDO');
  await rechazarProfesor(PROFESOR, 'global', 1, 'Falta el resumen de resultados.', e.deps);
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.RECHAZADO_PROFESOR);
  const nueva = e.global.revision_reporte_global.at(-1);
  assert.deepEqual([nueva.tipo_revisor, nueva.estado, nueva.comentario, nueva.hash_documento, nueva.token_tsa], ['profesor', 'rechazado', 'Falta el resumen de resultados.', null, null]);
  assert.deepEqual(e.notificaciones, [{
    usuarioId: 201, tipo: 'urgente', mensaje: 'Tu profesor rechazó el Reporte Global. Revisa el motivo y corrígelo.', rutaRelacionada: '/alumno/reportes?destacar=1&tipo=global',
  }]);
  assert.equal(e.mensual.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, 'el mensual con el mismo id sigue igual');
});

test('REP-05: el global ajeno o de otro tipo con ese id no se puede aprobar ni rechazar (404) y no cambia nada', async (t) => {
  const e = await escenarioProfesor(t);
  const antes = clon(e);
  await assert.rejects(aprobarProfesor(PROFESOR, 'global', 2, e.deps), (err) => err.status === 404);
  await assert.rejects(rechazarProfesor(PROFESOR, 'global', 2, 'Motivo', e.deps), (err) => err.status === 404);
  await assert.rejects(aprobarProfesor(PROFESOR, 'global', 99, e.deps), (err) => err.status === 404);
  assert.deepEqual(clon(e), antes);
  assert.deepEqual(e.sellos, []);
});

// ══ REP-06: coordinación valida el global ═════════════════════

async function escenarioCoordinacion(t, { estado = ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR } = {}) {
  const docs = carpeta(t, 'global-coord-docs-');
  const pdf = await pdfBase();
  fs.mkdirSync(path.join(docs, '2022630001'), { recursive: true });
  fs.writeFileSync(path.join(docs, '2022630001/vigente.pdf'), cifrarBuffer(pdf));
  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, rutaArchivo: '2022630001/mensual.pdf' })];
  const globales = [
    reporteGlobal({
      id: 1, estado, rutaArchivo: '2022630001/vigente.pdf',
      revisiones: [rev(1, 'alumno', 'aprobado', '2027-02-20T15:00:00.000Z', { hash_documento: sha256('solo alumno') }), rev(4, 'profesor', 'aprobado', '2027-02-24T15:00:00.000Z', { hash_documento: sha256(pdf) })],
    }),
    reporteGlobal({ id: 2, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, boleta: '2022630002', rutaArchivo: '2022630002/x.pdf' }),
  ];
  const bd = crearBdProfesor({ profesores: {}, reportes, globales, escritura: true, coordinadores: [COORDINADOR] });
  const sellos = [];
  const notificaciones = [];
  const deps = {
    prisma: bd.prisma, rutaBaseDocumentos: docs, ip: IP, ahora: new Date('2027-03-02T15:00:00.000Z'),
    leerSello: () => ({ data: SELLO }),
    solicitarSelloTiempo: async (hash) => { sellos.push(hash); return { token: TOKEN }; },
    crearNotificacion: async (d) => { notificaciones.push(d); },
    emitirAUsuario: () => {},
  };
  return { ...bd, docs, pdf, sellos, notificaciones, deps, global: globales[0], mensual: reportes[0] };
}

test('REP-06: la bandeja de coordinación incluye el global (periodo completo) y solo cuando ya lo aprobó el profesor', async (t) => {
  const e = await escenarioCoordinacion(t);
  const r = await listarCoordinacion(COORDINADOR, { prisma: e.prisma });
  const globales = [...r.pendientes, ...r.procesados].filter((x) => x.tipoReporte === 'global');
  assert.deepEqual(globales.map((g) => g.id), [1], 'el global 2 sigue con el profesor: no se ve');
  assert.deepEqual([globales[0].numeroReporte, globales[0].periodo.esquema, globales[0].profesor.nombreCompleto], [null, 'completo', 'LUIS TORRES VEGA']);
  const d = await detalleCoordinacion(COORDINADOR, 'global', 1, { prisma: e.prisma });
  assert.deepEqual([d.titulo, d.diasLaborados, d.horasReportadas, d.puedeRevisar], ['Reporte global de actividades', null, null, true]);
  await assert.rejects(detalleCoordinacion(COORDINADOR, 'global', 2, { prisma: e.prisma }), (err) => err.status === 404);
});

test('REP-06: validar un global verifica el hash contra la aprobación del profesor, agrega solo el sello y conserva todo el historial', async (t) => {
  const e = await escenarioCoordinacion(t);
  const antes = e.global.revision_reporte_global.map((r) => structuredClone(r));
  const mensualAntes = structuredClone(e.mensual);

  const r = await aprobarCoordinacion(COORDINADOR, 'global', 1, e.deps);

  assert.deepEqual(r.reporte, { id: 1, numero: null, estadoReporte: 'aprobado_coordinador' });
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.APROBADO_COORDINADOR);
  const final = descifrarBuffer(fs.readFileSync(path.join(e.docs, e.global.documento.ruta_archivo)));
  assert.deepEqual(e.sellos, [sha256(final)]);
  assert.deepEqual(e.global.revision_reporte_global.slice(0, antes.length), antes);
  assert.deepEqual(e.mensual, mensualAntes);
  assert.deepEqual(e.notificaciones.map((n) => [n.usuarioId, n.mensaje, n.rutaRelacionada]), [
    [201, 'Coordinación validó tu Reporte Global.', '/alumno/reportes?destacar=1&tipo=global'],
    [301, 'Coordinación validó el Reporte Global de ANA GARCIA LOPEZ.', '/profesor/reportes?destacar=1&tipo=global'],
  ]);
  assert.equal((await pdfCoordinacion(COORDINADOR, 'global', 1, { prisma: e.prisma, rutaBaseDocumentos: e.docs })).nombreArchivo, 'reporte-global-2022630001.pdf');
});

test('REP-06: si el PDF del global no es el que aprobó el profesor → 500 y no se sella; rechazar exige motivo y no genera PDF ni TSA', async (t) => {
  t.mock.method(console, 'error', () => {});
  const alterado = await escenarioCoordinacion(t);
  alterado.global.revision_reporte_global.find((r) => r.tipo_revisor === 'profesor').hash_documento = sha256('otro');
  await assert.rejects(aprobarCoordinacion(COORDINADOR, 'global', 1, alterado.deps), (err) => err.status === 500 && err.code === 'ARCHIVO_INCONSISTENTE');
  assert.deepEqual(alterado.sellos, []);
  assert.equal(alterado.global.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR);

  const e = await escenarioCoordinacion(t);
  await assert.rejects(rechazarCoordinacion(COORDINADOR, 'global', 1, '', e.deps), (err) => err.code === 'COMENTARIO_REQUERIDO');
  await rechazarCoordinacion(COORDINADOR, 'global', 1, 'Falta el cierre del servicio.', e.deps);
  assert.equal(e.global.estado_reporte, ESTADOS_REPORTE.RECHAZADO_COORDINADOR);
  const nueva = e.global.revision_reporte_global.at(-1);
  assert.deepEqual([nueva.tipo_revisor, nueva.estado, nueva.comentario, nueva.hash_documento, nueva.token_tsa], ['coordinador', 'rechazado', 'Falta el cierre del servicio.', null, null]);
  assert.deepEqual(e.sellos, []);
  assert.equal(archivos(e.docs).length, 1, 'no se generó ningún archivo');
  assert.equal(e.mensual.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, 'el mensual con el mismo id sigue igual');
  assert.deepEqual(e.notificaciones.map((n) => n.usuarioId), [201, 301]);
});

test('REP-06: un global ya validado o rechazado no se vuelve a resolver (409) y una validación simultánea solo avanza una vez', async (t) => {
  const e = await escenarioCoordinacion(t);
  const resultados = await Promise.allSettled([aprobarCoordinacion(COORDINADOR, 'global', 1, e.deps), rechazarCoordinacion(COORDINADOR, 'global', 1, 'Motivo', e.deps)]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(e.global.revision_reporte_global.filter((r) => r.tipo_revisor === 'coordinador').length, 1);
  await assert.rejects(aprobarCoordinacion(COORDINADOR, 'global', 1, e.deps), (err) => err.status === 409 && err.code === 'REPORTE_NO_PENDIENTE');
});
