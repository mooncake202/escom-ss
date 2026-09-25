const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { descifrarBuffer, cifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');
const { unirPdfs, comprimirPdfGhostscript } = require('../../lib/pdfExpediente');
const { crearError, validarReportesValidadosSiss } = require('./validators');
const {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_REPORTE_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_RECHAZADA_POR_SISS,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
  ESTADO_SOLICITUD_CARTA_TERMINO,
  ESTADO_CARTA_SOLICITADA,
  ESTADO_CARTA_LISTA_PARA_RECOGER,
  ESTADO_CARTA_RECOGIDA,
  ESTADO_LIBERACION_CARTA_RECOGIDA,
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO,
  ESTADO_SOLICITUD_CONSTANCIA_TERMINO,
  exigirEstadoLiberacion,
  exigirEstadoEvaluacion,
  exigirEstadoCarta,
  exigirEstadoExpedienteLss,
} = require('./lss.shared');
const { calcularHorasNetas, LIMITE_HORAS_SERVICIO } = require('../ah/ah.shared');

// Misma carpeta que usa GR para documentos cifrados — duplicado a propósito
// (RN de separación por módulo, sin compartir código entre gr/ y lss/, mismo
// criterio ya usado en resolverAlumnoYSolicitud).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

/**
 * Socket genérico (fail-open): mismo criterio ya usado en ah-profesor.service.js
 * — avisa al profesor que su resumen del dashboard pudo haber cambiado (en
 * este caso, el conteo de alumnos con evaluación de desempeño solicitada).
 */
function emitirResumenActualizadoProfesor(profesorUsuarioId) {
  try {
    emitirAUsuario(profesorUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (profesor, lss):', err.message);
  }
}

/**
 * Mismo patrón exacto que emitirATodosLosCoordinadores en gr.service.js —
 * duplicado a propósito (RN de separación por módulo). Coordinación ve TODO
 * sin noción de "asignación" (mismo criterio que LSS-04/06), y la
 * infraestructura de sockets no tiene salas por rol todavía, así que se
 * emite individualmente a cada coordinador existente. Fail-open: nunca
 * tumba la operación de negocio que lo llama.
 */
async function emitirATodosLosCoordinadores(evento, datos) {
  try {
    const coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
    for (const c of coordinadores) {
      try {
        emitirAUsuario(c.usuario_id, evento, datos);
      } catch (err) {
        console.error(`Error al emitir ${evento} a coordinador ${c.usuario_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`Error al listar coordinadores para emitir ${evento}:`, err.message);
  }
}

/**
 * Mismo criterio, pero hacia el propio alumno — su widget de "Proceso de
 * Liberación del Servicio Social" en el dashboard debe desaparecer en vivo
 * al iniciar su evaluación (deja de mostrar el estado 1/2 y pasa a estado 3,
 * sin proceso mostrado todavía porque CU-LSS-02 no existe aún).
 */
function emitirResumenActualizadoAlumno(alumnoUsuarioId) {
  try {
    emitirAUsuario(alumnoUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (alumno, lss):', err.message);
  }
}

/**
 * Mismo patrón que resolverAlumnoYSolicitud en ah-alumno.service.js —
 * duplicado a propósito (RN de separación por actor, sin compartir código
 * entre módulos). Incluye `oferta` porque RN-LSS-02 depende de
 * tipo_oferta/estado_oferta.
 */
async function resolverAlumnoYSolicitud(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: {
          oferta: { include: { profesor: true } },
          liberacion_proceso: true,
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }

  return { alumno, solicitud: alumno.solicitud_registro };
}

/**
 * RN-LSS-02: calcula cada requisito por separado para que el frontend pinte
 * tarjetas verde/rojo. Reglas ya confirmadas con el usuario:
 * - Horas netas >= 480, aplica a AMBOS tipos de oferta sin excepción.
 * - Reportes: al menos 6 reporte_mensual enviados y TODOS con
 *   estado_reporte === 'aprobado_coordinador' (no solo 6 de los que haya),
 *   más el reporte_global también con estado_reporte === 'aprobado_coordinador'.
 *   Corregido: NO se usa revision_reporte_mensual/global para esto — esas
 *   tablas son el historial append-only de cada acción individual (alumno
 *   firma, profesor decide, coordinación decide), no el estado actual del
 *   reporte; usar "la revisión más reciente" daba falsos positivos justo
 *   después de que un alumno corrige y reenvía un reporte rechazado (su
 *   propia firma de reenvío queda como "más reciente" con estado
 *   'aprobado', aunque el reporte en realidad volvió a
 *   pendiente_revision_profesor). El estado real y único que importa vive
 *   directo en reporte_mensual.estado_reporte / reporte_global.estado_reporte.
 * - Oferta 'Concluida': SOLO aplica si tipo_oferta === 'individual'.
 */
async function calcularRequisitos(solicitud, alumnoBoleta) {
  const [cumulo, reportesMensuales, reporteGlobal] = await Promise.all([
    prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: alumnoBoleta } }),
    prisma.reporte_mensual.findMany({
      where: { solicitud_registro_id: solicitud.id },
      select: { estado_reporte: true },
    }),
    prisma.reporte_global.findFirst({
      where: { solicitud_registro_id: solicitud.id },
      select: { estado_reporte: true },
    }),
  ]);

  const horasNetas = calcularHorasNetas(cumulo);
  const cumpleHoras = horasNetas >= LIMITE_HORAS_SERVICIO;

  const totalReportesMensuales = reportesMensuales.length;
  const todosMensualesAprobados = totalReportesMensuales > 0
    && reportesMensuales.every((r) => r.estado_reporte === ESTADO_REPORTE_APROBADO_COORDINADOR);
  const cumpleMensuales = totalReportesMensuales >= 6 && todosMensualesAprobados;

  const globalAprobado = reporteGlobal?.estado_reporte === ESTADO_REPORTE_APROBADO_COORDINADOR;
  const cumpleReportes = cumpleMensuales && globalAprobado;

  const aplicaOferta = solicitud.oferta?.tipo_oferta === 'individual';
  const cumpleOferta = aplicaOferta ? solicitud.oferta.estado_oferta === 'Concluida' : true;

  const cumpleTodos = cumpleHoras && cumpleReportes && cumpleOferta;

  return {
    cumpleTodos,
    requisitos: {
      horas: { cumple: cumpleHoras, horasNetas, requeridas: LIMITE_HORAS_SERVICIO },
      reportes: {
        cumple: cumpleReportes,
        totalMensualesEnviados: totalReportesMensuales,
        todosMensualesAprobados,
        globalEnviado: !!reporteGlobal,
        globalAprobado,
      },
      oferta: { aplica: aplicaOferta, cumple: aplicaOferta ? cumpleOferta : null },
    },
  };
}

async function obtenerEstadoRequisitos(alumnoUsuarioId) {
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  if (solicitud.liberacion_proceso) {
    return { yaExiste: true, estado: solicitud.liberacion_proceso.estado };
  }

  const { cumpleTodos, requisitos } = await calcularRequisitos(solicitud, alumno.boleta);
  return { yaExiste: false, cumpleTodos, requisitos };
}

/**
 * RN-LSS-01: nunca crea un segundo proceso. RN-LSS-02: revalida TODO en el
 * backend — nunca confía en lo que el frontend ya mostró.
 */
async function iniciarEvaluacion(alumnoUsuarioId, reportesValidadosSiss) {
  validarReportesValidadosSiss(reportesValidadosSiss);

  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  if (solicitud.liberacion_proceso) {
    throw crearError('Ya tienes un proceso de liberación en curso.', 409);
  }

  const { cumpleTodos } = await calcularRequisitos(solicitud, alumno.boleta);
  if (!cumpleTodos) {
    throw crearError('No cumples los requisitos para iniciar la evaluación de desempeño.', 409);
  }

  const proceso = await prisma.liberacion_proceso.create({
    data: {
      solicitud_registro_id: solicitud.id,
      estado: ESTADO_EVALUACION_SOLICITADA,
      fecha_inicio: new Date(),
      reportes_validados_siss: reportesValidadosSiss,
    },
  });

  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) {
    emitirResumenActualizadoProfesor(profesorUsuarioId);
  }
  emitirResumenActualizadoAlumno(alumnoUsuarioId);

  return {
    id: proceso.id,
    estado: proceso.estado,
    fecha_inicio: proceso.fecha_inicio,
    reportes_validados_siss: proceso.reportes_validados_siss,
  };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-02: consultar y actuar sobre el estado de la evaluación de
// desempeño. NO construye ninguna lógica real de LSS-03/04 (el profesor/
// coordinación evaluando) — solo lee lo que esos CU futuros produzcan, y
// las acciones que le corresponden al alumno sobre eso.
// ─────────────────────────────────────────────────────────────

/**
 * Mismo patrón que resolverAlumnoYSolicitud, pero además exige que ya
 * exista liberacion_proceso (CU-LSS-02 en adelante no tiene sentido sin
 * uno) y trae evaluacion_desempeno + sus revisiones, y carta_termino, si
 * existen. Se reutiliza tal cual para CU-LSS-05 (carta_termino) — sin
 * duplicar un resolver aparte solo por eso, mismo criterio de reuso ya
 * usado en el resto de este archivo.
 */
async function resolverConEvaluacion(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: {
          oferta: { include: { profesor: true } },
          liberacion_proceso: {
            include: {
              evaluacion_desempeno: { include: { revision_desempeno: true } },
              carta_termino: true,
            },
          },
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }
  const solicitud = alumno.solicitud_registro;
  if (!solicitud.liberacion_proceso) {
    throw crearError('No tienes un proceso de liberación iniciado.', 404);
  }

  return { alumno, solicitud, proceso: solicitud.liberacion_proceso };
}

/**
 * RF-LSS — resuelve cuál de los 5 alternos de CU-LSS-02 le toca pintar al
 * frontend, sin que este tenga que reimplementar ninguna regla:
 * A: sin evaluar (evaluacion_desempeno no existe todavía).
 * B: profesor aprobó, coordinación pendiente.
 * C: profesor rechazó (reportes SISS no confirmados).
 * D: ambas firmas completas.
 * E: coordinación devolvió para corrección (CU-LSS-04, Camino A) — el
 *    alumno no hace nada aquí, le toca al profesor corregir y reenviar.
 *    Corregido: antes 'devuelta_para_correccion' caía por default en 'B'
 *    ("coordinación pendiente"), mensaje incorrecto porque coordinación
 *    YA actuó (rechazó) y la pelota está con el profesor, no con ella.
 */
async function obtenerEstadoEvaluacion(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  const evaluacion = proceso.evaluacion_desempeno;

  const base = {
    evaluacionDescargada: !!proceso.evaluacion_descargada,
    evaluacionSubidaSiss: !!proceso.evaluacion_subida_siss,
    reportesValidadosSiss: !!proceso.reportes_validados_siss,
  };

  if (!evaluacion) {
    return { alterno: 'A', firmadoProfesor: false, firmadoCoordinacion: false, motivoRechazo: null, ...base };
  }

  const firmaProfesor = evaluacion.revision_desempeno.find((r) => r.tipo_revisor === 'profesor');
  const firmaCoordinacion = evaluacion.revision_desempeno.find((r) => r.tipo_revisor === 'coordinador');

  const alterno = evaluacion.estado === ESTADO_EVALUACION_RECHAZADA_POR_SISS
    ? 'C'
    : evaluacion.estado === ESTADO_EVALUACION_APROBADO_COORDINADOR
      ? 'D'
      : evaluacion.estado === ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION
        ? 'E'
        : 'B';

  return {
    alterno,
    firmadoProfesor: firmaProfesor?.estado === 'aprobado',
    firmadoCoordinacion: firmaCoordinacion?.estado === 'aprobado',
    // Único campo de texto libre real asociado al profesor en el schema
    // (no existe motivo_rechazo_profesor — ese nombre solo existe para
    // coordinación, motivo_rechazo_coordinacion, terreno de LSS-04).
    motivoRechazo: alterno === 'C' ? (evaluacion.observaciones_profesor ?? null) : null,
    ...base,
  };
}

/**
 * RN-LSS-06: reenvía la solicitud tras un rechazo del profesor — solo
 * posible si el alumno confirma explícitamente reportesValidadosSiss=true.
 * Un rechazo por SISS (CU-LSS-03, rechazarPorSiss) NUNCA tiene documento
 * real detrás — documento_id es NULL a propósito (corregido: un rechazo no
 * tiene PDF/firma/hash/TSA, nunca debió tenerlos) — así que "revertir a
 * pendiente" es simplemente borrar la fila de evaluacion_desempeno (cascada
 * a revision_desempeno), sin ningún documento ni archivo que limpiar.
 */
async function reenviarSolicitudEvaluacion(alumnoUsuarioId, reportesValidadosSiss) {
  if (reportesValidadosSiss !== true) {
    throw crearError('Debes confirmar que ya subiste tus reportes al SISS antes de reenviar.');
  }

  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoLiberacion(proceso, ESTADO_EVALUACION_SOLICITADA, 'Tu proceso de liberación ya no está en el paso de evaluación.');
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_RECHAZADA_POR_SISS, 'Tu evaluación no está en estado de rechazo — no hay nada que reenviar.');

  const evaluacion = proceso.evaluacion_desempeno;

  await prisma.$transaction([
    prisma.evaluacion_desempeno.delete({ where: { id: evaluacion.id } }),
    prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { reportes_validados_siss: true } }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Tu solicitud fue reenviada correctamente.' };
}

/**
 * Alterno D: sirve el PDF real (descifrado) y marca evaluacion_descargada.
 * Exige ambas firmas completas (estado='aprobado_coordinador').
 */
async function marcarEvaluacionDescargada(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_APROBADO_COORDINADOR, 'Tu evaluación todavía no está disponible para descargar.');

  const documento = await prisma.documento.findUnique({ where: { id: proceso.evaluacion_desempeno.documento_id } });

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, documento.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  if (!proceso.evaluacion_descargada) {
    await prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { evaluacion_descargada: true } });
    emitirResumenActualizadoAlumno(alumnoUsuarioId);
  }

  // Bug real encontrado (auditoría de nombres de archivo LSS): faltaba
  // exponer el nombre real al frontend — mismo patrón ya corregido en
  // descargarExpedienteLss.
  return { buffer: descifrarBuffer(bufferCifrado), nombreExpediente: documento.nombre_expediente };
}

/**
 * RN-LSS-07 (orden obligatorio): no se puede confirmar la subida a SISS
 * sin haber descargado la evaluación primero — rechazo real en backend,
 * no solo bloqueo visual.
 */
async function confirmarSubidaSiss(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_APROBADO_COORDINADOR, 'Tu evaluación todavía no está disponible.');

  if (!proceso.evaluacion_descargada) {
    throw crearError('Debes descargar tu evaluación antes de confirmar que la subiste al SISS.', 409);
  }

  await prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { evaluacion_subida_siss: true } });
  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  return { mensaje: 'Confirmado.' };
}

/**
 * Cierre del Alterno D — exige ambos booleanos en true, avanza
 * liberacion_proceso.estado a 'solicitud_carta_termino' (CU-LSS-05), y
 * crea la fila carta_termino (estado='solicitada', fecha_solicitud=ahora)
 * en la MISMA transacción — es el único punto real donde "se solicita" la
 * carta, así que fecha_solicitud debe nacer aquí (campo obligatorio en el
 * schema, sin default) y no en un paso posterior (CU-LSS-05/06), evitando
 * una ventana de inconsistencia donde liberacion_proceso ya avanzó pero
 * carta_termino todavía no existe.
 */
async function solicitarCartaTermino(alumnoUsuarioId) {
  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoLiberacion(proceso, ESTADO_EVALUACION_SOLICITADA, 'Tu proceso de liberación ya no está en el paso de evaluación.');

  if (!proceso.evaluacion_descargada || !proceso.evaluacion_subida_siss) {
    throw crearError('Debes descargar tu evaluación y confirmar que ya la subiste al SISS antes de continuar.', 409);
  }

  await prisma.$transaction([
    prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { estado: ESTADO_SOLICITUD_CARTA_TERMINO } }),
    prisma.carta_termino.create({
      data: {
        liberacion_proceso_id: proceso.id,
        estado: ESTADO_CARTA_SOLICITADA,
        carta_recogida: false,
        fecha_solicitud: new Date(),
      },
    }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Solicitud de carta de término enviada.', estado: ESTADO_SOLICITUD_CARTA_TERMINO };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-05: consultar y confirmar la recogida de la carta de término.
// NO construye ninguna lógica real de CU-LSS-06 (coordinación marcando la
// carta como lista) — el seed de prueba simula ese paso mientras ese CU no
// exista.
// ─────────────────────────────────────────────────────────────

/**
 * Flujo Principal — consulta pura, sin cambios en BD. Fail-safe a
 * ESTADO_CARTA_SOLICITADA si por algún motivo la fila no existe todavía
 * (no debería pasar, solicitarCartaTermino ya la crea).
 */
async function obtenerEstadoCarta(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  return { estado: proceso.carta_termino?.estado ?? ESTADO_CARTA_SOLICITADA };
}

/**
 * Flujo Alterno — RN-LSS-16: rechazo real en backend (409) si coordinación
 * todavía no marcó la carta como disponible, no solo bloqueo visual.
 * RF-LSS-23: fecha de recogida registrada en carta_termino.fecha_recogida.
 */
async function confirmarRecogida(alumnoUsuarioId) {
  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoCarta(proceso.carta_termino, ESTADO_CARTA_LISTA_PARA_RECOGER, 'Tu carta de término todavía no está lista para recoger.');

  await prisma.$transaction([
    prisma.carta_termino.update({
      where: { id: proceso.carta_termino.id },
      data: { estado: ESTADO_CARTA_RECOGIDA, carta_recogida: true, fecha_recogida: new Date() },
    }),
    prisma.liberacion_proceso.update({
      where: { id: proceso.id },
      data: { estado: ESTADO_LIBERACION_CARTA_RECOGIDA, carta_termino_recogida: true },
    }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Recogida confirmada.', estado: ESTADO_LIBERACION_CARTA_RECOGIDA };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-07: gestionar integración de expediente (actor: Alumno).
// Reutiliza el mecanismo YA PROBADO de GR (CU-GR-10, subirExpediente en
// gr.service.js) — unirPdfs de backend/src/lib/pdfExpediente.js (genérico,
// sin cambios), y el mismo criterio de cifrado/nombre/carpeta que el resto
// del proyecto. SÍ reutiliza comprimirPdfGhostscript (ampliación confirmada
// por el usuario tras encontrar el bug de archivos grandes): a diferencia
// de GR, que hace hasta 2 intentos en cascada (/ebook, luego /screen) sobre
// su límite de 2MB, aquí es UN SOLO intento con '/ebook' sobre el límite de
// 1MB — si tras ese único intento sigue superando 1MB, se rechaza.
//
// Diseño de estados (confirmado con el usuario): liberacion_proceso.estado
// se queda fijo en 'expediente_en_revision' durante TODO el sub-ciclo
// 07→08→09 (mismo criterio que 'evaluacion_solicitada' en 02→03→04) — la
// granularidad real vive en documento.estado_documento
// ('en_revision'/'rechazado'/'aprobado').
// ─────────────────────────────────────────────────────────────

// Mismo criterio de duplicación ya usado en todo el proyecto (RN de
// separación por módulo) — idéntica a esPdfValido en gr.service.js.
function esPdfValido(buffer) {
  return !!buffer && buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

const LIMITE_EXPEDIENTE_LSS_BYTES = 1 * 1024 * 1024; // 1 MB — RN-LSS-25 (desviación intencional de la ficha, confirmada por el usuario: NO son 2MB).

/**
 * Trae alumno+usuario (para el nombre del expediente), solicitud_registro
 * (campo `dictamen`, RN-LSS-22), liberacion_proceso, y el documento
 * expediente_lss más reciente si existe (alumno_id + tipo_documento, mismo
 * patrón "findFirst sin orderBy" ya usado en GR — nunca hay más de uno,
 * siempre se sobreescribe).
 */
async function resolverParaExpediente(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: { usuario: true, solicitud_registro: { include: { liberacion_proceso: true } } },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de servicio social.', 404);

  const solicitud = alumno.solicitud_registro;
  const proceso = solicitud.liberacion_proceso;
  if (!proceso) throw crearError('No tienes un proceso de liberación iniciado.', 404);

  const documentoExpediente = await prisma.documento.findFirst({ where: { alumno_id: alumno.boleta, tipo_documento: 'expediente_lss' } });

  return { alumno, solicitud, proceso, documentoExpediente };
}

// RN-LSS-24 (desviación intencional de la ficha, confirmada por el
// usuario): BOLETA_PATERNO_MATERNO_NOMBRE(S) — boleta AL INICIO, en vez de
// al final como decía la ficha original.
function nombreExpedienteLss(alumno) {
  const [apellidoPaterno, apellidoMaterno = ''] = alumno.usuario.apellidos.trim().split(/\s+/);
  const nombreLimpio = alumno.usuario.nombre.trim().replace(/\s+/g, '_');
  return `${alumno.boleta}_${apellidoPaterno}_${apellidoMaterno}_${nombreLimpio}.pdf`;
}

function estadoExpedienteVisible(documentoExpediente) {
  if (!documentoExpediente) return 'sin_enviar';
  return documentoExpediente.estado_documento; // 'en_revision' | 'rechazado' | 'aprobado'
}

/**
 * Flujo Principal, datos previos a mostrar la pantalla — RN-LSS-22
 * (requiereDictamen), RF-LSS-38 (observaciones de rechazo).
 */
async function obtenerInfoExpediente(alumnoUsuarioId) {
  const { alumno, solicitud, proceso, documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);

  return {
    estado: estadoExpedienteVisible(documentoExpediente),
    requiereDictamen: solicitud.dictamen !== null,
    nombreExpedienteSugerido: nombreExpedienteLss(alumno),
    observacionesRechazo: documentoExpediente?.estado_documento === ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO ? (proceso.observaciones_rechazo ?? null) : null,
  };
}

/**
 * Flujo Principal / Flujo Alterno 1.1 (reenvío tras rechazo, RN-LSS-23):
 * mismo mecanismo exacto en ambos casos — siempre se reemplazan TODOS los
 * documentos, nunca solo el que causó el rechazo.
 */
async function subirExpedienteLss(alumnoUsuarioId, archivos) {
  const { cartaCompromiso, cartaTermino, dictamen } = archivos;

  const { alumno, solicitud, proceso, documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);

  exigirEstadoExpedienteLss(documentoExpediente, 'Tu expediente ya fue enviado y no se puede modificar en este momento.');

  // RN-LSS-21.
  if (!cartaCompromiso || !cartaTermino) {
    throw crearError('Debes adjuntar la carta compromiso y la carta de término.');
  }

  // RN-LSS-22: el dictamen solo es obligatorio si se declaró en CU-GR-01.
  const requiereDictamen = solicitud.dictamen !== null;
  if (requiereDictamen && !dictamen) {
    throw crearError('Debes adjuntar tu documento de dictamen.');
  }

  // Orden fijo (sin desviación respecto a la ficha): carta_compromiso -> carta_termino -> dictamen (si aplica).
  const documentosOrdenados = [
    { clave: 'cartaCompromiso', archivo: cartaCompromiso },
    { clave: 'cartaTermino', archivo: cartaTermino },
    ...(requiereDictamen ? [{ clave: 'dictamen', archivo: dictamen }] : []),
  ];

  for (const { archivo } of documentosOrdenados) {
    if (!esPdfValido(archivo.buffer)) {
      throw crearError('Alguno de los archivos no es un PDF válido.');
    }
  }

  let pdfUnido;
  try {
    pdfUnido = await unirPdfs(documentosOrdenados.map((d) => d.archivo.buffer));
  } catch (err) {
    console.error('Error al unir los PDFs del expediente LSS:', err);
    throw crearError('No se pudieron combinar los documentos. Verifica que todos sean PDFs válidos.', 500);
  }

  // RN-LSS-25: si el combinado supera 1MB, se intenta UN SOLO pase de
  // compresión con Ghostscript ('/ebook', mismo mecanismo que GR pero sin
  // su cascada a '/screen') antes de rechazar — ampliación confirmada por
  // el usuario tras el bug de archivos grandes en CU-LSS-07.
  if (pdfUnido.length > LIMITE_EXPEDIENTE_LSS_BYTES) {
    try {
      pdfUnido = await comprimirPdfGhostscript(pdfUnido, '/ebook');
    } catch (err) {
      console.error('Error al comprimir el expediente LSS con Ghostscript:', err);
      // Fail-open: si Ghostscript falla, se sigue con el buffer original y
      // se deja que la validación de tamaño de abajo decida (no se rompe
      // el flujo por un problema del compresor).
    }
  }

  if (pdfUnido.length > LIMITE_EXPEDIENTE_LSS_BYTES) {
    throw crearError('El expediente combinado supera 1 MB, incluso después de intentar comprimirlo. Reduce el tamaño de tus documentos e intenta de nuevo.', 400, 'EXPEDIENTE_MUY_GRANDE');
  }

  const nombreExpediente = nombreExpedienteLss(alumno);
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, alumno.boleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(alumno.boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(pdfUnido));

  const ahora = new Date();
  let rutaViejaABorrar = null;

  try {
    await prisma.$transaction(async (tx) => {
      if (documentoExpediente) {
        rutaViejaABorrar = documentoExpediente.ruta_archivo;
        await tx.documento.update({
          where: { id: documentoExpediente.id },
          data: { ruta_archivo: rutaRelativa, nombre_expediente: nombreExpediente, estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION, creador_id: alumnoUsuarioId, fecha_creacion: ahora, aprobado_por_id: null },
        });
      } else {
        await tx.documento.create({
          data: { alumno_id: alumno.boleta, creador_id: alumnoUsuarioId, tipo_documento: 'expediente_lss', fecha_creacion: ahora, estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION, ruta_archivo: rutaRelativa, nombre_expediente: nombreExpediente },
        });
      }
      // Corrección retroactiva (CU-LSS-08): observaciones_rechazo YA NO se
      // limpia aquí. Confirmado contra el patrón real de GR
      // (gr-coordinador.service.js:358) — motivo_rechazo solo se limpia al
      // APROBAR definitivamente, nunca al reenviar. Se queda visible hasta
      // que coordinación (CU-LSS-09, no existe todavía) decida.
      await tx.liberacion_proceso.update({
        where: { id: proceso.id },
        data: { estado: ESTADO_EXPEDIENTE_EN_REVISION },
      });
    });
  } catch (err) {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa)); } catch {}
    throw crearError('Ocurrió un error al procesar tu expediente.', 500);
  }

  if (rutaViejaABorrar) {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaViejaABorrar)); } catch {}
  }

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);
  // Bug real encontrado en vivo: faltaba este emit — coordinación nunca se
  // enteraba en tiempo real de un expediente nuevo (RF-LSS-32, la
  // notificación calculada del dashboard solo se refrescaba al recargar).
  await emitirATodosLosCoordinadores('resumen:actualizado', {});

  return { mensaje: 'Tu expediente fue enviado correctamente y será revisado por Coordinación.', estado: ESTADO_EXPEDIENTE_EN_REVISION };
}

/**
 * Ver/descargar el expediente propio ya enviado — descifrado en memoria,
 * mismo patrón que marcarEvaluacionDescargada (LSS-02) / descargarParaRevision (LSS-04).
 */
async function descargarExpedienteLss(alumnoUsuarioId) {
  const { documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);
  if (!documentoExpediente) {
    throw crearError('Todavía no has enviado tu expediente.', 404);
  }

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, documentoExpediente.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  // Bug real encontrado: el nombre real (BOLETA_PATERNO_MATERNO_NOMBRE.pdf,
  // ya generado y guardado en documento.nombre_expediente) nunca se
  // exponía al frontend — la descarga se guardaba con un nombre genérico.
  return { buffer: descifrarBuffer(bufferCifrado), nombreExpediente: documentoExpediente.nombre_expediente };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-08: consultar estado del expediente y actuar sobre la resolución
// (actor: Alumno). NO construye ninguna lógica real de CU-LSS-09
// (coordinación dictaminando) — solo lee lo que ese CU futuro produzca
// (simulado por el seed sembrar-dictamen-expediente-prueba.js mientras no
// exista), y las 2 acciones que le corresponden al alumno sobre eso.
// ─────────────────────────────────────────────────────────────

/**
 * Flujo Principal — consulta pura, sin cambios en BD.
 */
async function obtenerEstadoExpediente(alumnoUsuarioId) {
  const { proceso, documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);
  return {
    estado: estadoExpedienteVisible(documentoExpediente),
    observacionesRechazo: documentoExpediente?.estado_documento === ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO ? (proceso.observaciones_rechazo ?? null) : null,
  };
}

/**
 * Alterno B — RN: solo se puede solicitar constancia si el expediente
 * está realmente 'aprobado' (guardia real, no solo visual).
 */
async function solicitarConstanciaTermino(alumnoUsuarioId) {
  const { proceso, documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);

  if (documentoExpediente?.estado_documento !== ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO) {
    throw crearError('Tu expediente todavía no ha sido aprobado.', 409);
  }

  await prisma.liberacion_proceso.update({
    where: { id: proceso.id },
    data: { estado: ESTADO_SOLICITUD_CONSTANCIA_TERMINO },
  });

  emitirResumenActualizadoAlumno(alumnoUsuarioId);

  return { mensaje: 'Solicitud de constancia de término enviada.', estado: ESTADO_SOLICITUD_CONSTANCIA_TERMINO };
}

/**
 * Alterno C — "Corregir y reenviar": mismo mecanismo exacto que
 * corregirExpediente de GR (gr.service.js) — investigado y confirmado
 * (Paso 1, CU-LSS-08): SÍ hay un cambio real de BD aquí, aunque NO se
 * toque `documento` (se queda 'rechazado' hasta el reenvío real, que
 * subirExpedienteLss ya maneja). Solo cambia la FASE
 * (liberacion_proceso.estado) de vuelta a 'carta_recogida' — la misma
 * que ya usa CU-LSS-07 — para que la guarda de ruta (RutaProtegida
 * guardaLSS) permita reingresar a esa pantalla. Sin este cambio real, un
 * navigate() ciego sería rebotado de inmediato por la guarda, que sigue
 * viendo liberacion_proceso.estado='expediente_en_revision'.
 */
async function corregirExpedienteLss(alumnoUsuarioId) {
  const { proceso, documentoExpediente } = await resolverParaExpediente(alumnoUsuarioId);

  if (documentoExpediente?.estado_documento !== ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO) {
    throw crearError('Tu expediente no está en estado de rechazo — no hay nada que corregir.', 409);
  }

  await prisma.liberacion_proceso.update({
    where: { id: proceso.id },
    data: { estado: ESTADO_LIBERACION_CARTA_RECOGIDA },
  });

  return { mensaje: 'Vuelve a integrar y enviar tu expediente.', estado: ESTADO_LIBERACION_CARTA_RECOGIDA };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-10: consultar el mensaje de la constancia de término (actor:
// Alumno). CORRECCIÓN ARQUITECTÓNICA (reemplaza el diseño anterior de
// archivo/descarga): la constancia es un MENSAJE DE TEXTO LIBRE que
// coordinación redacta (CU-LSS-11) con un enlace a
// serviciosocialconstancias.ipn.mx embebido — el alumno lo lee directo
// aquí, no hay ningún archivo que descargar de nuestro sistema. Sin
// cambios en BD en este CU (confirmado con el usuario) —
// liberacion_proceso.estado no se toca aquí.
// ─────────────────────────────────────────────────────────────

/**
 * RN-LSS-30: la existencia misma de liberacion_proceso.mensaje_constancia_termino
 * ES la señal de disponibilidad — no se necesita ningún campo de estado
 * adicional.
 */
async function obtenerEstadoConstancia(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  return {
    estado: proceso.mensaje_constancia_termino ? 'disponible' : 'pendiente',
    mensaje: proceso.mensaje_constancia_termino,
  };
}

module.exports = {
  obtenerEstadoRequisitos,
  iniciarEvaluacion,
  obtenerEstadoEvaluacion,
  reenviarSolicitudEvaluacion,
  marcarEvaluacionDescargada,
  confirmarSubidaSiss,
  solicitarCartaTermino,
  obtenerEstadoCarta,
  confirmarRecogida,
  obtenerInfoExpediente,
  subirExpedienteLss,
  descargarExpedienteLss,
  obtenerEstadoExpediente,
  solicitarConstanciaTermino,
  corregirExpedienteLss,
  obtenerEstadoConstancia,
};
