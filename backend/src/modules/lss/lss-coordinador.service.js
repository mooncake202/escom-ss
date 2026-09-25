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
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO,
  ESTADO_SOLICITUD_CONSTANCIA_TERMINO,
  ESTADO_CONSTANCIA_DISPONIBLE,
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

  // Bug real encontrado (auditoría de nombres de archivo LSS): mismo hueco
  // que descargarExpedienteParaRevision antes de corregirse.
  return { buffer: descifrarBuffer(bufferCifrado), nombreExpediente: evaluacion.documento.nombre_expediente };
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

// ─────────────────────────────────────────────────────────────
// CU-LSS-09: dictaminar expediente (actor: Coordinador). Mismo esquema
// exacto ya usado en CU-LSS-04 (dictaminar evaluación de desempeño) —
// reutiliza resolverCoordinador/emitirResumenActualizado/notificar ya
// definidos arriba en este mismo archivo.
//
// DECISIÓN CONFIRMADA (corrige una contradicción real de la ficha contra
// el diseño ya establecido en todo el módulo): la ficha dice que
// liberacion_proceso.estado debe cambiar a 'expediente_aprobado'/
// 'expediente_rechazado' — eso ROMPERÍA la guarda de ruta ya construida
// y verificada en CU-LSS-08 (que depende de que liberacion_proceso.estado
// se quede fijo en 'expediente_en_revision' durante todo este sub-ciclo,
// mismo criterio que 'evaluacion_solicitada' en 02→03→04). Aquí SOLO
// cambia documento.estado_documento y liberacion_proceso.observaciones_rechazo
// — el cambio real de liberacion_proceso.estado a
// 'solicitud_constancia_termino' ya lo maneja el ALUMNO en CU-LSS-08
// (ya construido), no coordinación aquí.
// ─────────────────────────────────────────────────────────────

/**
 * Trae el documento expediente_lss con todo lo necesario para
 * dictaminar/descargar/notificar: alumno+usuario, profesor+usuario (para
 * el listado), y liberacion_proceso (para observaciones_rechazo).
 */
async function resolverExpediente(documentoId) {
  const documento = await prisma.documento.findUnique({
    where: { id: Number(documentoId) },
    include: {
      alumno: {
        include: {
          usuario: true,
          solicitud_registro: {
            include: {
              oferta: { include: { profesor: { include: { usuario: true } } } },
              liberacion_proceso: true,
            },
          },
        },
      },
    },
  });
  if (!documento || documento.tipo_documento !== 'expediente_lss') {
    throw crearError('Expediente no encontrado.', 404);
  }
  return documento;
}

/**
 * Guardia de "no modificar ya dictaminado" (mismo criterio de seguridad
 * ya usado en todo el módulo, aunque la ficha no lo declare explícito
 * como RN separada) — 409 si el documento ya no está 'en_revision'.
 */
function exigirExpedienteEnRevision(documento) {
  if (documento.estado_documento !== ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION) {
    throw crearError('Este expediente ya fue dictaminado y no se puede modificar.', 409, 'EXPEDIENTE_YA_DICTAMINADO');
  }
}

function alumnoDeExpediente(documento) {
  return documento.alumno;
}

function liberacionProcesoDeExpediente(documento) {
  return documento.alumno.solicitud_registro.liberacion_proceso;
}

/**
 * TODOS los expedientes en 'en_revision' — sin filtro de asignación
 * (RN-LSS-28, mismo criterio que listarEvaluacionesPendientesDictamen).
 */
async function listarExpedientesPendientes() {
  const documentos = await prisma.documento.findMany({
    where: { tipo_documento: 'expediente_lss', estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION },
    include: {
      alumno: {
        include: {
          usuario: true,
          solicitud_registro: {
            include: { oferta: { include: { profesor: { include: { usuario: true } } } } },
          },
        },
      },
    },
    orderBy: { fecha_creacion: 'asc' },
  });

  return documentos.map((doc) => {
    const solicitud = doc.alumno.solicitud_registro;
    return {
      documentoId: doc.id,
      boleta: doc.alumno.boleta,
      nombreCompleto: `${doc.alumno.usuario.nombre} ${doc.alumno.usuario.apellidos}`,
      profesorNombre: solicitud?.oferta?.profesor
        ? `${solicitud.oferta.profesor.usuario.nombre} ${solicitud.oferta.profesor.usuario.apellidos}`
        : null,
      oferta: solicitud?.oferta?.nombre_proyecto ?? null,
      nombreExpediente: doc.nombre_expediente,
      fechaEnvio: doc.fecha_creacion,
    };
  });
}

/**
 * Coordinación revisa el expediente ANTES de dictaminar — mismo patrón de
 * descifrado en memoria ya usado en descargarParaRevision (LSS-04).
 */
async function descargarExpedienteParaRevision(coordinadorUsuarioId, documentoId) {
  await resolverCoordinador(coordinadorUsuarioId);
  const documento = await resolverExpediente(documentoId);

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, documento.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  // Mismo bug real que en descargarExpedienteLss (alumno): el nombre real
  // nunca se exponía al frontend.
  return { buffer: descifrarBuffer(bufferCifrado), nombreExpediente: documento.nombre_expediente };
}

/**
 * Flujo Principal — aprueba: documento.estado_documento='aprobado',
 * limpia observaciones_rechazo previas. liberacion_proceso.estado SIN
 * CAMBIO (ver nota de diseño arriba).
 */
async function dictaminarExpedienteAprobado(coordinadorUsuarioId, documentoId) {
  const coordinador = await resolverCoordinador(coordinadorUsuarioId);
  const documento = await resolverExpediente(documentoId);
  exigirExpedienteEnRevision(documento);

  const proceso = liberacionProcesoDeExpediente(documento);

  await prisma.$transaction([
    prisma.documento.update({
      where: { id: documento.id },
      data: { estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO, aprobado_por_id: coordinador.id },
    }),
    prisma.liberacion_proceso.update({
      where: { id: proceso.id },
      data: { observaciones_rechazo: null },
    }),
  ]);

  const alumnoUsuarioId = alumnoDeExpediente(documento).usuario_id;
  await notificar(alumnoUsuarioId, 'Coordinación aprobó tu expediente. Ya puedes solicitar tu constancia de término.', '/alumno/estado-resolucion');

  return { mensaje: 'Expediente aprobado correctamente.', estado: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO };
}

/**
 * Flujo Alterno — rechaza: RN-LSS-29 (observaciones obligatorias),
 * documento.estado_documento='rechazado', observaciones_rechazo=texto.
 * liberacion_proceso.estado SIN CAMBIO (ver nota de diseño arriba) — el
 * alumno vuelve a la fase de formulario (CU-LSS-07) a través de su propia
 * acción "Corregir y reenviar" (CU-LSS-08, ya construido), no aquí.
 */
async function dictaminarExpedienteRechazado(coordinadorUsuarioId, documentoId, observacionesRechazo) {
  await resolverCoordinador(coordinadorUsuarioId);
  const documento = await resolverExpediente(documentoId);
  exigirExpedienteEnRevision(documento);

  if (!observacionesRechazo || !observacionesRechazo.trim()) {
    throw crearError('Debes indicar las observaciones del rechazo.', 422, 'OBSERVACIONES_REQUERIDAS');
  }

  const proceso = liberacionProcesoDeExpediente(documento);

  await prisma.$transaction([
    prisma.documento.update({
      where: { id: documento.id },
      data: { estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO },
    }),
    prisma.liberacion_proceso.update({
      where: { id: proceso.id },
      data: { observaciones_rechazo: observacionesRechazo },
    }),
  ]);

  const alumnoUsuarioId = alumnoDeExpediente(documento).usuario_id;
  await notificar(alumnoUsuarioId, `Coordinación rechazó tu expediente: ${observacionesRechazo}`, '/alumno/estado-resolucion');

  return { mensaje: 'Expediente rechazado.', estado: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-11: gestionar estado de la constancia de término (actor:
// Coordinador) — último CU del módulo LSS. Mismo esquema exacto ya usado
// en CU-LSS-04/06/09 (resolverCoordinador/emitirResumenActualizado/
// notificar, reutilizados tal cual). A diferencia de LSS-04/09, aquí SÍ
// se sigue la ficha al pie de la letra: liberacion_proceso.estado avanza
// a 'constancia_disponible' (decisión confirmada por el usuario). La
// constancia es un PDF que coordinación SUBE MANUALMENTE (no generado
// con plantilla, a diferencia de la evaluación de desempeño).
// ─────────────────────────────────────────────────────────────

const TIPO_DOCUMENTO_CONSTANCIA_TERMINO = 'constancia_termino';

// Mismo criterio de duplicación ya usado en todo el proyecto (RN de
// separación por módulo) — idéntica a esPdfValido en lss-alumno.service.js.
function esPdfValido(buffer) {
  return !!buffer && buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

/**
 * RN-LSS-35 (matiz distinto a LSS-04/09): NO hay guardia de "ya
 * dictaminado" — el coordinador puede corregir cuantas veces necesite.
 * El único guardia real es que el alumno haya llegado al punto correcto
 * del proceso: 'solicitud_constancia_termino' (primera emisión) o ya
 * 'constancia_disponible' (corrección posterior). Cualquier otro estado
 * (el alumno ni siquiera ha solicitado su constancia todavía) se
 * rechaza.
 */
function exigirListoParaConstancia(proceso) {
  if (proceso.estado !== ESTADO_SOLICITUD_CONSTANCIA_TERMINO && proceso.estado !== ESTADO_CONSTANCIA_DISPONIBLE) {
    const error = new Error('Este alumno todavía no ha solicitado su constancia de término.');
    error.status = 409;
    throw error;
  }
}

/**
 * TODOS los alumnos con liberacion_proceso.estado en
 * ['solicitud_constancia_termino', 'constancia_disponible'] — sin filtro
 * de asignación (mismo criterio que listarEvaluacionesPendientesDictamen/
 * listarSolicitudesCartaTermino/listarExpedientesPendientes). Incluye
 * `emitida` (ya tiene documento constancia_termino o no) para que el
 * frontend distinga "emisión inicial" de "corrección".
 */
async function listarSolicitudesConstanciaPendientes() {
  const procesos = await prisma.liberacion_proceso.findMany({
    where: { estado: { in: [ESTADO_SOLICITUD_CONSTANCIA_TERMINO, ESTADO_CONSTANCIA_DISPONIBLE] } },
    include: {
      solicitud_registro: {
        include: {
          alumno: { include: { usuario: true } },
          oferta: { include: { profesor: { include: { usuario: true } } } },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const boletas = procesos.map((p) => p.solicitud_registro.alumno.boleta);
  const documentos = await prisma.documento.findMany({
    where: { tipo_documento: TIPO_DOCUMENTO_CONSTANCIA_TERMINO, alumno_id: { in: boletas } },
    select: { alumno_id: true, nombre_expediente: true },
  });
  const emitidaPorBoleta = new Map(documentos.map((d) => [d.alumno_id, d.nombre_expediente]));

  return procesos.map((proceso) => {
    const solicitud = proceso.solicitud_registro;
    return {
      liberacionProcesoId: proceso.id,
      boleta: solicitud.alumno.boleta,
      nombreCompleto: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
      profesorNombre: solicitud.oferta?.profesor
        ? `${solicitud.oferta.profesor.usuario.nombre} ${solicitud.oferta.profesor.usuario.apellidos}`
        : null,
      oferta: solicitud.oferta?.nombre_proyecto ?? null,
      emitida: emitidaPorBoleta.has(solicitud.alumno.boleta),
      nombreConstancia: emitidaPorBoleta.get(solicitud.alumno.boleta) ?? null,
    };
  });
}

/**
 * Flujo Principal (emisión inicial) Y Flujo Alterno 2.2/2.3 (corrección)
 * — misma función para ambos, la lógica de sobreescritura (update si ya
 * existe, create si no) lo maneja naturalmente. Mismo patrón de
 * cifrado/carpeta/borrado-solo-tras-confirmar que subirExpedienteLss
 * (LSS-07).
 */
async function emitirConstancia(coordinadorUsuarioId, liberacionProcesoId, archivoPdf) {
  await resolverCoordinador(coordinadorUsuarioId); // RN-LSS-32.

  const proceso = await prisma.liberacion_proceso.findUnique({
    where: { id: Number(liberacionProcesoId) },
    include: { solicitud_registro: { include: { alumno: { include: { usuario: true } } } } },
  });
  if (!proceso) throw crearError('Proceso de liberación no encontrado.', 404);

  exigirListoParaConstancia(proceso);

  if (!esPdfValido(archivoPdf?.buffer)) {
    throw crearError('El archivo no es un PDF válido.', 400);
  }

  const alumno = proceso.solicitud_registro.alumno;
  const nombreConstancia = `${alumno.boleta}_CONSTANCIA_TERMINO.pdf`;
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, alumno.boleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(alumno.boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(archivoPdf.buffer));

  const documentoExistente = await prisma.documento.findFirst({
    where: { alumno_id: alumno.boleta, tipo_documento: TIPO_DOCUMENTO_CONSTANCIA_TERMINO },
  });
  const rutaViejaABorrar = documentoExistente?.ruta_archivo ?? null;
  const ahora = new Date();

  try {
    await prisma.$transaction([
      documentoExistente
        ? prisma.documento.update({
            where: { id: documentoExistente.id },
            data: { ruta_archivo: rutaRelativa, nombre_expediente: nombreConstancia, fecha_creacion: ahora, creador_id: coordinadorUsuarioId },
          })
        : prisma.documento.create({
            data: {
              alumno_id: alumno.boleta,
              creador_id: coordinadorUsuarioId,
              tipo_documento: TIPO_DOCUMENTO_CONSTANCIA_TERMINO,
              fecha_creacion: ahora,
              estado_documento: 'disponible',
              ruta_archivo: rutaRelativa,
              nombre_expediente: nombreConstancia,
            },
          }),
      prisma.liberacion_proceso.update({
        where: { id: proceso.id },
        data: { estado: ESTADO_CONSTANCIA_DISPONIBLE },
      }),
    ]);
  } catch (err) {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa)); } catch {}
    throw crearError('Ocurrió un error al procesar la constancia.', 500);
  }

  if (rutaViejaABorrar) {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaViejaABorrar)); } catch {}
  }

  const alumnoUsuarioId = alumno.usuario_id;
  await notificar(alumnoUsuarioId, 'Tu constancia de término ya está disponible para descargar.', '/alumno/consultar-constancia-termino');

  return { mensaje: 'Constancia de término emitida correctamente.', estado: ESTADO_CONSTANCIA_DISPONIBLE };
}

module.exports = {
  listarEvaluacionesPendientesDictamen,
  descargarParaRevision,
  dictaminarAprobado,
  dictaminarRechazado,
  listarSolicitudesCartaTermino,
  marcarCartaListaParaRecoger,
  listarExpedientesPendientes,
  descargarExpedienteParaRevision,
  dictaminarExpedienteAprobado,
  dictaminarExpedienteRechazado,
  listarSolicitudesConstanciaPendientes,
  emitirConstancia,
};
