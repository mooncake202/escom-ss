// Ejecutar: node --test src/features/gestion-administrativa/CU-ADM-08-calendario/hooks/
import test from "node:test";
import assert from "node:assert/strict";
import {
  ciclosDesdeHoy, rangoSemestre, limitesNavegacion, moverMes, acotarMes, mesInicial, ventanaInicioPeriodo,
} from "./calendarioNavegacion.js";

const HOY = "2026-09-20"; // contexto.hoy del backend
const mes = (r) => (r ? `${r.mes + 1}/${r.anio}` : null);
const sinFiltro = (hoy = HOY) => limitesNavegacion({ hayFiltroActivo: false, eventosFiltrados: [], hoy });
const inhabil = (fecha) => ({ tipo: "Día inhábil", fecha });
const conFiltro = (eventosFiltrados, extra = {}) =>
  limitesNavegacion({ hayFiltroActivo: true, eventosFiltrados, hoy: HOY, ...extra });

// Avanza `pasos` veces en una dirección y devuelve el último mes alcanzado.
function caminar(desde, delta, limites, pasos = 200) {
  let actual = desde;
  for (let i = 0; i < pasos; i++) {
    const siguiente = moverMes(actual.anio, actual.mes, delta, limites);
    if (!siguiente) break;
    actual = siguiente;
  }
  return actual;
}

test("ventana global con contexto.hoy=2026: hacia atrás se detiene en enero 2026", () => {
  const lim = sinFiltro();
  assert.equal(mes(caminar({ anio: 2026, mes: 8 }, -1, lim)), "1/2026");
  assert.equal(moverMes(2026, 0, -1, lim), null);
});

test("ventana global con contexto.hoy=2026: hacia adelante se detiene en diciembre 2028", () => {
  const lim = sinFiltro();
  assert.equal(mes(caminar({ anio: 2026, mes: 8 }, 1, lim)), "12/2028");
  assert.equal(moverMes(2028, 11, 1, lim), null);
});

test("la ventana global cruza diciembre → enero y enero → diciembre dentro de sus años", () => {
  const lim = sinFiltro();
  assert.equal(mes(moverMes(2026, 11, 1, lim)), "1/2027");
  assert.equal(mes(moverMes(2027, 0, -1, lim)), "12/2026");
  assert.equal(mes(moverMes(2028, 0, -1, lim)), "12/2027");
});

test("la ventana sigue a contexto.hoy (no al reloj del navegador)", () => {
  const lim = sinFiltro("2031-03-05");
  assert.equal(mes(caminar({ anio: 2031, mes: 2 }, -1, lim)), "1/2031");
  assert.equal(mes(caminar({ anio: 2031, mes: 2 }, 1, lim)), "12/2033");
});

test("los años de la ventana son los mismos tres ciclos ofrecidos", () => {
  assert.deepEqual(ciclosDesdeHoy(HOY), [2026, 2027, 2028]);
  const lim = sinFiltro();
  assert.deepEqual([lim.anioMin, lim.mesMin, lim.anioMax, lim.mesMax], [2026, 0, 2028, 11]);
});

test("selector de año: un año fuera de la ventana se acota (2024 → enero 2026, 2030 → diciembre 2028)", () => {
  const lim = sinFiltro();
  assert.equal(mes(acotarMes(2024, 6, lim)), "1/2026");
  assert.equal(mes(acotarMes(2030, 6, lim)), "12/2028");
  assert.equal(mes(acotarMes(2027, 6, lim)), "7/2027");
});

test("si el mes visible ya está fuera de la ventana, la flecha lo acerca sin salir de ella", () => {
  const lim = sinFiltro();
  assert.equal(mes(moverMes(2024, 6, 1, lim)), "1/2026"); // julio 2024 (bug observado) → enero 2026
  assert.equal(mes(moverMes(2030, 2, -1, lim)), "12/2028");
});

test("solo filtro por tipo sin resultados: sigue acotado a la ventana global (ya no es ilimitado)", () => {
  const lim = conFiltro([]);
  assert.deepEqual([lim.anioMin, lim.mesMin, lim.anioMax, lim.mesMax], [2026, 0, 2028, 11]);
});

test("filtro con resultados en sep–oct 2026: la navegación se detiene en septiembre y octubre", () => {
  const lim = conFiltro([inhabil("2026-09-25"), inhabil("2026-10-12")]);
  assert.equal(mes(caminar({ anio: 2026, mes: 9 }, -1, lim)), "9/2026");
  assert.equal(mes(caminar({ anio: 2026, mes: 8 }, 1, lim)), "10/2026");
  assert.equal(moverMes(2026, 8, -1, lim), null); // no llega a agosto
  assert.equal(moverMes(2026, 9, 1, lim), null);  // no llega a noviembre
});

test("filtro con eventos en sep y dic: recorre sep → oct → nov → dic sin saltar meses vacíos", () => {
  const lim = conFiltro([inhabil("2026-09-25"), inhabil("2026-12-25")]);
  const ruta = [{ anio: 2026, mes: 8 }];
  for (let i = 0; i < 6; i++) { const s = moverMes(ruta.at(-1).anio, ruta.at(-1).mes, 1, lim); if (!s) break; ruta.push(s); }
  assert.deepEqual(ruta.map(mes), ["9/2026", "10/2026", "11/2026", "12/2026"]);
});

test("el límite más restrictivo manda: resultados que rebasan la ventana se recortan a ella", () => {
  // Ciclo 2026/01 arranca en agosto 2025, fuera de la ventana: el rango navegable empieza en enero 2026.
  const lim = conFiltro([inhabil("2025-09-10"), inhabil("2026-03-02")]);
  assert.deepEqual([lim.anioMin, lim.mesMin, lim.anioMax, lim.mesMax], [2026, 0, 2026, 2]);
  assert.equal(mes(caminar({ anio: 2026, mes: 1 }, -1, lim)), "1/2026");
  assert.equal(mes(caminar({ anio: 2026, mes: 1 }, 1, lim)), "3/2026");
});

test("resultados totalmente fuera de la ventana: un solo mes (el borde más cercano)", () => {
  const antes = conFiltro([inhabil("2025-09-10")]);
  assert.deepEqual([antes.anioMin, antes.mesMin, antes.anioMax, antes.mesMax], [2026, 0, 2026, 0]);
  const despues = conFiltro([inhabil("2029-05-07")]);
  assert.deepEqual([despues.anioMin, despues.mesMin, despues.anioMax, despues.mesMax], [2028, 11, 2028, 11]);
});

test("sin resultados con ciclo/semestre: un solo mes (el actual si pertenece al ciclo, si no el primero)", () => {
  const dentro = conFiltro([], { ciclo: "2027", periodo: "01" });   // ago 2026 – ene 2027 contiene sep 2026
  assert.deepEqual([dentro.anioMin, dentro.mesMin, dentro.anioMax, dentro.mesMax], [2026, 8, 2026, 8]);
  const fuera = conFiltro([], { ciclo: "2027", periodo: "02" });    // ene – jul 2027
  assert.deepEqual([fuera.anioMin, fuera.mesMin, fuera.anioMax, fuera.mesMax], [2027, 0, 2027, 0]);
  assert.equal(moverMes(2026, 8, 1, dentro), null);
  assert.equal(moverMes(2026, 8, -1, dentro), null);
});

test("sin contexto.hoy (datos aún no cargados) no se impone la ventana global", () => {
  assert.equal(sinFiltro("").mesMin, null);
});

test("mesInicial: el mes actual si está en el rango navegable, si no el primero", () => {
  const lim = conFiltro([inhabil("2026-09-25"), inhabil("2026-12-25")]);
  assert.equal(mes(mesInicial(lim, "2026-11-10")), "11/2026");
  assert.equal(mes(mesInicial(lim, HOY)), "9/2026");
  assert.equal(mes(mesInicial(lim, "2028-01-01")), "9/2026");
});

test("definición de ciclos conservada: 01/Y = ago Y-1 → ene Y; 02/Y = ene Y → jul Y", () => {
  assert.deepEqual([rangoSemestre(2027, "01").desde, rangoSemestre(2027, "01").hasta], ["2026-08-01", "2027-01-31"]);
  assert.deepEqual([rangoSemestre(2027, "02").desde, rangoSemestre(2027, "02").hasta], ["2027-01-01", "2027-07-31"]);
  const v = ventanaInicioPeriodo({ anio: "2027", semestre: "01", minFechaFutura: "2026-09-21" });
  assert.deepEqual(v, { minDate: "2026-09-21", maxDate: "2027-01-31", vistaInicial: "2026-09-21" });
});
