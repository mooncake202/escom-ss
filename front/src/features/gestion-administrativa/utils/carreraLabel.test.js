// Separación lógica / presentación de la carrera en Administrativa:
//   · código LÓGICO (lo que hay en `alumno.carrera`):  IA
//   · sigla de PRESENTACIÓN (lo que ve el usuario):    IIA
//
// Ejecutar: node --test src/features/gestion-administrativa/utils/

import test from "node:test";
import assert from "node:assert/strict";
import { etiquetaCarrera, siglaCarrera } from "./carreraLabel.js";

test("siglaCarrera: el lógico IA se MUESTRA como IIA", () => {
  assert.equal(siglaCarrera("IA"), "IIA");
});

test("siglaCarrera: IIA se tolera como entrada legado y también se muestra como IIA", () => {
  assert.equal(siglaCarrera("IIA"), "IIA");
  assert.equal(siglaCarrera("IIA"), siglaCarrera("IA"));
});

test("siglaCarrera: los demás códigos se muestran tal cual", () => {
  assert.equal(siglaCarrera("ISC"), "ISC");
  assert.equal(siglaCarrera("LCD"), "LCD");
});

test("etiquetaCarrera: IA e IIA dan el mismo nombre largo, en el estilo corto de ADM", () => {
  assert.equal(etiquetaCarrera("IA"), "Ing. Inteligencia Artificial");
  assert.equal(etiquetaCarrera("IIA"), "Ing. Inteligencia Artificial");
  assert.equal(etiquetaCarrera("ISC"), "Ing. Sistemas Computacionales");
  assert.equal(etiquetaCarrera("LCD"), "Lic. Ciencia de Datos");
});

// Fallback de 3 niveles de CU-ADM-17: etiqueta → código crudo → "—". Nunca se inventa un nombre.
test("ambas: un código desconocido se devuelve tal cual, y null/undefined dan guion", () => {
  for (const desconocido of ["XYZ", "ia", "IIAA", "", "__proto__", "constructor"]) {
    assert.equal(etiquetaCarrera(desconocido), desconocido, `etiqueta ${desconocido}`);
    assert.equal(siglaCarrera(desconocido), desconocido, `sigla ${desconocido}`);
  }
  for (const vacio of [null, undefined]) {
    assert.equal(etiquetaCarrera(vacio), "—");
    assert.equal(siglaCarrera(vacio), "—");
  }
});
