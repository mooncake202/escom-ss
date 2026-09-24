const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const { cifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');
const { crearError } = require('./validators');
const { generarPdfEvaluacion, agregarRubricaProfesor } = require('./lss.pdf');
const { obtenerRubricaProfesor } = require('./lss.rubricas');
const { solicitarSelloTiempo, ErrorTsa } = require('../../lib/timestampTsa');
const {
  sha256,
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EVALUACION_RECHAZADA_POR_SISS,
  ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
  nombreCompletoCarrera,
  validarYCalcularPuntajes,
  exigirEstadoEvaluacion,
} = require('./lss.shared');

/**
 * RF-LSS-02/RF-LSS-04: notificación Tipo A calculada del dashboard de
 * profesor — cuántos alumnos de ESTE profesor tienen una evaluación de
 * desempeño cuya acción pendiente es REALMENTE del profesor:
 * - evaluacion_desempeno no existe todavía (nunca evaluado), O
 * - existe en 'devuelta_para_correccion' (RN-LSS-11, coordinación la
 *   regresó para que el profesor corrija).
 * Corregido: antes solo filtraba liberacion_proceso.estado (que NO cambia
 * durante todo LSS-02/03/04), así que seguía contando alumnos ya
 * rechazados (le toca al alumno reenviar), en pendiente_dictamen (le toca
 * a coordinación) o aprobado_coordinador (le toca al alumno
 * descargar/confirmar) — ninguno de esos 3 es responsabilidad del
 * profesor en este momento.
 */
async function contarAlumnosConEvaluacionSolicitada(profesorId) {
  return prisma.liberacion_proceso.count({
    where: {
      estado: ESTADO_EVALUACION_SOLICITADA,
      solicitud_registro: { oferta: { profesor_id: profesorId } },
      OR: [
        { evaluacion_desempeno: null },
        { evaluacion_desempeno: { estado: ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION } },
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-03: evaluar el desempeño del alumno (actor: Profesor).
//
// Misma carpeta que usa GR/LSS-02 para documentos cifrados — duplicado a
// propósito (RN de separación por módulo).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

// RN-LSS-10: estados de evaluacion_desempeno ya "enviada" — ninguna función
// de este archivo puede tocarla salvo corregirYReenviar (Alterno 1.3), y
// esa exige un tercer estado (devuelta_para_correccion) que NO está en esta
// lista.
const ESTADOS_EVALUACION_BLOQUEADA = [ESTADO_EVALUACION_PENDIENTE_DICTAMEN, ESTADO_EVALUACION_APROBADO_COORDINADOR];

function emitirResumenActualizado(usuarioId) {
  try {
    emitirAUsuario(usuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (lss, profesor):', err.message);
  }
}

/**
 * RN-LSS-07: solo el profesor asignado a la oferta del alumno puede
 * evaluarlo — 404 "Alumno no encontrado" si no (mismo criterio ya usado en
 * obtenerHistorialAlumnoDeProfesor, ah-profesor.service.js), en vez de un
 * 403 que revelaría que el alumno existe pero no es suyo.
 */
async function resolverAlumnoDeProfesor(profesorUsuarioId, alumnoBoleta) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: profesorUsuarioId }, include: { usuario: true } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404);

  const solicitud = await prisma.solicitud_registro.findFirst({
    where: { alumno_id: alumnoBoleta, oferta: { profesor_id: profesor.id } },
    include: {
      alumno: { include: { usuario: true } },
      carrera: true,
      oferta: { include: { coordinador: { include: { usuario: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
      liberacion_proceso: { include: { evaluacion_desempeno: { include: { revision_desempeno: true } } } },
    },
  });
  if (!solicitud) throw crearError('Alumno no encontrado.', 404);
  if (!solicitud.liberacion_proceso) {
    throw crearError('Este alumno todavía no inició su proceso de liberación.', 404);
  }

  return { profesor, solicitud, proceso: solicitud.liberacion_proceso };
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function datosParaPdf(solicitud, observacionesProfesor, profesor, valores, sumaTotal) {
  return {
    alumno: {
      nombreCompleto: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
      boleta: solicitud.alumno.boleta,
      carreraNombre: nombreCompletoCarrera(solicitud.carrera?.nombre),
    },
    unidadAcademica: 'ESCOM',
    periodo: {
      inicioTexto: formatearFecha(solicitud.periodo_registro?.evento_calendario?.fecha_inicio),
      finTexto: formatearFecha(solicitud.periodo_registro?.evento_calendario?.fecha_fin),
    },
    observaciones: observacionesProfesor || '',
    responsable: { nombreCompleto: `${profesor.usuario.nombre} ${profesor.usuario.apellidos}` },
    valores: valores || {},
    sumaTotal: sumaTotal || 0,
  };
}

/**
 * Pasos 4-9 del flujo principal (generar PDF, incrustar rúbrica, hash,
 * sello TSA, cifrar y guardar en disco) — compartidos entre
 * registrarEvaluacion, rechazarPorSiss y corregirYReenviar, ya que los tres
 * regeneran el documento completo desde cero (mismo criterio confirmado:
 * "fidelidad estructural, no pixel-perfect"). `valores`/`sumaTotal` son
 * opcionales aquí a propósito: rechazarPorSiss no captura puntajes (rechaza
 * ANTES de evaluar por factores), así que su PDF muestra la tabla sin
 * marcar ("—") en vez de inventar datos.
 */
async function generarYGuardarDocumento(solicitud, profesor, observacionesProfesor, valores, sumaTotal) {
  const rubrica = obtenerRubricaProfesor(profesor.usuario.correo_institucional);
  if (!rubrica) {
    throw crearError('Registra tu firma (rúbrica) antes de evaluar — no se encontró ninguna guardada para tu cuenta.', 409, 'RUBRICA_NO_ENCONTRADA');
  }

  const pdfBase = await generarPdfEvaluacion(datosParaPdf(solicitud, observacionesProfesor, profesor, valores, sumaTotal));
  const pdfFinal = await agregarRubricaProfesor(pdfBase, rubrica);
  const hashDocumento = sha256(pdfFinal);

  let sello;
  try {
    sello = await solicitarSelloTiempo(hashDocumento);
  } catch (err) {
    if (err instanceof ErrorTsa) {
      throw crearError(`No se pudo obtener el sello de tiempo de la evaluación (${err.codigo}): ${err.message}`, 502, err.codigo);
    }
    throw err;
  }

  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, solicitud.alumno_id);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(solicitud.alumno_id, generarNombreSeguro());
  const rutaAbsoluta = path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa);
  fs.writeFileSync(rutaAbsoluta, cifrarBuffer(pdfFinal));

  return { rutaRelativa, rutaAbsoluta, hashDocumento, sello };
}

/**
 * Patrón "borrar y recrear" (RN confirmada, mismo criterio ya usado en
 * reenviarSolicitudEvaluacion de LSS-02): como liberacion_proceso_id es
 * único en evaluacion_desempeno, no se puede "revertir a sin evaluar" sin
 * borrar la fila completa. Solo se llama cuando la evaluación existente NO
 * está en un estado bloqueado (RN-LSS-10 ya se validó antes de invocarla).
 *
 * documento_id es NULLABLE (un rechazo por SISS no tiene documento real
 * detrás) — si la evaluación previa era un rechazo, no hay nada que borrar
 * en `documento` ni en disco, solo la fila de evaluacion_desempeno misma
 * (que no tiene onDelete:Cascade disparándose porque no hay documento
 * padre); se borra directo por su propio id.
 */
async function borrarEvaluacionExistenteSiHay(proceso) {
  const evaluacion = proceso.evaluacion_desempeno;
  if (!evaluacion) return;

  if (!evaluacion.documento_id) {
    await prisma.evaluacion_desempeno.delete({ where: { id: evaluacion.id } });
    return;
  }

  const documentoViejo = await prisma.documento.findUnique({ where: { id: evaluacion.documento_id } });
  // onDelete: Cascade en evaluacion_desempeno.documento_id -> borra también
  // evaluacion_desempeno y, de ahí, revision_desempeno.
  await prisma.documento.delete({ where: { id: evaluacion.documento_id } });

  if (documentoViejo) {
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, documentoViejo.ruta_archivo)); } catch {}
  }
}

/**
 * Paso 10 del flujo principal: transacción atómica documento +
 * evaluacion_desempeno + revision_desempeno. NO incluye hash_rubrica
 * (decisión confirmada: el hash_documento del PDF final ya cubre la
 * integridad de la rúbrica incrustada, mismo criterio que Reportes).
 */
async function crearEvaluacionEnTransaccion({ solicitud, proceso, profesor, estado, observacionesProfesor, reportesSissConfirmados, puntajesFactores, rutaRelativa, hashDocumento, sello, ipFirma }) {
  return prisma.$transaction(async (tx) => {
    const documento = await tx.documento.create({
      data: {
        alumno_id: solicitud.alumno_id,
        creador_id: profesor.usuario_id,
        tipo_documento: 'evaluacion_desempeno',
        fecha_creacion: new Date(),
        estado_documento: 'pendiente',
        ruta_archivo: rutaRelativa,
      },
    });

    const evaluacion = await tx.evaluacion_desempeno.create({
      data: {
        documento_id: documento.id,
        liberacion_proceso_id: proceso.id,
        estado,
        observaciones_profesor: observacionesProfesor || null,
        reportes_siss_confirmados: reportesSissConfirmados,
        fecha_evaluacion: new Date(),
        // Puntajes ya validados por validarYCalcularPuntajes — esta función
        // ahora SOLO la usan registrarEvaluacion/corregirYReenviar (rechazarPorSiss
        // tiene su propia crearRechazoEnTransaccion, sin documento ni PDF).
        puntajes_factores: puntajesFactores || null,
      },
    });

    await tx.revision_desempeno.create({
      data: {
        evaluacion_desempeno_id: evaluacion.id,
        usuario_id: profesor.usuario_id,
        tipo_revisor: 'profesor',
        estado: 'aprobado',
        hash_documento: hashDocumento,
        ip_firma: ipFirma || null,
        token_tsa: sello.token,
        fecha: new Date(),
      },
    });

    return { documento, evaluacion };
  });
}

/**
 * Rechazo por SISS (Alterno 3.1): a diferencia de crearEvaluacionEnTransaccion,
 * NO crea ningún `documento` — un rechazo no tiene PDF, no tiene firma, no
 * tiene rúbrica, no tiene hash ni sello TSA que calcular. `documento_id`
 * queda NULL (columna nullable a propósito, ver schema.prisma). La fila de
 * revision_desempeno sí se crea (deja registro de auditoría de quién
 * rechazó y cuándo), pero con hash_documento/token_tsa/ip_firma en NULL —
 * esos 3 campos ya eran nullable en el schema, confirmando que esto era
 * exactamente el caso para el que se diseñaron.
 */
async function crearRechazoEnTransaccion({ proceso, profesor, observacionesProfesor }) {
  return prisma.$transaction(async (tx) => {
    const evaluacion = await tx.evaluacion_desempeno.create({
      data: {
        documento_id: null,
        liberacion_proceso_id: proceso.id,
        estado: ESTADO_EVALUACION_RECHAZADA_POR_SISS,
        observaciones_profesor: observacionesProfesor,
        reportes_siss_confirmados: false,
        fecha_evaluacion: new Date(),
        puntajes_factores: null,
      },
    });

    await tx.revision_desempeno.create({
      data: {
        evaluacion_desempeno_id: evaluacion.id,
        usuario_id: profesor.usuario_id,
        tipo_revisor: 'profesor',
        estado: 'rechazado',
        fecha: new Date(),
      },
    });

    return { evaluacion };
  });
}

/**
 * Genera el documento (pasos 4-9) y lo persiste (paso 10) dentro de una
 * misma operación, descartando el archivo físico si la transacción falla
 * DESPUÉS de haberlo escrito en disco (paso 11 — mismo patrón try/catch que
 * ya usa Reportes).
 */
async function generarYPersistirEvaluacion({ solicitud, proceso, profesor, estado, observacionesProfesor, reportesSissConfirmados, puntajesFactores, sumaTotal, ipFirma }) {
  const { rutaRelativa, rutaAbsoluta, hashDocumento, sello } = await generarYGuardarDocumento(solicitud, profesor, observacionesProfesor, puntajesFactores, sumaTotal);

  try {
    return await crearEvaluacionEnTransaccion({
      solicitud, proceso, profesor, estado, observacionesProfesor, reportesSissConfirmados, puntajesFactores, rutaRelativa, hashDocumento, sello, ipFirma,
    });
  } catch (err) {
    try { fs.unlinkSync(rutaAbsoluta); } catch {}
    throw err;
  }
}

async function notificarAlumno(alumnoUsuarioId, mensaje) {
  try {
    await crearNotificacion({ usuarioId: alumnoUsuarioId, tipo: 'info', mensaje, rutaRelacionada: '/alumno/seguimiento-evaluacion' });
  } catch (err) {
    console.error('Error al crear notificación de evaluación para el alumno:', err.message);
  }
  emitirResumenActualizado(alumnoUsuarioId);
}

/**
 * Paso 13: Tipo A calculada (sin fila en `notificacion`) — el dashboard de
 * coordinación recalcula su conteo de "pendiente_dictamen" en cada consulta
 * (ver dashboard.service.js), así que aquí solo hace falta avisar en vivo
 * al coordinador dueño de la oferta de este alumno.
 */
function avisarCoordinacion(solicitud) {
  const coordinadorUsuarioId = solicitud.oferta?.coordinador?.usuario_id;
  if (coordinadorUsuarioId) emitirResumenActualizado(coordinadorUsuarioId);
}

/**
 * Flujo Principal (14 pasos, ver CU-LSS-03): el profesor aprueba la
 * evaluación y confirma que ya vio los reportes del alumno validados en
 * SISS. RN-LSS-08/09: reportesSissConfirmados debe llegar explícitamente en
 * true — si el profesor considera que NO están validados, debe usar
 * rechazarPorSiss en vez de este flujo.
 *
 * `ipFirma` no forma parte de la firma original del CU tal como la dio el
 * usuario, pero revision_desempeno.ip_firma es una columna real que el
 * resto del proyecto sí usa (mismo criterio que auth.controller.js con
 * req.ip) — el controller la pasa desde req.ip.
 */
async function registrarEvaluacion(profesorUsuarioId, alumnoBoleta, { observacionesProfesor, reportesSissConfirmados, valores } = {}, ipFirma = null) {
  const { profesor, solicitud, proceso } = await resolverAlumnoDeProfesor(profesorUsuarioId, alumnoBoleta);

  // RN-LSS-10
  if (proceso.evaluacion_desempeno && ESTADOS_EVALUACION_BLOQUEADA.includes(proceso.evaluacion_desempeno.estado)) {
    throw crearError('Esta evaluación ya fue enviada y no se puede modificar.', 409, 'EVALUACION_YA_ENVIADA');
  }
  // RN-LSS-08/09
  if (reportesSissConfirmados !== true) {
    throw crearError('Debes confirmar que los reportes del alumno están validados en el SISS antes de evaluar. Si no lo están, usa "Rechazar por SISS".', 422, 'REPORTES_SISS_NO_CONFIRMADOS');
  }
  // RN-LSS-08: los 7 factores completos, suma SIEMPRE recalculada en
  // servidor (nunca se confía en ningún total que mande el cliente).
  const sumaTotal = validarYCalcularPuntajes(valores);

  await borrarEvaluacionExistenteSiHay(proceso);

  await generarYPersistirEvaluacion({
    solicitud, proceso, profesor,
    estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
    observacionesProfesor,
    reportesSissConfirmados: true,
    puntajesFactores: valores,
    sumaTotal,
    ipFirma,
  });

  await notificarAlumno(solicitud.alumno.usuario_id, 'Tu profesor registró tu evaluación de desempeño. Está pendiente del dictamen de coordinación.');
  avisarCoordinacion(solicitud);
  emitirResumenActualizado(profesorUsuarioId);

  return { mensaje: 'Evaluación registrada correctamente.', estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN };
}

/**
 * Flujo Alterno 3.1: el profesor rechaza porque los reportes del alumno NO
 * están validados en SISS. Es un registro simple ("rechazado, con este
 * motivo") — NO genera PDF, NO calcula hash, NO pide sello TSA, NO exige
 * rúbrica registrada (nunca hubo firma involucrada; corregido — antes
 * reutilizaba por error el flujo pesado completo de
 * registrarEvaluacion/corregirYReenviar solo para satisfacer la vieja
 * restricción NOT NULL de documento_id, ya eliminada). Mismo patrón
 * "borrar y recrear" para rechazos sucesivos (decisión confirmada) — no
 * hay coordinación involucrada, por eso NO se llama avisarCoordinacion
 * aquí (a diferencia de registrarEvaluacion/corregirYReenviar).
 */
async function rechazarPorSiss(profesorUsuarioId, alumnoBoleta, observacionesProfesor) {
  const { profesor, solicitud, proceso } = await resolverAlumnoDeProfesor(profesorUsuarioId, alumnoBoleta);

  if (proceso.evaluacion_desempeno && ESTADOS_EVALUACION_BLOQUEADA.includes(proceso.evaluacion_desempeno.estado)) {
    throw crearError('Esta evaluación ya fue enviada y no se puede modificar.', 409, 'EVALUACION_YA_ENVIADA');
  }
  if (!observacionesProfesor || !observacionesProfesor.trim()) {
    throw crearError('Debes indicar el motivo del rechazo.', 422, 'MOTIVO_REQUERIDO');
  }

  await borrarEvaluacionExistenteSiHay(proceso);

  await crearRechazoEnTransaccion({ proceso, profesor, observacionesProfesor });

  await notificarAlumno(solicitud.alumno.usuario_id, 'Tu profesor rechazó tu evaluación de desempeño: tus reportes no aparecen validados en el SISS. Revisa el motivo y reenvía tu solicitud.');
  emitirResumenActualizado(profesorUsuarioId);

  return { mensaje: 'Evaluación rechazada correctamente.', estado: ESTADO_EVALUACION_RECHAZADA_POR_SISS };
}

/**
 * Flujo Alterno 1.3 (RN-LSS-11): solo posible si coordinación devolvió la
 * evaluación para corrección (CU-LSS-04, dictaminarRechazado). Regenera el documento completo
 * (pasos 4-11) y vuelve a 'pendiente_dictamen'; motivo_rechazo_coordinacion
 * queda limpio automáticamente porque la fila se recrea desde cero (no se
 * reutiliza la anterior).
 */
async function corregirYReenviar(profesorUsuarioId, alumnoBoleta, { observacionesProfesor, valores } = {}) {
  const { profesor, solicitud, proceso } = await resolverAlumnoDeProfesor(profesorUsuarioId, alumnoBoleta);

  exigirEstadoEvaluacion(
    proceso.evaluacion_desempeno,
    ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
    'Tu evaluación no está en estado de corrección — no hay nada que reenviar.',
  );

  // RN-LSS-08/11: la corrección también debe traer los 7 factores
  // completos — se regenera el documento entero, no se reutilizan los
  // puntajes anteriores (la corrección puede cambiarlos).
  const sumaTotal = validarYCalcularPuntajes(valores);

  await borrarEvaluacionExistenteSiHay(proceso);

  await generarYPersistirEvaluacion({
    solicitud, proceso, profesor,
    estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
    observacionesProfesor,
    reportesSissConfirmados: true,
    puntajesFactores: valores,
    sumaTotal,
  });

  await notificarAlumno(solicitud.alumno.usuario_id, 'Tu profesor corrigió y reenvió tu evaluación de desempeño. Está pendiente del dictamen de coordinación.');
  avisarCoordinacion(solicitud);
  emitirResumenActualizado(profesorUsuarioId);

  return { mensaje: 'Evaluación corregida y reenviada correctamente.', estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN };
}

/**
 * Alumnos de este profesor cuya acción pendiente es REALMENTE del
 * profesor — mismo criterio corregido que contarAlumnosConEvaluacionSolicitada
 * (sin evaluacion_desempeno, o en 'devuelta_para_correccion'): excluye a
 * los que ya rechazó (le toca al alumno), a los que ya evaluó y están
 * pendiente_dictamen (le toca a coordinación) y a los aprobado_coordinador
 * (le toca al alumno descargar/confirmar).
 */
async function listarAlumnosConEvaluacionPendiente(profesorUsuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: profesorUsuarioId } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404);

  const solicitudes = await prisma.solicitud_registro.findMany({
    where: {
      oferta: { profesor_id: profesor.id },
      liberacion_proceso: {
        estado: ESTADO_EVALUACION_SOLICITADA,
        OR: [
          { evaluacion_desempeno: null },
          { evaluacion_desempeno: { estado: ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION } },
        ],
      },
    },
    include: {
      alumno: { include: { usuario: true } },
      oferta: true,
      liberacion_proceso: { include: { evaluacion_desempeno: true } },
    },
  });

  return solicitudes.map((s) => ({
    boleta: s.alumno.boleta,
    nombreCompleto: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
    oferta: s.oferta?.nombre_proyecto ?? null,
    // Tras el filtro de arriba, solo puede ser null (Alterno A, sin
    // evaluar) o 'devuelta_para_correccion' — rechazada_por_siss,
    // pendiente_dictamen y aprobado_coordinador ya no llegan aquí, por eso
    // motivoRechazo ya no tiene sentido en esta lista (se eliminó).
    estadoEvaluacion: s.liberacion_proceso.evaluacion_desempeno?.estado ?? null,
    // CU-LSS-04: motivo por el que coordinación devolvió la evaluación —
    // solo tiene valor real cuando estadoEvaluacion === 'devuelta_para_correccion'.
    // Campo previamente faltante (confirmado en la exploración de LSS-04).
    motivoRechazoCoordinacion: s.liberacion_proceso.evaluacion_desempeno?.motivo_rechazo_coordinacion ?? null,
    // CU-LSS-01: cuándo el alumno inició el proceso de liberación (y por
    // tanto solicitó esta evaluación) — "Fecha de envío" en el frontend.
    fechaInicio: s.liberacion_proceso.fecha_inicio,
    // Elección original del alumno en CU-LSS-01 (iniciarEvaluacion): false =
    // le pidió al profesor validar sus reportes en SISS antes de evaluar.
    reportesValidadosSiss: !!s.liberacion_proceso.reportes_validados_siss,
  }));
}

module.exports = {
  contarAlumnosConEvaluacionSolicitada,
  registrarEvaluacion,
  rechazarPorSiss,
  corregirYReenviar,
  listarAlumnosConEvaluacionPendiente,
};
