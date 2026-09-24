// Página 2 del PDF: CONTROL DE ASISTENCIA (datos + layout + estampado de firmas).
//
// Lo que se vigila aquí es que la hoja NO invente nada: sus registros son las bitácoras que Reportes ya seleccionaba,
// sus horas son `horas_contabilizadas` y sus totales salen de `horas_reportadas`, nunca de un cálculo paralelo.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');

const {
  FILAS, CODIGOS_ERROR, construirAsistencia, filasDeAsistencia, formatearFechaCorta, formatearHoraMexico,
} = require('./reportes.asistencia');
const { ESTADOS_BITACORA_QUE_CUENTAN, ESTADOS_BITACORA_NO_RESUELTOS } = require('./reportes.shared');
const { consultarAsistenciaDelPeriodo } = require('./reportes-alumno.service');
const {
  construirDatosPdf, generarPdfReporteMensual, planificarPaginaAsistencia,
  agregarRubricaProfesor, agregarSelloValidacion, colocacionesRubricaProfesor,
  PAGINA_REPORTE, PAGINA_ASISTENCIA,
} = require('./reportes.pdf');
const { resultadoEjemplo, ACTIVIDADES_EJEMPLO, crearPng } = require('./reportes.pdf.fixtures');
const ASIS = require('./reportes.plantilla.asistencia');

const bitacora = (fecha, horas, inicio, fin) => ({
  fecha, horas, horaInicio: `${fecha}T${inicio}:00:00.000Z`, horaFin: `${fecha}T${fin}:00:00.000Z`,
});

const textosDe = (elementos) => elementos.filter((e) => e.tipo === 'texto').map((e) => e.texto);
const datos = (cambios) => construirDatosPdf(resultadoEjemplo(cambios), ACTIVIDADES_EJEMPLO);

// ── Datos: filas ─────────────────────────────────────────────

test('la tabla tiene SIEMPRE 24 filas, aunque el periodo traiga menos registros', () => {
  for (const n of [0, 1, 3, 20, 24]) {
    const filas = filasDeAsistencia(Array.from({ length: n }, (_, i) => bitacora(`2025-09-0${(i % 9) + 1}`, 4, '15', '19')));
    assert.equal(filas.length, FILAS);
    assert.equal(filas.filter((f) => f.conRegistro).length, n);
    assert.deepEqual(filas.map((f) => f.numero), Array.from({ length: 24 }, (_, i) => i + 1));
  }
});

test('más de 24 registros NO se recortan en silencio: error explícito', () => {
  const muchas = Array.from({ length: 25 }, (_, i) => bitacora(`2025-09-${String(i + 1).padStart(2, '0')}`, 4, '15', '19'));
  assert.throws(() => filasDeAsistencia(muchas), (err) => err.code === CODIGOS_ERROR.ASISTENCIA_EXCEDE_FILAS);
});

test('"Horas por día" es horas_contabilizadas, NUNCA la resta salida - entrada', () => {
  // Jornada de 3 h 50 min de reloj, pero AH contabilizó 3 (trunca hacia abajo).
  const [fila] = filasDeAsistencia([bitacora('2025-09-16', 3, '15', '18')]);
  assert.equal(fila.horas, '3');
  assert.equal(fila.entrada, '09:00');
  assert.equal(fila.salida, '12:00');
});

test('entrada y salida salen de hora_inicio / hora_fin, en hora de México', () => {
  // México es UTC-6 todo el año: 15:00 UTC = 09:00 local.
  assert.equal(formatearHoraMexico('2025-09-16T15:00:00.000Z'), '09:00');
  assert.equal(formatearHoraMexico('2025-09-16T19:45:00.000Z'), '13:45');
  assert.equal(formatearHoraMexico(null), '', 'una jornada sin cerrar no imprime salida');
  assert.equal(formatearFechaCorta('2025-09-16'), '16/09/2025');
});

// ── Datos: totales ───────────────────────────────────────────

test('total del mes = el valor que se le pase (snapshot o cálculo vigente); el acumulado le suma lo ya reportado', () => {
  const a = construirAsistencia({ bitacoras: [bitacora('2025-09-16', 4, '15', '19')], totalDelMes: 82, horasPrevias: 156 });
  assert.equal(a.totalMes, '82');
  assert.equal(a.totalAcumulado, '238', '80 + 76 + 82 del ejemplo de la ficha');
});

test('acumulado del PRIMER reporte: sin reportes previos es igual al total del mes', () => {
  const a = construirAsistencia({ bitacoras: [], totalDelMes: 80, horasPrevias: 0 });
  assert.deepEqual([a.totalMes, a.totalAcumulado], ['80', '80']);
});

test('sin total definido (reporte global) los dos totales quedan vacíos, no en cero', () => {
  const a = construirAsistencia({ responsable: { nombre: 'X', cargo: 'Profesor base' } });
  assert.deepEqual([a.totalMes, a.totalAcumulado], ['', '']);
  assert.ok(a.filas.every((f) => !f.conRegistro));
});

// ── Layout ───────────────────────────────────────────────────

test('la hoja imprime los MISMOS datos del alumno y del periodo que la página 1', () => {
  const d = datos();
  const textos = textosDe(planificarPaginaAsistencia(d, {}));

  assert.ok(textos.includes('CONTROL DE ASISTENCIA'));
  assert.ok(textos.includes(d.alumno.nombreCompleto));
  assert.ok(textos.includes(d.alumno.boleta));
  assert.ok(textos.includes(d.alumno.carreraNombre));
  assert.ok(textos.includes(d.periodo.inicioTexto));
  assert.ok(textos.includes(d.periodo.finTexto));
  assert.ok(textos.includes(String(d.numeroReporte)));
});

test('las 24 filas se numeran y los registros aparecen con su fecha, horas y totales', () => {
  const textos = textosDe(planificarPaginaAsistencia(datos(), {}));
  for (const n of ['1', '12', '24']) assert.ok(textos.includes(n), `falta la fila ${n}`);
  assert.ok(textos.includes('16/09/2025'));
  assert.ok(textos.includes(ASIS.TABLA.etiquetaTotalMes));
  assert.ok(textos.includes(ASIS.TABLA.etiquetaTotalAcumulado));
  assert.ok(textos.includes('9'), 'total del mes');
  assert.ok(textos.includes('89'), 'acumulado = 80 previas + 9');
});

test('responsable directo: nombre y cargo del profesor, con su leyenda y la del sello', () => {
  const textos = textosDe(planificarPaginaAsistencia(datos(), {}));
  assert.ok(textos.includes('LUIS ENRIQUE TORRES VEGA'));
  assert.ok(textos.includes('Profesor base'));
  assert.ok(textos.includes('Responsable Directo'));
  assert.ok(textos.includes('Sello del Prestatario'));
  assert.ok(textos.includes('Página 2 de 2'));
});

test('el reporte GLOBAL no arma Control de Asistencia: su hoja 2 no existe', () => {
  const d = datos({ reporte: { tipo: 'global', numero: null } });
  assert.equal(d.tipoReporte, 'global');
  assert.equal(d.asistencia, null, 'el Control de Asistencia es exclusivo del mensual');
});

test('todo el contenido cae dentro de la hoja Carta', () => {
  for (const el of planificarPaginaAsistencia(datos(), {})) {
    const izquierda = el.left ?? el.x ?? 0;
    const arriba = el.top ?? el.y ?? 0;
    assert.ok(izquierda >= 0 && izquierda <= ASIS.PAGINA.ancho, `fuera por la izquierda: ${JSON.stringify(el).slice(0, 80)}`);
    assert.ok(arriba >= 0 && arriba <= ASIS.PAGINA.alto, `fuera por arriba/abajo: ${JSON.stringify(el).slice(0, 80)}`);
  }
});

// ── Estados que participan ───────────────────────────────────
//
// Reportes cuenta 'aprobada' + 'rechazada'; 'pendiente_revision' no cuenta ni aparece. La selección la hace
// consultarAsistenciaDelPeriodo con ESTADOS_BITACORA_QUE_CUENTAN — aquí se fija esa regla.

test('los estados que cuentan son exactamente aprobada y rechazada', () => {
  assert.deepEqual([...ESTADOS_BITACORA_QUE_CUENTAN].sort(), ['aprobada', 'rechazada']);
  for (const pendiente of ESTADOS_BITACORA_NO_RESUELTOS) {
    assert.equal(ESTADOS_BITACORA_QUE_CUENTAN.includes(pendiente), false, `${pendiente} no debe contar`);
  }
});

test('aprobada y rechazada aparecen en la tabla; las pendientes no', async () => {
  const filas = [
    { id: 1, estado: 'aprobada', fecha_registro: new Date('2025-09-16T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-16T15:00:00Z'), hora_fin: new Date('2025-09-16T19:00:00Z') },
    { id: 2, estado: 'rechazada', fecha_registro: new Date('2025-09-17T00:00:00Z'), horas_contabilizadas: 3, hora_inicio: new Date('2025-09-17T15:00:00Z'), hora_fin: new Date('2025-09-17T18:00:00Z') },
    { id: 3, estado: 'pendiente_revision', fecha_registro: new Date('2025-09-18T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-18T15:00:00Z'), hora_fin: new Date('2025-09-18T19:00:00Z') },
  ];
  const prisma = { bitacora: { findMany: async ({ where }) => filas.filter((f) => where.estado.in.includes(f.estado)) } };

  const registros = await consultarAsistenciaDelPeriodo(prisma, 42, { inicio: '2025-09-16', fin: '2025-10-15' });

  assert.deepEqual(registros.map((r) => r.fecha), ['2025-09-16', '2025-09-17']);
  assert.equal(registros.reduce((s, r) => s + r.horas, 0), 7, 'la rechazada también suma sus horas');
});

test('rechazada → aprobada no cambia ni el conjunto ni las horas del reporte', async () => {
  const base = { id: 1, fecha_registro: new Date('2025-09-16T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-16T15:00:00Z'), hora_fin: new Date('2025-09-16T19:00:00Z') };
  const periodo = { inicio: '2025-09-16', fin: '2025-10-15' };
  const prismaCon = (estado) => ({ bitacora: { findMany: async ({ where }) => (where.estado.in.includes(estado) ? [{ ...base, estado }] : []) } });

  const comoRechazada = await consultarAsistenciaDelPeriodo(prismaCon('rechazada'), 42, periodo);
  const comoAprobada = await consultarAsistenciaDelPeriodo(prismaCon('aprobada'), 42, periodo);

  // El estado no viaja a la página 2: la fila, su fecha, sus horas y su posición son idénticas.
  assert.deepEqual(comoRechazada, comoAprobada);
  assert.deepEqual(filasDeAsistencia(comoRechazada), filasDeAsistencia(comoAprobada));
});

// Mismo criterio que el resto de las pruebas del módulo: no se cuentan las máscaras de transparencia (SMask), que
// pdf-lib guarda como un stream aparte de cada PNG con alfa.
const imagenesDe = async (buffer) => {
  const { PDFName, PDFRawStream } = require('pdf-lib');
  const doc = await PDFDocument.load(buffer);
  let n = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')
      && !o.dict.has(PDFName.of('SMaskInData'))
      && o.dict.get(PDFName.of('ColorSpace')) !== PDFName.of('DeviceGray')) n += 1;
  }
  return n;
};

// ── Firmas ───────────────────────────────────────────────────

test('la rúbrica del profesor se coloca en la página 1 y, en la 2, por cada registro más el responsable', () => {
  const colocaciones = colocacionesRubricaProfesor([0, 1, 2]);
  const porPagina = colocaciones.reduce((acc, c) => ({ ...acc, [c.pagina]: (acc[c.pagina] ?? 0) + 1 }), {});
  assert.equal(porPagina[PAGINA_REPORTE], 1, 'Autorizó, como siempre');
  assert.equal(porPagina[PAGINA_ASISTENCIA], 4, 'responsable directo + 3 registros');
});

test('sin registros solo se firma al responsable directo de la página 2', () => {
  const colocaciones = colocacionesRubricaProfesor([]);
  assert.equal(colocaciones.filter((c) => c.pagina === PAGINA_ASISTENCIA).length, 1);
});

test('las filas VACÍAS no reciben firma: las colocaciones salen de los registros renderizados', () => {
  // 3 registros → filas 0,1,2 firmadas; las 21 vacías, no.
  const registros = [bitacora('2025-09-16', 4, '15', '19'), bitacora('2025-09-17', 3, '15', '18'), bitacora('2025-09-18', 2, '15', '17')];
  const filas = filasDeAsistencia(registros);
  const conRegistro = filas.map((f, i) => (f.conRegistro ? i : null)).filter((i) => i !== null);

  assert.deepEqual(conRegistro, [0, 1, 2]);
  const enAsistencia = colocacionesRubricaProfesor(conRegistro).filter((c) => c.pagina === PAGINA_ASISTENCIA);
  assert.equal(enAsistencia.length, conRegistro.length + 1, 'una por fila poblada + el responsable directo');
});

test('el reporte GLOBAL no firma ninguna celda de asistencia: no tiene hoja 2', async () => {
  // Con un PDF de una sola página las colocaciones de la hoja 2 se omiten: solo queda "Autorizó".
  const global = await PDFDocument.create();
  global.addPage([612, 792]);
  const firmado = await agregarRubricaProfesor(Buffer.from(await global.save()), crearPng(300, 100), [0, 1, 2]);

  assert.equal((await PDFDocument.load(firmado)).getPageCount(), 1);
  assert.equal(await imagenesDe(firmado), 1, 'una sola rúbrica, la de la página 1');
});

// ── PDF completo ─────────────────────────────────────────────

test('el PDF generado tiene DOS páginas Carta', async () => {
  const pdf = await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) });
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 2);
  for (const p of doc.getPages()) {
    assert.deepEqual([Math.round(p.getWidth()), Math.round(p.getHeight())], [612, 792]);
  }
});

test('todo el flujo de firmado funciona sobre el PDF de dos páginas', async () => {
  const delAlumno = await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) });
  const conProfesor = await agregarRubricaProfesor(delAlumno, crearPng(300, 100), [0, 1, 2]);
  const conSello = await agregarSelloValidacion(conProfesor, crearPng(200, 200));

  for (const buffer of [conProfesor, conSello]) {
    assert.equal((await PDFDocument.load(buffer)).getPageCount(), 2);
  }
  // Cada etapa incrusta UNA imagen nueva, por muchas veces que se dibuje.
  assert.equal(await imagenesDe(conProfesor), (await imagenesDe(delAlumno)) + 1);
  assert.equal(await imagenesDe(conSello), (await imagenesDe(conProfesor)) + 1);
});

test('COMPATIBILIDAD: un PDF histórico de UNA página se sigue firmando y sellando sin tocar nada más', async () => {
  const historico = await PDFDocument.create();
  historico.addPage([612, 792]);
  const unaPagina = Buffer.from(await historico.save());

  const conProfesor = await agregarRubricaProfesor(unaPagina, crearPng(300, 100), [0, 1, 2]);
  const conSello = await agregarSelloValidacion(conProfesor, crearPng(200, 200));

  // Sigue teniendo una sola página: las colocaciones de la hoja de asistencia se omiten en silencio.
  assert.equal((await PDFDocument.load(conProfesor)).getPageCount(), 1);
  assert.equal((await PDFDocument.load(conSello)).getPageCount(), 1);
  assert.equal(await imagenesDe(conProfesor), 1, 'solo la rúbrica de Autorizó');
  assert.equal(await imagenesDe(conSello), 2, 'rúbrica + sello');
});

// ── Inmutabilidad de lo que imprime la página 2 (inspección de AH) ──────────
//
// Lo que la hoja imprime de cada jornada —fecha_registro, hora_inicio, hora_fin y horas_contabilizadas— solo lo
// escribe el ALUMNO mientras la bitácora está en curso ('en_curso' / 'pendiente_datos'), estados que NUNCA cuentan
// para el reporte. Las tres operaciones del profesor (aprobar, rechazar y reconsiderar) tocan únicamente `estado`,
// `motivo_rechazo`, `fecha_revision` y `revisado_por_id`.
//
// Esta prueba lee el código de AH: si alguien añadiera una escritura a esos campos desde el flujo del profesor, aquí
// se enteraría antes de que el PDF y su corrección pudieran divergir.

test('AH: el profesor NUNCA escribe los campos que imprime el Control de Asistencia', () => {
  const fs = require('fs');
  const path = require('path');
  const ah = path.join(__dirname, '..', 'ah');
  const codigo = fs.readFileSync(path.join(ah, 'ah-profesor.service.js'), 'utf8').replace(/\/\/.*$/gm, '');

  // Bloques `data: { ... }` de cada prisma.bitacora.update del profesor.
  const escrituras = [...codigo.matchAll(/bitacora\.update\(\{[\s\S]*?data:\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
  assert.ok(escrituras.length >= 3, 'aprobar, rechazar y reconsiderar');

  for (const bloque of escrituras) {
    for (const campo of ['fecha_registro', 'hora_inicio', 'hora_fin', 'horas_contabilizadas']) {
      assert.equal(bloque.includes(campo), false, `el profesor no debe escribir ${campo}`);
    }
  }
  assert.equal(/bitacora\.delete/.test(codigo), false, 'el profesor no borra bitácoras');
});

test('AH: el alumno solo toca esos campos mientras la jornada NO cuenta para el reporte', () => {
  const fs = require('fs');
  const path = require('path');
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'ah', 'ah-alumno.service.js'), 'utf8');

  // finalizarJornada escribe hora_fin/horas_contabilizadas y cancelarJornada borra: ambas exigen 'en_curso'.
  assert.match(codigo, /estado:\s*'en_curso'/);
  // confirmarBitacora parte de en_curso/pendiente_datos. Ninguno de los tres estados cuenta para Reportes.
  assert.match(codigo, /\['en_curso',\s*'pendiente_datos'\]/);
  for (const estado of ['en_curso', 'pendiente_datos']) {
    assert.equal(ESTADOS_BITACORA_QUE_CUENTAN.includes(estado), false, `${estado} no cuenta`);
  }
});
