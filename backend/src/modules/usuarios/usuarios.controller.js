const usuariosService = require('./usuarios.service');

async function postCrearUsuario(req, res) {
  try {
    const creadoPorId = req.usuario.sub;

    const resultado = await usuariosService.crearUsuario(req.body, creadoPorId);

    if (!resultado.correoEnviado) {
      return res.status(201).json({
        message:
          'El usuario fue creado, pero no se pudo enviar el correo de notificación. ' +
          'Usa la opción de reenviar correo.',
        usuario: resultado.usuario,
        correoEnviado: false,
      });
    }

    return res.status(201).json({
      message: `El usuario fue creado correctamente. Se ha enviado un correo a ${resultado.usuario.correo_institucional} para que establezca su contraseña.`,
      usuario: resultado.usuario,
      correoEnviado: true,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) console.error('Error inesperado al crear usuario:', err);

    return res.status(status).json({ message });
  }
}

async function postReenviarCorreo(req, res) {
  try {
    const usuarioId = Number(req.params.id);
    await usuariosService.reenviarCorreoBienvenida(usuarioId);
    return res.status(200).json({ message: 'Correo reenviado correctamente.' });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'No se pudo reenviar el correo. Intenta de nuevo.' : err.message;

    if (status === 500) console.error('Error inesperado al reenviar correo:', err);

    return res.status(status).json({ message });
  }
}

async function getUsuarios(req, res) {
  try {
    const usuarios = await usuariosService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    return res.status(500).json({ message: 'No se pudieron cargar los usuarios.' });
  }
}

async function putActualizarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    await usuariosService.actualizarUsuario(id, req.body);
    return res.status(200).json({ message: 'Usuario actualizado correctamente.' });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) console.error('Error inesperado al actualizar usuario:', err);

    return res.status(status).json({ message });
  }
}

module.exports = { postCrearUsuario, postReenviarCorreo, getUsuarios, putActualizarUsuario };