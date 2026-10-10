// CU-PRO-05 — lógica pura del historial de ofertas.
//
// Vive fuera del hook por la misma razón que `consultaOfertas.js` en CU-PRO-03: son reglas que se
// pueden probar con `node --test`, y el hook no, porque usa `useState`. Sin importaciones: `node`
// no resuelve el alias `@/` de Vite.

// Qué validar antes de reenviar una oferta corregida. Un error por campo, con la misma redacción
// que el registro (CU-PRO-01), para que el profesor lea lo mismo en los dos formularios.
//
// La regla de las carreras faltaba: el formulario ya reservaba sitio para ese error, pero nadie lo
// producía, así que el 400 del backend ("Debe seleccionar al menos un perfil de carrera.") caía en
// el recuadro de error general en vez de junto al selector.
export function validarEdicion(form, esIndividual) {
  const e = {};

  if (!form?.nombre?.trim()) e.nombre = "El nombre es obligatorio.";
  if (!form?.descripcion?.trim()) e.descripcion = "La descripción es obligatoria.";
  if (!form?.carreras?.length) e.carreras = "Selecciona al menos una carrera.";

  // Una oferta individual tiene un único lugar fijo: no hay campo de cupos que validar.
  if (!esIndividual) {
    const n = Number.parseInt(form?.cupos, 10);
    if (!form?.cupos || Number.isNaN(n) || n < 2) {
      e.cupos = "Para modalidad proyecto, el mínimo es de 2 cupos.";
    }
  }

  return e;
}

// Si la carga falló, la lista está vacía por el fallo, no porque el profesor no tenga ofertas:
// mostrar "No tienes ofertas registradas aún." junto al banner de error afirmaba algo falso.
export function debeMostrarSinOfertas(totalOfertas, errorCarga) {
  return !errorCarga && totalOfertas === 0;
}
