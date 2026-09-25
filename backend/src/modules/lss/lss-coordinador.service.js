const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const { cifrarBuffer, descifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');
const { crearError } = require('./validators');
const { agregarSelloCoordinacion } = require('./lss.pdf');
const { obtenerSelloCoordinacion } = require('./lss.rubricas');
const { solicitarSelloTiempo, ErrorTsa } = require('../../lib/timestampTsa');
const {
  sha256,
  ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
  ESTADO_CARTA_SOLICITADA,
  ESTADO_CARTA_LISTA_PARA_RECOGER,
  exigirEstadoCarta,
} = require('./lss.shared');

// ─────────────────────────────────────────────────────────────
// CU-LSS-04: dictaminar evaluación de desempeño (actor: Coordinador).
//
// Misma carpeta que usa GR/LSS-02/LSS-03 para documentos cifrados —
// duplicado a propósito (RN de separación por módulo).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

function emitirResumenActualizado(usuarioId) {
  try {
    emitirAUsuario(usuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (lss, coordinador):', err.message);
  }
}

/**
 * RN-LSS-12: solo coordinador puede dictaminar — mismo patrón de
 * resolución ya usado en gr-coordinador.service.js (decidirDocumentacion),
 * aunque el listado (más abajo) no filtre por coordinador asignado: este
 * actor ve TODAS las evaluaciones, sin noción de "asignación".
 */
async function resolverCoordinador(coordinadorUsuarioId) {
  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);
  return coordinador;
}

/**
 * Trae la evaluación con todo lo necesario para dictaminar/descargar:
 * documento (ruta real), alumno+usuario, profesor+usuario (para notificar),
 * y sus revision_desempeno (para exigirPdfVigente).
 */
async function resolverEvaluacion(evaluacionId) {
  const evaluacion = await prisma.evaluacion_desempeno.findUnique({
    where: { id: Number(evaluacionId) },
    include: {
      documento: true,
      revision_desempeno: true,
      liberacion_proceso: {
        include: {
          solicitud_registro: {
            include: {
              alumno: { include: { usuario: true } },
              oferta: { include: { profesor: { include: { usuario: true } } } },
            },
          },
        },
      },
    },
  });
  if (!evaluacion) throw crearError('Evaluación no encontrada.', 404);
  return evaluacion;
}

/**
 * RN-LSS-14/15: solo se puede dictaminar (aprobar o rechazar) una
 * evaluación que esté REALMENTE en pendiente_dictamen — rechazo real (409)
 * si ya fue dictaminada antes (o nunca llegó a ese estado).
 */
function exigirPendienteDictamen(evaluacion) {
  if (evaluacion.estado !== ESTADO_EVALUACION_PENDIENTE_DICTAMEN) {
    throw crearError('Esta evaluación ya fue dictaminada y no se puede modificar.', 409, 'EVALUACION_YA_DICTAMINADA');
  }
}

/**
 * Mismo patrón exacto que exigirPdfVigente de Reportes
 * (reportes-revision.service.js): el archivo leído de disco debe coincidir
 * con el hash que quedó registrado cuando el profesor firmó — si no
 * coincide, es un error de integridad del sistema (500), no un rechazo de
 * validación del usuario. Toma la revisión de profesor más reciente
 * (fecha, desempate por id) por si en el futuro hubiera más de una.
 */
function exigirPdfVigente(evaluacion, pdfBuffer) {
  const firmasProfesor = evaluacion.revision_desempeno.filter((r) => r.tipo_revisor === 'profesor' && r.estado === 'aprobado');
  const vigente = firmasProfesor.reduce((a, b) => (a === null || b.fecha > a.fecha || (+b.fecha === +a.fecha && b.id > a.id) ? b : a), null);
  if (!vigente?.hash_documento || vigente.hash_documento !== sha256(pdfBuffer)) {
    console.error(`[lss-coordinador] El PDF almacenado de la evaluación ${evaluacion.id} no coincide con la firma registrada del profesor.`);
    throw crearError('El archivo de la evaluación no coincide con el que firmó el profesor.', 500, 'ARCHIVO_INCONSISTENTE');
  }
}

function alumnoDe(evaluacion) {
  return evaluacion.liberacion_proceso.solicitud_registro.alumno;
}

function profesorUsuarioIdDe(evaluacion) {
  return evaluacion.liberacion_proceso.solicitud_registro.oferta?.profesor?.usuario_id ?? null;
}

async function notificar(usuarioId, mensaje, rutaRelacionada) {
  try {
    await crearNotificacion({ usuarioId, tipo: 'info', mensaje, rutaRelacionada });
  } catch (err) {
    console.error('Error al crear notificación de dictamen:', err.message);
  }
  emitirResumenActualizado(usuarioId);
}

/**
 * TODAS las evaluaciones en pendiente_dictamen — sin filtro de asignación
 * (mismo criterio ya usado en gr-coordinador.service.js:
 * listarSolicitudesDocumentacionPendiente, sin parámetros).
 */
async function listarEvaluacionesPendientesDictamen() {
  const evaluaciones = await prisma.evaluacion_desempeno.findMany({
    where: { estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN },
    include: {
      liberacion_proceso: {
        include: {
          solicitud_registro: {
            include: {
              alumno: { include: { usuario: true } },
              oferta: { include: { profesor: { include: { usuario: true } } } },
            },
          },
        },
      },
    },
    orderBy: { fecha_evaluacion: 'asc' },
  });

  return evaluaciones.map((ev) => {
    const solicitud = ev.liberacion_proceso.solicitud_registro;
    return {
      evaluacionId: ev.id,
      boleta: solicitud.alumno.boleta,
      nombreCompleto: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
      profesorNombre: solicitud.oferta?.profesor
        ? `${solicitud.oferta.profesor.usuario.nombre} ${solicitud.oferta.profesor.usuario.apellidos}`
        : null,
      oferta: solicitud.oferta?.nombre_proyecto ?? null,
      fechaEnvio: ev.fecha_evaluacion,
      // Punto 6: elección original del alumno en CU-LSS-01 — recordatorio
      // informativo (NO bloqueante) para que coordinación verifique
      // manualmente en SISS antes de aprobar. Mismo campo que ya se
      // expone al profesor en listarAlumnosConEvaluacionPendiente.
      reportesValidadosSiss: !!ev.liberacion_proceso.reportes_validados_siss,
    };
  });
}

/**
 * Coordinación revisa el PDF (con la rúbrica del profesor) ANTES de
 * dictaminar — mismo patrón de descifrado en memoria ya usado en
 * marcarEvaluacionDescargada (LSS-02): nunca se guarda una copia
 * descifrada en disco, se sirve el buffer directo en la respuesta HTTP.
 */
async function descargarParaRevision(coordinadorUsuarioId, evaluacionId) {
  await resolverCoordinador(coordinadorUsuarioId);
  const evaluacion = await resolverEvaluacion(evaluacionId);

  if (!evaluacion.documento) {
    throw crearError('Esta evaluación todavía no tiene ningún documento disponible.', 404);
  }

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, evaluacion.documento.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  return descifrarBuffer(bufferCifrado);
}

/**
 * Flujo Principal (CU-LSS-04): coordinador aprueba — incrusta su sello
 * sobre el PDF que YA tiene la rúbrica del profesor (sin regenerar el
 * documento completo), calcula nuevo hash/TSA y avanza el estado.
 * liberacion_proceso.estado NO se toca (mismo criterio ya establecido en
 * todo el módulo: la granularidad vive en evaluacion_desempeno).
 */
async function dictaminarAprobado(coordinadorUsuarioId, evaluacionId, ipFirma = null) {
  const coordinador = await resolverCoordinador(coordinadorUsuarioId);
  const evaluacion = await resolverEvaluacion(evaluacionId);
  exigirPendienteDictamen(evaluacion);

  if (!evaluacion.documento) {
    // No debería poder pasar (registrarEvaluacion/corregirYReenviar
    // siempre generan documento antes de pendiente_dictamen), pero se
    // revalida por seguridad (RN-LSS-15).
    throw crearError('Esta evaluación no tiene ningún documento asociado.', 500, 'DOCUMENTO_FALTANTE');
  }

  const rutaAbsoluta = path.join(RUTA_BASE_DOCUMENTOS, evaluacion.documento.ruta_archivo);
  let pdfProfesor;
  try {
    pdfProfesor = descifrarBuffer(fs.readFileSync(rutaAbsoluta));
  } catch (err) {
    throw crearError('El archivo de la evaluación no está disponible.', 404);
  }

  exigirPdfVigente(evaluacion, pdfProfesor);

  const sello = obtenerSelloCoordinacion();
  if (!sello) {
    throw crearError('No se encontró el sello de coordinación registrado en el sistema.', 409, 'SELLO_NO_ENCONTRADO');
  }

  const pdfFinal = await agregarSelloCoordinacion(pdfProfesor, sello);
  const hashDocumento = sha256(pdfFinal);

  let selloTsa;
  try {
    selloTsa = await solicitarSelloTiempo(hashDocumento);
  } catch (err) {
    if (err instanceof ErrorTsa) {
      throw crearError(`No se pudo obtener el sello de tiempo del dictamen (${err.codigo}): ${err.message}`, 502, err.codigo);
    }
    throw err;
  }

  const rutaRelativaNueva = path.join(alumnoDe(evaluacion).boleta, generarNombreSeguro());
  const rutaAbsolutaNueva = path.join(RUTA_BASE_DOCUMENTOS, rutaRelativaNueva);
  fs.writeFileSync(rutaAbsolutaNueva, cifrarBuffer(pdfFinal));

  try {
    await prisma.$transaction([
      prisma.documento.update({
        where: { id: evaluacion.documento_id },
        data: { ruta_archivo: rutaRelativaNueva, estado_documento: 'vigente', aprobado_por_id: coordinador.id },
      }),
      prisma.evaluacion_desempeno.update({
        where: { id: evaluacion.id },
        data: { estado: ESTADO_EVALUACION_APROBADO_COORDINADOR, motivo_rechazo_coordinacion: null },
      }),
      prisma.revision_desempeno.create({
        data: {
          evaluacion_desempeno_id: evaluacion.id,
          usuario_id: coordinadorUsuarioId,
          tipo_revisor: 'coordinador',
          estado: 'aprobado',
          hash_documento: hashDocumento,
          ip_firma: ipFirma || null,
          token_tsa: selloTsa.token,
          fecha: new Date(),
        },
      }),
    ]);
  } catch (err) {
    try { fs.unlinkSync(rutaAbsolutaNueva); } catch {}
    throw err;
  }

  // Solo tras confirmar la transacción se borra el PDF anterior (el que
  // solo tenía la rúbrica del profesor) — mismo orden de seguridad ya
  // usado en Reportes (registrarAprobacion): nunca se borra un archivo
  // antes de saber que la BD ya quedó consistente.
  try { fs.unlinkSync(rutaAbsoluta); } catch {}

  const alumnoUsuarioId = alumnoDe(evaluacion).usuario_id;
  await notificar(alumnoUsuarioId, 'Coordinación aprobó tu evaluación de desempeño. Ya puedes descargarla.', '/alumno/seguimiento-evaluacion');

  return { mensaje: 'Evaluación aprobada correctamente.', estado: ESTADO_EVALUACION_APROBADO_COORDINADOR };
}

/**
 * Flujo Alterno (CU-LSS-04, Camino A — RN-LSS-11): coordinador rechaza y
 * devuelve al PROFESOR para que corrija — nunca al alumno. Igual que
 * rechazarPorSiss (LSS-03), NO genera PDF, NO calcula hash, NO pide TSA:
 * un rechazo nunca debe tocar el documento (mismo criterio ya corregido
 * en el bug real de LSS-03).
 *
 * Punto 7 (bug real confirmado con evidencia de BD): el documento que el
 * profesor ya había firmado quedaba colgado (documento_id sin limpiar).
 * Investigado: corregirYReenviar (LSS-03) YA destruye y regenera ese
 * documento por completo en cuanto el profesor corrige (borrarEvaluacionExistenteSiHay
 * lo borra antes de generar el nuevo) — nada en el código actual lee ese
 * documento mientras la evaluación está en devuelta_para_correccion, así
 * que limpiarlo aquí no pierde ninguna referencia útil.
 *
 * Orden obligatorio (no se puede invertir): evaluacion_desempeno.documento_id
 * tiene onDelete:Cascade hacia `documento` — si se borrara `documento`
 * PRIMERO, cascadearía y borraría la propia fila evaluacion_desempeno que
 * se está actualizando. Por eso primero se actualiza evaluacion_desempeno
 * con documento_id:null (desacopla la referencia) y SOLO DESPUÉS de que
 * la transacción confirma se borra el documento huérfano + su archivo
 * físico — mismo patrón de seguridad "nunca borrar antes de confirmar BD"
 * ya usado en el resto del módulo.
 */
async function dictaminarRechazado(coordinadorUsuarioId, evaluacionId, motivoRechazoCoordinacion) {
  await resolverCoordinador(coordinadorUsuarioId);
  const evaluacion = await resolverEvaluacion(evaluacionId);
  exigirPendienteDictamen(evaluacion);

  if (!motivoRechazoCoordinacion || !motivoRechazoCoordinacion.trim()) {
    throw crearError('Debes indicar el motivo del rechazo.', 422, 'MOTIVO_REQUERIDO');
  }

  const documentoViejo = evaluacion.documento;

  await prisma.$transaction([
    prisma.evaluacion_desempeno.update({
      where: { id: evaluacion.id },
      data: { estado: ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION, motivo_rechazo_coordinacion: motivoRechazoCoordinacion, documento_id: null },
    }),
    prisma.revision_desempeno.create({
      data: {
        evaluacion_desempeno_id: evaluacion.id,
        usuario_id: coordinadorUsuarioId,
        tipo_revisor: 'coordinador',
        estado: 'rechazado',
        fecha: new Date(),
      },
    }),
  ]);

  // Solo tras confirmar la transacción se borra el documento huérfano —
  // ya no tiene ninguna fila que lo referencie.
  if (documentoViejo) {
    try { await prisma.documento.delete({ where: { id: documentoViejo.id } }); } catch (err) {
      console.error('No se pudo borrar el documento huérfano tras el rechazo:', err.message);
    }
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, documentoViejo.ruta_archivo)); } catch {}
  }

  const profesorUsuarioId = profesorUsuarioIdDe(evaluacion);
  const alumnoUsuarioId = alumnoDe(evaluacion).usuario_id;

  if (profesorUsuarioId) {
    await notificar(profesorUsuarioId, `Coordinación devolvió una evaluación para corrección: ${motivoRechazoCoordinacion}`, '/profesor/evaluar-alumno');
  }
  // RF-LSS-18: el alumno se entera, pero sin ninguna acción de su parte —
  // la corrección la hace el profesor (Camino A).
  await notificar(alumnoUsuarioId, 'Tu evaluación fue devuelta para corrección por coordinación. Tu profesor la está ajustando.', '/alumno/seguimiento-evaluacion');

  return { mensaje: 'Evaluación devuelta para corrección.', estado: ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-06: gestionar estado de carta de término (actor: Coordinador).
// Mismo criterio que CU-LSS-04: coordinación ve TODO, sin noción de
// "asignación" — reutiliza resolverCoordinador/emitirResumenActualizado
// ya definidos arriba en este mismo archivo.
// ─────────────────────────────────────────────────────────────

/**
 * TODOS los alumnos con una fila carta_termino, en cualquiera de los 3
 * estados — sin filtro de asignación (mismo criterio que
 * listarEvaluacionesPendientesDictamen).
 */
async function listarSolicitudesCartaTermino() {
  const cartas = await prisma.carta_termino.findMany({
    include: {
      liberacion_proceso: {
        include: {
          solicitud_registro: {
            include: {
              alumno: { include: { usuario: true } },
              oferta: { include: { profesor: { include: { usuario: true } } } },
            },
          },
        },
      },
    },
    orderBy: { fecha_solicitud: 'asc' },
  });

  return cartas.map((carta) => {
    const solicitud = carta.liberacion_proceso.solicitud_registro;
    return {
      liberacionProcesoId: carta.liberacion_proceso_id,
      boleta: solicitud.alumno.boleta,
      nombreCompleto: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
      profesorNombre: solicitud.oferta?.profesor
        ? `${solicitud.oferta.profesor.usuario.nombre} ${solicitud.oferta.profesor.usuario.apellidos}`
        : null,
      oferta: solicitud.oferta?.nombre_proyecto ?? null,
      estado: carta.estado,
      fechaSolicitud: carta.fecha_solicitud,
      fechaDisponible: carta.fecha_disponible,
      fechaRecogida: carta.fecha_recogida,
    };
  });
}

/**
 * RN-LSS-17: solo coordinador (resolverCoordinador ya lo exige — 404 si el
 * usuario autenticado no tiene perfil de coordinador; requireRole en la
 * ruta ya filtra por rol antes de llegar aquí). RN-LSS-19: el flujo solo
 * avanza — exigirEstadoCarta rechaza (409) si la carta no está
 * exactamente en 'solicitada'.
 */
async function marcarCartaListaParaRecoger(coordinadorUsuarioId, liberacionProcesoId) {
  await resolverCoordinador(coordinadorUsuarioId);

  const carta = await prisma.carta_termino.findUnique({
    where: { liberacion_proceso_id: Number(liberacionProcesoId) },
    include: {
      liberacion_proceso: {
        include: { solicitud_registro: { include: { alumno: true } } },
      },
    },
  });

  exigirEstadoCarta(carta, ESTADO_CARTA_SOLICITADA, 'Esta carta de término ya no está en el paso de solicitada.');

  await prisma.carta_termino.update({
    where: { id: carta.id },
    data: { estado: ESTADO_CARTA_LISTA_PARA_RECOGER, fecha_disponible: new Date() },
  });

  // Solo el emit — la notificación visible es la Tipo A calculada, ya
  // construida en CU-LSS-05 (resumenAlumno.cartaTerminoListaParaRecoger),
  // no se crea ninguna fila `notificacion` nueva aquí.
  const alumnoUsuarioId = carta.liberacion_proceso.solicitud_registro.alumno.usuario_id;
  emitirResumenActualizado(alumnoUsuarioId);

  return { mensaje: 'Carta de término marcada como lista para recoger.', estado: ESTADO_CARTA_LISTA_PARA_RECOGER };
}

module.exports = {
  listarEvaluacionesPendientesDictamen,
  descargarParaRevision,
  dictaminarAprobado,
  dictaminarRechazado,
  listarSolicitudesCartaTermino,
  marcarCartaListaParaRecoger,
};
