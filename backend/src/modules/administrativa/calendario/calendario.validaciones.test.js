const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fechaISOValida,
  esFinDeSemana,
  obtenerContextoMexico,
  validarCrearEvento,
  validarActualizarInhabil,
  evaluarModificabilidad,
  mesesCicloSemestre,
} = require('./calendario.validaciones');
const {
  HORAS_INHABIL_PERMITIDAS,
  CODIGOS_ERROR,
  semestreApiAPrisma,
  semestrePrismaAApi,
} = require('./calendario.shared');

// Viernes 2026-09-18, 13:30 en México (UTC-6).
const AHORA = new Date('2026-09-18T19:30:00.000Z');
const HOY = '2026-09-18';
const PASADO = '2026-09-17'; // jueves
const SABADO = '2026-09-19';
const DOMINGO = '2026-09-20';
const LUNES = '2026-09-21';

const inhabil = (extra) => ({ tipo: 'Inhabil', nombre: 'Fumigación', fechaInicio: LUNES, hora: null, ...extra });
const vacacional = (extra) => ({
  tipo: 'Vacacional', nombre: 'Receso escolar', fechaInicio: LUNES, fechaFin: '2026-09-25', confirmacionPublicacion: true, ...extra,
});
const periodo = (extra) => ({
  tipo: 'Periodo', nombre: 'Periodo 2027-01', anio: '2027', semestre: '01', fechaMaxExpediente: '2026-09-25',
  fechaInicio: '2026-10-16', fechaFin: '2027-05-17', confirmacionPublicacion: true, ...extra,
});

// Inicio en enero 2027 (válido tanto para 01/2027 como para 02/2027); el expediente va antes del inicio.
const ENERO_2027 = { fechaInicio: '2027-01-18', fechaMaxExpediente: '2027-01-15' };

const validar = (entrada, ahora = AHORA) => validarCrearEvento(entrada, ahora);
const ahoraMx = (isoUtc) => new Date(isoUtc);

function assertValido(res) {
  assert.equal(res.ok, true, JSON.stringify(res));
  return res.datos;
}

// Falla exactamente en un campo y con el código esperado.
function assertSoloError(res, campo, codigo = CODIGOS_ERROR.VALIDACION) {
  assert.equal(res.ok, false, 'se esperaba un error');
  assert.equal(res.codigo, codigo);
  assert.deepEqual(Object.keys(res.errores), [campo], JSON.stringify(res.errores));
}

// ── Utilidades de fecha y hora de México ─────────────────────

test('fechaISOValida y esFinDeSemana', () => {
  assert.equal(fechaISOValida('2026-09-21'), true);
  for (const mala of ['2026-02-30', '2026/09/21', '21-09-2026', '2026-9-21', '', null, undefined, 20260921]) {
    assert.equal(fechaISOValida(mala), false, String(mala));
  }
  assert.equal(esFinDeSemana(SABADO), true);
  assert.equal(esFinDeSemana(DOMINGO), true);
  assert.equal(esFinDeSemana(LUNES), false);
});

test('obtenerContextoMexico: día y segundos en hora de México, no en UTC', () => {
  assert.deepEqual(obtenerContextoMexico(AHORA), { hoy: HOY, segundosDelDia: 13.5 * 3600 });
  assert.deepEqual(obtenerContextoMexico(ahoraMx('2026-09-18T06:00:00.000Z')), { hoy: HOY, segundosDelDia: 0 });
  // 03:00Z del 19 ya es 21:00 del día 18 en México.
  assert.deepEqual(obtenerContextoMexico(ahoraMx('2026-09-19T03:00:00.000Z')), { hoy: HOY, segundosDelDia: 21 * 3600 });
  assert.deepEqual(obtenerContextoMexico(ahoraMx('2026-09-19T05:59:59.000Z')), { hoy: HOY, segundosDelDia: 86399 });
  assert.throws(() => obtenerContextoMexico(new Date('nope')), TypeError);
  assert.throws(() => obtenerContextoMexico('2026-09-18'), TypeError);
});

// ── Reglas comunes ───────────────────────────────────────────

test('común: nombre vacío, en blanco o no texto es inválido en los tres tipos', () => {
  for (const nombre of ['', '   ', undefined, null, 123]) {
    assertSoloError(validar(inhabil({ nombre })), 'nombre');
    assertSoloError(validar(vacacional({ nombre })), 'nombre');
    assertSoloError(validar(periodo({ nombre })), 'nombre');
  }
});

test('común: nombre de más de 150 caracteres es inválido; 150 es válido y se recorta', () => {
  assertSoloError(validar(inhabil({ nombre: 'x'.repeat(151) })), 'nombre');
  assertSoloError(validar(vacacional({ nombre: 'x'.repeat(151) })), 'nombre');
  assertSoloError(validar(periodo({ nombre: 'x'.repeat(151) })), 'nombre');
  assert.equal(assertValido(validar(inhabil({ nombre: 'x'.repeat(150) }))).nombre.length, 150);
  assert.equal(assertValido(validar(inhabil({ nombre: '  Fumigación  ' }))).nombre, 'Fumigación');
  assertSoloError(validar(inhabil({ nombre: `  ${'x'.repeat(151)}  ` })), 'nombre');
});

test('común: fecha con formato o calendario inválido', () => {
  for (const fechaInicio of ['2026-02-30', '2026/09/21', '21-09-2026', '2026-9-21', '', null, undefined]) {
    assertSoloError(validar(inhabil({ fechaInicio })), 'fechaInicio');
  }
});

test('común: sábado y domingo no pueden ser la fecha de un Inhabil', () => {
  assertSoloError(validar(inhabil({ fechaInicio: SABADO })), 'fechaInicio');
  assertSoloError(validar(inhabil({ fechaInicio: DOMINGO })), 'fechaInicio');
});

test('común: tipo ausente o desconocido', () => {
  for (const entrada of [null, undefined, {}, { tipo: 'Otro' }, { ...inhabil(), tipo: 'inhabil' }]) {
    assertSoloError(validar(entrada), 'tipo');
  }
});

// ── Inhabil ──────────────────────────────────────────────────

test('Inhabil: fecha futura todo el día es válido', () => {
  assert.deepEqual(assertValido(validar(inhabil())), {
    tipo: 'Inhabil', nombre: 'Fumigación', fechaInicio: LUNES, fechaFin: null, hora: null,
  });
});

test('Inhabil: fecha futura con cada hora exacta permitida (07:00 a 18:00) es válido', () => {
  assert.equal(HORAS_INHABIL_PERMITIDAS.length, 12);
  assert.equal(HORAS_INHABIL_PERMITIDAS[0], '07:00');
  assert.equal(HORAS_INHABIL_PERMITIDAS[11], '18:00');
  for (const hora of HORAS_INHABIL_PERMITIDAS) {
    assert.equal(assertValido(validar(inhabil({ hora }))).hora, hora);
  }
});

test('Inhabil: 07:00 es "desde las 07:00", no todo el día', () => {
  assert.equal(assertValido(validar(inhabil({ hora: '07:00' }))).hora, '07:00');
  assert.equal(assertValido(validar(inhabil({ hora: null }))).hora, null);
});

test('Inhabil: horas fuera de rango, con minutos o mal formadas son inválidas', () => {
  for (const hora of ['06:00', '19:00', '13:30', '14:15', '7:00', '14:00:00', '', 14, true]) {
    assertSoloError(validar(inhabil({ hora })), 'hora');
  }
});

test('Inhabil: la hora debe venir explícita (null = todo el día); omitirla es inválido', () => {
  const { hora, ...sinHora } = inhabil();
  assertSoloError(validar(sinHora), 'hora');
  assertSoloError(validar(inhabil({ hora: undefined })), 'hora');
});

test('Inhabil: hoy todo el día es inválido (el día ya comenzó)', () => {
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: null })), 'hora');
  // Incluso justo después de medianoche.
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: null }), ahoraMx('2026-09-18T06:00:00.000Z')), 'hora');
});

test('Inhabil: hoy con ahora 13:30, 13:00 es inválida y 14:00 y 15:00 son válidas', () => {
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: '13:00' })), 'hora');
  assert.equal(assertValido(validar(inhabil({ fechaInicio: HOY, hora: '14:00' }))).hora, '14:00');
  assert.equal(assertValido(validar(inhabil({ fechaInicio: HOY, hora: '15:00' }))).hora, '15:00');
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: '07:00' })), 'hora');
});

test('Inhabil: la hora debe ser estrictamente posterior a ahora (igual no vale; se consideran segundos)', () => {
  const exacto = ahoraMx('2026-09-18T20:00:00.000Z'); // 14:00:00
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: '14:00' }), exacto), 'hora');
  assert.equal(assertValido(validar(inhabil({ fechaInicio: HOY, hora: '15:00' }), exacto)).hora, '15:00');

  const casi = ahoraMx('2026-09-18T19:59:59.000Z'); // 13:59:59
  assert.equal(assertValido(validar(inhabil({ fechaInicio: HOY, hora: '14:00' }), casi)).hora, '14:00');
});

test('Inhabil: hoy con ahora a las 07:00 en punto, 07:00 no vale y 08:00 sí', () => {
  const siete = ahoraMx('2026-09-18T13:00:00.000Z');
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: '07:00' }), siete), 'hora');
  assert.equal(assertValido(validar(inhabil({ fechaInicio: HOY, hora: '08:00' }), siete)).hora, '08:00');
});

test('Inhabil: pasada la última hora del día (18:00) ya no hay hora válida para hoy', () => {
  const noche = ahoraMx('2026-09-19T03:00:00.000Z'); // 21:00 del 18 en México
  assertSoloError(validar(inhabil({ fechaInicio: HOY, hora: '18:00' }), noche), 'hora');
});

test('Inhabil: "hoy" es el de México, no el de UTC', () => {
  const noche = ahoraMx('2026-09-19T03:00:00.000Z'); // en UTC ya es 19; en México sigue siendo 18
  const res = validar(inhabil({ fechaInicio: HOY, hora: null }), noche);
  assertSoloError(res, 'hora'); // "ya comenzó", no "fecha pasada"
  assert.match(res.errores.hora, /ya comenzó/);
});

test('Inhabil: fecha pasada es inválida, con o sin hora', () => {
  assertSoloError(validar(inhabil({ fechaInicio: PASADO })), 'fechaInicio');
  assertSoloError(validar(inhabil({ fechaInicio: PASADO, hora: '18:00' })), 'fechaInicio');
});

test('Inhabil: fechaFin presente es inválida; nula o ausente es válida', () => {
  assertSoloError(validar(inhabil({ fechaFin: '2026-09-22' })), 'fechaFin');
  assert.equal(assertValido(validar(inhabil({ fechaFin: null }))).fechaFin, null);
  assert.equal(assertValido(validar(inhabil())).fechaFin, null);
});

test('Inhabil: no exige confirmación de publicación', () => {
  assertValido(validar(inhabil({ confirmacionPublicacion: false })));
});

test('Inhabil (actualizar): aplica las mismas reglas y no admite cambiar el tipo', () => {
  assertValido(validarActualizarInhabil({ nombre: 'Nuevo', fechaInicio: LUNES, hora: '10:00' }, AHORA));
  assertSoloError(validarActualizarInhabil({ nombre: 'Nuevo', fechaInicio: HOY, hora: null }, AHORA), 'hora');
  assertSoloError(validarActualizarInhabil({ nombre: 'Nuevo', fechaInicio: HOY, hora: '13:00' }, AHORA), 'hora');
  assertSoloError(validarActualizarInhabil({ tipo: 'Vacacional', nombre: 'Nuevo', fechaInicio: LUNES, hora: null }, AHORA), 'tipo');
  assertValido(validarActualizarInhabil({ tipo: 'Inhabil', nombre: 'Nuevo', fechaInicio: LUNES, hora: null }, AHORA));
  const vacio = validarActualizarInhabil(null, AHORA);
  assert.equal(vacio.ok, false);
  assert.deepEqual(Object.keys(vacio.errores).sort(), ['fechaInicio', 'hora', 'nombre']);
});

// ── Modificabilidad (editar/eliminar) ────────────────────────

test('modificabilidad Inhabil: fecha futura, con o sin hora, sí', () => {
  for (const hora of [null, '07:00', '18:00']) {
    assert.deepEqual(evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: LUNES, hora }, AHORA), {
      editable: true, eliminable: true, motivo: null,
    });
  }
});

test('modificabilidad Inhabil: hoy con hora posterior a ahora, sí', () => {
  const r = evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: HOY, hora: '14:00' }, AHORA);
  assert.deepEqual(r, { editable: true, eliminable: true, motivo: null });
});

test('modificabilidad Inhabil: hoy todo el día, no (ya entró en vigor)', () => {
  const r = evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: HOY, hora: null }, AHORA);
  assert.deepEqual(r, { editable: false, eliminable: false, motivo: CODIGOS_ERROR.EVENTO_YA_EN_VIGOR });
});

test('modificabilidad Inhabil: hoy con hora igual o anterior a ahora, no', () => {
  const anterior = evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: HOY, hora: '13:00' }, AHORA);
  assert.equal(anterior.editable, false);
  assert.equal(anterior.motivo, CODIGOS_ERROR.EVENTO_YA_EN_VIGOR);

  const igual = evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: HOY, hora: '14:00' }, ahoraMx('2026-09-18T20:00:00.000Z'));
  assert.equal(igual.editable, false);
  assert.equal(igual.eliminable, false);
});

test('modificabilidad Inhabil: el mismo evento pasa de modificable a no modificable al llegar su hora', () => {
  const evento = { tipo: 'Inhabil', fechaInicio: HOY, hora: '14:00' };
  assert.equal(evaluarModificabilidad(evento, ahoraMx('2026-09-18T19:59:59.000Z')).editable, true);
  assert.equal(evaluarModificabilidad(evento, ahoraMx('2026-09-18T20:00:00.000Z')).editable, false);
});

test('modificabilidad Inhabil: fecha pasada, no', () => {
  const r = evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: PASADO, hora: '18:00' }, AHORA);
  assert.deepEqual(r, { editable: false, eliminable: false, motivo: CODIGOS_ERROR.EVENTO_YA_EN_VIGOR });
});

test('modificabilidad: Periodo y Vacacional son inmutables aunque sean futuros', () => {
  for (const tipo of ['Periodo', 'Vacacional']) {
    assert.deepEqual(evaluarModificabilidad({ tipo, fechaInicio: '2027-01-11' }, AHORA), {
      editable: false, eliminable: false, motivo: CODIGOS_ERROR.EVENTO_INMUTABLE,
    });
  }
});

test('modificabilidad: tipo desconocido o fecha inválida lanzan TypeError', () => {
  assert.throws(() => evaluarModificabilidad({ tipo: 'Otro', fechaInicio: LUNES }, AHORA), TypeError);
  assert.throws(() => evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: 'nope', hora: null }, AHORA), TypeError);
  assert.throws(() => evaluarModificabilidad({ tipo: 'Inhabil', fechaInicio: HOY, hora: '13:30:00' }, AHORA), TypeError);
});

// ── Vacacional ───────────────────────────────────────────────

test('Vacacional: rango futuro válido, incluso si contiene fines de semana por dentro', () => {
  assert.deepEqual(assertValido(validar(vacacional())), {
    tipo: 'Vacacional', nombre: 'Receso escolar', fechaInicio: LUNES, fechaFin: '2026-09-25', hora: null,
  });
  assertValido(validar(vacacional({ fechaFin: '2026-09-29' }))); // cruza sábado 26 y domingo 27
});

test('Vacacional: inicio hoy es inválido (debe ser estrictamente futuro)', () => {
  assertSoloError(validar(vacacional({ fechaInicio: HOY })), 'fechaInicio');
});

test('Vacacional: inicio pasado es inválido', () => {
  assertSoloError(validar(vacacional({ fechaInicio: PASADO })), 'fechaInicio');
});

test('Vacacional: fin igual al inicio es inválido', () => {
  assertSoloError(validar(vacacional({ fechaInicio: LUNES, fechaFin: LUNES })), 'fechaFin');
});

test('Vacacional: fin anterior al inicio es inválido; fin hoy o pasado también', () => {
  assertSoloError(validar(vacacional({ fechaInicio: '2026-09-23', fechaFin: '2026-09-22' })), 'fechaFin');
  assertSoloError(validar(vacacional({ fechaFin: HOY })), 'fechaFin');
  assertSoloError(validar(vacacional({ fechaFin: PASADO })), 'fechaFin');
});

test('Vacacional: los extremos no pueden ser sábado ni domingo', () => {
  assertSoloError(validar(vacacional({ fechaInicio: SABADO })), 'fechaInicio');
  assertSoloError(validar(vacacional({ fechaInicio: DOMINGO, fechaFin: '2026-09-25' })), 'fechaInicio');
  assertSoloError(validar(vacacional({ fechaFin: '2026-09-26' })), 'fechaFin');
  assertSoloError(validar(vacacional({ fechaFin: '2026-09-27' })), 'fechaFin');
});

test('Vacacional: fechas obligatorias', () => {
  assertSoloError(validar(vacacional({ fechaInicio: undefined })), 'fechaInicio');
  assertSoloError(validar(vacacional({ fechaFin: null })), 'fechaFin');
});

test('Vacacional: confirmacionPublicacion faltante o distinta de true es CONFIRMACION_REQUERIDA', () => {
  const { confirmacionPublicacion, ...sinConfirmacion } = vacacional();
  assertSoloError(validar(sinConfirmacion), 'confirmacionPublicacion', CODIGOS_ERROR.CONFIRMACION_REQUERIDA);
  for (const valor of [false, 'true', 1, null]) {
    assertSoloError(validar(vacacional({ confirmacionPublicacion: valor })), 'confirmacionPublicacion', CODIGOS_ERROR.CONFIRMACION_REQUERIDA);
  }
});

test('Vacacional: confirmacionPublicacion = true es válida', () => {
  assertValido(validar(vacacional({ confirmacionPublicacion: true })));
});

test('Vacacional: sin confirmación y con otro error, el código es VALIDACION e incluye ambos campos', () => {
  const res = validar(vacacional({ fechaInicio: HOY, confirmacionPublicacion: false }));
  assert.equal(res.ok, false);
  assert.equal(res.codigo, CODIGOS_ERROR.VALIDACION);
  assert.deepEqual(Object.keys(res.errores).sort(), ['confirmacionPublicacion', 'fechaInicio']);
});

test('Vacacional: no admite hora', () => {
  assertSoloError(validar(vacacional({ hora: '10:00' })), 'hora');
  assertValido(validar(vacacional({ hora: null })));
});

// ── Periodo ──────────────────────────────────────────────────

test('Periodo: caso válido con datos normalizados', () => {
  assert.deepEqual(assertValido(validar(periodo())), {
    tipo: 'Periodo',
    nombre: 'Periodo 2027-01',
    fechaInicio: '2026-10-16',
    fechaFin: '2027-05-17',
    hora: null,
    periodo: { anio: '2027', semestre: '01', fechaMaxExpediente: '2026-09-25' },
  });
});

test('Periodo: año exactamente de 4 dígitos (texto o entero); otros valores son inválidos', () => {
  assert.equal(assertValido(validar(periodo({ anio: 2027 }))).periodo.anio, '2027');
  for (const anio of ['26', '20266', 'abcd', '', null, undefined, 2026.5, '20 6']) {
    assertSoloError(validar(periodo({ anio })), 'anio');
  }
});

test('Periodo: el semestre debe ser "01" o "02"', () => {
  assert.equal(assertValido(validar(periodo({ semestre: '02', ...ENERO_2027 }))).periodo.semestre, '02');
  for (const semestre of ['1', '03', 'S01', 's01', 1, null, undefined, '']) {
    assertSoloError(validar(periodo({ semestre })), 'semestre');
  }
});

test('Periodo: la fecha máxima de expediente no puede ser hoy (debe ser estrictamente futura)', () => {
  assertSoloError(validar(periodo({ fechaMaxExpediente: HOY })), 'fechaMaxExpediente');
});

test('Periodo: la fecha máxima de expediente pasada es inválida', () => {
  assertSoloError(validar(periodo({ fechaMaxExpediente: PASADO })), 'fechaMaxExpediente');
});

test('Periodo: la fecha máxima igual al inicio es inválida', () => {
  assertSoloError(validar(periodo({ fechaMaxExpediente: '2026-10-16' })), 'fechaMaxExpediente');
});

test('Periodo: la fecha máxima posterior al inicio es inválida', () => {
  assertSoloError(validar(periodo({ fechaMaxExpediente: '2026-10-19' })), 'fechaMaxExpediente');
});

test('Periodo: la fecha máxima no puede ser sábado ni domingo', () => {
  assertSoloError(validar(periodo({ fechaMaxExpediente: '2026-09-26' })), 'fechaMaxExpediente');
  assertSoloError(validar(periodo({ fechaMaxExpediente: '2026-09-27' })), 'fechaMaxExpediente');
});

test('Periodo: no hay mínimo de días entre expediente e inicio (el día hábil anterior basta)', () => {
  assertValido(validar(periodo({ fechaMaxExpediente: '2026-10-15' })));
});

test('Periodo: inicio y fin no pueden ser sábado ni domingo', () => {
  assertSoloError(validar(periodo({ fechaInicio: '2026-10-17' })), 'fechaInicio');
  assertSoloError(validar(periodo({ fechaInicio: '2026-10-18' })), 'fechaInicio');
  assertSoloError(validar(periodo({ fechaFin: '2027-05-15' })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: '2027-05-16' })), 'fechaFin');
});

test('Periodo: inicio y fin en sábado o domingo se rechazan a la vez, cada uno en su campo y con su mensaje', () => {
  for (const [fechaInicio, fechaFin] of [['2026-10-17', '2027-05-15'], ['2026-10-18', '2027-05-16'], ['2026-10-17', '2027-05-16']]) {
    const res = validar(periodo({ fechaInicio, fechaFin }));
    assert.equal(res.ok, false);
    assert.equal(res.codigo, CODIGOS_ERROR.VALIDACION);
    assert.deepEqual(Object.keys(res.errores).sort(), ['fechaFin', 'fechaInicio']);
    assert.match(res.errores.fechaInicio, /fecha de inicio no puede ser sábado ni domingo/);
    assert.match(res.errores.fechaFin, /fecha de fin no puede ser sábado ni domingo/);
  }
  // Lunes a viernes en ambos extremos: válido.
  assertValido(validar(periodo({ fechaInicio: '2026-10-19', fechaFin: '2027-05-14' })));
});

test('Periodo: cambio de mes y de año en los extremos (lunes-viernes válido; sábado y domingo no)', () => {
  const cruceDeAnio = { fechaMaxExpediente: '2026-12-30', fechaInicio: '2026-12-31', fechaFin: '2027-01-01' }; // jueves → viernes
  assertValido(validar(periodo(cruceDeAnio)));
  assertSoloError(validar(periodo({ ...cruceDeAnio, fechaFin: '2027-01-02' })), 'fechaFin');   // sábado
  assertSoloError(validar(periodo({ ...cruceDeAnio, fechaFin: '2027-01-03' })), 'fechaFin');   // domingo
  assertSoloError(validar(periodo({ ...cruceDeAnio, fechaInicio: '2027-01-02', fechaFin: '2027-05-17' })), 'fechaInicio');
  // Fin de mes: el último día del mes en viernes es válido; en sábado o domingo no.
  assertValido(validar(periodo({ fechaFin: '2027-05-28' })));
  assertSoloError(validar(periodo({ fechaFin: '2027-05-29' })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: '2027-05-30' })), 'fechaFin');
});

test('Periodo: febrero no bisiesto y bisiesto en los extremos', () => {
  // 2027 (no bisiesto): viernes 26 válido, sábado 27 y domingo 28 no; el 29 no existe.
  assertValido(validar(periodo({ fechaFin: '2027-02-26' })));
  assertSoloError(validar(periodo({ fechaFin: '2027-02-27' })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: '2027-02-28' })), 'fechaFin');
  const inexistente = validar(periodo({ fechaFin: '2027-02-29' }));
  assert.equal(inexistente.ok, false);
  assert.match(inexistente.errores.fechaFin, /no es una fecha válida/);

  // 2028 (bisiesto): martes 29 válido; sábado 26 y domingo 27 no.
  assertValido(validar(periodo({ fechaFin: '2028-02-29' })));
  assertSoloError(validar(periodo({ fechaFin: '2028-02-26' })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: '2028-02-27' })), 'fechaFin');
  // 2032: el 29 de febrero es domingo.
  assertSoloError(validar(periodo({ fechaFin: '2032-02-29' })), 'fechaFin');
  assertValido(validar(periodo({ fechaFin: '2032-02-27' })));

  // Inicio el 29-feb-2028 (martes) dentro del ciclo 02/2028; el domingo 27 no.
  const ciclo = { anio: '2028', semestre: '02', fechaMaxExpediente: '2028-02-25', fechaFin: '2028-04-28' };
  assertValido(validar(periodo({ ...ciclo, fechaInicio: '2028-02-29' })));
  assertSoloError(validar(periodo({ ...ciclo, fechaInicio: '2028-02-27' })), 'fechaInicio');
});

test('Periodo: inicio y fin deben ser estrictamente futuros', () => {
  // Con inicio hoy o pasado, la fecha máxima (futura) tampoco puede ser anterior al inicio.
  for (const fechaInicio of [HOY, PASADO]) {
    const res = validar(periodo({ fechaInicio }));
    assert.equal(res.ok, false);
    assert.match(res.errores.fechaInicio, /posterior a hoy/);
    assert.ok(res.errores.fechaMaxExpediente);
  }
  assertSoloError(validar(periodo({ fechaFin: HOY })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: PASADO })), 'fechaFin');
});

test('Periodo: fin igual o anterior al inicio es inválido', () => {
  assertSoloError(validar(periodo({ fechaFin: '2026-10-16' })), 'fechaFin');
  assertSoloError(validar(periodo({ fechaFin: '2026-10-15' })), 'fechaFin');
});

test('Periodo: el rango puede contener fines de semana por dentro', () => {
  assertValido(validar(periodo({ fechaInicio: '2026-10-19', fechaFin: '2026-10-23' })));
  assertValido(validar(periodo())); // varios meses, con sábados y domingos internos
});

test('Periodo: sin confirmacionPublicacion = true es CONFIRMACION_REQUERIDA', () => {
  const { confirmacionPublicacion, ...sinConfirmacion } = periodo();
  assertSoloError(validar(sinConfirmacion), 'confirmacionPublicacion', CODIGOS_ERROR.CONFIRMACION_REQUERIDA);
  assertSoloError(validar(periodo({ confirmacionPublicacion: false })), 'confirmacionPublicacion', CODIGOS_ERROR.CONFIRMACION_REQUERIDA);
});

test('Periodo: todos los campos son obligatorios y se reportan a la vez', () => {
  const res = validar({ tipo: 'Periodo', confirmacionPublicacion: true });
  assert.equal(res.ok, false);
  assert.equal(res.codigo, CODIGOS_ERROR.VALIDACION);
  assert.deepEqual(Object.keys(res.errores).sort(), ['anio', 'fechaFin', 'fechaInicio', 'fechaMaxExpediente', 'nombre', 'semestre']);
});

test('Periodo: no admite hora', () => {
  assertSoloError(validar(periodo({ hora: '10:00' })), 'hora');
});

// Solo fechaInicio debe corresponder al ciclo/semestre. La fecha de fin queda meses después (fuera del semestre).
// Con "hoy" en septiembre 2026, agosto y septiembre 2026 ya son pasado: esos casos usan un "hoy" de julio 2026.
const AHORA_JULIO_2026 = new Date('2026-07-15T18:00:00.000Z');
const inicioPeriodo = (semestre, fechaInicio, fechaMaxExpediente, extra, ahora = AHORA) =>
  validar(periodo({ anio: '2027', semestre, fechaInicio, fechaMaxExpediente, fechaFin: '2028-06-15', ...extra }), ahora);

test('Periodo 01/2027: acepta inicio de agosto a diciembre 2026', () => {
  for (const inicio of ['2026-08-03', '2026-09-21', '2026-10-16', '2026-11-16', '2026-12-14']) {
    assertValido(inicioPeriodo('01', inicio, '2026-07-31', undefined, AHORA_JULIO_2026));
  }
});

test('Periodo 01/2027: acepta inicio en enero 2027', () => {
  assertValido(inicioPeriodo('01', '2027-01-18', '2027-01-15'));
});

test('Periodo 01/2027: rechaza inicio posterior a enero 2027 con un error claro en fechaInicio', () => {
  for (const inicio of ['2027-02-01', '2027-03-15', '2027-07-30']) {
    const res = inicioPeriodo('01', inicio, '2026-09-30');
    assertSoloError(res, 'fechaInicio');
    assert.match(res.errores.fechaInicio, /no corresponde al ciclo 2027\/01 \(agosto 2026 a enero 2027\)/);
  }
});

test('Periodo 01/2027: rechaza inicio anterior a agosto 2026', () => {
  assertSoloError(inicioPeriodo('01', '2026-07-31', '2026-07-20', undefined, AHORA_JULIO_2026), 'fechaInicio');
});

test('Periodo 02/2027: acepta inicio en enero 2027', () => {
  assertValido(inicioPeriodo('02', '2027-01-18', '2027-01-15'));
});

test('Periodo 02/2027: acepta inicio de febrero a julio 2027', () => {
  for (const inicio of ['2027-02-01', '2027-03-15', '2027-05-17', '2027-06-14', '2027-07-30']) {
    assertValido(inicioPeriodo('02', inicio, '2027-01-15'));
  }
});

test('Periodo 02/2027: rechaza inicio anterior a enero 2027 con un error claro en fechaInicio', () => {
  for (const inicio of ['2026-12-14', '2026-10-16']) {
    const res = inicioPeriodo('02', inicio, '2026-09-30');
    assertSoloError(res, 'fechaInicio');
    assert.match(res.errores.fechaInicio, /no corresponde al ciclo 2027\/02 \(enero 2027 a julio 2027\)/);
  }
});

test('Periodo 02/2027: rechaza inicio posterior a julio 2027', () => {
  assertSoloError(inicioPeriodo('02', '2027-08-02', '2027-01-15'), 'fechaInicio');
});

test('Periodo: fechaFin y fechaMaxExpediente pueden quedar fuera de la ventana del semestre', () => {
  // 01/2027 con fin en 2028 y expediente en septiembre 2026; 02/2027 con expediente en diciembre 2026.
  assertValido(inicioPeriodo('01', '2026-10-16', '2026-09-30', { fechaFin: '2028-03-15' }));
  assertValido(inicioPeriodo('02', '2027-03-15', '2026-12-15', { fechaFin: '2027-12-15' }));
});

test('Periodo: sin ciclo válido (anio o semestre inválidos) solo se reportan esos campos, no fechaInicio', () => {
  assertSoloError(validar(periodo({ anio: '27' })), 'anio');
  assertSoloError(validar(periodo({ semestre: '03' })), 'semestre');
});

test('Periodo: la regla del ciclo no oculta otros errores de fechaInicio (fin de semana o pasado)', () => {
  assert.match(inicioPeriodo('01', '2026-10-17', '2026-09-30').errores.fechaInicio, /sábado/);
  assert.match(inicioPeriodo('01', PASADO, '2026-09-30').errores.fechaInicio, /posterior a hoy/);
});

test('Periodo: mapeo de semestre "01" <-> s01 y "02" <-> s02', () => {
  assert.equal(semestreApiAPrisma('01'), 's01');
  assert.equal(semestreApiAPrisma('02'), 's02');
  assert.equal(semestrePrismaAApi('s01'), '01');
  assert.equal(semestrePrismaAApi('s02'), '02');
  for (const mala of ['1', '03', 's01', null, undefined]) assert.throws(() => semestreApiAPrisma(mala), TypeError);
  for (const mala of ['01', 's03', 'S01', null, undefined]) assert.throws(() => semestrePrismaAApi(mala), TypeError);
});

// ── Ciclo / semestre ─────────────────────────────────────────

test('ciclo: 2026-01 = agosto 2025 a enero 2026', () => {
  assert.deepEqual(mesesCicloSemestre('2026', '01'), { desde: { anio: 2025, mes: 8 }, hasta: { anio: 2026, mes: 1 } });
});

test('ciclo: 2026-02 = enero 2026 a julio 2026', () => {
  assert.deepEqual(mesesCicloSemestre('2026', '02'), { desde: { anio: 2026, mes: 1 }, hasta: { anio: 2026, mes: 7 } });
});

test('ciclo: 2027-01 = agosto 2026 a enero 2027', () => {
  assert.deepEqual(mesesCicloSemestre('2027', '01'), { desde: { anio: 2026, mes: 8 }, hasta: { anio: 2027, mes: 1 } });
});

test('ciclo: 2027-02 = enero 2027 a julio 2027', () => {
  assert.deepEqual(mesesCicloSemestre('2027', '02'), { desde: { anio: 2027, mes: 1 }, hasta: { anio: 2027, mes: 7 } });
});

test('ciclo: 2028-02 = enero 2028 a julio 2028', () => {
  assert.deepEqual(mesesCicloSemestre('2028', '02'), { desde: { anio: 2028, mes: 1 }, hasta: { anio: 2028, mes: 7 } });
});

test('ciclo: solo devuelve año y mes; no genera fechas exactas (los días salen del Periodo en BD)', () => {
  for (const [anio, semestre] of [['2026', '01'], ['2027', '02']]) {
    const { desde, hasta } = mesesCicloSemestre(anio, semestre);
    assert.deepEqual(Object.keys(desde), ['anio', 'mes']);
    assert.deepEqual(Object.keys(hasta), ['anio', 'mes']);
    assert.equal(typeof desde.mes, 'number');
    assert.equal(typeof hasta.anio, 'number');
  }
});

test('ciclo: el 01 y el 02 del mismo año comparten enero (el 01 termina en enero y el 02 empieza en enero)', () => {
  const s1 = mesesCicloSemestre('2027', '01');
  const s2 = mesesCicloSemestre('2027', '02');
  assert.deepEqual(s1.hasta, s2.desde);
});

test('ciclo: acepta el año como entero', () => {
  assert.deepEqual(mesesCicloSemestre(2026, '01'), mesesCicloSemestre('2026', '01'));
});

test('ciclo: año o semestre inválidos lanzan TypeError', () => {
  for (const anio of ['26', 'abcd', '20266', '', null, undefined, 2026.5]) {
    assert.throws(() => mesesCicloSemestre(anio, '01'), TypeError, `anio=${String(anio)}`);
  }
  for (const semestre of ['1', '03', 's01', 1, null, undefined]) {
    assert.throws(() => mesesCicloSemestre('2026', semestre), TypeError, `semestre=${String(semestre)}`);
  }
});
