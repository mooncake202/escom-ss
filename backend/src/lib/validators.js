const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' -]{2,50}$/;
const TELEFONO_REGEX = /^\d{10}$/;
const CORREO_IPN_REGEX = /^[^\s@]+@ipn\.mx$/i;

const DEPARTAMENTOS_VALIDOS = [
  'Sistemas Computacionales',
  'Inteligencia Artificial',
  'Ciencias Básicas',
  'Posgrado e Investigación',
  'Servicios Escolares',
];

function validarNombreOApellidos(valor, etiquetaCampo) {
  if (!valor || !NOMBRE_REGEX.test(valor.trim())) {
    const error = new Error(`${etiquetaCampo} solo debe contener letras y espacios (2 a 50 caracteres).`);
    error.status = 400;
    throw error;
  }
}

function validarCorreoInstitucional(correo) {
  if (!correo || !CORREO_IPN_REGEX.test(correo.trim())) {
    const error = new Error('El correo institucional debe tener un formato válido y terminar en @ipn.mx.');
    error.status = 400;
    throw error;
  }
  if (correo.trim().length > 35) {
    const error = new Error('El correo institucional no puede superar 35 caracteres.');
    error.status = 400;
    throw error;
  }
}

/**
 * @param {string} telefono
 * @param {object} opciones
 * @param {boolean} opciones.requerido - si true, un valor vacío también es error.
 */
function validarTelefono(telefono, { requerido = false } = {}) {
  if (!telefono) {
    if (requerido) {
      const error = new Error('El teléfono personal es obligatorio.');
      error.status = 400;
      throw error;
    }
    return;
  }
  if (!TELEFONO_REGEX.test(telefono)) {
    const error = new Error('El teléfono personal debe tener exactamente 10 dígitos numéricos.');
    error.status = 400;
    throw error;
  }
}

function validarDepartamento(departamento) {
  if (!departamento || !DEPARTAMENTOS_VALIDOS.includes(departamento)) {
    const error = new Error('Selecciona un departamento válido.');
    error.status = 400;
    throw error;
  }
}

// RN-CRED-04: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
const CONTRASENA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validarContrasena(contrasena) {
  if (!contrasena || !CONTRASENA_REGEX.test(contrasena)) {
    const error = new Error(
      'La contraseña debe tener mínimo 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.'
    );
    error.status = 400;
    throw error;
  }
}

module.exports = {
  validarNombreOApellidos,
  validarCorreoInstitucional,
  validarTelefono,
  validarDepartamento,
  validarContrasena,
  DEPARTAMENTOS_VALIDOS,
};