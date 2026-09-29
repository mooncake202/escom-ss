const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' -]{2,50}$/;
const TELEFONO_REGEX = /^\d{10}$/;
const CORREO_IPN_REGEX = /^[^\s@]+@ipn\.mx$/i;
// Correo personal (CU-ADM-04): cualquier dominio, no institucional. Solo forma básica.
const CORREO_PERSONAL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CORREO_PERSONAL_MAX_LEN = 50; // alumno.correo_personal es VarChar(50)

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

// ── NUEVO (CU-GR-01) ──────────────────────────────────────────────────────
// Función SEPARADA de validarCorreoInstitucional a propósito: los alumnos
// usan @alumno.ipn.mx, no @ipn.mx (ese dominio es exclusivo de profesor y
// coordinador en CU-CRED-03). No se toca la función existente para no
// arriesgar ese flujo ya probado.
//
// Antes solo exigía el dominio (cualquier parte local). Corregido: el correo
// institucional real de un alumno del IPN es LETRAS seguidas de EXACTAMENTE
// 4 DÍGITOS — mismo patrón ya exigido en el login/recuperación de contraseña
// (LoginPage.jsx/RecuperarContrasena.jsx) y en el formulario de registro
// (CU-GR-01, validations.js). Backend y frontend deben exigir lo mismo.
const CORREO_ALUMNO_IPN_REGEX = /^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/i;

function validarCorreoInstitucionalAlumno(correo) {
  if (!correo || !CORREO_ALUMNO_IPN_REGEX.test(correo.trim())) {
    const error = new Error('El correo institucional debe tener el formato de alumno del IPN: letras seguidas de 4 dígitos y @alumno.ipn.mx (ej. juapere1234@alumno.ipn.mx).');
    error.status = 400;
    throw error;
  }
  if (correo.trim().length > 35) {
    const error = new Error('El correo institucional no puede superar 35 caracteres.');
    error.status = 400;
    throw error;
  }
}

// Formato de boleta ESCOM: año de ingreso (19|20 + 2 dígitos) + 63 (carrera) + 4 dígitos.
const BOLETA_REGEX = /^(19|20)\d{2}63\d{4}$/;

function validarBoleta(boleta) {
  if (!boleta || !BOLETA_REGEX.test(boleta)) {
    const error = new Error('La boleta no tiene un formato válido para ESCOM.');
    error.status = 400;
    throw error;
  }
}

/**
 * CU-ADM-04 — correo personal del alumno. A diferencia de validarCorreoInstitucional, aquí el
 * dominio es libre (gmail, outlook…): es el correo alterno del alumno, no el del IPN.
 * El límite de 50 caracteres es el de la columna, no una regla de negocio.
 */
function validarCorreoPersonal(correo, { requerido = false } = {}) {
  const valor = typeof correo === 'string' ? correo.trim() : '';

  if (valor === '') {
    if (requerido) {
      const error = new Error('El correo personal es obligatorio.');
      error.status = 400;
      throw error;
    }
    return;
  }

  if (!CORREO_PERSONAL_REGEX.test(valor)) {
    const error = new Error('El correo personal no tiene un formato válido.');
    error.status = 400;
    throw error;
  }
  if (valor.length > CORREO_PERSONAL_MAX_LEN) {
    const error = new Error(`El correo personal no puede superar ${CORREO_PERSONAL_MAX_LEN} caracteres.`);
    error.status = 400;
    throw error;
  }
}

module.exports = {
  validarNombreOApellidos,
  validarCorreoPersonal,
  validarCorreoInstitucional,
  validarTelefono,
  validarDepartamento,
  validarContrasena,
  validarCorreoInstitucionalAlumno,
  validarBoleta,
  DEPARTAMENTOS_VALIDOS,
};