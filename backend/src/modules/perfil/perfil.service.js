// CU-ADM-04 (el alumno consulta y actualiza sus datos) y CU-ADM-10 (lo mismo para el profesor).
//
// REGLA COMÚN: cada rol edita SOLO sus datos de contacto. Todo lo institucional es de solo lectura
// aquí — nombre, apellidos y correo institucional los cambia el coordinador desde
// usuarios.service.js; boleta, carrera, créditos y semestre nacen en el registro de GR y nadie los
// edita; cubículo y departamento también son del coordinador.
//
// La lista de campos escribibles NO sale del cuerpo de la petición: se construye explícitamente con
// los dos campos permitidos de cada rol. Mandar `boleta` o `departamento` en el JSON no tiene
// ningún efecto, porque esos nombres nunca llegan al `data` del update.
//
// `usuarioId` viene SIEMPRE del token (req.usuario.sub), nunca del body ni de la URL: así un
// usuario no puede leer ni editar el perfil de otro.

const prisma = require('../../lib/prisma');
const { validarTelefono, validarCorreoPersonal } = require('../../lib/validators');

const HORARIO_MAX_LEN = 100; // profesor.horario_atencion es VarChar(100)

function crearError(mensaje, status = 400) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

const limpiar = (texto) => (typeof texto === 'string' ? texto.trim() : '');
const nombreCompleto = (usuario) => `${usuario.nombre} ${usuario.apellidos}`.trim();

// ── CU-ADM-10 · Profesor ────────────────────────────────────────────────────

async function buscarProfesor(usuarioId) {
  const profesor = await prisma.profesor.findUnique({
    where: { usuario_id: usuarioId },
    include: { usuario: true },
  });
  if (!profesor) {
    throw crearError('No se encontró un perfil de profesor asociado a esta cuenta.', 404);
  }
  return profesor;
}

/**
 * Vista del profesor. `institucionales` es lo que la pantalla muestra bloqueado y `editables` lo
 * único que admite el PUT: la separación viaja en la respuesta para que el front no tenga que
 * adivinarla ni mantener su propia lista.
 */
function vistaProfesor(profesor) {
  return {
    institucionales: {
      nombre: profesor.usuario.nombre,
      apellidos: profesor.usuario.apellidos,
      nombreCompleto: nombreCompleto(profesor.usuario),
      correoInstitucional: profesor.usuario.correo_institucional,
      cubiculo: profesor.cubiculo,
      departamento: profesor.departamento,
    },
    editables: {
      horarioAtencion: profesor.horario_atencion,
      telefonoPersonal: profesor.telefono_personal,
    },
  };
}

async function obtenerPerfilProfesor(usuarioId) {
  return vistaProfesor(await buscarProfesor(usuarioId));
}

/**
 * El profesor NUNCA puede modificar: nombre, apellidos, correo_institucional, cubículo ni
 * departamento — esos son datos institucionales que solo el coordinador puede editar
 * (ver usuarios.service.js -> actualizarUsuario).
 * Ambos campos son obligatorios; el teléfono debe tener exactamente 10 dígitos (validarTelefono).
 */
async function actualizarPerfilProfesor(usuarioId, datos) {
  const { telefono_personal, horario_atencion } = datos;

  validarTelefono(telefono_personal, { requerido: true });

  const horario = limpiar(horario_atencion);
  if (horario === '') throw crearError('El horario de atención es obligatorio.');
  if (horario.length > HORARIO_MAX_LEN) {
    throw crearError(`El horario de atención no puede superar ${HORARIO_MAX_LEN} caracteres.`);
  }

  await buscarProfesor(usuarioId); // 404 si la cuenta no tiene perfil de profesor

  const actualizado = await prisma.profesor.update({
    where: { usuario_id: usuarioId },
    // Solo estos dos campos: cualquier otro que venga en el cuerpo se ignora por construcción.
    data: { telefono_personal, horario_atencion: horario },
    include: { usuario: true },
  });

  return vistaProfesor(actualizado);
}

// ── CU-ADM-04 · Alumno ──────────────────────────────────────────────────────

async function buscarAlumno(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { usuario: true },
  });
  if (!alumno) {
    throw crearError('No se encontró un perfil de alumno asociado a esta cuenta.', 404);
  }
  return alumno;
}

/**
 * `creditos` es Decimal(5,2) en el schema (un porcentaje de avance de la carrera, p. ej. 78.50);
 * se devuelve como número para que el front lo formatee, sin convertirlo aquí en texto.
 */
function vistaAlumno(alumno) {
  return {
    institucionales: {
      nombre: alumno.usuario.nombre,
      apellidos: alumno.usuario.apellidos,
      nombreCompleto: nombreCompleto(alumno.usuario),
      boleta: alumno.boleta,
      carrera: alumno.carrera,
      correoInstitucional: alumno.usuario.correo_institucional,
      creditos: Number(alumno.creditos),
      semestre: alumno.semestre,
    },
    editables: {
      correoPersonal: alumno.correo_personal ?? '',
      celular: alumno.celular,
    },
  };
}

async function obtenerPerfilAlumno(usuarioId) {
  return vistaAlumno(await buscarAlumno(usuarioId));
}

/**
 * El alumno solo puede modificar correo_personal y celular; ambos obligatorios. Todo lo demás
 * —boleta, carrera, créditos, semestre, nombre, apellidos, correo institucional— es inmutable desde
 * este CU y ni siquiera se lee del cuerpo.
 *
 * El celular usa validarTelefono, el mismo validador del profesor: exactamente 10 dígitos, que es
 * justo lo que admite la columna VarChar(10).
 */
async function actualizarPerfilAlumno(usuarioId, datos) {
  const { correo_personal, celular } = datos;

  validarCorreoPersonal(correo_personal, { requerido: true });
  validarTelefono(celular, { requerido: true });

  await buscarAlumno(usuarioId); // 404 si la cuenta no tiene perfil de alumno

  const actualizado = await prisma.alumno.update({
    where: { usuario_id: usuarioId },
    data: { correo_personal: limpiar(correo_personal), celular },
    include: { usuario: true },
  });

  return vistaAlumno(actualizado);
}

module.exports = {
  obtenerPerfilProfesor,
  actualizarPerfilProfesor,
  obtenerPerfilAlumno,
  actualizarPerfilAlumno,
};
