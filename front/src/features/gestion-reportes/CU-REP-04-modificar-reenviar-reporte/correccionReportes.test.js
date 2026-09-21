// Ejecutar: node --test src/features/gestion-reportes/CU-REP-04-modificar-reenviar-reporte/
import test from "node:test";
import assert from "node:assert/strict";
import { normalizarActividades, hayCambioReal } from "./correccionReportes.js";

const ORIGINAL = "Actividad uno.\nActividad dos.";
const car = (codigo) => String.fromCharCode(codigo);

test("normalizarActividades: saltos de línea unificados, líneas vacías fuera, espacios repetidos y extremos limpios", () => {
  assert.equal(normalizarActividades("  a\r\n\r\n\tb   c  \n"), "a\nb c");
  assert.equal(normalizarActividades(`a${car(0x2028)}b${car(0x85)}c`), "a\nb\nc", "LS y NEL");
  assert.equal(normalizarActividades(`a${car(0xa0)}${car(0xa0)}b`), "a b", "espacios Unicode");
  assert.equal(normalizarActividades(`a${car(0x200b)}b`), "ab", "caracteres invisibles fuera");
  assert.equal(normalizarActividades("cafe" + car(0x301)), "caf" + car(0xe9), "NFC");
  assert.equal(normalizarActividades(null), "");
  assert.equal(normalizarActividades(undefined), "");
});

test("hayCambioReal: iguales o con diferencias solo de formato → false; cualquier cambio de contenido → true", () => {
  assert.equal(hayCambioReal(ORIGINAL, ORIGINAL), false);
  assert.equal(hayCambioReal(ORIGINAL, ORIGINAL.replace("\n", "\r\n")), false);
  assert.equal(hayCambioReal(ORIGINAL, `\n\n${ORIGINAL}\n\n`), false);
  assert.equal(hayCambioReal(ORIGINAL, "Actividad   uno.\nActividad dos."), false);
  assert.equal(hayCambioReal(ORIGINAL, "  Actividad uno.  \n\nActividad dos.  "), false);
  assert.equal(hayCambioReal(ORIGINAL, `${ORIGINAL} Más.`), true);
  assert.equal(hayCambioReal(ORIGINAL, "Actividad dos.\nActividad uno."), true, "otro orden es otro contenido");
  assert.equal(hayCambioReal(ORIGINAL, ""), true);
  assert.equal(hayCambioReal("", ""), false);
});
