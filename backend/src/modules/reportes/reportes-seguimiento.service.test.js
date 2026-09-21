// CU-REP-02 / CU-REP-03 (Alumno): listado, seguimiento e historial real, y PDF almacenado. Prisma falso; solo lectura.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { listarReportes, obtenerSeguimiento, obtenerPdfReporte } = require('./reportes-seguimiento.service');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');
const { cifrarBuffer } = require('../../lib/fileEncryption');

const ALUMNO = 201; // alumno del reporte con id 1 (alumnoUsuarioId = 200 + id)
const OTRO_ALUMNO = 202;
const PDF = Buffer.from('%PDF-1.7\n% PDF almacenado (bytes exactos)\n%%EOF\n');

const usuario = (nombre, apellidos) => ({ nombre, apellidos });
const rev = (id, tipo, estado, fecha, extra = {}) => ({
  id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: 'h'.repeat(64), ip_firma: '10.0.0.1', token_tsa: 'tok', comentario: null,
  usuario: tipo === 'alumno' ? usuario('ANA', 'GARCIA LOPEZ') : tipo === 'profesor' ? usuario('LUIS', 'TORRES VEGA') : usuario('MARIA', 'SOTO PEREZ'), ...extra,
});
const ids = (l) => l.map((r) => r.id);

// Historial largo: enviado, rechazo del profesor, corrección, aprobación, rechazo de Coordinación, corrección, aprobaciones.
const HISTORIAL_LARGO = [
  rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'),
  rev(2, 'profesor', 'rechazado', '2026-08-18T15:00:00.000Z', { comentario: 'Faltan actividades del segundo mes.' }),
  rev(3, 'alumno', 'aprobado', '2026-08-19T15:00:00.000Z'),
  rev(4, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z'),
  rev(5, 'coordinador', 'rechazado', '2026-08-22T15:00:00.000Z', { comentario: 'El formato de las actividades no es claro.' }),
  rev(6, 'alumno', 'aprobado', '2026-08-23T15:00:00.000Z'),
  rev(7, 'profesor', 'aprobado', '2026-08-24T15:00:00.000Z'),
  rev(8, 'coordinador', 'aprobado', '2026-08-26T15:00:00.000Z'),
];

function grafo() {
  return [
    reporteMensual({ id: 1, estado: ESTADOS_REPORTE.APROBADO_COORDINADOR, numero: 1, diasLaborados: 16, horasReportadas: 61, rutaArchivo: 'x/1.pdf', revisiones: HISTORIAL_LARGO }),
    reporteMensual({ id: 11, alumnoUsuarioId: ALUMNO, boleta: '2022630001', solicitudId: 1001, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, numero: 2, diasLaborados: 14, horasReportadas: 50, rutaArchivo: 'x/11.pdf',
      actividades: 'Actividades a corregir.',
      revisiones: [rev(20, 'alumno', 'aprobado', '2026-09-16T15:00:00.000Z'), rev(21, 'profesor', 'rechazado', '2026-09-18T15:00:00.000Z', { comentario: 'Detalla las pruebas realizadas.' })] }),
    reporteMensual({ id: 12, alumnoUsuarioId: ALUMNO, boleta: '2022630001', solicitudId: 1001, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, numero: 3, rutaArchivo: 'x/12.pdf',
      revisiones: [rev(30, 'alumno', 'aprobado', '2026-10-16T15:00:00.000Z')] }),
    // De otro alumno.
    reporteMensual({ id: 2, alumnoUsuarioId: OTRO_ALUMNO, boleta: '2022630002', solicitudId: 1002, nombre: 'LUIS', apellidos: 'RUIZ MARTINEZ', estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, rutaArchivo: 'x/2.pdf',
      revisiones: [rev(40, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'), rev(41, 'coordinador', 'rechazado', '2026-08-30T15:00:00.000Z', { comentario: 'Reporte del otro alumno.' })] }),
  ];
}
// El reporte 1 es de ALUMNO también (alumnoUsuarioId = 200 + 1 = 201).
const bd = (reportes = grafo()) => crearBdProfesor({ profesores: {}, reportes });

// ── Listado ──────────────────────────────────────────────────

test('listado: solo los reportes del alumno del token, del más reciente al más antiguo; nada de otros alumnos', async () => {
  const { prisma } = bd();
  const r = await listarReportes(ALUMNO, { prisma });
  assert.deepEqual(ids(r.reportes), [12, 11, 1]);
  assert.equal(r.total, 3);
  assert.deepEqual(ids((await listarReportes(OTRO_ALUMNO, { prisma })).reportes), [2]);
  assert.deepEqual((await listarReportes(999, { prisma })).reportes, [], 'un usuario sin reportes recibe una lista vacía');
  assert.equal(/RUIZ|Reporte del otro alumno|2022630002/.test(JSON.stringify(await listarReportes(ALUMNO, { prisma }))), false);
});

test('listado: cada reporte trae número, periodo real, estado, snapshot de días/horas, revisor y acciones — sin mes/año como nombre ni datos internos', async () => {
  const { prisma } = bd();
  const { reportes } = await listarReportes(ALUMNO, { prisma });
  const r11 = reportes.find((r) => r.id === 11);

  assert.deepEqual(Object.keys(r11).sort(), [
    'diasLaborados', 'estadoReporte', 'fechaEnvio', 'horasReportadas', 'id', 'numeroReporte', 'periodo', 'puedeCorregir',
    'revisor', 'tipoReporte', 'totalEventos', 'ultimoRechazo',
  ]);
  assert.deepEqual([r11.tipoReporte, r11.numeroReporte, r11.estadoReporte, r11.diasLaborados, r11.horasReportadas], ['mensual', 2, 'rechazado_profesor', 14, 50]);
  assert.equal(r11.periodo.inicioTexto.length > 0, true);
  assert.deepEqual(r11.revisor, { nombreCompleto: 'LUIS TORRES VEGA' });
  assert.equal(r11.fechaEnvio, '2026-09-16T15:00:00.000Z');
  assert.equal(r11.puedeCorregir, true);
  assert.deepEqual(r11.ultimoRechazo, { etapa: 'profesor', fecha: '2026-09-18T15:00:00.000Z', motivo: 'Detalla las pruebas realizadas.', actor: { nombreCompleto: 'LUIS TORRES VEGA' } });
  assert.equal(r11.totalEventos, 2);
  assert.equal(reportes.find((r) => r.id === 12).puedeCorregir, false);
  assert.equal(reportes.find((r) => r.id === 12).ultimoRechazo, null);
  assert.equal(/mesMostrado|titulo|hash|token|ip_firma|ruta_archivo|comentario|solicitud_registro/i.test(JSON.stringify(reportes)), false);
});

test('listado: solo lecturas y sin consultar bitácoras (el modelo no existe en la BD falsa)', async () => {
  const { prisma, operaciones } = bd();
  await listarReportes(ALUMNO, { prisma });
  assert.deepEqual(operaciones, ['reporte_mensual.findMany', 'reporte_global.findMany']);
});

// ── Seguimiento / historial real ─────────────────────────────

test('seguimiento: reconstruye el historial REAL desde las revisiones, en orden, y conserva los rechazos aunque el reporte termine aprobado', async () => {
  const { prisma } = bd();
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma });

  assert.equal(s.estadoReporte, 'aprobado_coordinador');
  assert.deepEqual(s.historial.map((h) => [h.etapa, h.resultado]), [
    ['alumno', 'enviado'],
    ['profesor', 'rechazado'],
    ['alumno', 'reenviado'],
    ['profesor', 'aprobado'],
    ['coordinacion', 'rechazado'],
    ['alumno', 'reenviado'],
    ['profesor', 'aprobado'],
    ['coordinacion', 'aprobado'],
  ]);
  assert.deepEqual(s.historial.map((h) => h.motivo), [null, 'Faltan actividades del segundo mes.', null, null, 'El formato de las actividades no es claro.', null, null, null]);
  assert.equal(s.historial[1].fecha, '2026-08-18T15:00:00.000Z');
  assert.deepEqual(s.historial[1].actor, { nombreCompleto: 'LUIS TORRES VEGA' });
  assert.deepEqual(s.historial[4].actor, { nombreCompleto: 'MARIA SOTO PEREZ' });
  assert.deepEqual(s.historial.map((h) => h.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  // Ya aprobado: nada que corregir, pero el historial conserva los rechazos.
  assert.equal(s.puedeCorregir, false);
  assert.equal(s.ultimoRechazo, null);
  assert.equal(s.actividades, null);
});

test('seguimiento: no inventa eventos — un reporte solo enviado tiene UN evento; el estado actual no se convierte en evento', async () => {
  const { prisma } = bd();
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 12, { prisma });
  assert.equal(s.estadoReporte, 'pendiente_revision_profesor');
  assert.deepEqual(s.historial.map((h) => [h.etapa, h.resultado]), [['alumno', 'enviado']]);
  assert.equal(s.puedeCorregir, false);
});

test('seguimiento: el orden sale de la fecha y, con la misma fecha, del id; una fila desordenada no cambia el resultado', async () => {
  const misma = '2026-08-16T15:00:00.000Z';
  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, revisiones: [
    rev(9, 'profesor', 'aprobado', misma), rev(3, 'alumno', 'aprobado', misma), rev(5, 'alumno', 'aprobado', '2026-08-15T15:00:00.000Z'),
  ] })];
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma: bd(reportes).prisma });
  assert.deepEqual(s.historial.map((h) => h.id), [5, 3, 9]);
  assert.deepEqual(s.historial.map((h) => h.resultado), ['enviado', 'reenviado', 'aprobado']);
});

test('seguimiento con el estado ACTUAL rechazado: último motivo, puedeCorregir y las actividades a precargar', async () => {
  const { prisma } = bd();
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', '11', { prisma });
  assert.equal(s.puedeCorregir, true);
  assert.deepEqual(s.ultimoRechazo, { etapa: 'profesor', fecha: '2026-09-18T15:00:00.000Z', motivo: 'Detalla las pruebas realizadas.', actor: { nombreCompleto: 'LUIS TORRES VEGA' } });
  assert.equal(s.actividades, 'Actividades a corregir.');
  assert.equal(s.titulo, 'Reporte mensual de actividades No. 2');
  assert.deepEqual([s.diasLaborados, s.horasReportadas], [14, 50], 'snapshot del reporte');
});

test('rechazado por Coordinación tras un rechazo anterior del profesor: el último motivo es el de Coordinación y los dos siguen en el historial', async () => {
  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR, revisiones: [
    rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'), rev(2, 'profesor', 'rechazado', '2026-08-17T15:00:00.000Z', { comentario: 'Primero.' }),
    rev(3, 'alumno', 'aprobado', '2026-08-18T15:00:00.000Z'), rev(4, 'profesor', 'aprobado', '2026-08-19T15:00:00.000Z'),
    rev(5, 'coordinador', 'rechazado', '2026-08-20T15:00:00.000Z', { comentario: 'Segundo.' }),
  ] })];
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma: bd(reportes).prisma });
  assert.equal(s.ultimoRechazo.etapa, 'coordinacion');
  assert.equal(s.ultimoRechazo.motivo, 'Segundo.');
  assert.deepEqual(s.historial.filter((h) => h.resultado === 'rechazado').map((h) => h.motivo), ['Primero.', 'Segundo.']);
  assert.equal(s.puedeCorregir, true);
});

test('un estado rechazado sin ninguna revisión de rechazo guardada: se puede corregir, pero no se inventa un motivo', async () => {
  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, revisiones: [rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z')] })];
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma: bd(reportes).prisma });
  assert.equal(s.puedeCorregir, true);
  assert.equal(s.ultimoRechazo, null);
});

test('seguimiento: nunca expone hash, token, IP ni datos de otros; un rechazo sin comentario guardado trae motivo nulo', async () => {
  const reportes = [reporteMensual({ id: 1, estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, revisiones: [
    rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'), rev(2, 'profesor', 'rechazado', '2026-08-17T15:00:00.000Z', { comentario: undefined }),
  ] })];
  const s = await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma: bd(reportes).prisma });
  assert.equal(s.historial[1].motivo, null);
  const { prisma } = bd();
  const texto = JSON.stringify(await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma }));
  assert.equal(/hash|token|ip_firma|tok\b|10\.0\.0\.1|h{20}|ruta_archivo|solicitud_registro/i.test(texto), false);
});

test('seguimiento ajeno, inexistente, global, de otro tipo o con id inválido: EL MISMO 404', async () => {
  const { prisma } = bd();
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  await assert.rejects(obtenerSeguimiento(ALUMNO, 'mensual', 2, { prisma }), esperado, 'de otro alumno');
  await assert.rejects(obtenerSeguimiento(OTRO_ALUMNO, 'mensual', 11, { prisma }), esperado);
  await assert.rejects(obtenerSeguimiento(ALUMNO, 'mensual', 999, { prisma }), esperado);
  for (const [tipo, id] of [['global', 1], ['semanal', 1], ['__proto__', 1], ['mensual', 'abc'], ['mensual', 0], ['mensual', '1.5'], ['mensual', undefined], ['mensual', { id: 1 }]]) {
    await assert.rejects(obtenerSeguimiento(ALUMNO, tipo, id, { prisma }), esperado, `${tipo}/${String(id)}`);
  }
});

test('seguimiento: la propiedad va en el propio filtro y solo se hace una lectura', async () => {
  const { prisma, operaciones } = bd();
  await obtenerSeguimiento(ALUMNO, 'mensual', 1, { prisma });
  assert.deepEqual(operaciones, ['reporte_mensual.findFirst']);
});

// ── PDF almacenado ───────────────────────────────────────────

function carpeta(t, archivos = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-alumno-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  for (const [ruta, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(base, ruta)), { recursive: true });
    fs.writeFileSync(path.join(base, ruta), contenido);
  }
  return base;
}

test('pdf: entrega el PDF almacenado del propio reporte, descifrado y byte por byte, en cualquier estado', async (t) => {
  const base = carpeta(t, { 'x/1.pdf': cifrarBuffer(PDF), 'x/11.pdf': cifrarBuffer(Buffer.from('%PDF-rechazado')), 'x/12.pdf': cifrarBuffer(Buffer.from('%PDF-pendiente')) });
  const { prisma } = bd();
  const aprobado = await obtenerPdfReporte(ALUMNO, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.equal(Buffer.compare(aprobado.pdf, PDF), 0);
  assert.equal(aprobado.nombreArchivo, 'reporte-mensual-1-2022630001.pdf');
  assert.equal((await obtenerPdfReporte(ALUMNO, 'mensual', '11', { prisma, rutaBaseDocumentos: base })).pdf.toString(), '%PDF-rechazado');
  assert.equal((await obtenerPdfReporte(ALUMNO, 'mensual', 12, { prisma, rutaBaseDocumentos: base })).pdf.toString(), '%PDF-pendiente');
});

test('pdf ajeno, inexistente, de otro tipo o con id inválido: EL MISMO 404 y nunca se lee el archivo del otro', async (t) => {
  const base = carpeta(t, { 'x/2.pdf': cifrarBuffer(PDF) });
  const lecturas = t.mock.method(fs.promises, 'readFile');
  const { prisma } = bd();
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';
  for (const [tipo, id] of [['mensual', 2], ['mensual', 999], ['global', 1], ['mensual', 'abc']]) {
    await assert.rejects(obtenerPdfReporte(ALUMNO, tipo, id, { prisma, rutaBaseDocumentos: base }), esperado, `${tipo}/${id}`);
  }
  assert.equal(lecturas.mock.callCount(), 0);
});

test('pdf: archivo ausente o ruta fuera de la carpeta → 404 ARCHIVO_NO_DISPONIBLE; archivo alterado → 500 ARCHIVO_ILEGIBLE; sin escribir nada', async (t) => {
  t.mock.method(console, 'error', () => {});
  const raiz = carpeta(t, { 'docs/x/1.pdf': cifrarBuffer(PDF), 'secreto.pdf': cifrarBuffer(PDF) });
  const alterado = cifrarBuffer(PDF);
  alterado[alterado.length - 1] ^= 0xff;
  fs.writeFileSync(path.join(raiz, 'docs/x/12.pdf'), alterado);
  const reportes = [
    reporteMensual({ id: 1, rutaArchivo: 'x/no-existe.pdf' }),
    reporteMensual({ id: 3, alumnoUsuarioId: 201, rutaArchivo: '../secreto.pdf' }),
    reporteMensual({ id: 4, alumnoUsuarioId: 201, rutaArchivo: null }),
    reporteMensual({ id: 5, alumnoUsuarioId: 201, rutaArchivo: 'x/12.pdf' }),
  ];
  const base = path.join(raiz, 'docs');
  const { prisma, operaciones } = bd(reportes);
  const escrituras = ['writeFile', 'rm', 'unlink', 'rename', 'appendFile', 'mkdir'].map((m) => t.mock.method(fs.promises, m));
  for (const id of [1, 3, 4]) {
    await assert.rejects(obtenerPdfReporte(ALUMNO, 'mensual', id, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404 && err.code === 'ARCHIVO_NO_DISPONIBLE', `reporte ${id}`);
  }
  await assert.rejects(obtenerPdfReporte(ALUMNO, 'mensual', 5, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 500 && err.code === 'ARCHIVO_ILEGIBLE');
  assert.equal(escrituras.reduce((n, e) => n + e.mock.callCount(), 0), 0);
  assert.ok(operaciones.every((o) => o === 'reporte_mensual.findFirst'));
});
