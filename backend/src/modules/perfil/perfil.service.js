const prisma = require('../../lib/prisma');
const { validarTelefono } = require('../../lib/validators');

const HORARIO_MAX_LEN = 100;

/**
 * El profesor NUNCA puede modificar: nombre, apellidos, correo_institucional,
 * cubículo, ni departamento — esos son datos institucionales que solo el
 * coordinador puede editar (ver usuarios.service.js -> actualizarUsuario).
 * usuarioId viene del token (req.usuario.sub), nunca del body, para que un
 * profesor no pueda editar el perfil de otro cambiando un :id en la URL.
 */
async function actualizarPerfilProfesor(usuarioId, datos) {
  const { telefono_personal, horario_atencion } = datos;

  validarTelefono(telefono_personal, { requerido: true });

  if (!horario_atencion || !horario_atencion.trim()) {
    const error = new Error('El horario de atención es obligatorio.');
    error.status = 400;
    throw error;
  }
  if (horario_atencion.trim().length > HORARIO_MAX_LEN) {
    const error = new Error(`El horario de atención no puede superar ${HORARIO_MAX_LEN} caracteres.`);
    error.status = 400;
    throw error;
  }

  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });
  if (!profesor) {
    const error = new Error('No se encontró un perfil de profesor asociado a esta cuenta.');
    error.status = 404;
    throw error;
  }

  return prisma.profesor.update({
    where: { usuario_id: usuarioId },
    data: {
      telefono_personal,
      horario_atencion: horario_atencion.trim(),
    },
  });
}

module.exports = { actualizarPerfilProfesor };
