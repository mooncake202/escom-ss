const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { generarTokenSeguro, generarContrasenaAleatoria } = require('../../lib/tokens');
const { enviarCorreoBienvenida } = require('../../lib/mailer');
const {
  validarNombreOApellidos,
  validarCorreoInstitucional,
  validarTelefono,
  validarDepartamento,
} = require('../../lib/validators');

const CUPOS_BASE = 3;
const MINUTOS_VIGENCIA_TOKEN = 30; // RN-CRED-03

function validarDatosBasicos({ nombre, apellidos, correo_institucional, rol }) {
  validarNombreOApellidos(nombre, 'El nombre');
  validarNombreOApellidos(apellidos, 'Los apellidos');
  validarCorreoInstitucional(correo_institucional);

  // RF-CRED-16: este CU nunca crea cuentas de alumno.
  if (!['profesor', 'coordinador'].includes(rol)) {
    const error = new Error('El rol debe ser "profesor" o "coordinador".');
    error.status = 400;
    throw error;
  }
}

/**
 * CU-CRED-03 — Crear usuarios
 * @param {object} datos - nombre, apellidos, correo_institucional, rol, departamento?, caracteristicas?
 * @param {number} creadoPorId - id del coordinador autenticado (req.usuario.sub)
 */
async function crearUsuario(datos, creadoPorId) {
  const { nombre, apellidos, correo_institucional, rol, departamento, caracteristicas = [] } = datos;

  validarDatosBasicos(datos);

  if (rol === 'profesor') {
    validarDepartamento(departamento);
    validarTelefono(datos.telefono_personal, { requerido: false });
  }

  // RN-CRED-06: correo no debe estar registrado.
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional } });
  if (existente) {
    const error = new Error('El correo institucional ya está registrado en el sistema.');
    error.status = 409;
    throw error;
  }

  // Resuelve las características solicitadas contra el catálogo real (nunca se confía
  // en nombres mandados desde el frontend sin validarlos contra la BD).
  let caracteristicasEncontradas = [];
  if (rol === 'profesor' && caracteristicas.length > 0) {
    caracteristicasEncontradas = await prisma.caracteristica.findMany({
      where: { nombre: { in: caracteristicas } },
    });

    if (caracteristicasEncontradas.length !== caracteristicas.length) {
      const error = new Error('Una o más características seleccionadas no son válidas.');
      error.status = 400;
      throw error;
    }
  }

  const incrementoTotal = caracteristicasEncontradas.reduce((sum, c) => sum + c.incremento_cupos, 0);
  const cuposTotales = CUPOS_BASE + incrementoTotal;

  const contrasenaHash = await bcrypt.hash(generarContrasenaAleatoria(), 10);
  const token = generarTokenSeguro();
  const ahora = new Date();
  const fechaExpiracion = new Date(ahora.getTime() + MINUTOS_VIGENCIA_TOKEN * 60000);

  const { usuarioCreado } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: {
        rol,
        correo_institucional,
        nombre,
        apellidos,
        contrasena: contrasenaHash,
        fecha_creacion: ahora,
        creado_por_id: creadoPorId,
        rubrica_fecha_registro: ahora,
      },
    });

    if (rol === 'profesor') {
      const profesorCreado = await tx.profesor.create({
        data: {
          usuario_id: usuarioCreado.id,
          departamento,
          telefono_personal: datos.telefono_personal || '',
          horario_atencion: datos.horario_atencion || '',
          cubiculo: datos.cubiculo || '',
          cupos_totales: cuposTotales,
        },
      });

      if (caracteristicasEncontradas.length > 0) {
        await tx.solicitud_caracteristica.createMany({
          data: caracteristicasEncontradas.map((c) => ({
            profesor_id: profesorCreado.id,
            caracteristica_id: c.id,
            justificacion: 'Asignada por el coordinador al momento de creación de cuenta.',
            estado: 'aprobado',
            fecha: ahora,
            fecha_respuesta: ahora,
          })),
        });
      }
    } else if (rol === 'coordinador') {
      await tx.coordinador.create({
        data: { usuario_id: usuarioCreado.id },
      });
    }

    await tx.token_contrasena.create({
      data: {
        usuario_id: usuarioCreado.id,
        token,
        fecha_expiracion: fechaExpiracion,
        usado: false,
      },
    });

    return { usuarioCreado };
  });

  // El envío de correo queda FUERA de la transacción a propósito: si falla,
  // el usuario ya quedó creado (E1) y se habilita el reenvío manual.
  let correoEnviado = true;
  try {
    await enviarCorreoBienvenida({ to: correo_institucional, nombre, token });
  } catch (err) {
    console.error('Error al enviar correo de bienvenida:', err);
    correoEnviado = false;
  }

  return {
    usuario: {
      id: usuarioCreado.id,
      nombre: usuarioCreado.nombre,
      apellidos: usuarioCreado.apellidos,
      correo_institucional: usuarioCreado.correo_institucional,
      rol: usuarioCreado.rol,
    },
    correoEnviado,
  };
}

/**
 * RF-CRED-15 — reenvío manual si el correo de bienvenida falló.
 * Genera un token nuevo (el anterior pudo haber expirado) y reintenta el envío.
 */
async function reenviarCorreoBienvenida(usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  const token = generarTokenSeguro();
  const ahora = new Date();
  const fechaExpiracion = new Date(ahora.getTime() + MINUTOS_VIGENCIA_TOKEN * 60000);

  await prisma.token_contrasena.create({
    data: { usuario_id: usuario.id, token, fecha_expiracion: fechaExpiracion, usado: false },
  });

  await enviarCorreoBienvenida({ to: usuario.correo_institucional, nombre: usuario.nombre, token });
}

/**
 * Lista profesores y coordinadores para la pantalla de gestión de usuarios.
 * Incluye datos de perfil y características aprobadas cuando aplica.
 */
async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: { in: ['profesor', 'coordinador'] } },
    orderBy: { fecha_creacion: 'desc' },
    include: {
      profesor: {
        include: {
          solicitud_caracteristica: {
            where: { estado: 'aprobado' },
            include: { caracteristica: true },
          },
        },
      },
      coordinador: true,
    },
  });

  return usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellidos: u.apellidos,
    correo_institucional: u.correo_institucional,
    rol: u.rol,
    fecha_creacion: u.fecha_creacion,
    creado_por_id: u.creado_por_id,
    ...(u.profesor
      ? {
          departamento: u.profesor.departamento,
          telefono_personal: u.profesor.telefono_personal,
          horario_atencion: u.profesor.horario_atencion,
          cubiculo: u.profesor.cubiculo,
          cupos_totales: u.profesor.cupos_totales,
          caracteristicas: u.profesor.solicitud_caracteristica.map((sc) => sc.caracteristica.nombre),
        }
      : {}),
  }));
}

/**
 * Edición completa de un usuario (solo Coordinador). A diferencia de
 * crearUsuario, aquí SÍ se permite tocar correo_institucional, así que se
 * revalida unicidad excluyendo al propio usuario. Si es profesor, reemplaza
 * por completo el set de características (borra y vuelve a crear) y
 * recalcula cupos_totales.
 */
async function actualizarUsuario(id, datos) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { profesor: true },
  });

  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  const {
    nombre,
    apellidos,
    correo_institucional,
    departamento,
    telefono_personal,
    horario_atencion,
    cubiculo,
    caracteristicas = [],
  } = datos;

  validarNombreOApellidos(nombre, 'El nombre');
  validarNombreOApellidos(apellidos, 'Los apellidos');
  validarCorreoInstitucional(correo_institucional);

  if (usuario.rol === 'profesor') {
    validarDepartamento(departamento);
    validarTelefono(telefono_personal, { requerido: false });
  }

  if (correo_institucional.toLowerCase() !== usuario.correo_institucional.toLowerCase()) {
    const existente = await prisma.usuario.findUnique({ where: { correo_institucional } });
    if (existente) {
      const error = new Error('El correo institucional ya está registrado en el sistema.');
      error.status = 409;
      throw error;
    }
  }

  let caracteristicasEncontradas = [];
  if (usuario.rol === 'profesor' && caracteristicas.length > 0) {
    caracteristicasEncontradas = await prisma.caracteristica.findMany({
      where: { nombre: { in: caracteristicas } },
    });
    if (caracteristicasEncontradas.length !== caracteristicas.length) {
      const error = new Error('Una o más características seleccionadas no son válidas.');
      error.status = 400;
      throw error;
    }
  }

  const incrementoTotal = caracteristicasEncontradas.reduce((sum, c) => sum + c.incremento_cupos, 0);
  const cuposTotales = CUPOS_BASE + incrementoTotal;
  const ahora = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id },
      data: { nombre, apellidos, correo_institucional },
    });

    if (usuario.rol === 'profesor') {
      await tx.profesor.update({
        where: { usuario_id: id },
        data: {
          departamento,
          telefono_personal: telefono_personal || '',
          horario_atencion: horario_atencion || '',
          cubiculo: cubiculo || '',
          cupos_totales: cuposTotales,
        },
      });

      // Reemplaza el set completo de características.
      await tx.solicitud_caracteristica.deleteMany({ where: { profesor_id: usuario.profesor.id } });

      if (caracteristicasEncontradas.length > 0) {
        await tx.solicitud_caracteristica.createMany({
          data: caracteristicasEncontradas.map((c) => ({
            profesor_id: usuario.profesor.id,
            caracteristica_id: c.id,
            justificacion: 'Actualizada por el coordinador al editar la cuenta.',
            estado: 'aprobado',
            fecha: ahora,
            fecha_respuesta: ahora,
          })),
        });
      }
    }
  });

  return { id };
}

module.exports = { crearUsuario, reenviarCorreoBienvenida, listarUsuarios, actualizarUsuario };