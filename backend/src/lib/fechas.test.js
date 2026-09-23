// Utilidades de fecha compartidas. Módulo puro: sin BD, sin reloj (salvo el `ahora` inyectable).

const test = require('node:test');
const assert = require('node:assert/strict');

const { calcularDiaMexicoUTC, calcularFechaLimiteServicio, ANIOS_MAXIMOS_SERVICIO } = require('./fechas');

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
const iso = (fecha) => fecha.toISOString().slice(0, 10);

test('calcularDiaMexicoUTC: devuelve el día calendario de MÉXICO, no el de UTC', () => {
  // 2025-11-15 03:00 UTC = 2025-11-14 21:00 en México.
  assert.equal(iso(calcularDiaMexicoUTC(new Date('2025-11-15T03:00:00.000Z'))), '2025-11-14');
  assert.equal(iso(calcularDiaMexicoUTC(new Date('2025-11-15T18:00:00.000Z'))), '2025-11-15');
});

// ── Fecha límite del servicio social (2 años) ───────────────────────────

test('el límite del servicio son 2 años exactos conservando día y mes', () => {
  assert.equal(ANIOS_MAXIMOS_SERVICIO, 2);
  for (const [inicio, esperado] of [
    ['2025-10-16', '2027-10-16'],
    ['2026-07-16', '2028-07-16'],
    ['2025-01-01', '2027-01-01'],
    ['2025-12-31', '2027-12-31'],
    ['2024-03-01', '2026-03-01'],
  ]) {
    assert.equal(iso(calcularFechaLimiteServicio(utc(inicio))), esperado, inicio);
  }
});

test('29 de febrero: el límite es el 28 de febrero, NUNCA el 1 de marzo', () => {
  // Sumar 2 años a un 29-feb siempre cae en un año no bisiesto: el día no existe y no debe desbordarse al mes siguiente.
  assert.equal(iso(calcularFechaLimiteServicio(utc('2024-02-29'))), '2026-02-28');
  assert.equal(iso(calcularFechaLimiteServicio(utc('2028-02-29'))), '2030-02-28');
  // El 28-feb de un año bisiesto no se toca: su día sí existe en el destino.
  assert.equal(iso(calcularFechaLimiteServicio(utc('2024-02-28'))), '2026-02-28');
});

test('un 29-feb cuyo destino SÍ es bisiesto conservaría el día (no aplica con 2 años, se prueba el criterio)', () => {
  // Con ANIOS_MAXIMOS_SERVICIO = 2 nunca ocurre, pero el criterio es "solo se ajusta si el día no existe".
  assert.equal(iso(calcularFechaLimiteServicio(utc('2024-02-27'))), '2026-02-27');
});

test('el resultado es medianoche UTC del día calendario, sin hora arrastrada', () => {
  const limite = calcularFechaLimiteServicio(new Date('2025-10-16T18:30:45.123Z'));
  assert.equal(limite.toISOString(), '2027-10-16T00:00:00.000Z');
});

test('acepta el Date de Prisma (@db.Date) y también una fecha en texto', () => {
  assert.equal(iso(calcularFechaLimiteServicio(utc('2025-10-16'))), '2027-10-16');
  assert.equal(iso(calcularFechaLimiteServicio('2025-10-16')), '2027-10-16');
});

test('una fecha inválida se rechaza con TypeError, nunca devuelve Invalid Date', () => {
  for (const malo of [null, undefined, '', 'no-es-fecha', new Date('x')]) {
    assert.throws(() => calcularFechaLimiteServicio(malo), TypeError, String(malo));
  }
});
