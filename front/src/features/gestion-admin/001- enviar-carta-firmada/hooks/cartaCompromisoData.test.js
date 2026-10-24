// Ejecutar: node --test "src/features/gestion-admin/001- enviar-carta-firmada/hooks/"
//
// Fechas de la carta compromiso firmada (HANDOFF §3): el inicio del periodo es @db.Date (medianoche UTC) y se muestra
// con formatearFechaUTC; la fecha de envío es un instante real (DateTime) y se muestra en hora de México. Ninguna de las
// dos puede depender de la zona horaria del navegador.

import test from "node:test";
import assert from "node:assert/strict";
import { formatFechaLarga, formatFechaHora } from "./cartaCompromisoData.js";

test("formatFechaLarga: @db.Date 2026-07-16 → '16 de julio de 2026' (no el 15)", () => {
  assert.equal(formatFechaLarga("2026-07-16T00:00:00.000Z"), "16 de julio de 2026");
});

test("formatFechaHora: 05:30Z del 24-oct es 23 oct 2026, 11:30 p.m. en México", () => {
  const texto = formatFechaHora("2026-10-24T05:30:00.000Z");
  assert.match(texto, /^23 oct 2026/);
  assert.match(texto, /11:30/);
});

test("sin fecha o fecha inválida → '—'", () => {
  for (const f of [formatFechaLarga, formatFechaHora]) {
    assert.equal(f(null), "—");
    assert.equal(f("no-es-fecha"), "—");
  }
});
