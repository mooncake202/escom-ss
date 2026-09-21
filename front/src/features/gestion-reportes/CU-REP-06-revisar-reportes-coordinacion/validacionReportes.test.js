// Ejecutar: node --test src/features/gestion-reportes/CU-REP-06-revisar-reportes-coordinacion/
import test from "node:test";
import assert from "node:assert/strict";
import { ESTADO_MAP, estadoDe, CRITERIO, filtrarReportes } from "./validacionReportes.js";

// Elementos con la forma real de GET /coordinador/reportes.
const item = (id, alumno, profesor, carrera) => ({
  id, tipoReporte: "mensual", numeroReporte: 1, estadoReporte: "pendiente_revision_coordinador", puedeRevisar: true,
  alumno: { nombreCompleto: alumno, boleta: `20226300${id}`, carrera },
  profesor: profesor ? { nombreCompleto: profesor } : null,
});

const LISTA = [
  item(1, "ANA GARCÍA LÓPEZ", "LUIS TORRES VEGA", "Ingeniería en Inteligencia Artificial"),
  item(2, "LUIS RUIZ MARTÍNEZ", "DRA. ROSA RAMÍREZ GUTIÉRREZ", "Ingeniería en Sistemas Computacionales"),
  item(3, "PEDRO VALDEZ CRUZ", null, null),
];
const ids = (r) => r.map((x) => x.id);

test("estados: los 3 reales que ve Coordinación tienen etiqueta; uno desconocido se muestra tal cual y en neutro", () => {
  assert.deepEqual(Object.keys(ESTADO_MAP).sort(), ["aprobado_coordinador", "pendiente_revision_coordinador", "rechazado_coordinador"]);
  assert.equal(estadoDe("pendiente_revision_coordinador").label, "Pendiente de validación");
  assert.equal(estadoDe("aprobado_coordinador").label, "Validado por coordinación");
  assert.equal(estadoDe("rechazado_coordinador").label, "Rechazado por coordinación");
  const C = { bgInput: "gris", textMuted: "tenue" };
  assert.equal(estadoDe("raro").label, "raro");
  assert.equal(estadoDe("raro").bg(C), "gris");
  assert.equal(estadoDe("pendiente_revision_profesor").label, "pendiente_revision_profesor", "lo que no le llega a Coordinación no se disfraza");
});

test("filtrarReportes: sin búsqueda devuelve todo (la misma lista); no modifica la original", () => {
  assert.equal(filtrarReportes(LISTA, CRITERIO.TODOS, ""), LISTA);
  assert.equal(filtrarReportes(LISTA, CRITERIO.ALUMNO, "   "), LISTA);
  filtrarReportes(LISTA, CRITERIO.ALUMNO, "ana");
  assert.deepEqual(ids(LISTA), [1, 2, 3]);
});

test("filtrarReportes: cada criterio busca solo en su campo, sin distinguir mayúsculas ni acentos", () => {
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.ALUMNO, "garcia")), [1]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.ALUMNO, "MARTINEZ")), [2]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.ALUMNO, "torres")), [], "torres es del profesor, no del alumno");
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.PROFESOR, "torres")), [1]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.PROFESOR, "gutierrez")), [2]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.CARRERA, "inteligencia")), [1]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.CARRERA, "sistemas")), [2]);
});

test("filtrarReportes: 'todos' busca en alumno, profesor y carrera; los reportes sin profesor o carrera no rompen la búsqueda", () => {
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.TODOS, "luis")), [1, 2], "Luis es profesor de uno y alumno del otro");
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.TODOS, "computacionales")), [2]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.TODOS, "valdez")), [3]);
  assert.deepEqual(ids(filtrarReportes(LISTA, CRITERIO.PROFESOR, "x")), []);
  assert.deepEqual(ids(filtrarReportes(LISTA, "otro-criterio", "ana")), [1], "un criterio desconocido busca en todo");
});
