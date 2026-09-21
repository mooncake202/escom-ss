const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TIPOS_DIA,
  MOTIVOS_INCONSISTENCIA,
  eventoCubreFecha,
  construirCalendarioPeriodo,
} = require('./reportes.calendario');

const evento = (id, nombre, tipo, fechaInicio, fechaFin = null) => ({ id, nombre, tipo, fechaInicio, fechaFin });
const diaDe = (calendario, fecha) => calendario.dias.find((d) => d.fecha === fecha);

// Semana: lun 2025-11-17 … dom 2025-11-23
const INICIO = '2025-11-17';
const FIN = '2025-11-23';

test('eventoCubreFecha: rango con fecha_fin y evento de un solo día (fecha_fin nula)', () => {
  const rangoEv = evento(1, 'Semana', 'Vacacional', '2025-11-18', '2025-11-20');
  assert.equal(eventoCubreFecha(rangoEv, '2025-11-17'), false);
  assert.equal(eventoCubreFecha(rangoEv, '2025-11-18'), true);
  assert.equal(eventoCubreFecha(rangoEv, '2025-11-20'), true);
  assert.equal(eventoCubreFecha(rangoEv, '2025-11-21'), false);

  const unDia = evento(2, 'Puente', 'Inhabil', '2025-11-17', null);
  assert.equal(eventoCubreFecha(unDia, '2025-11-17'), true);
  assert.equal(eventoCubreFecha(unDia, '2025-11-18'), false);
});

test('devuelve un día por cada fecha del periodo, ambas puntas incluidas', () => {
  const cal = construirCalendarioPeriodo({ inicio: INICIO, fin: FIN });
  assert.equal(cal.dias.length, 7);
  assert.equal(cal.dias[0].fecha, INICIO);
  assert.equal(cal.dias[6].fecha, FIN);
  assert.deepEqual(cal.eventos, []);
  assert.deepEqual(cal.inconsistencias, []);
});

test('clasifica: laborado, laborable sin bitácora y fin de semana', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    bitacoras: [{ id: 10, fecha: '2025-11-17', horas: 4 }, { id: 11, fecha: '2025-11-18', horas: 2 }],
  });

  assert.equal(diaDe(cal, '2025-11-17').tipo, TIPOS_DIA.LABORADO);
  assert.equal(diaDe(cal, '2025-11-17').bitacoraAprobada, true);
  assert.equal(diaDe(cal, '2025-11-17').horas, 4);
  assert.equal(diaDe(cal, '2025-11-18').horas, 2);

  const sinBitacora = diaDe(cal, '2025-11-19');
  assert.equal(sinBitacora.tipo, TIPOS_DIA.LABORABLE_SIN_BITACORA);
  assert.equal(sinBitacora.bitacoraAprobada, false);
  assert.equal(sinBitacora.horas, null);

  assert.equal(diaDe(cal, '2025-11-22').tipo, TIPOS_DIA.FIN_DE_SEMANA);
  assert.equal(diaDe(cal, '2025-11-22').finDeSemana, true);
  assert.equal(diaDe(cal, '2025-11-23').tipo, TIPOS_DIA.FIN_DE_SEMANA);
  assert.deepEqual(cal.inconsistencias, []);
});

test('eventos Inhabil y Vacacional: banderas, nombre y clasificación', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [
      evento(5, 'Día de la Revolución', 'Inhabil', '2025-11-17'),
      evento(6, 'Receso', 'Vacacional', '2025-11-19', '2025-11-20'),
    ],
  });

  const inhabil = diaDe(cal, '2025-11-17');
  assert.equal(inhabil.tipo, TIPOS_DIA.INHABIL);
  assert.equal(inhabil.inhabil, true);
  assert.equal(inhabil.vacacional, false);
  assert.deepEqual(inhabil.evento, { id: 5, nombre: 'Día de la Revolución', tipo: 'Inhabil' });

  const vacacional = diaDe(cal, '2025-11-20');
  assert.equal(vacacional.tipo, TIPOS_DIA.VACACIONAL);
  assert.equal(vacacional.vacacional, true);
  assert.equal(vacacional.inhabil, false);
  assert.equal(vacacional.evento.nombre, 'Receso');

  assert.equal(diaDe(cal, '2025-11-18').evento, null);
  assert.equal(cal.eventos.length, 2);
  assert.deepEqual(cal.eventos.map((e) => e.id), [5, 6]);
  assert.deepEqual(cal.inconsistencias, []);
});

test('dos eventos en el mismo día: ambas banderas y el Vacacional como evento principal', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [evento(1, 'Inhábil X', 'Inhabil', '2025-11-19'), evento(2, 'Receso', 'Vacacional', '2025-11-19')],
  });
  const dia = diaDe(cal, '2025-11-19');
  assert.equal(dia.inhabil, true);
  assert.equal(dia.vacacional, true);
  assert.equal(dia.tipo, TIPOS_DIA.VACACIONAL);
  assert.equal(dia.evento.nombre, 'Receso');
});

test('un evento que cae fuera del periodo no aparece en eventos', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [evento(1, 'Lejano', 'Vacacional', '2025-12-20', '2026-01-05')],
  });
  assert.deepEqual(cal.eventos, []);
});

test('fin de semana dentro de un evento Vacacional: se conserva finDeSemana y gana la clasificación vacacional', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [evento(1, 'Receso', 'Vacacional', '2025-11-17', '2025-11-23')],
  });
  const sabado = diaDe(cal, '2025-11-22');
  assert.equal(sabado.finDeSemana, true);
  assert.equal(sabado.vacacional, true);
  assert.equal(sabado.tipo, TIPOS_DIA.VACACIONAL);
});

test('INCONSISTENCIA: bitácora aprobada en un día Inhabil se reporta y no se modifica ni se oculta', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [evento(5, 'Día de la Revolución', 'Inhabil', '2025-11-17')],
    bitacoras: [{ id: 77, fecha: '2025-11-17', horas: 4 }],
  });

  assert.equal(cal.inconsistencias.length, 1);
  const inc = cal.inconsistencias[0];
  assert.equal(inc.fecha, '2025-11-17');
  assert.deepEqual(inc.bitacoraIds, [77]);
  assert.equal(inc.horas, 4);
  assert.deepEqual(inc.motivos, [MOTIVOS_INCONSISTENCIA.EVENTO_INHABIL]);
  assert.deepEqual(inc.eventos, [{ id: 5, nombre: 'Día de la Revolución', tipo: 'Inhabil' }]);

  const dia = diaDe(cal, '2025-11-17');
  assert.equal(dia.inconsistente, true);
  assert.equal(dia.bitacoraAprobada, true); // el dato de AH se muestra tal cual
  assert.equal(dia.horas, 4);
  assert.equal(dia.tipo, TIPOS_DIA.LABORADO);
});

test('INCONSISTENCIA: bitácora aprobada en día Vacacional, en fin de semana y en ambos a la vez', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    eventos: [evento(6, 'Receso', 'Vacacional', '2025-11-21', '2025-11-22')],
    bitacoras: [
      { id: 1, fecha: '2025-11-20', horas: 4 },  // día normal: sin problema
      { id: 2, fecha: '2025-11-21', horas: 3 },  // viernes vacacional
      { id: 3, fecha: '2025-11-22', horas: 4 },  // sábado dentro del receso: dos motivos
      { id: 4, fecha: '2025-11-23', horas: 1 },  // domingo normal: fin de semana
    ],
  });

  assert.deepEqual(cal.inconsistencias.map((i) => i.fecha), ['2025-11-21', '2025-11-22', '2025-11-23']);
  assert.deepEqual(cal.inconsistencias[0].motivos, [MOTIVOS_INCONSISTENCIA.EVENTO_VACACIONAL]);
  assert.deepEqual(cal.inconsistencias[1].motivos, [MOTIVOS_INCONSISTENCIA.EVENTO_VACACIONAL, MOTIVOS_INCONSISTENCIA.FIN_DE_SEMANA]);
  assert.deepEqual(cal.inconsistencias[2].motivos, [MOTIVOS_INCONSISTENCIA.FIN_DE_SEMANA]);
  assert.equal(diaDe(cal, '2025-11-20').inconsistente, false);
});

test('bitácoras fuera del periodo se ignoran', () => {
  const cal = construirCalendarioPeriodo({
    inicio: INICIO,
    fin: FIN,
    bitacoras: [{ id: 1, fecha: '2025-11-16', horas: 4 }, { id: 2, fecha: '2025-11-24', horas: 4 }],
  });
  assert.equal(cal.dias.every((d) => !d.bitacoraAprobada), true);
});
