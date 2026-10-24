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
// Reportes cuenta SOLO 'aprobada'; 'rechazada' y 'pendiente_revision' no cuentan ni aparecen. La selección la hace
// consultarAsistenciaDelPeriodo con ESTADOS_BITACORA_QUE_CUENTAN — aquí se fija esa regla.

test('el único estado que cuenta es aprobada', () => {
  assert.deepEqual([...ESTADOS_BITACORA_QUE_CUENTAN], ['aprobada']);
  assert.equal(ESTADOS_BITACORA_QUE_CUENTAN.includes('rechazada'), false, 'rechazada no debe contar');
  for (const pendiente of ESTADOS_BITACORA_NO_RESUELTOS) {
    assert.equal(ESTADOS_BITACORA_QUE_CUENTAN.includes(pendiente), false, `${pendiente} no debe contar`);
  }
});

test('solo la aprobada aparece en la tabla; la rechazada y las pendientes no', async () => {
  const filas = [
    { id: 1, estado: 'aprobada', fecha_registro: new Date('2025-09-16T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-16T15:00:00Z'), hora_fin: new Date('2025-09-16T19:00:00Z') },
    { id: 2, estado: 'rechazada', fecha_registro: new Date('2025-09-17T00:00:00Z'), horas_contabilizadas: 3, hora_inicio: new Date('2025-09-17T15:00:00Z'), hora_fin: new Date('2025-09-17T18:00:00Z') },
    { id: 3, estado: 'pendiente_revision', fecha_registro: new Date('2025-09-18T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-18T15:00:00Z'), hora_fin: new Date('2025-09-18T19:00:00Z') },
  ];
  const prisma = { bitacora: { findMany: async ({ where }) => filas.filter((f) => where.estado.in.includes(f.estado)) } };

  const registros = await consultarAsistenciaDelPeriodo(prisma, 42, { inicio: '2025-09-16', fin: '2025-10-15' });

  assert.deepEqual(registros.map((r) => r.fecha), ['2025-09-16']);
  assert.equal(registros.reduce((s, r) => s + r.horas, 0), 4, 'la rechazada no suma sus horas');
});

test('la misma jornada rechazada no entra en la tabla; aprobada sí, con su fecha y sus horas', async () => {
  const base = { id: 1, fecha_registro: new Date('2025-09-16T00:00:00Z'), horas_contabilizadas: 4, hora_inicio: new Date('2025-09-16T15:00:00Z'), hora_fin: new Date('2025-09-16T19:00:00Z') };
  const periodo = { inicio: '2025-09-16', fin: '2025-10-15' };
  const prismaCon = (estado) => ({ bitacora: { findMany: async ({ where }) => (where.estado.in.includes(estado) ? [{ ...base, estado }] : []) } });

  const comoRechazada = await consultarAsistenciaDelPeriodo(prismaCon('rechazada'), 42, periodo);
  const comoAprobada = await consultarAsistenciaDelPeriodo(prismaCon('aprobada'), 42, periodo);

  assert.deepEqual(comoRechazada, []);
  assert.deepEqual(comoAprobada.map((r) => [r.fecha, r.horas]), [['2025-09-16', 4]]);
  assert.equal(filasDeAsistencia(comoRechazada).filter((f) => f.fecha).length, 0, 'sin renglones con registro');
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
//
// Regla vigente: el ALUMNO firma "Elaboró" (hoja 1) y la celda Firma de cada fila CON registro (hoja 2), al generar
// el PDF (envío y reenvío). El PROFESOR solo firma "Autorizó" (hoja 1) y el responsable directo (hoja 2). Coordinación
// solo sella.

// Cada imagen DIBUJADA por página (operador Do sobre un XObject Image, también dentro de Form XObject anidados), con
// su tamaño original y su caja en puntos PDF (origen abajo-izquierda), a partir de la matriz `cm` vigente.
async function dibujosPorPagina(buffer) {
  const { PDFName, PDFRawStream, PDFArray, decodePDFRawStream } = require('pdf-lib');
  const doc = await PDFDocument.load(buffer);
  const leer = (s) => Buffer.from(s instanceof PDFRawStream ? decodePDFRawStream(s).decode() : s.getContents()).toString('latin1');
  const res = [];
  const recorrer = (contenido, recursos, pagina, base) => {
    const xo = recursos?.lookup(PDFName.of('XObject'));
    const pila = [];
    let m = base;
    const toks = contenido.split(/\s+/);
    toks.forEach((t, i) => {
      if (t === 'q') pila.push(m);
      else if (t === 'Q') m = pila.pop() ?? base;
      else if (t === 'cm') {
        const [a, b, c, d, e, f] = toks.slice(i - 6, i).map(Number);
        m = [a * m[0] + b * m[2], a * m[1] + b * m[3], c * m[0] + d * m[2], c * m[1] + d * m[3], e * m[0] + f * m[2] + m[4], e * m[1] + f * m[3] + m[5]];
      } else if (t === 'Do') {
        const obj = xo?.lookup(PDFName.of(toks[i - 1].replace('/', '')));
        const tipo = obj?.dict.get(PDFName.of('Subtype'));
        if (tipo === PDFName.of('Image')) {
          res.push({ pagina, w: obj.dict.get(PDFName.of('Width')).asNumber(), h: obj.dict.get(PDFName.of('Height')).asNumber(), x: m[4], y: m[5], ancho: m[0], alto: m[3] });
        } else if (tipo === PDFName.of('Form')) recorrer(leer(obj), obj.dict.lookup(PDFName.of('Resources')), pagina, m);
      }
    });
  };
  doc.getPages().forEach((p, i) => {
    const c = p.node.Contents();
    const partes = c instanceof PDFArray ? c.asArray().map((r) => doc.context.lookup(r)) : [c];
    recorrer(partes.map(leer).join('\n'), p.node.Resources(), i, [1, 0, 0, 1, 0, 0]);
  });
  return res;
}

// Rúbricas de prueba con tamaños distintos: así cada dibujo se atribuye sin ambigüedad a quien firmó.
const RUBRICA_ALUMNO = crearPng(400, 140);
const RUBRICA_PROFESOR = crearPng(300, 100);
const SELLO = crearPng(200, 200);
const de = (dibujos, [w, h], pagina) => dibujos.filter((d) => d.w === w && d.h === h && d.pagina === pagina);
const ALTO_PAGINA = 792;
const COL_FIRMA = ASIS.geometriaColumna(ASIS.COLUMNA.FIRMA);
// ¿El dibujo cae dentro de la celda Firma de la fila i? (layout medido desde arriba; PDF, desde abajo)
const enCeldaFirma = (d, i) => d.x >= COL_FIRMA.x && d.x + d.ancho <= COL_FIRMA.xFin
  && ALTO_PAGINA - (d.y + d.alto) >= ASIS.topDeFila(i) && ALTO_PAGINA - d.y <= ASIS.topDeFila(i) + ASIS.TABLA.filas.alto;

const datosTresRegistros = () => datos({
  asistencia: construirAsistencia({
    bitacoras: [bitacora('2025-09-16', 4, '15', '19'), bitacora('2025-09-17', 3, '15', '18'), bitacora('2025-09-18', 2, '15', '17')],
    totalDelMes: 9,
    responsable: { nombre: 'LUIS ENRIQUE TORRES VEGA', cargo: 'Profesor base' },
  }),
});

test('la rúbrica del profesor solo se coloca abajo: Autorizó (hoja 1) y responsable directo (hoja 2), ninguna fila', () => {
  const colocaciones = colocacionesRubricaProfesor();
  const porPagina = colocaciones.reduce((acc, c) => ({ ...acc, [c.pagina]: (acc[c.pagina] ?? 0) + 1 }), {});
  assert.deepEqual(porPagina, { [PAGINA_REPORTE]: 1, [PAGINA_ASISTENCIA]: 1 });
  const img = { ancho: 300, alto: 100 };
  for (const c of colocaciones.filter((x) => x.pagina === PAGINA_ASISTENCIA)) {
    const { top } = c.ubicar(img);
    assert.ok(top > ASIS.TOP_TOTALES, 'la firma de la hoja 2 queda debajo de la tabla, no en una celda');
  }
});

test('planificarPaginaAsistencia: la rúbrica del ALUMNO va en la celda Firma de cada fila con registro; las vacías no', () => {
  const imagenes = { alumno: { ancho: 400, alto: 140 }, profesor: { ancho: 300, alto: 100 } };
  const elementos = planificarPaginaAsistencia(datosTresRegistros(), imagenes);
  const delAlumno = elementos.filter((e) => e.tipo === 'imagen' && e.imagen === imagenes.alumno);
  const delProfesor = elementos.filter((e) => e.tipo === 'imagen' && e.imagen === imagenes.profesor);

  assert.equal(delAlumno.length, 3, 'una por registro; las 21 filas vacías quedan sin firma');
  delAlumno.forEach((e, i) => {
    assert.ok(e.left >= COL_FIRMA.x && e.left + e.ancho <= COL_FIRMA.xFin, `fila ${i + 1}: dentro de la columna Firma`);
    assert.ok(e.top >= ASIS.topDeFila(i) && e.top + e.alto <= ASIS.topDeFila(i) + ASIS.TABLA.filas.alto, `fila ${i + 1}: dentro de su renglón`);
  });
  assert.equal(delProfesor.length, 1, 'el profesor solo firma al responsable directo');
  assert.ok(delProfesor[0].top > ASIS.TOP_TOTALES);
});

test('(a) envío: el PDF del alumno lleva su rúbrica en Elaboró y en las 3 filas con registro, nada en las vacías', async () => {
  const delAlumno = await generarPdfReporteMensual(datosTresRegistros(), { rubricaAlumno: RUBRICA_ALUMNO });
  const dibujos = await dibujosPorPagina(delAlumno);

  assert.equal(de(dibujos, [400, 140], PAGINA_REPORTE).length, 1, 'Elaboró');
  const enHoja2 = de(dibujos, [400, 140], PAGINA_ASISTENCIA);
  assert.equal(enHoja2.length, 3);
  for (let i = 0; i < ASIS.TABLA.filas.cantidad; i += 1) {
    assert.equal(enHoja2.filter((d) => enCeldaFirma(d, i)).length, i < 3 ? 1 : 0, `fila ${i + 1}`);
  }
  assert.equal(de(dibujos, [300, 100], PAGINA_ASISTENCIA).length, 0, 'todavía no firma el profesor');
});

test('(b) firma del profesor: Autorizó y responsable directo; ninguna imagen nueva en las filas', async () => {
  const delAlumno = await generarPdfReporteMensual(datosTresRegistros(), { rubricaAlumno: RUBRICA_ALUMNO });
  const conProfesor = await agregarRubricaProfesor(delAlumno, RUBRICA_PROFESOR);
  const antes = await dibujosPorPagina(delAlumno);
  const despues = await dibujosPorPagina(conProfesor);

  assert.equal(de(despues, [300, 100], PAGINA_REPORTE).length, 1, 'Autorizó');
  const profesorHoja2 = de(despues, [300, 100], PAGINA_ASISTENCIA);
  assert.equal(profesorHoja2.length, 1, 'solo el responsable directo');
  for (let i = 0; i < ASIS.TABLA.filas.cantidad; i += 1) assert.equal(enCeldaFirma(profesorHoja2[0], i), false);
  assert.ok(ALTO_PAGINA - profesorHoja2[0].y > ASIS.TOP_TOTALES, 'debajo de la tabla');
  // Las firmas del alumno no se mueven ni se duplican.
  assert.deepEqual(de(despues, [400, 140], PAGINA_ASISTENCIA), de(antes, [400, 140], PAGINA_ASISTENCIA));
  assert.equal(await imagenesDe(conProfesor), (await imagenesDe(delAlumno)) + 1, 'una imagen nueva incrustada');
});

test('(c) coordinación: solo agrega el sello en las dos hojas; todo lo anterior queda igual', async () => {
  const delAlumno = await generarPdfReporteMensual(datosTresRegistros(), { rubricaAlumno: RUBRICA_ALUMNO });
  const conProfesor = await agregarRubricaProfesor(delAlumno, RUBRICA_PROFESOR);
  const conSello = await agregarSelloValidacion(conProfesor, SELLO);
  const antes = await dibujosPorPagina(conProfesor);
  const despues = await dibujosPorPagina(conSello);

  assert.equal(de(despues, [200, 200], PAGINA_REPORTE).length, 1);
  assert.equal(de(despues, [200, 200], PAGINA_ASISTENCIA).length, 1);
  assert.deepEqual(despues.filter((d) => d.w !== 200), antes, 'firmas de alumno y profesor intactas');
  assert.equal(await imagenesDe(conSello), (await imagenesDe(conProfesor)) + 1);
});

test('el reporte GLOBAL no firma ninguna celda de asistencia: no tiene hoja 2', async () => {
  // Con un PDF de una sola página las colocaciones de la hoja 2 se omiten: solo queda "Autorizó".
  const global = await PDFDocument.create();
  global.addPage([612, 792]);
  const firmado = await agregarRubricaProfesor(Buffer.from(await global.save()), RUBRICA_PROFESOR);

  assert.equal((await PDFDocument.load(firmado)).getPageCount(), 1);
  assert.equal(await imagenesDe(firmado), 1, 'una sola rúbrica, la de la página 1');
});

// ── PDF completo ─────────────────────────────────────────────

test('el PDF generado tiene DOS páginas Carta', async () => {
  const pdf = await generarPdfReporteMensual(datos(), { rubricaAlumno: RUBRICA_ALUMNO });
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 2);
  for (const p of doc.getPages()) {
    assert.deepEqual([Math.round(p.getWidth()), Math.round(p.getHeight())], [612, 792]);
  }
});

test('COMPATIBILIDAD: un PDF histórico de UNA página se sigue firmando y sellando sin tocar nada más', async () => {
  const historico = await PDFDocument.create();
  historico.addPage([612, 792]);
  const unaPagina = Buffer.from(await historico.save());

  const conProfesor = await agregarRubricaProfesor(unaPagina, RUBRICA_PROFESOR);
  const conSello = await agregarSelloValidacion(conProfesor, SELLO);

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
