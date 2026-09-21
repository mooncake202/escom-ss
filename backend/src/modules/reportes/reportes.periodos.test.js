const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONFIG_PERIODOS,
  ESQUEMAS,
  InicioServicioNoLaboralError,
  normalizarFechaISO,
  formatearFechaLarga,
  formatearMesAnio,
  sumarDiasISO,
  listarFechasISO,
  esFinDeSemanaISO,
  nDiaLaboralDelMes,
  determinarEsquema,
  calcularPeriodoReporte,
  listarPeriodosCompletos,
  periodoCerrado,
  servicioIniciado,
} = require('./reportes.periodos');

const periodoDe = (fechaInicio, fechaFin, numero, config) =>
  calcularPeriodoReporte({ fechaInicio, fechaFin, numero, config });

const rango = (p) => `${p.inicio}→${p.fin}`;

// Siguiente día lunes-viernes estrictamente posterior (cálculo independiente del módulo).
function siguienteLaboral(iso) {
  let fecha = sumarDiasISO(iso, 1);
  while (esFinDeSemanaISO(fecha)) fecha = sumarDiasISO(fecha, 1);
  return fecha;
}

test('configuración por defecto: mes_calendario en los primeros 5 días L-V; cierre nominal de mediados en 15', () => {
  assert.equal(CONFIG_PERIODOS.diasLaboralesInicioMesCalendario, 5);
  assert.equal(CONFIG_PERIODOS.diaCorteMediados, 15);
  assert.equal(CONFIG_PERIODOS.diaMaxInicioMesCalendario, undefined, 'la regla del día 15 ya no existe');
});

// ── Esquema: primeros 5 días lunes-viernes del mes ───────────

test('n-ésimo día lunes-viernes del mes, con el mes empezando en cada día de la semana', () => {
  assert.equal(nDiaLaboralDelMes(2025, 10, 5), '2025-11-07'); // nov 2025 empieza sábado: 3,4,5,6,7
  assert.equal(nDiaLaboralDelMes(2026, 6, 5), '2026-07-07');  // julio 2026 empieza miércoles: 1,2,3,6,7
  assert.equal(nDiaLaboralDelMes(2026, 5, 5), '2026-06-05');  // junio 2026 empieza lunes: 1..5
  assert.equal(nDiaLaboralDelMes(2026, 4, 5), '2026-05-07');  // mayo 2026 empieza viernes: 1,4,5,6,7
  assert.equal(nDiaLaboralDelMes(2026, 7, 5), '2026-08-07');  // agosto 2026 empieza sábado
  assert.equal(nDiaLaboralDelMes(2026, 1, 5), '2026-02-06');  // febrero 2026 empieza domingo
  assert.equal(nDiaLaboralDelMes(2026, 6, 3), '2026-07-03');
});

test('esquema: inicio dentro de los primeros 5 días L-V del mes → mes_calendario; después → mediados_de_mes', () => {
  // Noviembre 2025: los días L-V son 3, 4, 5, 6 y 7 (1 y 2 son fin de semana).
  for (const fecha of ['2025-11-03', '2025-11-04', '2025-11-05', '2025-11-06', '2025-11-07']) {
    assert.equal(determinarEsquema(fecha), ESQUEMAS.MES_CALENDARIO, fecha);
  }
  for (const fecha of ['2025-11-10', '2025-11-14', '2025-11-17', '2025-11-28']) {
    assert.equal(determinarEsquema(fecha), ESQUEMAS.MEDIADOS_DE_MES, fecha);
  }
  // Julio 2026 (empieza en miércoles): el 5.º día L-V es el 7; el 8 ya es mediados.
  assert.equal(determinarEsquema('2026-07-07'), ESQUEMAS.MES_CALENDARIO);
  assert.equal(determinarEsquema('2026-07-08'), ESQUEMAS.MEDIADOS_DE_MES);
  assert.equal(determinarEsquema('2026-07-16'), ESQUEMAS.MEDIADOS_DE_MES);
  // Junio 2026 (empieza en lunes): el 5.º día L-V es el viernes 5.
  assert.equal(determinarEsquema('2026-06-05'), ESQUEMAS.MES_CALENDARIO);
  assert.equal(determinarEsquema('2026-06-08'), ESQUEMAS.MEDIADOS_DE_MES);
});

test('esquema: la regla anterior del día 15 ya no aplica (el 15 de septiembre de 2025 es mediados_de_mes)', () => {
  assert.equal(determinarEsquema('2025-09-15'), ESQUEMAS.MEDIADOS_DE_MES);
  assert.equal(determinarEsquema('2025-09-05'), ESQUEMAS.MES_CALENDARIO);
});

test('el número de días L-V y el día de corte son configurables sin tocar el algoritmo', () => {
  const tres = { ...CONFIG_PERIODOS, diasLaboralesInicioMesCalendario: 3 };
  assert.equal(determinarEsquema('2025-11-05', tres), ESQUEMAS.MES_CALENDARIO); // 3.er día L-V
  assert.equal(determinarEsquema('2025-11-06', tres), ESQUEMAS.MEDIADOS_DE_MES);

  const config = { ...CONFIG_PERIODOS, diaCorteMediados: 14 };
  assert.equal(rango(periodoDe('2025-10-16', null, 1, config)), '2025-10-16→2025-11-14');
  // El corte nominal 15/nov (sábado) pasa al lunes 17; el fin nominal 14/dic (domingo) pasa al viernes 12.
  assert.equal(rango(periodoDe('2025-10-16', null, 2, config)), '2025-11-17→2025-12-12');
});

// ── mes_calendario ───────────────────────────────────────────

test('mes_calendario: primer L-V → último L-V de cada mes (el sábado/domingo del cierre no cuenta)', () => {
  // Inicio miércoles 1-oct-2025.
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 1)), '2025-10-01→2025-10-31');
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 2)), '2025-11-03→2025-11-28'); // nov: 1 sáb, 30 dom
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 3)), '2025-12-01→2025-12-31');
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 4)), '2026-01-01→2026-01-30'); // 31-ene es sábado
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 5)), '2026-02-02→2026-02-27'); // feb 2026: 1 dom, 28 sáb
  assert.equal(rango(periodoDe('2025-10-01', '2026-04-30', 7)), '2026-04-01→2026-04-30');
});

test('mes_calendario: el primer periodo va de la fecha real al último L-V del mes', () => {
  const p1 = periodoDe('2025-11-03', '2026-06-03', 1);
  assert.equal(p1.esquema, ESQUEMAS.MES_CALENDARIO);
  assert.equal(rango(p1), '2025-11-03→2025-11-28');
  assert.equal(p1.esPrimero, true);
  assert.equal(rango(periodoDe('2025-11-03', '2026-06-03', 2)), '2025-12-01→2025-12-31');
  // Inicio en el 5.º día L-V (viernes 7): sigue siendo mes_calendario.
  assert.equal(rango(periodoDe('2025-11-07', null, 1)), '2025-11-07→2025-11-28');
});

test('mes_calendario: cruce de año', () => {
  assert.equal(rango(periodoDe('2025-11-03', null, 3)), '2026-01-01→2026-01-30');
  assert.equal(rango(periodoDe('2025-12-01', null, 2)), '2026-01-01→2026-01-30');
});

test('mes_calendario: febrero no bisiesto, bisiesto en día laboral y bisiesto en sábado', () => {
  assert.equal(rango(periodoDe('2027-02-01', null, 1)), '2027-02-01→2027-02-26'); // 28-feb-2027 es domingo
  assert.equal(rango(periodoDe('2028-02-01', null, 1)), '2028-02-01→2028-02-29'); // 29-feb-2028 es martes
  assert.equal(rango(periodoDe('2020-02-03', null, 1)), '2020-02-03→2020-02-28'); // 29-feb-2020 es sábado
});

// ── mediados_de_mes ──────────────────────────────────────────

test('caso obligatorio: inicio 2026-07-16 → R1 2026-07-16→2026-08-14 y R2 2026-08-17→2026-09-15', () => {
  const r1 = periodoDe('2026-07-16', '2027-02-17', 1);
  const r2 = periodoDe('2026-07-16', '2027-02-17', 2);
  assert.equal(r1.esquema, ESQUEMAS.MEDIADOS_DE_MES);
  assert.equal(rango(r1), '2026-07-16→2026-08-14'); // el 15-ago es sábado
  assert.equal(rango(r2), '2026-08-17→2026-09-15'); // el 16-ago es domingo
});

test('mediados_de_mes: cortes nominales 16/15 con sus extremos llevados a lunes-viernes', () => {
  const inicio = '2026-07-16';
  assert.equal(rango(periodoDe(inicio, null, 3)), '2026-09-16→2026-10-15');
  assert.equal(rango(periodoDe(inicio, null, 4)), '2026-10-16→2026-11-13'); // 15-nov es domingo → viernes 13
  assert.equal(rango(periodoDe(inicio, null, 5)), '2026-11-16→2026-12-15');
  assert.equal(rango(periodoDe(inicio, null, 6)), '2026-12-16→2027-01-15');
  assert.equal(rango(periodoDe(inicio, null, 7)), '2027-01-18→2027-02-15'); // 16-ene es sábado → lunes 18
});

test('mediados_de_mes: inicio y fin nominales en fin de semana (sábado/domingo) a la vez', () => {
  assert.equal(rango(periodoDe('2025-10-16', null, 1)), '2025-10-16→2025-11-14'); // 15-nov sábado → viernes
  assert.equal(rango(periodoDe('2025-10-16', null, 2)), '2025-11-17→2025-12-15'); // 16-nov domingo → lunes
});

test('mediados_de_mes: el primer periodo conserva la fecha real de inicio (17, 18 y 31)', () => {
  assert.equal(rango(periodoDe('2025-11-17', null, 1)), '2025-11-17→2025-12-15');
  assert.equal(rango(periodoDe('2025-11-18', null, 1)), '2025-11-18→2025-12-15');
  assert.equal(rango(periodoDe('2025-12-31', null, 1)), '2025-12-31→2026-01-15');
  assert.equal(rango(periodoDe('2025-12-31', null, 2)), '2026-01-16→2026-02-13'); // 15-feb-2026 es domingo
});

test('mediados_de_mes: cruce de año y de febrero (bisiesto y no bisiesto)', () => {
  assert.equal(rango(periodoDe('2025-12-16', null, 1)), '2025-12-16→2026-01-15');
  assert.equal(rango(periodoDe('2025-12-16', null, 2)), '2026-01-16→2026-02-13');
  assert.equal(rango(periodoDe('2027-01-18', null, 1)), '2027-01-18→2027-02-15'); // no bisiesto
  assert.equal(rango(periodoDe('2028-01-17', null, 1)), '2028-01-17→2028-02-15'); // bisiesto: el 29-feb queda dentro del siguiente
  assert.equal(rango(periodoDe('2028-01-17', null, 2)), '2028-02-16→2028-03-15');
});

test('los eventos Inhabil/Vacacional NO desplazan los límites: un feriado entre semana sigue siendo extremo', () => {
  // 16-sep-2026 (miércoles, día inhábil oficial) abre el periodo 3 aunque no se trabaje.
  assert.equal(periodoDe('2026-07-16', null, 3).inicio, '2026-09-16');
  // El cálculo no recibe eventos del calendario: ninguno puede cambiar el resultado.
});

// ── Invariantes ──────────────────────────────────────────────

test('ningún periodo inicia ni termina en sábado o domingo, y cada uno empieza en el siguiente día L-V tras el anterior', () => {
  for (const inicio of listarFechasISO('2025-01-01', '2026-12-31').filter((f) => !esFinDeSemanaISO(f))) {
    for (let k = 1; k <= 14; k++) {
      const actual = periodoDe(inicio, null, k);
      const siguiente = periodoDe(inicio, null, k + 1);
      assert.equal(esFinDeSemanaISO(actual.inicio), false, `inicio ${inicio} #${k} empieza en fin de semana`);
      assert.equal(esFinDeSemanaISO(actual.fin), false, `inicio ${inicio} #${k} termina en fin de semana`);
      assert.ok(actual.inicio <= actual.fin, `inicio ${inicio} #${k}`);
      assert.equal(siguiente.inicio, siguienteLaboral(actual.fin), `inicio ${inicio}: #${k} → #${k + 1} sin traslape ni huecos entre semana`);
    }
    assert.equal(periodoDe(inicio, null, 1).inicio, inicio, `el primer periodo usa la fecha real ${inicio}`);
  }
});

// ── Inicio real en fin de semana: inconsistencia, no corrección ──

test('inicio real en sábado o domingo: NO se corrige, lanza InicioServicioNoLaboralError (cualquier esquema)', () => {
  for (const fecha of ['2026-07-18', '2026-07-19', '2025-11-01', '2025-11-02', '2026-08-01', '2026-02-01']) {
    for (const numero of [1, 2]) {
      assert.throws(
        () => periodoDe(fecha, null, numero),
        (err) => err instanceof InicioServicioNoLaboralError && err instanceof TypeError
          && err.code === 'INICIO_SERVICIO_FIN_DE_SEMANA' && err.message.includes(fecha),
        `${fecha} #${numero}`,
      );
    }
  }
});

// ── Fin de servicio y no generar periodos residuales ─────────

test('un periodo que termina después de fecha_fin NO se recorta: se marca rebasaFinServicio', () => {
  // Servicio 2025-11-03 → 2026-06-03. El periodo 8 (junio) termina el 30 y rebasa el 3 de junio.
  const p8 = periodoDe('2025-11-03', '2026-06-03', 8);
  assert.equal(rango(p8), '2026-06-01→2026-06-30');
  assert.equal(p8.rebasaFinServicio, true);
  const p7 = periodoDe('2025-11-03', '2026-06-03', 7);
  assert.equal(rango(p7), '2026-05-01→2026-05-29'); // 31-may es domingo
  assert.equal(p7.rebasaFinServicio, false);
});

test('mediados_de_mes: un periodo que rebasa fecha_fin por un solo día tampoco se recorta', () => {
  // 2025-10-16 → 2026-05-14: el periodo 7 es 16-abr → 15-may (15 > 14).
  const p7 = periodoDe('2025-10-16', '2026-05-14', 7);
  assert.equal(rango(p7), '2026-04-16→2026-05-15');
  assert.equal(p7.rebasaFinServicio, true);
  assert.equal(rango(periodoDe('2025-10-16', '2026-05-14', 6)), '2026-03-16→2026-04-15');
});

test('un periodo que termina exactamente en fecha_fin sí es completo; un fin de servicio en sábado no lo rebasa', () => {
  assert.equal(periodoDe('2025-10-01', '2026-04-30', 7).rebasaFinServicio, false);
  assert.equal(periodoDe('2025-10-01', '2026-04-30', 8).rebasaFinServicio, true);
  // R1 termina el viernes 14-ago; si el servicio termina el sábado 15-ago, cabe completo.
  assert.equal(periodoDe('2026-07-16', '2026-08-15', 1).rebasaFinServicio, false);
  assert.equal(periodoDe('2026-07-16', '2026-08-13', 1).rebasaFinServicio, true);
});

test('listarPeriodosCompletos: solo periodos mensuales completos, sin residuales', () => {
  const a = listarPeriodosCompletos({ fechaInicio: '2025-10-01', fechaFin: '2026-04-30' });
  assert.equal(a.length, 7);
  assert.equal(a.at(-1).fin, '2026-04-30');

  const b = listarPeriodosCompletos({ fechaInicio: '2025-11-03', fechaFin: '2026-06-03' });
  assert.equal(b.length, 7);
  assert.equal(b.at(-1).fin, '2026-05-29');

  const c = listarPeriodosCompletos({ fechaInicio: '2025-10-16', fechaFin: '2026-05-14' });
  assert.equal(c.length, 6);
  assert.equal(c.at(-1).fin, '2026-04-15');

  const d = listarPeriodosCompletos({ fechaInicio: '2025-12-16', fechaFin: '2026-07-16' });
  assert.equal(d.length, 7);
  assert.equal(d.at(-1).fin, '2026-07-15');

  const obligatorio = listarPeriodosCompletos({ fechaInicio: '2026-07-16', fechaFin: '2027-02-17' });
  assert.deepEqual(obligatorio.slice(0, 2).map(rango), ['2026-07-16→2026-08-14', '2026-08-17→2026-09-15']);
});

test('sin fecha_fin no se puede verificar: rebasaFinServicio es null y no hay lista de periodos', () => {
  assert.equal(periodoDe('2025-10-01', null, 1).rebasaFinServicio, null);
  assert.deepEqual(listarPeriodosCompletos({ fechaInicio: '2025-10-01', fechaFin: null }), []);
});

test('acepta Date en UTC (como los @db.Date de Prisma) igual que texto ISO', () => {
  const conDate = calcularPeriodoReporte({
    fechaInicio: new Date('2025-10-16T00:00:00.000Z'),
    fechaFin: new Date('2026-05-14T00:00:00.000Z'),
    numero: 2,
  });
  assert.equal(rango(conDate), '2025-11-17→2025-12-15');
  assert.throws(
    () => calcularPeriodoReporte({ fechaInicio: new Date('2026-07-18T00:00:00.000Z'), numero: 1 }),
    InicioServicioNoLaboralError,
  );
});

test('rechaza número de reporte inválido y fechas inexistentes', () => {
  for (const numero of [0, -1, 1.5, '2', NaN, undefined]) {
    assert.throws(() => periodoDe('2025-10-01', null, numero), TypeError, `numero=${String(numero)}`);
  }
  assert.throws(() => normalizarFechaISO('2025-02-30'), TypeError);
  assert.throws(() => normalizarFechaISO('2025-2-3'), TypeError);
  assert.throws(() => normalizarFechaISO(new Date('nope')), TypeError);
  assert.throws(() => normalizarFechaISO(null), TypeError);
});

test('sumarDiasISO y listarFechasISO cruzan mes, año y febrero bisiesto', () => {
  assert.equal(sumarDiasISO('2025-12-31', 1), '2026-01-01');
  assert.equal(sumarDiasISO('2028-02-28', 1), '2028-02-29');
  assert.equal(sumarDiasISO('2027-02-28', 1), '2027-03-01');
  assert.deepEqual(listarFechasISO('2025-12-30', '2026-01-02'), ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
  assert.deepEqual(listarFechasISO('2025-01-05', '2025-01-04'), []);
});

test('esFinDeSemanaISO', () => {
  assert.equal(esFinDeSemanaISO('2025-11-15'), true);  // sábado
  assert.equal(esFinDeSemanaISO('2025-11-16'), true);  // domingo
  assert.equal(esFinDeSemanaISO('2025-11-17'), false); // lunes
});

test('periodoCerrado: cierra el día DESPUÉS de su último día (día calendario México)', () => {
  const p = periodoDe('2025-10-16', null, 1); // termina el viernes 2025-11-14
  assert.equal(periodoCerrado(p, '2025-11-13'), false);
  assert.equal(periodoCerrado(p, '2025-11-14'), false);
  assert.equal(periodoCerrado(p, '2025-11-15'), true);
});

test('servicioIniciado: inicia el propio día de fecha_inicio', () => {
  assert.equal(servicioIniciado('2025-10-16', '2025-10-15'), false);
  assert.equal(servicioIniciado('2025-10-16', '2025-10-16'), true);
  assert.equal(servicioIniciado(new Date('2025-10-16T00:00:00Z'), new Date('2025-10-17T00:00:00Z')), true);
});

test('formatearFechaLarga: "16 de mayo de 2025", sin cero a la izquierda y en español', () => {
  assert.equal(formatearFechaLarga('2025-05-16'), '16 de mayo de 2025');
  assert.equal(formatearFechaLarga('2025-06-15'), '15 de junio de 2025');
  assert.equal(formatearFechaLarga('2026-01-01'), '1 de enero de 2026');
  assert.equal(formatearFechaLarga(new Date('2025-09-03T00:00:00Z')), '3 de septiembre de 2025');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  meses.forEach((mes, i) => {
    assert.equal(formatearFechaLarga(`2025-${String(i + 1).padStart(2, '0')}-10`), `10 de ${mes} de 2025`);
  });
});

test('formatearFechaLarga: fecha inexistente o mal formada lanza TypeError', () => {
  for (const mala of ['2025-02-30', '2025-5-16', '16/05/2025', '', null, undefined]) {
    assert.throws(() => formatearFechaLarga(mala), TypeError, String(mala));
  }
});

test('formatearMesAnio: "Agosto 2026" con inicial mayúscula, sin día', () => {
  assert.equal(formatearMesAnio('2026-08-15'), 'Agosto 2026');
  assert.equal(formatearMesAnio(new Date('2027-01-31T00:00:00.000Z')), 'Enero 2027');
  assert.equal(formatearMesAnio('2025-09-01'), 'Septiembre 2025');
  assert.throws(() => formatearMesAnio('2026-02-30'), TypeError);
});
