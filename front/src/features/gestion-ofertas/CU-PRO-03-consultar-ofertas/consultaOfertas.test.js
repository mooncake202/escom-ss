// CU-PRO-03 — lógica pura de la consulta de ofertas.
//
// Ejecutar: node --test src/features/gestion-ofertas/CU-PRO-03-consultar-ofertas/
//
// Cubre lo que antes no tenía nada:
//   · `adaptarOferta` descartaba `fechaRegistro`, así que la pantalla nunca la mostraba aunque el
//     backend la entregara y el componente la pintara;
//   · el detalle abierto quedaba apuntando a un objeto de la lista anterior tras cada recarga.

import test from "node:test";
import assert from "node:assert/strict";
import { adaptarOferta, resolverSeleccion, terminoBuscado, hayFiltrosActivos } from "./consultaOfertas.js";

// Forma real de un elemento de GET /ofertas/consultar.
const delBackend = (extra = {}) => ({
  id: 23,
  titulo: "Prueba de IIA e ISC",
  nombreSISS: null,
  programaSISS: null,
  profesor: "SEEDREP01 PROFESOR UNO",
  modalidad: "proyecto",
  estado: "pendiente_revision",
  descripcion: "Desarrollo y pruebas.",
  actividades: "Desarrollo y pruebas.",
  cuposRegistrados: 2,
  cuposDisponibles: 2,
  cuposOcupadosProfesor: 1,
  cuposTotalesProfesor: 3,
  perfilCarrera: ["ISC", "IA"],
  motivoRechazo: null,
  fechaRegistro: "2026-09-27",
  ...extra,
});

// ── adaptarOferta ──────────────────────────────────────────────────────────

test("adaptarOferta: conserva fechaRegistro (antes la descartaba)", () => {
  assert.equal(adaptarOferta(delBackend()).fechaRegistro, "2026-09-27");
});

test("adaptarOferta: traduce los tres estados y deja pasar cualquier otro", () => {
  assert.equal(adaptarOferta(delBackend({ estado: "pendiente_revision" })).estado, "pendiente");
  assert.equal(adaptarOferta(delBackend({ estado: "aprobada" })).estado, "aprobado");
  assert.equal(adaptarOferta(delBackend({ estado: "rechazada" })).estado, "rechazado");
  assert.equal(adaptarOferta(delBackend({ estado: "cerrada" })).estado, "cerrada");
});

test("adaptarOferta: conserva el resto de los campos que la pantalla usa", () => {
  const a = adaptarOferta(delBackend());
  assert.equal(a.id, 23);
  assert.equal(a.nombre, "Prueba de IIA e ISC");
  assert.equal(a.modalidad, "proyecto");
  assert.equal(a.cuposRegistrados, 2);
  assert.equal(a.cuposDisponibles, 2);
  assert.equal(a.cuposOcupadosProfesor, 1);
  assert.equal(a.cuposTotalesProfesor, 3);
  assert.deepEqual(a.perfilDeseado, ["ISC", "IA"]);
  assert.deepEqual(a.actividades, ["Desarrollo y pruebas."]);
});

test("adaptarOferta: una oferta sin carreras ni SISS no inventa valores", () => {
  const a = adaptarOferta(delBackend({ perfilCarrera: [], nombreSISS: null, programaSISS: null, actividades: null }));
  assert.deepEqual(a.perfilDeseado, []);
  assert.equal(a.tituloSISS, null);
  assert.equal(a.programaSISS, null);
  assert.deepEqual(a.actividades, [], "sin actividades el arreglo queda vacío, no [null]");
});

// ── resolverSeleccion ──────────────────────────────────────────────────────
// Es lo que mantiene el detalle sincronizado tras una recarga silenciosa por socket.

const enLista = (id, extra = {}) => ({ id, nombre: "X", estado: "pendiente", ...extra });

test("resolverSeleccion: si la oferta sigue en la lista, devuelve la versión FRESCA", () => {
  const previo = enLista(1, { estado: "pendiente", nombre: "viejo" });
  const lista = [enLista(1, { estado: "aprobado", nombre: "nuevo" }), enLista(2)];

  const resuelto = resolverSeleccion(lista, previo);

  assert.equal(resuelto.id, 1);
  assert.equal(resuelto.estado, "aprobado", "toma el estado nuevo, no el que tenía abierto");
  assert.equal(resuelto.nombre, "nuevo");
  assert.notEqual(resuelto, previo, "no conserva la instancia anterior");
  assert.equal(resuelto, lista[0], "es exactamente el objeto de la lista nueva");
});

test("resolverSeleccion: si la oferta ya no está, cierra el detalle", () => {
  assert.equal(resolverSeleccion([enLista(2), enLista(3)], enLista(1)), null);
  assert.equal(resolverSeleccion([], enLista(1)), null);
});

test("resolverSeleccion: sin detalle abierto no abre ninguno", () => {
  assert.equal(resolverSeleccion([enLista(1)], null), null);
  assert.equal(resolverSeleccion([enLista(1)], undefined), null);
});

// ── terminoBuscado ─────────────────────────────────────────────────────────
// Único punto de recorte: alimenta tanto lo que se envía al backend como `hayFiltrosActivos`.

test("terminoBuscado: recorta los extremos y conserva el espacio interior", () => {
  assert.equal(terminoBuscado("  integracion  "), "integracion");
  assert.equal(terminoBuscado(" integracion"), "integracion");
  assert.equal(terminoBuscado("integracion "), "integracion");
  assert.equal(terminoBuscado("\t integracion \n"), "integracion");
  assert.equal(terminoBuscado("Prueba de integración"), "Prueba de integración");
  assert.equal(terminoBuscado("  Prueba  de  "), "Prueba  de", "los dobles de dentro se quedan");
});

test("terminoBuscado: solo espacios queda en cadena vacía (= sin búsqueda)", () => {
  for (const vacio of ["", "   ", "\t", "\n", "  \t\n  "]) {
    assert.equal(terminoBuscado(vacio), "", JSON.stringify(vacio));
  }
});

test("terminoBuscado: un valor no string da cadena vacía, no revienta", () => {
  for (const valor of [undefined, null, 123, {}, [], true]) {
    assert.equal(terminoBuscado(valor), "", JSON.stringify(valor));
  }
});

// ── hayFiltrosActivos ──────────────────────────────────────────────────────

test("hayFiltrosActivos: con término recortado o con modalidad distinta de todos", () => {
  assert.equal(hayFiltrosActivos("integracion", "todos"), true);
  assert.equal(hayFiltrosActivos("", "proyecto"), true);
  assert.equal(hayFiltrosActivos("integracion", "individual"), true);
});

test("hayFiltrosActivos: sin término y con modalidad todos, NO hay filtros", () => {
  assert.equal(hayFiltrosActivos("", "todos"), false);
});

// Esta es la regla que arregla el mensaje: "   " no debe contar como filtro activo.
test("hayFiltrosActivos: un texto de solo espacios no cuenta como filtro", () => {
  assert.equal(hayFiltrosActivos(terminoBuscado("   "), "todos"), false, "ni (filtros activos) ni mensaje de búsqueda");
  assert.equal(hayFiltrosActivos(terminoBuscado("  x  "), "todos"), true);
});
