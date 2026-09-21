// CU-REP-05 (Profesor): listado, detalle y PDF almacenado. Prisma falso con el grafo de reportes; solo lectura.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { cifrarBuffer } = require('../../lib/fileEncryption');

const { TIPOS_REPORTE, listarReportes, obtenerDetalleReporte, obtenerPdfReporte } = require('./reportes-profesor.service');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, reporteGlobal, crearBdProfesor } = require('./reportes.profesor.fixtures');

const PROFESOR_A = 50; // usuario_id → profesor 1
const PROFESOR_B = 51; // usuario_id → profesor 2
const PROFESORES = { [PROFESOR_A]: 1, [PROFESOR_B]: 2 };

const ids = (lista) => lista.map((r) => r.id);

// ── Propiedad ────────────────────────────────────────────────

test('listado: cada profesor ve SOLO los reportes de alumnos asignados a sus propias ofertas', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [
      reporteMensual({ id: 1, profesorId: 1 }),
      reporteMensual({ id: 2, profesorId: 2 }),
      reporteMensual({ id: 3, profesorId: 1, estado: 'aprobado_coordinador' }),
      reporteMensual({ id: 4, profesorId: 2, estado: 'rechazado_profesor' }),
    ],
  });

  const a = await listarReportes(PROFESOR_A, { prisma });
  assert.deepEqual(ids(a.pendientes), [1]);
  assert.deepEqual(ids(a.procesados), [3]);

  const b = await listarReportes(PROFESOR_B, { prisma });
  assert.deepEqual(ids(b.pendientes), [2]);
  assert.deepEqual(ids(b.procesados), [4]);
});

test('listado: el profesor sale del token (usuario_id), no de ningún dato del cliente', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1 }), reporteMensual({ id: 2, profesorId: 2 })] });
  // Los parámetros extra que pudiera mandar un cliente no existen en la firma: solo cuenta usuarioId.
  const r = await listarReportes(PROFESOR_B, { prisma, profesorId: 1, profesor_id: 1 });
  assert.deepEqual(ids(r.pendientes), [2]);
});

test('sin perfil de profesor → 404; es de solo lectura (ninguna escritura ni otros modelos)', async () => {
  const { prisma, operaciones } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1 })] });
  await assert.rejects(listarReportes(999, { prisma }), (err) => err.status === 404 && /perfil de profesor/.test(err.message));
  await assert.rejects(obtenerDetalleReporte(999, 'mensual', 1, { prisma }), (err) => err.status === 404);
  await listarReportes(PROFESOR_A, { prisma });
  await obtenerDetalleReporte(PROFESOR_A, 'mensual', 1, { prisma });
  assert.ok(operaciones.every((op) => /\.(findUnique|findMany|findFirst)$/.test(op)), operaciones.join(', '));
});

test('profesor sin reportes: listas vacías', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 2 })] });
  assert.deepEqual(await listarReportes(PROFESOR_A, { prisma }), { pendientes: [], procesados: [], totales: { pendientes: 0, procesados: 0 } });
});

// ── Pendientes / procesados ──────────────────────────────────

test('clasificación: solo pendiente_revision_profesor es pendiente y solo esa permite revisar', async () => {
  const estados = [
    ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    ESTADOS_REPORTE.RECHAZADO_PROFESOR,
    ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
    ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
    ESTADOS_REPORTE.APROBADO_COORDINADOR,
    'estado_desconocido',
  ];
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: estados.map((estado, i) => reporteMensual({ id: i + 1, numero: i + 1, estado })),
  });
  const r = await listarReportes(PROFESOR_A, { prisma });

  assert.deepEqual(r.pendientes.map((x) => x.estadoReporte), ['pendiente_revision_profesor']);
  assert.deepEqual(
    r.procesados.map((x) => x.estadoReporte).sort(),
    ['aprobado_coordinador', 'estado_desconocido', 'pendiente_revision_coordinador', 'rechazado_coordinador', 'rechazado_profesor'],
  );
  assert.ok(r.pendientes.every((x) => x.puedeRevisar === true));
  assert.ok(r.procesados.every((x) => x.puedeRevisar === false));
  assert.deepEqual(r.totales, { pendientes: 1, procesados: 5 });

  // El detalle usa la misma regla.
  for (let i = 0; i < estados.length; i += 1) {
    const d = await obtenerDetalleReporte(PROFESOR_A, 'mensual', i + 1, { prisma });
    assert.equal(d.puedeRevisar, estados[i] === 'pendiente_revision_profesor', estados[i]);
  }
});

test('orden: pendientes del más antiguo al más reciente; procesados del más reciente al más antiguo', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [
      reporteMensual({ id: 1, envio: '2026-09-20T10:00:00.000Z' }),
      reporteMensual({ id: 2, envio: '2026-08-16T10:00:00.000Z' }),
      reporteMensual({ id: 3, envio: '2026-10-16T10:00:00.000Z' }),
      reporteMensual({ id: 4, estado: 'aprobado_coordinador', envio: '2026-08-16T10:00:00.000Z' }),
      reporteMensual({ id: 5, estado: 'aprobado_coordinador', envio: '2026-10-16T10:00:00.000Z' }),
      reporteMensual({ id: 6, estado: 'rechazado_profesor', envio: null }), // sin fecha: al final
    ],
  });
  const r = await listarReportes(PROFESOR_A, { prisma });
  assert.deepEqual(ids(r.pendientes), [2, 1, 3]);
  assert.deepEqual(ids(r.procesados), [5, 4, 6]);
});

// ── Forma de cada reporte ────────────────────────────────────

test('cada reporte trae tipoReporte, numeroReporte, alumno, periodo/mes, fechaEnvio, estadoReporte y puedeRevisar', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [reporteMensual({ id: 7, numero: 1, nombre: 'ANA', apellidos: 'GARCIA LOPEZ', boleta: '2022630001', envio: '2026-08-16T15:30:00.000Z' })],
  });
  const [reporte] = (await listarReportes(PROFESOR_A, { prisma })).pendientes;

  assert.deepEqual(reporte, {
    id: 7,
    tipoReporte: 'mensual',
    numeroReporte: 1,
    alumno: { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001' },
    periodo: { inicio: '2026-07-16', fin: '2026-08-14', inicioTexto: '16 de julio de 2026', finTexto: '14 de agosto de 2026', esquema: 'mediados_de_mes' }, // 15-ago es sábado
    mesMostrado: { mes: 8, anio: 2026, texto: 'Agosto 2026' },
    fechaEnvio: '2026-08-16T15:30:00.000Z',
    estadoReporte: 'pendiente_revision_profesor',
    puedeRevisar: true,
  });
});

test('la tarjeta se arma con tipoReporte + numeroReporte + mesMostrado: "Reporte Mensual No. N · Mes Año"', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, numero: 3 })] });
  const [r] = (await listarReportes(PROFESOR_A, { prisma })).pendientes;
  assert.equal(r.tipoReporte, TIPOS_REPORTE.MENSUAL);
  assert.equal(`Reporte Mensual No. ${r.numeroReporte} · ${r.mesMostrado.texto}`, 'Reporte Mensual No. 3 · Octubre 2026');
});

test('periodo y mes mostrado: mediados de mes (mes de cierre), mes calendario y sin periodo oficial', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [
      reporteMensual({ id: 1, numero: 1, fechaInicio: '2026-07-16' }),                       // 16 jul → 15 ago
      reporteMensual({ id: 2, numero: 2, fechaInicio: '2026-07-16' }),                       // 16 ago → 15 sep
      reporteMensual({ id: 3, numero: 1, fechaInicio: '2026-11-03' }),                       // mes calendario: 3 nov → 30 nov
      reporteMensual({ id: 4, numero: 2, fechaInicio: '2026-12-16', fechaFin: '2027-08-10' }), // cruza de año: 16 ene → 15 feb
      reporteMensual({ id: 5, numero: 1, sinPeriodo: true }),
      reporteMensual({ id: 6, numero: 4, fechaInicio: '2026-07-16' }),                       // 15-nov es domingo → termina el viernes 13
      reporteMensual({ id: 7, numero: 1, fechaInicio: '2026-07-18' }),                       // inicio real en sábado: no se corrige, sin periodo
    ],
  });
  const porId = Object.fromEntries((await listarReportes(PROFESOR_A, { prisma })).pendientes.map((r) => [r.id, r]));
  assert.deepEqual([porId[1].periodo.inicio, porId[1].periodo.fin, porId[1].mesMostrado.texto], ['2026-07-16', '2026-08-14', 'Agosto 2026']);
  assert.deepEqual([porId[2].periodo.inicio, porId[2].periodo.fin, porId[2].mesMostrado.texto], ['2026-08-17', '2026-09-15', 'Septiembre 2026']); // 16-ago es domingo
  assert.deepEqual([porId[3].periodo.esquema, porId[3].periodo.inicio, porId[3].periodo.fin, porId[3].mesMostrado.texto], ['mes_calendario', '2026-11-03', '2026-11-30', 'Noviembre 2026']);
  assert.deepEqual([porId[4].periodo.fin, porId[4].mesMostrado], ['2027-02-15', { mes: 2, anio: 2027, texto: 'Febrero 2027' }]);
  assert.equal(porId[5].periodo, null);
  assert.equal(porId[5].mesMostrado, null);
  assert.deepEqual([porId[6].periodo.inicio, porId[6].periodo.fin, porId[6].mesMostrado.texto], ['2026-10-16', '2026-11-13', 'Noviembre 2026']);
  assert.deepEqual([porId[7].periodo, porId[7].mesMostrado], [null, null]);
});

test('fechaEnvio: la del ÚLTIMO envío del alumno; ignora revisiones del profesor y coordinación; respaldo: el documento', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [
      reporteMensual({
        id: 1,
        estado: 'pendiente_revision_profesor',
        revisiones: [
          { tipo_revisor: 'alumno', estado: 'aprobado', fecha: new Date('2026-08-16T10:00:00.000Z') },
          { tipo_revisor: 'profesor', estado: 'rechazado', fecha: new Date('2026-08-20T10:00:00.000Z') },
          { tipo_revisor: 'alumno', estado: 'aprobado', fecha: new Date('2026-08-25T10:00:00.000Z') }, // reenvío tras corregir
          { tipo_revisor: 'coordinador', estado: 'aprobado', fecha: new Date('2026-09-30T10:00:00.000Z') },
        ],
      }),
      reporteMensual({ id: 2, envio: null, documentoFecha: '2026-08-17T09:00:00.000Z' }),
      reporteMensual({ id: 3, envio: null }),
    ],
  });
  const porId = Object.fromEntries((await listarReportes(PROFESOR_A, { prisma })).pendientes.map((r) => [r.id, r]));
  assert.equal(porId[1].fechaEnvio, '2026-08-25T10:00:00.000Z');
  assert.equal(porId[2].fechaEnvio, '2026-08-17T09:00:00.000Z');
  assert.equal(porId[3].fechaEnvio, null);
});

test('nombre del alumno: "Nombre Apellidos" como está guardado, sin espacios de sobra', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, nombre: '  ANA  MARÍA ', apellidos: 'GARCÍA   LÓPEZ' })] });
  const [r] = (await listarReportes(PROFESOR_A, { prisma })).pendientes;
  assert.equal(r.alumno.nombreCompleto, 'ANA MARÍA GARCÍA LÓPEZ');
});

// ── Global (CU-REP-07): mismo flujo que el mensual ────────────

const PDF_GLOBAL = Buffer.from('%PDF-1.7\n% PDF global almacenado (bytes exactos)\n%%EOF\n');

test('globales: se listan y se ven como los mensuales — misma forma, sin número ni mes, con el periodo COMPLETO del servicio', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [reporteMensual({ id: 1, profesorId: 1 })],
    globales: [
      reporteGlobal({ id: 9, profesorId: 1, envio: '2027-02-20T10:00:00.000Z' }),
      reporteGlobal({ id: 10, profesorId: 2 }),
      reporteGlobal({ id: 11, profesorId: 1, estado: 'aprobado_coordinador' }),
    ],
  });
  const r = await listarReportes(PROFESOR_A, { prisma });
  const global = r.pendientes.find((x) => x.tipoReporte === 'global');

  assert.deepEqual(global, {
    id: 9,
    tipoReporte: 'global',
    numeroReporte: null,
    alumno: { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630009' },
    periodo: { inicio: '2026-07-16', fin: '2027-02-17', inicioTexto: '16 de julio de 2026', finTexto: '17 de febrero de 2027', esquema: 'completo' },
    mesMostrado: null,
    fechaEnvio: '2027-02-20T10:00:00.000Z',
    estadoReporte: 'pendiente_revision_profesor',
    puedeRevisar: true,
  });
  const [mensual] = r.pendientes.filter((x) => x.tipoReporte === 'mensual');
  assert.deepEqual(Object.keys(global), Object.keys(mensual), 'mismas claves: el frontend solo distingue el tipo');
  assert.deepEqual(r.procesados.filter((x) => x.tipoReporte === 'global').map((x) => x.id), [11]);
  assert.equal([...r.pendientes, ...r.procesados].some((x) => x.id === 10), false, 'el global de otro profesor no aparece');
});

test('detalle de un global propio: título, actividades del resumen y snapshot nulo (no se guardan días ni horas); ajeno → 404', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, globales: [reporteGlobal({ id: 9, profesorId: 1, actividades: 'Resumen final del servicio.' }), reporteGlobal({ id: 10, profesorId: 2 })] });
  const d = await obtenerDetalleReporte(PROFESOR_A, 'global', '9', { prisma });
  assert.equal(d.titulo, 'Reporte global de actividades');
  assert.equal(d.actividades, 'Resumen final del servicio.');
  assert.deepEqual([d.diasLaborados, d.horasReportadas, d.numeroReporte], [null, null, null]);
  await assert.rejects(obtenerDetalleReporte(PROFESOR_A, 'global', 10, { prisma }), (err) => err.status === 404 && err.message === 'Reporte no encontrado.');
  await assert.rejects(obtenerDetalleReporte(PROFESOR_A, 'mensual', 9, { prisma }), (err) => err.status === 404, 'el id de un global no es el de un mensual');
});

test('PDF de un global propio: los bytes exactos almacenados, con nombre propio; ajeno → 404', async (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-global-profesor-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  fs.mkdirSync(path.join(base, 'g'), { recursive: true });
  fs.writeFileSync(path.join(base, 'g/9.pdf'), cifrarBuffer(PDF_GLOBAL));
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, globales: [reporteGlobal({ id: 9, profesorId: 1, rutaArchivo: 'g/9.pdf' }), reporteGlobal({ id: 10, profesorId: 2, rutaArchivo: 'g/9.pdf' })] });
  const r = await obtenerPdfReporte(PROFESOR_A, 'global', 9, { prisma, rutaBaseDocumentos: base });
  assert.equal(Buffer.compare(r.pdf, PDF_GLOBAL), 0);
  assert.equal(r.nombreArchivo, 'reporte-global-2022630009.pdf');
  await assert.rejects(obtenerPdfReporte(PROFESOR_A, 'global', 10, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404);
});

// ── Detalle ──────────────────────────────────────────────────

test('detalle mensual: título, tipo, número, alumno, días laborados, horas reportadas, fecha de envío, actividades y estado', async () => {
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [reporteMensual({
      id: 1, numero: 1, actividades: 'Diseñé el módulo.\nDocumenté la API.', envio: '2026-08-16T15:30:00.000Z',
      diasLaborados: 4, horasReportadas: 13,
    })],
  });
  const detalle = await obtenerDetalleReporte(PROFESOR_A, 'mensual', 1, { prisma });

  assert.equal(detalle.id, 1);
  assert.equal(detalle.tipoReporte, 'mensual');
  assert.equal(detalle.numeroReporte, 1);
  assert.equal(detalle.titulo, 'Reporte mensual de actividades No. 1');
  assert.deepEqual(detalle.alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001' });
  assert.equal(detalle.diasLaborados, 4);
  assert.equal(detalle.horasReportadas, 13, 'las horas del snapshot, no días × 4');
  assert.equal(detalle.fechaEnvio, '2026-08-16T15:30:00.000Z');
  assert.equal(detalle.actividades, 'Diseñé el módulo.\nDocumenté la API.');
  assert.equal(detalle.estadoReporte, 'pendiente_revision_profesor');
  assert.equal(detalle.puedeRevisar, true);
  assert.equal(detalle.periodo.inicio, '2026-07-16');
  assert.equal(detalle.mesMostrado.texto, 'Agosto 2026');
});

test('detalle: días y horas salen del snapshot del reporte y NUNCA se consulta bitácora (el modelo ni existe en la BD falsa)', async () => {
  const { prisma, operaciones } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [
      reporteMensual({ id: 1, diasLaborados: 3, horasReportadas: 7 }),
      reporteMensual({ id: 2, diasLaborados: 22, horasReportadas: 88, sinPeriodo: true }),
    ],
  });
  const primero = await obtenerDetalleReporte(PROFESOR_A, 'mensual', 1, { prisma });
  const sinPeriodo = await obtenerDetalleReporte(PROFESOR_A, 'mensual', 2, { prisma });
  assert.deepEqual([primero.diasLaborados, primero.horasReportadas], [3, 7]);
  assert.deepEqual([sinPeriodo.diasLaborados, sinPeriodo.horasReportadas, sinPeriodo.periodo], [22, 88, null], 'no depende del periodo ni de bitácoras');
  assert.equal(operaciones.some((op) => op.startsWith('bitacora')), false);
  assert.deepEqual([...new Set(operaciones)].sort(), ['profesor.findUnique', 'reporte_mensual.findFirst']);
});

test('detalle: un reporte ya procesado se puede consultar pero no revisar', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, estado: 'aprobado_coordinador' })] });
  const detalle = await obtenerDetalleReporte(PROFESOR_A, 'mensual', 1, { prisma });
  assert.equal(detalle.estadoReporte, 'aprobado_coordinador');
  assert.equal(detalle.puedeRevisar, false);
});

test('detalle: el id puede llegar como texto (parámetro de ruta)', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 12 })] });
  assert.equal((await obtenerDetalleReporte(PROFESOR_A, 'mensual', '12', { prisma })).id, 12);
});

// ── 404 sin revelar existencia ───────────────────────────────

test('detalle ajeno, inexistente, de otro tipo o con id inválido: EL MISMO 404, sin revelar que existe', async () => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1 }), reporteMensual({ id: 2, profesorId: 2 })] });
  const intentar = (tipo, id) => obtenerDetalleReporte(PROFESOR_A, tipo, id, { prisma }).then(() => null, (err) => err);

  const ajeno = await intentar('mensual', 2);
  const inexistente = await intentar('mensual', 999);
  assert.equal(ajeno.status, 404);
  assert.equal(inexistente.status, 404);
  assert.equal(ajeno.message, inexistente.message);
  assert.equal(ajeno.code, inexistente.code);
  assert.equal(/ajeno|otro|permiso|prohib/i.test(ajeno.message), false);

  for (const [tipo, id] of [['global', 1], ['semanal', 1], ['__proto__', 1], ['constructor', 1], ['mensual', 'abc'], ['mensual', '0'], ['mensual', '-1'], ['mensual', '1.5'],
    ['mensual', '1e3'], ['mensual', '99999999999999'], ['mensual', ''], ['mensual', undefined], ['mensual', null], ['mensual', { toString: () => '1' }], ['mensual', [1]]]) {
    const err = await intentar(tipo, id);
    assert.ok(err, `${tipo}/${String(id)} debería fallar`);
    assert.equal(err.status, 404, `${tipo}/${String(id)}`);
    assert.equal(err.message, ajeno.message);
  }
  assert.equal((await intentar('mensual', 1)), null, 'el propio sí se consulta');
});

test('la consulta de detalle lleva la propiedad en el propio filtro (un reporte ajeno nunca llega a leerse)', async () => {
  const consultas = [];
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 2, profesorId: 2 })] });
  const original = prisma.reporte_mensual.findFirst;
  const espiado = new Proxy(prisma, {
    get(obj, prop) {
      if (prop === 'reporte_mensual') return { ...obj.reporte_mensual, findFirst: (args) => { consultas.push(args.where); return original(args); } };
      return obj[prop];
    },
  });
  await assert.rejects(obtenerDetalleReporte(PROFESOR_A, 'mensual', 2, { prisma: espiado }), (err) => err.status === 404);
  assert.deepEqual(consultas, [{ id: 2, solicitud_registro: { oferta: { profesor_id: 1 } } }]);
});

// ── PDF almacenado ───────────────────────────────────────────

const PDF_ALUMNO = Buffer.from('%PDF-1.7\n% PDF firmado por el alumno (bytes exactos)\n%%EOF\n');

// Carpeta de documentos temporal con el PDF del alumno cifrado, como lo deja el envío.
function carpetaDocumentos(t, archivos = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-profesor-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  for (const [ruta, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(base, ruta)), { recursive: true });
    fs.writeFileSync(path.join(base, ruta), contenido);
  }
  return base;
}

const instantaneaDe = (base) => fs.readdirSync(base, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => { const r = path.join(e.parentPath ?? e.path, e.name); return [path.relative(base, r), fs.readFileSync(r).toString('hex'), fs.statSync(r).mtimeMs]; })
  .sort();

test('pdf: entrega el PDF almacenado, descifrado y byte por byte igual al que firmó el alumno', async (t) => {
  const base = carpetaDocumentos(t, { '2022630001/a.pdf': cifrarBuffer(PDF_ALUMNO) });
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1, boleta: '2022630001', numero: 3, rutaArchivo: '2022630001/a.pdf' })] });

  const r = await obtenerPdfReporte(PROFESOR_A, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.ok(Buffer.isBuffer(r.pdf));
  assert.equal(Buffer.compare(r.pdf, PDF_ALUMNO), 0);
  assert.equal(r.nombreArchivo, 'reporte-mensual-3-2022630001.pdf');
});

test('pdf: se puede ver en cualquier estado del reporte (pendiente, rechazado, aprobado) y con el id como texto', async (t) => {
  const base = carpetaDocumentos(t, { 'x/a.pdf': cifrarBuffer(PDF_ALUMNO) });
  for (const estado of Object.values(ESTADOS_REPORTE)) {
    const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 4, profesorId: 1, estado, rutaArchivo: 'x/a.pdf' })] });
    const r = await obtenerPdfReporte(PROFESOR_A, 'mensual', '4', { prisma, rutaBaseDocumentos: base });
    assert.equal(Buffer.compare(r.pdf, PDF_ALUMNO), 0, estado);
  }
});

test('pdf ajeno, inexistente, de otro tipo o con id inválido: EL MISMO 404 y nunca se lee el archivo', async (t) => {
  // El archivo del reporte ajeno SÍ existe en disco: aun así no debe llegar a leerse.
  const base = carpetaDocumentos(t, { 'b/a.pdf': cifrarBuffer(PDF_ALUMNO) });
  const lecturas = t.mock.method(fs.promises, 'readFile');
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 2, profesorId: 2, rutaArchivo: 'b/a.pdf' })] });

  const pedir = (tipo, id) => obtenerPdfReporte(PROFESOR_A, tipo, id, { prisma, rutaBaseDocumentos: base });
  const esperado = (err) => err.status === 404 && err.message === 'Reporte no encontrado.' && err.code === undefined;
  await assert.rejects(pedir('mensual', 2), esperado);
  await assert.rejects(pedir('mensual', 999), esperado);
  for (const [tipo, id] of [['global', 1], ['semanal', 1], ['__proto__', 1], ['mensual', 'abc'], ['mensual', 0], ['mensual', -1], ['mensual', '1.5'], ['mensual', '99999999999999'], ['mensual', undefined], ['mensual', { id: 2 }]]) {
    await assert.rejects(pedir(tipo, id), esperado, `${tipo}/${String(id)}`);
  }
  assert.equal(lecturas.mock.callCount(), 0);
});

test('pdf: la propiedad va en el filtro de la consulta y solo se lee el reporte (nada más)', async (t) => {
  const base = carpetaDocumentos(t, { 'x/a.pdf': cifrarBuffer(PDF_ALUMNO) });
  const { prisma, operaciones } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1, rutaArchivo: 'x/a.pdf' })] });
  await obtenerPdfReporte(PROFESOR_A, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.deepEqual(operaciones, ['profesor.findUnique', 'reporte_mensual.findFirst']);

  const b = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1, rutaArchivo: 'x/a.pdf' })] });
  await assert.rejects(obtenerPdfReporte(PROFESOR_B, 'mensual', 1, { prisma: b.prisma, rutaBaseDocumentos: base }), (err) => err.status === 404);
});

test('pdf: sin escribir nada — ni en disco (archivos y fechas intactos) ni en BD (solo lecturas)', async (t) => {
  const base = carpetaDocumentos(t, { 'x/a.pdf': cifrarBuffer(PDF_ALUMNO), 'x/otro.pdf': cifrarBuffer(Buffer.from('%PDF-otro')) });
  const antes = instantaneaDe(base);
  const { prisma, operaciones } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1, rutaArchivo: 'x/a.pdf' })] });
  const escrituras = ['writeFile', 'rm', 'unlink', 'rename', 'appendFile', 'mkdir'].map((m) => t.mock.method(fs.promises, m));

  await obtenerPdfReporte(PROFESOR_A, 'mensual', 1, { prisma, rutaBaseDocumentos: base });
  assert.deepEqual(instantaneaDe(base), antes);
  assert.equal(escrituras.reduce((n, e) => n + e.mock.callCount(), 0), 0);
  assert.ok(operaciones.every((o) => /\.(findUnique|findFirst)$/.test(o)), operaciones.join(', '));
});

test('pdf: reporte sin documento o con el archivo borrado → 404 ARCHIVO_NO_DISPONIBLE', async (t) => {
  const base = carpetaDocumentos(t);
  const { prisma } = crearBdProfesor({
    profesores: PROFESORES,
    reportes: [reporteMensual({ id: 1, profesorId: 1, rutaArchivo: null }), reporteMensual({ id: 2, profesorId: 1, rutaArchivo: 'x/no-existe.pdf' }), reporteMensual({ id: 3, profesorId: 1, rutaArchivo: 'x' })],
  });
  fs.mkdirSync(path.join(base, 'x'));
  for (const id of [1, 2, 3]) {
    await assert.rejects(obtenerPdfReporte(PROFESOR_A, 'mensual', id, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404 && err.code === 'ARCHIVO_NO_DISPONIBLE', `reporte ${id}`);
  }
});

test('pdf: una ruta guardada que sale de la carpeta de documentos (../, absoluta, prefijo parecido) nunca se lee', async (t) => {
  const raiz = carpetaDocumentos(t, { 'documentos/x/a.pdf': cifrarBuffer(PDF_ALUMNO), 'documentos-secretos/a.pdf': cifrarBuffer(PDF_ALUMNO), 'secreto.pdf': cifrarBuffer(PDF_ALUMNO) });
  const base = path.join(raiz, 'documentos');
  const rutas = ['../secreto.pdf', '../documentos-secretos/a.pdf', path.join(raiz, 'secreto.pdf'), '..', '.', ''];
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: rutas.map((rutaArchivo, i) => reporteMensual({ id: i + 1, profesorId: 1, rutaArchivo })) });
  const lecturas = t.mock.method(fs.promises, 'readFile');

  for (let i = 1; i <= rutas.length; i += 1) {
    await assert.rejects(obtenerPdfReporte(PROFESOR_A, 'mensual', i, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 404 && err.code === 'ARCHIVO_NO_DISPONIBLE', rutas[i - 1]);
  }
  assert.equal(lecturas.mock.callCount(), 0);
});

test('pdf: un archivo alterado o cifrado con otra llave → 500 ARCHIVO_ILEGIBLE (sin entregar bytes) y se registra', async (t) => {
  const registro = t.mock.method(console, 'error', () => {});
  const alterado = cifrarBuffer(PDF_ALUMNO);
  alterado[alterado.length - 1] ^= 0xff;
  const base = carpetaDocumentos(t, { 'x/a.pdf': alterado, 'x/corto.pdf': Buffer.from('abc') });
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [reporteMensual({ id: 1, profesorId: 1, rutaArchivo: 'x/a.pdf' }), reporteMensual({ id: 2, profesorId: 1, rutaArchivo: 'x/corto.pdf' })] });
  for (const id of [1, 2]) {
    await assert.rejects(obtenerPdfReporte(PROFESOR_A, 'mensual', id, { prisma, rutaBaseDocumentos: base }), (err) => err.status === 500 && err.code === 'ARCHIVO_ILEGIBLE');
  }
  assert.equal(registro.mock.callCount(), 2);
});

test('pdf: profesor sin perfil → 404 de perfil', async (t) => {
  const { prisma } = crearBdProfesor({ profesores: PROFESORES, reportes: [] });
  await assert.rejects(obtenerPdfReporte(999, 'mensual', 1, { prisma, rutaBaseDocumentos: carpetaDocumentos(t) }), (err) => err.status === 404 && /perfil de profesor/.test(err.message));
});
