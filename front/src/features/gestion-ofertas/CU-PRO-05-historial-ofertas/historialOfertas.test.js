// CU-PRO-05 — lógica pura del historial de ofertas.
//
// Ejecutar: node --test src/features/gestion-ofertas/CU-PRO-05-historial-ofertas/
//
// Cubre los dos huecos que tenía la pantalla:
//   · `validarEdicion` no exigía ninguna carrera, así que el formulario se enviaba vacío de perfil
//     y el 400 del backend caía en el recuadro de error GENERAL, lejos del selector;
//   · si la carga fallaba, la lista quedaba vacía y la pantalla afirmaba "No tienes ofertas
//     registradas aún." justo debajo del banner de error.

import test from "node:test";
import assert from "node:assert/strict";
import { validarEdicion, debeMostrarSinOfertas } from "./historialOfertas.js";

// Forma real de `formEdicion`, tal como la arma `iniciarEdicion` desde una oferta de /ofertas/mias.
const form = (extra = {}) => ({
  nombre: "Sistema de seguimiento",
  descripcion: "Desarrollo y pruebas del módulo.",
  carreras: ["ISC"],
  cupos: "3",
  ...extra,
});

// ── validarEdicion: carreras ───────────────────────────────────────────────

test("validarEdicion: sin carreras da error POR CAMPO (antes no daba ninguno)", () => {
  for (const vacio of [[], undefined, null]) {
    const e = validarEdicion(form({ carreras: vacio }), false);
    assert.equal(e.carreras, "Selecciona al menos una carrera.", JSON.stringify(vacio));
  }
});

test("validarEdicion: con al menos una carrera no hay error de carreras", () => {
  assert.equal(validarEdicion(form({ carreras: ["ISC"] }), false).carreras, undefined);
  assert.equal(validarEdicion(form({ carreras: ["ISC", "IA"] }), false).carreras, undefined);
});

// El mensaje es el mismo que usa el registro (CU-PRO-01): el profesor lee lo mismo en los dos sitios.
test("validarEdicion: el mensaje de carreras coincide con el del registro", () => {
  assert.equal(validarEdicion(form({ carreras: [] }), false).carreras, "Selecciona al menos una carrera.");
});

test("validarEdicion: la regla de carreras también aplica a una oferta individual", () => {
  const e = validarEdicion(form({ carreras: [], cupos: "" }), true);
  assert.equal(e.carreras, "Selecciona al menos una carrera.");
  assert.equal(e.cupos, undefined, "una individual no tiene campo de cupos que validar");
});

// ── validarEdicion: lo que ya validaba y no debe cambiar ───────────────────

test("validarEdicion: nombre y descripción vacíos o solo espacios", () => {
  for (const vacio of ["", "   ", "\t\n", undefined]) {
    assert.equal(validarEdicion(form({ nombre: vacio }), false).nombre, "El nombre es obligatorio.");
    assert.equal(validarEdicion(form({ descripcion: vacio }), false).descripcion, "La descripción es obligatoria.");
  }
});

test("validarEdicion: cupos de proyecto por debajo del mínimo", () => {
  for (const malo of ["", "0", "1", "abc", undefined]) {
    assert.equal(
      validarEdicion(form({ cupos: malo }), false).cupos,
      "Para modalidad proyecto, el mínimo es de 2 cupos.",
      JSON.stringify(malo),
    );
  }
});

test("validarEdicion: cupos de proyecto válidos no dan error", () => {
  for (const bueno of ["2", "3", "6"]) {
    assert.equal(validarEdicion(form({ cupos: bueno }), false).cupos, undefined, bueno);
  }
});

test("validarEdicion: un formulario completo no da ningún error", () => {
  assert.deepEqual(validarEdicion(form(), false), {});
  assert.deepEqual(validarEdicion(form({ cupos: "" }), true), {});
});

test("validarEdicion: acumula todos los errores a la vez, no solo el primero", () => {
  const e = validarEdicion({ nombre: " ", descripcion: "", carreras: [], cupos: "1" }, false);
  assert.deepEqual(Object.keys(e).sort(), ["carreras", "cupos", "descripcion", "nombre"]);
});

test("validarEdicion: un formulario ausente no revienta", () => {
  for (const nada of [undefined, null, {}]) {
    const e = validarEdicion(nada, false);
    assert.equal(e.nombre, "El nombre es obligatorio.");
    assert.equal(e.carreras, "Selecciona al menos una carrera.");
  }
});

// ── debeMostrarSinOfertas ──────────────────────────────────────────────────

test("debeMostrarSinOfertas: sin ofertas y sin error, sí se muestra", () => {
  assert.equal(debeMostrarSinOfertas(0, null), true);
  assert.equal(debeMostrarSinOfertas(0, undefined), true);
  assert.equal(debeMostrarSinOfertas(0, ""), true, "una cadena vacía no es un error");
});

// La regla que arregla el mensaje falso: si la carga falló, la lista está vacía POR EL FALLO.
test("debeMostrarSinOfertas: con error de carga NO se muestra el estado vacío", () => {
  for (const error of [
    "El servicio no está disponible temporalmente. Intenta de nuevo más tarde.",
    "No se pudieron cargar tus ofertas.",
    "No se pudo cerrar la oferta.",
  ]) {
    assert.equal(debeMostrarSinOfertas(0, error), false, error);
  }
});

test("debeMostrarSinOfertas: con ofertas nunca se muestra, haya error o no", () => {
  assert.equal(debeMostrarSinOfertas(3, null), false);
  assert.equal(debeMostrarSinOfertas(3, "fallo al cerrar"), false);
});
