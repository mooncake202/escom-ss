// Validaciones propias del módulo LSS — mismo criterio que ah/validators.js:
// no reutiliza backend/src/lib/validators.js (ese archivo es solo para
// datos personales/académicos de GR).

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

/**
 * RN-LSS-03: reportes_validados_siss es la palabra del alumno sobre si sus
 * reportes ya están validados en SISS (true) o si solicita que el profesor
 * los valide (false) — ambos checks del frontend son mutuamente excluyentes
 * y uno de los dos es obligatorio, así que aquí el valor debe llegar como
 * boolean explícito, nunca undefined/null (eso significaría que el alumno
 * no marcó ninguna casilla).
 */
function validarReportesValidadosSiss(valor) {
  if (typeof valor !== 'boolean') {
    throw crearError('Debes confirmar o solicitar la validación de tus reportes en SISS.');
  }
}

module.exports = { crearError, validarReportesValidadosSiss };
