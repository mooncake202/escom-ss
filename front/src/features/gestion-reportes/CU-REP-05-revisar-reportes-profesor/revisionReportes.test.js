// Ejecutar: node --test src/features/gestion-reportes/CU-REP-05-revisar-reportes-profesor/
import test from "node:test";
import assert from "node:assert/strict";
import {
  ESTADO_MAP, estadoDe, claveReporte, idsDestacados, esDestacado, tipoDeUrl, describirResultado, etiquetaReporte, textoPeriodo, textoFechaEnvio, textoFechaCorta, filtrarPorAlumno, agruparPorAlumno,
} from "./revisionReportes.js";

// Elementos con la forma real de GET /profesor/reportes.
const item = (extra = {}) => ({
  id: 1,
  tipoReporte: "mensual",
  numeroReporte: 1,
  alumno: { nombreCompleto: "ANA GARCÍA LÓPEZ", boleta: "2022630001" },
  periodo: { inicio: "2026-07-16", fin: "2026-08-14", inicioTexto: "16 de julio de 2026", finTexto: "14 de agosto de 2026", esquema: "mediados_de_mes" },
  mesMostrado: { mes: 8, anio: 2026, texto: "Agosto 2026" },
  fechaEnvio: "2026-09-20T21:50:00.000Z",
  estadoReporte: "pendiente_revision_profesor",
  puedeRevisar: true,
  ...extra,
});

test("claveReporte: el tipo forma parte de la clave (un mensual y un global con el mismo id no chocan)", () => {
  assert.equal(claveReporte(item({ id: 5 })), "mensual:5");
  assert.notEqual(claveReporte(item({ id: 5 })), claveReporte(item({ id: 5, tipoReporte: "global" })));
});

test("etiquetaReporte: 'Reporte Mensual No. N' sin mes ni año (aunque el backend mande mesMostrado) o 'Reporte Global'", () => {
  assert.equal(etiquetaReporte(item({ numeroReporte: 2, mesMostrado: { mes: 9, anio: 2026, texto: "Septiembre 2026" } })), "Reporte Mensual No. 2");
  assert.equal(etiquetaReporte(item({ numeroReporte: 3, mesMostrado: null })), "Reporte Mensual No. 3");
  assert.equal(etiquetaReporte(item({ tipoReporte: "global", numeroReporte: null, periodo: null, mesMostrado: null })), "Reporte Global");
});

test("textoPeriodo: rango con las fechas del backend; sin periodo → null", () => {
  assert.equal(textoPeriodo(item()), "16 de julio de 2026 — 14 de agosto de 2026");
  assert.equal(textoPeriodo(item({ periodo: null })), null);
});

test("textoFechaEnvio: fecha y hora de México a partir del instante UTC; sin fecha → guion", () => {
  assert.equal(textoFechaEnvio("2026-09-20T21:50:00.000Z"), "20 de septiembre de 2026, 15:50 h");
  assert.equal(textoFechaEnvio("2026-09-21T02:32:40.000Z"), "20 de septiembre de 2026, 20:32 h");
  assert.equal(textoFechaEnvio(null), "—");
  assert.equal(textoFechaCorta("2026-09-20T21:50:00.000Z"), "20 de septiembre de 2026");
  assert.equal(textoFechaCorta(undefined), "—");
});

test("filtrarPorAlumno: sin distinguir mayúsculas ni acentos; vacío devuelve todo y no modifica la lista", () => {
  const lista = [
    item({ id: 1 }),
    item({ id: 2, alumno: { nombreCompleto: "LUIS RUIZ MARTÍNEZ", boleta: "2022630002" } }),
  ];
  const copia = structuredClone(lista);
  assert.deepEqual(filtrarPorAlumno(lista, "garcia").map((r) => r.id), [1]);
  assert.deepEqual(filtrarPorAlumno(lista, "  martinez ").map((r) => r.id), [2]);
  assert.deepEqual(filtrarPorAlumno(lista, "RUIZ").map((r) => r.id), [2]);
  assert.deepEqual(filtrarPorAlumno(lista, "").map((r) => r.id), [1, 2]);
  assert.deepEqual(filtrarPorAlumno(lista, "zzz"), []);
  assert.deepEqual(lista, copia);
});

test("agruparPorAlumno: agrupa por boleta y conserva el orden; dos alumnos con el mismo nombre no se mezclan", () => {
  const lista = [
    item({ id: 1 }),
    item({ id: 2, alumno: { nombreCompleto: "ANA GARCÍA LÓPEZ", boleta: "2099630009" } }), // homónimo
    item({ id: 3, numeroReporte: 2 }),
  ];
  const grupos = agruparPorAlumno(lista);
  assert.deepEqual(grupos.map((g) => [g.boleta, g.alumno, g.reportes.map((r) => r.id)]), [
    ["2022630001", "ANA GARCÍA LÓPEZ", [1, 3]],
    ["2099630009", "ANA GARCÍA LÓPEZ", [2]],
  ]);
  assert.deepEqual(agruparPorAlumno([]), []);
});

test("estados: los 5 reales de estado_reporte tienen etiqueta; uno desconocido se muestra tal cual y en neutro", () => {
  const C = { warningSoft: "ws", warning: "w", accentSoft: "as", accentText: "at", successSoft: "ss", success: "s", danger: "d", bgInput: "bi", textMuted: "tm" };
  assert.deepEqual(Object.keys(ESTADO_MAP).sort(), [
    "aprobado_coordinador", "pendiente_revision_coordinador", "pendiente_revision_profesor", "rechazado_coordinador", "rechazado_profesor",
  ]);
  assert.equal(estadoDe("pendiente_revision_profesor").label, "Pendiente de revisión");
  assert.equal(estadoDe("pendiente_revision_profesor").color(C), "w");
  assert.equal(estadoDe("rechazado_profesor").label, "Rechazado");
  assert.equal(estadoDe("rechazado_profesor").color(C), "d");
  assert.equal(estadoDe("pendiente_revision_coordinador").label, "En revisión de coordinación");
  assert.equal(estadoDe("rechazado_coordinador").label, "Rechazado por coordinación");
  assert.equal(estadoDe("aprobado_coordinador").color(C), "s");

  // Los estados del mock anterior ya no existen; un desconocido nunca se pinta como "pendiente".
  for (const desconocido of ["pendiente_revision", "aprobado", "algo_nuevo"]) {
    const s = estadoDe(desconocido);
    assert.equal(s.label, desconocido);
    assert.equal(s.color(C), "tm");
    assert.equal(s.bg(C), "bi");
  }
});

test("idsDestacados: uno o varios ids separados por coma; lo que no es un id se ignora", () => {
  assert.deepEqual([...idsDestacados("5")], [5]);
  assert.deepEqual([...idsDestacados("5, 7,9")], [5, 7, 9]);
  assert.deepEqual([...idsDestacados(null)], []);
  assert.deepEqual([...idsDestacados("")], []);
  assert.deepEqual([...idsDestacados("abc,-1,2.5,8")], [8]);
});

test("esDestacado: solo reportes mensuales con ese id (un global con el mismo id no se resalta)", () => {
  const ids = idsDestacados("5");
  assert.equal(esDestacado(item({ id: 5 }), ids), true);
  assert.equal(esDestacado(item({ id: 6 }), ids), false);
  assert.equal(esDestacado(item({ id: 5, tipoReporte: "global" }), ids), false);
});

test("describirResultado: alumno y periodo del reporte; sin periodo usa la etiqueta del reporte", () => {
  assert.deepEqual(describirResultado(item(), "aprobado"), { tipo: "aprobado", alumno: "ANA GARCÍA LÓPEZ", periodo: "16 de julio de 2026 — 14 de agosto de 2026" });
  assert.deepEqual(describirResultado(item({ periodo: null }), "rechazado"), { tipo: "rechazado", alumno: "ANA GARCÍA LÓPEZ", periodo: "Reporte Mensual No. 1" });
});

test("tipoDeUrl y esDestacado con tipo: ?tipo=global resalta el global; sin tipo, el mensual; nunca el del otro tipo con el mismo id", () => {
  assert.equal(tipoDeUrl("global"), "global");
  for (const otro of [null, undefined, "", "mensual", "GLOBAL", "otro"]) assert.equal(tipoDeUrl(otro), "mensual");
  const ids = idsDestacados("5");
  const global = item({ id: 5, tipoReporte: "global", numeroReporte: null });
  assert.equal(esDestacado(global, ids, "global"), true);
  assert.equal(esDestacado(global, ids), false, "sin tipo se busca un mensual");
  assert.equal(esDestacado(item({ id: 5 }), ids, "global"), false);
  assert.equal(esDestacado(item({ id: 5 }), ids, tipoDeUrl(null)), true);
});

test("etiquetaReporte y claveReporte del global: 'Reporte Global' sin número y con clave propia", () => {
  const global = item({ id: 5, tipoReporte: "global", numeroReporte: null, mesMostrado: null });
  assert.equal(etiquetaReporte(global), "Reporte Global");
  assert.equal(claveReporte(global), "global:5");
  assert.deepEqual(describirResultado(item({ id: 5, tipoReporte: "global", numeroReporte: null, periodo: null }), "aprobado"), { tipo: "aprobado", alumno: "ANA GARCÍA LÓPEZ", periodo: "Reporte Global" });
});
