// Validaciones propias del módulo AH (Actividades y Horas) — no reutiliza
// backend/src/lib/validators.js a propósito, ese archivo es solo para datos
// personales/académicos de GR.

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/**
 * RN-AH-01/RN-AH-02: los 4 campos son obligatorios sin excepción.
 */
function validarCamposActividad({ titulo, descripcion, entregable_esperado, fecha_limite }) {
  if (!titulo || !titulo.trim()) throw crearError('El título es obligatorio.');
  if (!descripcion || !descripcion.trim()) throw crearError('La descripción es obligatoria.');
  if (!entregable_esperado || !entregable_esperado.trim()) throw crearError('El entregable esperado es obligatorio.');
  if (!fecha_limite || isNaN(new Date(fecha_limite).getTime())) {
    throw crearError('La fecha límite es obligatoria y debe ser una fecha válida.');
  }
}

/**
 * Regla nueva (decisión de diseño propia, no está en la ficha original):
 * fecha_limite debe ser posterior o igual a la fecha de inicio del periodo
 * de servicio social de ESE alumno (solicitud_registro -> periodo_registro
 * -> evento_calendario.fecha_inicio) — el propio día de inicio ya es una
 * jornada laboral válida, así que una fecha_limite ahí es aceptable. El
 * profesor SÍ puede asignar actividades antes de que el servicio social del
 * alumno inicie — solo la fecha límite debe caer en o después del inicio,
 * no la asignación en sí. Compartida por crearActividad, editarActividad y
 * (vía validarExtensionFecha) extenderFechaLimiteActividad — misma regla de
 * negocio en los 3 casos, no se bifurca.
 */
function validarFechaLimiteContraInicio(fechaLimite, fechaInicioPeriodo) {
  if (!fechaInicioPeriodo) return; // no debería ocurrir para un alumno_asignado, pero no truena si falta
  const limite = new Date(fechaLimite);
  const inicio = new Date(fechaInicioPeriodo);
  if (limite < inicio) {
    throw crearError(`La fecha límite debe ser posterior o igual al inicio del servicio social del alumno (${formatearFecha(inicio)}).`);
  }
}

/**
 * Regla INDEPENDIENTE y adicional a validarFechaLimiteContraInicio: sin
 * importar cuándo inició el periodo del alumno, fecha_limite nunca puede
 * caer antes de HOY (día calendario real, no la hora exacta — permite que
 * fecha_limite sea hoy mismo). Ambas reglas deben cumplirse a la vez.
 */
function validarFechaLimiteNoPasada(fechaLimite) {
  const limite = new Date(fechaLimite);
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  if (limite < hoy) {
    throw crearError(`La fecha límite no puede ser anterior a hoy (${formatearFecha(hoy)}).`);
  }
}

/**
 * RN-AH-05: al extender fecha_limite (actividad con avance ya registrado),
 * la nueva fecha debe ser una extensión hacia adelante Y seguir siendo
 * posterior al inicio del periodo del alumno.
 */
function validarExtensionFecha(nuevaFecha, fechaActual, fechaInicioPeriodo) {
  if (!nuevaFecha || isNaN(new Date(nuevaFecha).getTime())) {
    throw crearError('La nueva fecha límite es obligatoria y debe ser una fecha válida.');
  }
  const nueva = new Date(nuevaFecha);
  const actual = new Date(fechaActual);
  if (nueva <= actual) {
    throw crearError(`La nueva fecha límite debe ser posterior a la fecha límite actual (${formatearFecha(actual)}).`);
  }
  validarFechaLimiteContraInicio(nuevaFecha, fechaInicioPeriodo);
}

/**
 * CU-AH-03: valida el array `avances` que el alumno envía al confirmar su
 * bitácora — sin límite superior de actividades (confirmado con el
 * usuario), pero al menos una, y cada fila con sus 4 campos propios.
 */
function validarAvancesBitacora(avances) {
  if (!Array.isArray(avances) || avances.length === 0) {
    throw crearError('Debes reportar al menos una actividad trabajada.');
  }

  avances.forEach((av, idx) => {
    const n = idx + 1;
    const actividadId = Number(av?.actividad_id);
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw crearError(`Selecciona una actividad válida en la fila ${n}.`);
    }
    if (!av?.descripcion || !String(av.descripcion).trim()) {
      throw crearError(`Describe el trabajo realizado en la fila ${n}.`);
    }
    if (!av?.evidencia || !String(av.evidencia).trim()) {
      throw crearError(`Agrega evidencia del trabajo en la fila ${n}.`);
    }
    const pct = Number(av?.porcentaje_avance);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      throw crearError(`El porcentaje de avance de la fila ${n} debe ser un número entre 0 y 100.`);
    }
  });

  const ids = avances.map((av) => Number(av.actividad_id));
  if (new Set(ids).size !== ids.length) {
    throw crearError('No puedes reportar la misma actividad dos veces en la misma bitácora.');
  }
}

/**
 * CU-AH-03: cada actividad_id reportada debe pertenecer al conjunto de
 * actividades reportables (ESTADOS_ACTIVIDAD_REPORTABLE) ya traído de BD
 * para ese alumno — 404 genérico, mismo criterio que obtenerDetalleActividad.
 */
function validarActividadesReportables(avances, actividadesDelAlumno) {
  const reportablesIds = new Set(actividadesDelAlumno.map((a) => a.id));
  for (const av of avances) {
    if (!reportablesIds.has(Number(av.actividad_id))) {
      throw crearError('Una de las actividades seleccionadas no existe o no puede reportarse.', 404);
    }
  }
}

module.exports = {
  crearError,
  formatearFecha,
  validarCamposActividad,
  validarFechaLimiteContraInicio,
  validarFechaLimiteNoPasada,
  validarExtensionFecha,
  validarAvancesBitacora,
  validarActividadesReportables,
};
