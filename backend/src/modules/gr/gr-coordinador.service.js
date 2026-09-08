const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/prisma');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { dictamenLabel, RUTA_BASE_DOCUMENTOS } = require('./gr.service');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

function borrarArchivosFisicos(documentos) {
  documentos.forEach((d) => {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, d.ruta_archivo)); } catch {}
  });
}

/**
 * RF-GR-67: solicitudes con documentación pendiente de revisión.
 */
async function listarSolicitudesDocumentacionPendiente() {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'SISS_y_documentacion_pendiente' },
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
    },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  const boletas = solicitudes.map((s) => s.alumno_id);
  const documentos = await prisma.documento.findMany({
    where: { alumno_id: { in: boletas }, tipo_documento: { in: ['carta_creditos', 'constancia_seguro_social'] } },
  });

  return solicitudes.map((s) => {
    const docCarta = documentos.find((d) => d.alumno_id === s.alumno_id && d.tipo_documento === 'carta_creditos');
    const docSeguro = documentos.find((d) => d.alumno_id === s.alumno_id && d.tipo_documento === 'constancia_seguro_social');
    return {
      id: s.id,
      alumno: {
        nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
        boleta: s.alumno.boleta,
        carrera: s.alumno.carrera,
        creditos: s.alumno.creditos,
        dictamen: dictamenLabel(s.dictamen),
      },
      profesor: s.oferta?.profesor ? `${s.oferta.profesor.usuario.nombre} ${s.oferta.profesor.usuario.apellidos}` : null,
      vacante: s.oferta?.nombre_proyecto ?? null,
      registroSISS: s.registro_siss,
      fechaEnvio: s.fecha_aplicacion,
      documentos: {
        cartaCreditosId: docCarta?.id ?? null,
        seguroSocialId: docSeguro?.id ?? null,
      },
    };
  });
}

/**
 * CU-GR-07 — las 4 decisiones posibles de Coordinador.
 *
 * Orden importante (Excepción E2): la base de datos se actualiza PRIMERO;
 * los archivos físicos solo se borran DESPUÉS de que la transacción tuvo
 * éxito. Si se borrara el archivo antes y luego la transacción fallara, la
 * solicitud seguiría "pendiente" en la BD pero sin el PDF real detrás —
 * un estado inconsistente e imposible de corregir para el alumno. Con este
 * orden, si algo falla en la BD, los archivos siguen intactos y todo queda
 * exactamente como estaba antes del intento (fácil de reintentar).
 */
async function decidirDocumentacion(solicitudId, decision, motivoRechazo, coordinadorUsuarioId) {
  const DECISIONES_VALIDAS = ['aceptar', 'corregir_siss', 'corregir_documentos', 'rechazar_definitivo'];
  if (!DECISIONES_VALIDAS.includes(decision)) throw crearError('Decisión inválida.');
  if (decision !== 'aceptar' && (!motivoRechazo || !motivoRechazo.trim())) {
    throw crearError('Debes ingresar un motivo.');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const solicitud = await prisma.solicitud_registro.findUnique({ where: { id: Number(solicitudId) } });
  if (!solicitud) throw crearError('Solicitud no encontrada.', 404);
  if (solicitud.estado_solicitud !== 'SISS_y_documentacion_pendiente') {
    throw crearError('Esta solicitud ya fue procesada.', 409);
  }

  const documentos = await prisma.documento.findMany({
    where: { alumno_id: solicitud.alumno_id, tipo_documento: { in: ['carta_creditos', 'constancia_seguro_social'] } },
  });
  const idsDocumentos = documentos.map((d) => d.id);

  if (decision === 'aceptar') {
    // No borra ningún archivo — no aplica el reordenamiento aquí.
    await prisma.$transaction([
      prisma.solicitud_registro.update({
        where: { id: solicitud.id },
        data: { estado_solicitud: 'SISS_docs_aprobados', estado_anterior: 'SISS_y_documentacion_pendiente', registro_siss: true, docs_iniciales: true },
      }),
      prisma.documento.updateMany({ where: { id: { in: idsDocumentos } }, data: { estado_documento: 'aprobado', aprobado_por_id: coordinador.id } }),
    ]);
    return { estado_solicitud: 'SISS_docs_aprobados' };
  }

  if (decision === 'corregir_siss') {
    await prisma.$transaction([
      prisma.solicitud_registro.update({
        where: { id: solicitud.id },
        data: { estado_solicitud: 'corregir_SISS', estado_anterior: 'SISS_y_documentacion_pendiente', registro_siss: false, docs_iniciales: false, motivo_rechazo: motivoRechazo },
      }),
      prisma.documento.updateMany({ where: { id: { in: idsDocumentos } }, data: { estado_documento: 'con_correcciones' } }),
    ]);
    // Solo hasta aquí, con la BD ya confirmada, se tocan los archivos físicos.
    borrarArchivosFisicos(documentos);
    return { estado_solicitud: 'corregir_SISS' };
  }

  if (decision === 'corregir_documentos') {
    await prisma.$transaction([
      prisma.solicitud_registro.update({
        where: { id: solicitud.id },
        data: { estado_solicitud: 'corregir_docsini', estado_anterior: 'SISS_y_documentacion_pendiente', docs_iniciales: false, motivo_rechazo: motivoRechazo },
      }),
      prisma.documento.updateMany({ where: { id: { in: idsDocumentos } }, data: { estado_documento: 'con_correcciones' } }),
    ]);
    borrarArchivosFisicos(documentos);
    return { estado_solicitud: 'corregir_docsini' };
  }

  // decision === 'rechazar_definitivo'
  await prisma.$transaction(async (tx) => {
    await tx.solicitud_registro.update({
      where: { id: solicitud.id },
      data: {
        estado_solicitud: 'rechazada_definitivamente',
        estado_anterior: 'SISS_y_documentacion_pendiente',
        tipo_rechazo: 'definitivo',
        motivo_rechazo: motivoRechazo,
        oferta_id: null,
        docs_iniciales: false,
        registro_siss: false,
        periodo_registro_id: null,
      },
    });
    await tx.documento.deleteMany({ where: { id: { in: idsDocumentos } } });

    // Este estado solo se alcanza tras ser aceptado en CU-GR-02, así que el
    // cupo siempre estaba consumido — se libera aquí mismo, no hasta CU-GR-13.
    if (solicitud.oferta_id) {
      await tx.oferta_servicio.update({ where: { id: solicitud.oferta_id }, data: { cupos_disponibles: { increment: 1 } } });
    }
  });
  // La transacción ya eliminó las filas en BD; ahora sí se borran los
  // archivos físicos que quedaron huérfanos.
  borrarArchivosFisicos(documentos);
  return { estado_solicitud: 'rechazada_definitivamente' };
}

/**
 * E1 / RF-GR-68/69: descarga (descifrada) de un documento. Permiso: el
 * propio coordinador (cualquier documento) o el alumno dueño (solo el suyo)
 * — reutilizable después cuando el alumno tenga su propia vista de documentos.
 */
async function descargarDocumento(documentoId, usuarioSolicitante) {
  const documento = await prisma.documento.findUnique({ where: { id: Number(documentoId) } });
  if (!documento) throw crearError('Documento no encontrado.', 404);

  if (usuarioSolicitante.rol === 'coordinador') {
    // permitido
  } else if (usuarioSolicitante.rol === 'alumno_sin_asignar') {
    const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioSolicitante.sub } });
    if (!alumno || alumno.boleta !== documento.alumno_id) throw crearError('No tienes permiso para ver este documento.', 403);
  } else {
    throw crearError('No tienes permiso para ver este documento.', 403);
  }

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, documento.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  return descifrarBuffer(bufferCifrado);
}



/**
 * RF-GR-85: alumnos con la carta compromiso lista para entregar presencialmente.
 */
async function listarSolicitudesEsperandoCarta() {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'espera_confirmacion_carta_compromiso' },
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    alumno: {
      nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
      boleta: s.alumno.boleta,
      carrera: s.alumno.carrera,
      correoInst: s.alumno.usuario.correo_institucional,
    },
    profesor: s.oferta?.profesor ? `${s.oferta.profesor.usuario.nombre} ${s.oferta.profesor.usuario.apellidos}` : null,
    periodoInicio: s.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
    periodoFin: s.periodo_registro?.evento_calendario?.fecha_fin ?? null,
  }));
}

/**
 * CU-GR-09 — RN-GR-50 a RN-GR-53.
 */
async function registrarRecepcionCarta(solicitudId, coordinadorUsuarioId) {
  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const solicitud = await prisma.solicitud_registro.findUnique({ where: { id: Number(solicitudId) } });
  if (!solicitud) throw crearError('Solicitud no encontrada.', 404);
  if (solicitud.estado_solicitud !== 'espera_confirmacion_carta_compromiso') {
    throw crearError('Esta solicitud ya fue procesada.', 409);
  }

  await prisma.solicitud_registro.update({
    where: { id: solicitud.id },
    data: {
      estado_solicitud: 'carta_compromiso_confirmada',
      estado_anterior: 'espera_confirmacion_carta_compromiso',
      carta_compromiso: true,
      fecha_carta_compromiso: new Date(),
    },
  });
  return { mensaje: 'Recepción registrada correctamente.' };
}

/**
 * RF-GR-107: expedientes pendientes de revisión.
 */
async function listarExpedientesPendientes() {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'expediente_pendiente_revision' },
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  const boletas = solicitudes.map((s) => s.alumno_id);
  const documentos = await prisma.documento.findMany({
    where: { alumno_id: { in: boletas }, tipo_documento: 'expediente' },
  });

  return solicitudes.map((s) => {
    const docExpediente = documentos.find((d) => d.alumno_id === s.alumno_id);
    return {
      id: s.id,
      alumno: {
        nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
        boleta: s.alumno.boleta,
        carrera: s.alumno.carrera,
        correoInst: s.alumno.usuario.correo_institucional,
        creditos: s.alumno.creditos,
      },
      profesor: s.oferta?.profesor ? `${s.oferta.profesor.usuario.nombre} ${s.oferta.profesor.usuario.apellidos}` : null,
      periodoInicio: s.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
      periodoFin: s.periodo_registro?.evento_calendario?.fecha_fin ?? null,
      fechaEnvio: s.fecha_aplicacion,
      requiereDictamen: s.dictamen !== null,
      dictamenLabel: dictamenLabel(s.dictamen),
      expediente: {
        documentoId: docExpediente?.id ?? null,
        nombreArchivo: docExpediente?.nombre_expediente ?? null,
      },
    };
  });
}

/**
 * CU-GR-12 — aprobar o rechazar con correcciones.
 */
async function decidirExpediente(solicitudId, decision, motivoRechazo, coordinadorUsuarioId) {
  if (!['aprobar', 'rechazar'].includes(decision)) throw crearError('Decisión inválida.');
  if (decision === 'rechazar' && (!motivoRechazo || !motivoRechazo.trim())) {
    throw crearError('Debes ingresar un motivo.');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: Number(solicitudId) },
    include: { alumno: true },
  });
  if (!solicitud) throw crearError('Solicitud no encontrada.', 404);
  if (solicitud.estado_solicitud !== 'expediente_pendiente_revision') {
    throw crearError('Esta solicitud ya fue procesada.', 409);
  }

  const documentoExpediente = await prisma.documento.findFirst({
    where: { alumno_id: solicitud.alumno_id, tipo_documento: 'expediente' },
  });

  if (decision === 'aprobar') {
    await prisma.$transaction([
      prisma.solicitud_registro.update({
        where: { id: solicitud.id },
        data: { estado_solicitud: 'expediente_aprobado', estado_anterior: 'expediente_pendiente_revision' },
      }),
      // RN-GR-73: el rol cambia aquí mismo, tal como dice la ficha. El
      // modal de bienvenida (ver notificación abajo) es lo que garantiza
      // que la transición de estado_solicitud a alumno_asignado se
      // complete sin importar si el alumno recarga, cierra sesión o
      // sigue en la misma pantalla.
      prisma.usuario.update({ where: { id: solicitud.alumno.usuario_id }, data: { rol: 'alumno_asignado' } }),
      ...(documentoExpediente
        ? [prisma.documento.update({ where: { id: documentoExpediente.id }, data: { estado_documento: 'aprobado', aprobado_por_id: coordinador.id } })]
        : []),
    ]);

    await crearNotificacion({
      usuarioId: solicitud.alumno.usuario_id,
      tipo: 'success',
      mensaje: 'Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.',
      rutaRelacionada: 'MODAL_BIENVENIDA_ALUMNO_ASIGNADO',
    });

    return { estado_solicitud: 'expediente_aprobado' };
  }

  // rechazar — RN-GR-71, mismo patrón de reutilizar fila que en GR-11.
  await prisma.$transaction([
    prisma.solicitud_registro.update({
      where: { id: solicitud.id },
      data: { estado_solicitud: 'expediente_con_correcciones', estado_anterior: 'expediente_pendiente_revision', motivo_rechazo: motivoRechazo, tipo_rechazo: 'corregible' },
    }),
    ...(documentoExpediente
      ? [prisma.documento.update({ where: { id: documentoExpediente.id }, data: { estado_documento: 'con_correcciones' } })]
      : []),
  ]);
  return { estado_solicitud: 'expediente_con_correcciones' };
}


module.exports = { listarSolicitudesDocumentacionPendiente, 
  decidirDocumentacion, descargarDocumento,
  listarSolicitudesEsperandoCarta, registrarRecepcionCarta,
  listarExpedientesPendientes, decidirExpediente,
};