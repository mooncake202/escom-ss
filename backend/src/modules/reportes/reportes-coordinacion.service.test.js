// CU-REP-06 (Coordinación): listado, detalle y PDF almacenado. Prisma falso con el grafo de reportes; solo lectura.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { listarReportes, obtenerDetalleReporte, obtenerPdfReporte } = require('./reportes-coordinacion.service');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');
const { cifrarBuffer } = require('../../lib/fileEncryption');

const COORDINADOR = 70;
const COORDINADORES = [COORDINADOR, 71];
const PDF_VIGENTE = Buffer.from('%PDF-1.7\n% PDF vigente: alumno + profesor (bytes exactos)\n%%EOF\n');

const rev = (id, tipo, estado, fecha, extra = {}) => ({ id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: null, comentario: null, ...extra });
const alumnoFirma = (id) => rev(9000 + id, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z', { hash_documento: 'a'.repeat(64) });
const profesorAprueba = (id, fecha) => rev(9100 + id, 'profesor', 'aprobado', fecha, { hash_documento: 'b'.repeat(64) });

// Grafo típico: dos pendientes, un aprobado, un rechazado por Coordinación y dos que Coordinación todavía no ve.
function grafo(extra = {}) {
  return [
    reporteMensual({ id: 1, profesorId: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, numero: 2, rutaArchivo: 'x/1.pdf',
      revisiones: [alumnoFirma(1), profesorAprueba(1, '2026-08-20T15:00:00.000Z')] }),
    reporteMensual({ id: 2, profesorId: 2, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, nombre: 'LUIS', apellidos: 'RUIZ MARTINEZ', boleta: '2022630002', carrera: 'ISC',
      profesorNombre: 'DRA. ROSA', profesorApellidos: 'RAMIREZ GUTIERREZ', rutaArchivo: 'x/2.pdf',
      revisiones: [alumnoFirma(2), profesorAprueba(2, '2026-08-18T15:00:00.000Z')] }),
    reporteMensual({ id: 3, profesorId: 1, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR, rutaArchivo: 'x/3.pdf',
      revisiones: [alumnoFirma(3), profesorAprueba(3, '2026-08-10T15:00:00.000Z'), rev(9200, 'coordinador', 'aprobado', '2026-08-12T15:00:00.000Z', { hash_documento: 'c'.repeat(64) })] }),
    reporteMensual({ id: 4, profesorId: 1, estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, rutaArchivo: 'x/4.pdf',
      revisiones: [alumnoFirma(4), profesorAprueba(4, '2026-08-11T15:00:00.000Z'), rev(9201, 'coordinador', 'rechazado', '2026-08-25T15:00:00.000Z', { comentario: 'Falta el detalle de las horas.' })] }),
    reporteMensual({ id: 5, profesorId: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, rutaArchivo: 'x/5.pdf' }),
    reporteMensual({ id: 6, profesorId: 1, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, rutaArchivo: 'x/6.pdf' }),
    ...(extra.reportes ?? []),
  ];
}

const bd = (reportes = grafo(), opciones = {}) => crearBdProfesor({ profesores: { 50: 1 }, reportes, coordinadores: COORDINADORES, ...opciones });
const ids = (lista) => lista.map((r) => r.id);

// ── Listado ──────────────────────────────────────────────────

test('listado: pendientes (los que espera Coordinación) y procesados (validados o rechazados); lo que sigue con el profesor no aparece', async () => {
  const { prisma } = bd();
  const r = await listarReportes(COORDINADOR, { prisma });
  assert.deepEqual(ids(r.pendientes), [2, 1], 'pendientes: del más antiguo (aprobado antes por el profesor) al más reciente');
  assert.deepEqual(ids(r.procesados), [4, 3], 'procesados: del más reciente al más antiguo');
  assert.deepEqual(r.totales, { pendientes: 2, procesados: 2 });
  assert.ok(![5, 6].some((id) => ids([...r.pendientes, ...r.procesados]).includes(id)), 'pendiente_revision_profesor y rechazado_profesor no se ven');
});

test('listado: la bandeja es compartida — cualquier coordinador ve los reportes de todos los profesores', async () => {
  const { prisma } = bd();
  assert.deepEqual(ids((await listarReportes(71, { prisma })).pendientes), [2, 1]);
});

test('listado: forma de cada reporte — alumno, boleta, carrera, profesor, periodo, fechas y puedeRevisar; sin datos internos', async () => {
  const { prisma } = bd();
  const { pendientes, procesados } = await listarReportes(COORDINADOR, { prisma });
  const uno = pendientes.find((r) => r.id === 1);

  assert.deepEqual(Object.keys(uno).sort(), [
    'alumno', 'estadoReporte', 'fechaAprobacionProfesor', 'fechaEnvio', 'fechaRevisionCoordinacion', 'id', 'mesMostrado',
    'numeroReporte', 'periodo', 'profesor', 'puedeRevisar', 'tipoReporte',
  ]);
  assert.deepEqual(uno.alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001', carrera: 'Ingeniería en Inteligencia Artificial' });
  assert.deepEqual(uno.profesor, { nombreCompleto: 'LUIS TORRES VEGA' });
  assert.equal(uno.tipoReporte, 'mensual');
  assert.equal(uno.numeroReporte, 2);
  assert.equal(uno.estadoReporte, 'pendiente_revision_coordinador');
  assert.equal(uno.puedeRevisar, true);
  assert.equal(uno.fechaAprobacionProfesor, '2026-08-20T15:00:00.000Z');
  assert.equal(uno.fechaRevisionCoordinacion, null);
  assert.equal(uno.fechaEnvio, '2026-08-16T15:00:00.000Z');
  assert.equal(pendientes.find((r) => r.id === 2).alumno.carrera, 'Ingeniería en Sistemas Computacionales');
  assert.equal(procesados.find((r) => r.id === 3).fechaRevisionCoordinacion, '2026-08-12T15:00:00.000Z');
  assert.equal(procesados.every((r) => r.puedeRevisar === false), true);
  assert.equal(/solicitud_registro|documento|ruta_archivo|hash|token|comentario|usuario_id/i.test(JSON.stringify({ pendientes, procesados })), false);
});

test('listado: un coordinador sin perfil (o un usuario de otro rol) recibe 404 de perfil; nunca se listan reportes', async () => {
  const { prisma, operaciones } = bd();
  await assert.rejects(listarReportes(50, { prisma }), (err) => err.status === 404 && /perfil de coordinador/.test(err.message)); // es profesor
  await assert.rejects(listarReportes(999, { prisma }), (err) => err.status === 404);
  assert.ok(!operaciones.includes('reporte_mensual.findMany'));
});

test('listado: solo lecturas y sin consultar bitácoras (el modelo no existe en la BD falsa)', async () => {
  const { prisma, operaciones } = bd();
  await listarReportes(COORDINADOR, { prisma });
  assert.deepEqual(operaciones, ['coordinador.findUnique', 'reporte_mensual.findMany', 'reporte_global.findMany']);
});

// ── Detalle ──────────────────────────────────────────────────

test('detalle: título, alumno, carrera, profesor, días, horas, fechas y estado, con el snapshot del propio reporte', async () => {
  const { prisma } = bd();
  const d = await obtenerDetalleReporte(COORDINADOR, 'mensual', 1, { prisma });
  assert.equal(d.titulo, 'Reporte mensual de actividades No. 2');
  assert.equal(d.diasLaborados, 4);
  assert.equal(d.horasReportadas, 13);
  assert.equal(d.actividades, 'Actividades del reporte 1.');
  assert.deepEqual(d.alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001', carrera: 'Ingeniería en Inteligencia Artificial' });
  assert.deepEqual(d.profesor, { nombreCompleto: 'LUIS TORRES VEGA' });
  assert.equal(d.fechaAprobacionProfesor, '2026-08-20T15:00:00.000Z');
  assert.equal(d.puedeRevisar, true);
  assert.equal(d.revisionCoordinacion, null);
  assert.equal(d.periodo.inicioTexto.length > 0, true);
});

test('detalle: un reporte ya resuelto se puede consultar (con el motivo del rechazo) pero no revisar; el id puede llegar como texto', async () => {
  const { prisma } = bd();
  const rechazado = await obtenerDetalleReporte(COORDINADOR, 'mensual', '4', { prisma });
  assert.equal(rechazado.puedeRevisar, false);
  assert.deepEqual(rechazado.revisionCoordinacion, { estado: 'rechazado', comentario: 'Falta el detalle de las horas.', fecha: '2026-08-25T15:00:00.000Z' });
  const aprobado = await obtenerDetalleReporte(COORDINADOR, 'mensual', 3, { prisma });
  assert.deepEqual([aprobado.puedeRevisar, aprobado.revisionCoordinacion.estado, aprobado.revisionCoordinacion.comentario], [false, 'aprobado', null]);
});

test('detalle: inexistente, aún con el profesor, otro tipo o id inválido → EL MISMO 404', async () => {
  const { prisma } = bd();
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  for (const [tipo, id] of [['mensual', 999], ['mensual', 5], ['mensual', 6], ['global', 1], ['semanal', 1], ['__proto__', 1], ['mensual', 'abc'], ['mensual', 0], ['mensual', '1.5'], ['mensual', undefined], ['mensual', { id: 1 }]]) {
    await assert.rejects(obtenerDetalleReporte(COORDINADOR, tipo, id, { prisma }), esperado, `${tipo}/${String(id)}`);
  }
  await assert.rejects(obtenerDetalleReporte(50, 'mensual', 1, { prisma }), (err) => err.status === 404 && /perfil de coordinador/.test(err.message));
});

test('detalle: nunca se consultan bitácoras', async () => {
  const { prisma, operaciones } = bd();
  await obtenerDetalleReporte(COORDINADOR, 'mensual', 1, { prisma });
  assert.deepEqual(operaciones, ['coordinador.findUnique', 'reporte_mensual.findFirst']);
});

// ── PDF almacenado ───────────────────────────────────────────

function carpeta(t, archivos = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-coordinacion-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  for (const [ruta, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(base, ruta)), { recursive: true });
    fs.writeFileSync(path.join(base, ruta), contenido);
  }
  return base;
}

test('pdf: entrega el PDF vigente descifrado, byte por byte, de un reporte pendiente y de uno ya resuelto', async (t) => {
  const base = carpeta(t, { 'x/1.pdf': cifrarBuffer(PDF_VIGENTE), 'x/3.pdf': cifrarBuffer(Buffer.from('%PDF-final-con-sello')) });
  const { prisma } = bd();
  const pendiente = await obtenerPdfReporte(COORDINADOR, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.equal(Buffer.compare(pendiente.pdf, PDF_VIGENTE), 0);
  assert.equal(pendiente.nombreArchivo, 'reporte-mensual-2-2022630001.pdf');
  const aprobado = await obtenerPdfReporte(COORDINADOR, 'mensual', '3', { prisma, rutaBaseDocumentos: base });
  assert.equal(aprobado.pdf.toString(), '%PDF-final-con-sello');
});

test('pdf: un reporte que Coordinación no ve (con el profesor), inexistente o de otro tipo → el mismo 404 y nunca se lee el archivo', async (t) => {
  const base = carpeta(t, { 'x/5.pdf': cifrarBuffer(PDF_VIGENTE), 'x/6.pdf': cifrarBuffer(PDF_VIGENTE) });
  const lecturas = t.mock.method(fs.promises, 'readFile');
  const { prisma } = bd();
  for (const [tipo, id] of [['mensual', 5], ['mensual', 6], ['mensual', 999], ['global', 1], ['mensual', 'abc']]) {
    await assert.rejects(obtenerPdfReporte(COORDINADOR, tipo, id, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404 && err.message === 'Reporte no encontrado.', `${tipo}/${id}`);
  }
  await assert.rejects(obtenerPdfReporte(50, 'mensual', 1, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404);
  assert.equal(lecturas.mock.callCount(), 0);
});

test('pdf: archivo ausente o ruta fuera de la carpeta → 404 ARCHIVO_NO_DISPONIBLE; archivo alterado → 500 ARCHIVO_ILEGIBLE', async (t) => {
  t.mock.method(console, 'error', () => {});
  const raiz = carpeta(t, { 'docs/x/2.pdf': cifrarBuffer(PDF_VIGENTE), 'secreto.pdf': cifrarBuffer(PDF_VIGENTE) });
  const alterado = cifrarBuffer(PDF_VIGENTE);
  alterado[alterado.length - 1] ^= 0xff;
  fs.writeFileSync(path.join(raiz, 'docs/x/4.pdf'), alterado);
  const reportes = [
    reporteMensual({ id: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, rutaArchivo: 'x/no-existe.pdf' }),
    reporteMensual({ id: 2, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, rutaArchivo: '../secreto.pdf' }),
    reporteMensual({ id: 3, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, rutaArchivo: null }),
    reporteMensual({ id: 4, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, rutaArchivo: 'x/4.pdf' }),
  ];
  const { prisma } = bd(reportes);
  const base = path.join(raiz, 'docs');
  for (const id of [1, 2, 3]) {
    await assert.rejects(obtenerPdfReporte(COORDINADOR, 'mensual', id, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404 && err.code === 'ARCHIVO_NO_DISPONIBLE', `reporte ${id}`);
  }
  await assert.rejects(obtenerPdfReporte(COORDINADOR, 'mensual', 4, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 500 && err.code === 'ARCHIVO_ILEGIBLE');
});

test('pdf: sin escribir nada — ni en disco (archivos intactos) ni en BD (solo lecturas)', async (t) => {
  const base = carpeta(t, { 'x/1.pdf': cifrarBuffer(PDF_VIGENTE) });
  const antes = fs.readFileSync(path.join(base, 'x/1.pdf'));
  const escrituras = ['writeFile', 'rm', 'unlink', 'rename', 'appendFile', 'mkdir'].map((m) => t.mock.method(fs.promises, m));
  const { prisma, operaciones } = bd();
  await obtenerPdfReporte(COORDINADOR, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.equal(Buffer.compare(fs.readFileSync(path.join(base, 'x/1.pdf')), antes), 0);
  assert.equal(escrituras.reduce((n, e) => n + e.mock.callCount(), 0), 0);
  assert.deepEqual(operaciones, ['coordinador.findUnique', 'reporte_mensual.findFirst']);
});
