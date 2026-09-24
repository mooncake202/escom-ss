// Lo único que comparten los tres CU del módulo (ADM-01, ADM-03 y ADM-17): el estado canónico de
// asignación, la forma de los errores y el armado del nombre.
//
// A propósito NO hay aquí una "vista de alumno" común: cada CU expone campos distintos (ADM-03
// nunca muestra el celular de un tercero, ADM-17 sí lo muestra a quien supervisa) y unificarlos en
// una sola función terminaría filtrando datos de un CU en otro.

// Único estado que significa "asignado". No se filtra por periodo ni por fecha: es el mismo
// criterio canónico que usan AH, GR y el módulo de bajas.
const ESTADO_ASIGNADO = 'alumno_asignado';

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

const nombreCompleto = (usuario) => `${usuario.nombre} ${usuario.apellidos}`.trim();

module.exports = { ESTADO_ASIGNADO, crearError, nombreCompleto };
