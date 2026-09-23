// CU-REP-01 fase 1: datos para preparar el reporte mensual. Solo lectura.
// Inicio/fin del servicio: solicitud → periodo_registro → evento_calendario (nunca las bitácoras).
// Una bitácora pertenece al periodo cuya fecha_registro (el día de la jornada, @db.Date) cae dentro de [inicio, fin] —
// NUNCA por fecha_revision (nuevas reglas, Bloque 1). Cuentan las bitácoras 'aprobada' y 'rechazada' (el profesor ya
// decidió esa jornada, aceptada o no); 'en_curso', 'pendiente_datos' y 'pendiente_revision' (sin decisión final) no
// cuentan ni bloquean el reporte, solo se detectan para avisar al alumno (diagnostico.bitacorasNoResueltas).
// diasLaborados = cantidad de esas bitácoras del periodo; horas = SUM(horas_contabilizadas) tal como las guarda AH.
// El reporte se puede generar desde el primer día hábil ADMINISTRATIVO posterior a fecha_fin del periodo (L-V, sin
// evento Inhabil ni Vacacional; nuevas reglas, Bloque 2) — no basta con que el periodo ya haya terminado. Para el
// Reporte N > 1 solo se exige que exista el Reporte N-1 (cualquiera sea su estado_reporte: ya fue enviado); el
// Reporte 1 no tiene requisito de reporte anterior. calcularPeriodoReporte no cambia: sus límites siguen siendo L-V.
//
// periodo_registro.fecha_fin es una fecha ADMINISTRATIVA: marca el inicio del servicio en fecha_inicio, pero NO
// limita ni detiene la secuencia mensual. Los periodos siguen generándose con el mismo motor aunque rebasen
// fecha_fin (R8, R9…) mientras el alumno siga necesitando completar sus horas: quien frena la secuencia es la
// ausencia de bitácoras del periodo (SIN_BITACORAS_APROBADAS), no el calendario oficial. fecha_fin sigue siendo
// necesaria para el Reporte Global (CU-REP-07), que sí imprime el periodo oficial completo.

const { calcularDiaMexicoUTC, calcularFechaLimiteServicio } = require('../../lib/fechas');
const {
  ESTADO_REPORTE_APROBACION_FINAL,
  ESTADOS_REPORTE_RECHAZADOS,
  ESTADOS_BITACORA_QUE_CUENTAN,
  ESTADOS_BITACORA_NO_RESUELTOS,
  TIPOS_EVENTO_NO_LABORABLE,
  DESFASE_MEXICO_HORAS,
  MOTIVOS_BLOQUEO,
  MENSAJES_BLOQUEO,
  nombreInstitucionalCarrera,
  nombreCompleto,
  aNumero,
  formatearPorcentajeCreditos,
  tituloReporteMensual,
} = require('./reportes.shared');
const {
  normalizarFechaISO,
  formatearFechaLarga,
  sumarDiasISO,
  calcularPeriodoReporte,
  esFinDeSemanaISO,
  servicioIniciado,
} = require('./reportes.periodos');
const {
  construirCalendarioPeriodo,
  primerDiaHabilAdministrativoDesde,
  diasHabilesAdministrativosDesde,
  contarDiasHabilesAdministrativos,
  TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO,
} = require('./reportes.calendario');

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

const aDateUTC = (iso) => new Date(`${iso}T00:00:00.000Z`);

// Instante UTC en que empieza, en México, el día `iso`.
function inicioDiaMexico(iso) {
  const hora = String(DESFASE_MEXICO_HORAS).padStart(2, '0');
  return new Date(`${iso}T${hora}:00:00.000Z`);
}

// Instante UTC en que empieza, en México, el día siguiente a `iso`.
function inicioDiaSiguienteMexico(iso) {
  return inicioDiaMexico(sumarDiasISO(iso, 1));
}

async function resolverAlumnoYSolicitud(prisma, usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: {
      usuario: { select: { nombre: true, apellidos: true, correo_institucional: true, rubrica_imagen: true } },
      solicitud_registro: {
        include: {
          periodo_registro: { include: { evento_calendario: true } },
          oferta: { include: { profesor: { include: { usuario: { select: { nombre: true, apellidos: true } } } } } },
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }
  return { alumno, solicitud: alumno.solicitud_registro };
}

function consultarReportes(prisma, solicitudId) {
  return prisma.reporte_mensual.findMany({
    where: { solicitud_registro_id: solicitudId },
    orderBy: { num_reporte: 'asc' },
    select: { id: true, num_reporte: true, estado_reporte: true },
  });
}

// Calendario global: no se filtra por coordinador (igual que AH).
function consultarEventosNoLaborables(prisma, inicio, fin) {
  return prisma.evento_calendario.findMany({
    where: {
      tipo: { in: [...TIPOS_EVENTO_NO_LABORABLE] },
      fecha_inicio: { lte: aDateUTC(fin) },
      OR: [
        { fecha_fin: { gte: aDateUTC(inicio) } },
        { AND: [{ fecha_fin: null }, { fecha_inicio: { gte: aDateUTC(inicio) } }] },
      ],
    },
    orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }],
    select: { id: true, nombre: true, tipo: true, fecha_inicio: true, fecha_fin: true },
  });
}

// Filas de evento_calendario → forma que espera reportes.calendario.js. La comparten prepararReporteMensual y el
// chequeo de plazo de envío que usa AH (Bloque 4) — un único lugar que traduce del modelo de Prisma.
function mapearEventosNoLaborables(filas) {
  return filas.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    tipo: e.tipo,
    fechaInicio: normalizarFechaISO(e.fecha_inicio),
    fechaFin: e.fecha_fin ? normalizarFechaISO(e.fecha_fin) : null,
  }));
}

// Bitácoras del periodo (Bloque 1): pertenece la que su fecha_registro (día de la jornada; @db.Date, sin hora) cae en
// [inicio, fin]. Trae 'aprobada' y 'rechazada' (cuentan para dias_laborados/horas_reportadas) y también las tres sin
// decisión final —'en_curso', 'pendiente_datos', 'pendiente_revision'— que no cuentan ni bloquean, solo se detectan
// para avisar al alumno. prepararReporteMensual separa cada grupo.
function consultarBitacorasDelPeriodo(prisma, solicitudId, inicio, fin) {
  return prisma.bitacora.findMany({
    where: {
      solicitud_registro_id: solicitudId,
      estado: { in: [...ESTADOS_BITACORA_QUE_CUENTAN, ...ESTADOS_BITACORA_NO_RESUELTOS] },
      fecha_registro: { gte: aDateUTC(inicio), lte: aDateUTC(fin) },
    },
    orderBy: { fecha_registro: 'asc' },
    select: { id: true, estado: true, fecha_registro: true, fecha_revision: true, horas_contabilizadas: true },
  });
}

async function consultarActividadesConRegistros(prisma, solicitudId, fin) {
  const [actividades, registros] = await Promise.all([
    prisma.actividad.findMany({
      where: { solicitud_registro_id: solicitudId, fecha_asignacion: { lt: inicioDiaSiguienteMexico(fin) } },
      orderBy: { fecha_asignacion: 'asc' },
      select: { id: true, titulo: true, estado: true, fecha_limite: true, porcentaje_progreso: true },
    }),
    prisma.registro_bitacora_actividades.findMany({
      where: {
        actividad: { solicitud_registro_id: solicitudId },
        // Mismas bitácoras contabilizables que dias_laborados/horas_reportadas (aprobada + rechazada; nunca las sin
        // decisión final) — el avance ya no se queda corto solo porque el profesor rechazó una jornada trabajada.
        bitacora: { estado: { in: ESTADOS_BITACORA_QUE_CUENTAN }, fecha_registro: { lte: aDateUTC(fin) } },
      },
      select: {
        actividad_id: true,
        porcentaje_avance_registrado: true,
        bitacora: { select: { fecha_registro: true } },
      },
    }),
  ]);
  return { actividades, registros };
}

/**
 * Avance con bitácoras contabilizables (aprobada + rechazada; nunca en_curso/pendiente_datos/pendiente_revision —
 * mismo criterio que dias_laborados/horas_reportadas). Cada registro guarda el % acumulado de ese día, así que
 * alInicio/alCierre son el ÚLTIMO registro antes del periodo / hasta su fin (no el máximo).
 * porcentajeActual (actividad.porcentaje_progreso) incluye avances aún no aprobados (bitácoras sin decisión final).
 */
function calcularAvanceActividades({ actividades, registros, inicio, fin }) {
  const porActividad = new Map();
  for (const r of registros) {
    const lista = porActividad.get(r.actividad_id) ?? [];
    lista.push({ fecha: normalizarFechaISO(r.bitacora.fecha_registro), pct: r.porcentaje_avance_registrado });
    porActividad.set(r.actividad_id, lista);
  }

  return actividades.map((a) => {
    const lista = (porActividad.get(a.id) ?? []).sort((x, y) => x.fecha.localeCompare(y.fecha));
    const antes = lista.filter((r) => r.fecha < inicio);
    const hastaCierre = lista.filter((r) => r.fecha <= fin);
    const alInicio = antes.length ? antes[antes.length - 1].pct : 0;
    const alCierre = hastaCierre.length ? hastaCierre[hastaCierre.length - 1].pct : 0;

    return {
      id: a.id,
      titulo: a.titulo,
      estado: a.estado,
      fechaLimite: normalizarFechaISO(a.fecha_limite),
      porcentajeActual: a.porcentaje_progreso,
      avance: { alInicio, alCierre, enPeriodo: Math.max(0, alCierre - alInicio) },
      bitacorasEnPeriodo: lista.filter((r) => r.fecha >= inicio && r.fecha <= fin).length,
    };
  });
}

const textoONull = (valor) => {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto === '' ? null : texto;
};

// Datos del PDF que faltan. El correo personal no se sustituye por el institucional. Sin oferta no se pide
// programa: ya lo cubre SIN_PROFESOR_RESPONSABLE.
function evaluarBloqueosDeDatos({ carreraNombre, correoPersonal, profesor, ofertaExiste, programa }) {
  const codigos = [];
  if (!carreraNombre) codigos.push(MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA);
  if (!correoPersonal) codigos.push(MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL);
  if (!profesor) codigos.push(MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE);
  if (ofertaExiste && !programa) codigos.push(MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS);
  return codigos;
}

// Motivos por los que no se puede generar el reporte; lista vacía = puede (CU-REP-01).
// `motivosDatos` (evaluarBloqueosDeDatos) va al final y se informa aunque no haya periodo.
function evaluarBloqueos({
  servicio, periodo, hoy, periodoGenerable, diasLaborados, reporteExistente, motivosDatos = [],
}) {
  const motivos = [];
  const agregar = (codigo) => motivos.push({ codigo, mensaje: MENSAJES_BLOQUEO[codigo] });

  // El inicio real nunca se corrige en silencio: en fin de semana es una inconsistencia que bloquea.
  if (servicio.fechaInicio && esFinDeSemanaISO(servicio.fechaInicio)) {
    agregar(MOTIVOS_BLOQUEO.INICIO_SERVICIO_FIN_DE_SEMANA);
    motivosDatos.forEach(agregar);
    return motivos;
  }

  if (!servicio.fechaInicio || !periodo) {
    agregar(MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL);
    motivosDatos.forEach(agregar);
    return motivos;
  }

  if (!servicioIniciado(servicio.fechaInicio, hoy)) agregar(MOTIVOS_BLOQUEO.SERVICIO_NO_INICIADO);

  // fecha_fin NO bloquea: un periodo que la rebasa (o un servicio sin fecha_fin registrada) se genera igual. El
  // freno natural de la secuencia es SIN_BITACORAS_APROBADAS cuando el periodo ya no tiene jornadas.

  if (!periodoGenerable) agregar(MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO);
  else if (diasLaborados === 0) agregar(MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS);

  // Para Reporte N > 1 basta con que exista el Reporte N-1 (cualquiera sea su estado): como `numero` siempre se
  // asigna como max(num_reporte existentes) + 1, esa existencia ya está garantizada por construcción — no hace
  // falta ningún bloqueo adicional aquí (Bloque 2: ya no se exige aprobación final de reportes anteriores).
  if (reporteExistente) agregar(MOTIVOS_BLOQUEO.REPORTE_YA_EXISTE);

  motivosDatos.forEach(agregar);
  return motivos;
}

// Lo que el PDF imprime del alumno, del profesor responsable y del programa, y qué datos faltan. Lo comparten la
// preparación del reporte (CU-REP-01) y la corrección de uno rechazado (CU-REP-04): mismos datos, mismos bloqueos.
function datosDeImpresion(alumno, solicitud) {
  const profesorUsuario = solicitud.oferta?.profesor?.usuario ?? null;
  const carreraNombre = nombreInstitucionalCarrera(alumno.carrera);
  const correoPersonal = textoONull(alumno.correo_personal);
  const programa = textoONull(solicitud.oferta?.programa_SISS);
  const profesor = profesorUsuario
    ? {
        nombre: profesorUsuario.nombre,
        apellidos: profesorUsuario.apellidos,
        nombreCompleto: nombreCompleto(profesorUsuario.nombre, profesorUsuario.apellidos),
        ofertaId: solicitud.oferta.id,
        ofertaNombre: solicitud.oferta.nombre_proyecto,
        usuarioId: solicitud.oferta.profesor.usuario_id,
      }
    : null;
  const motivosDatos = evaluarBloqueosDeDatos({
    carreraNombre, correoPersonal, profesor, ofertaExiste: Boolean(solicitud.oferta), programa,
  });
  return {
    alumno: {
      nombre: alumno.usuario.nombre,
      apellidos: alumno.usuario.apellidos,
      nombreCompleto: nombreCompleto(alumno.usuario.nombre, alumno.usuario.apellidos),
      boleta: alumno.boleta,
      carrera: alumno.carrera,
      carreraNombre,
      semestre: alumno.semestre,
      telefono: alumno.celular,
      creditos: aNumero(alumno.creditos),
      creditosTexto: formatearPorcentajeCreditos(alumno.creditos),
      correoInstitucional: alumno.usuario.correo_institucional,
      correoPersonal,
    },
    profesor,
    programa,
    motivosDatos,
  };
}

// ── Aviso por plazo de envío (Bloque 3) ─────────────────────────────────
//
// Aviso persistente y puramente derivado (no se guarda, no usa `notificacion`, no WebSocket): se recalcula en cada
// llamada a partir de periodo.fin + calendario institucional. Día 1 del plazo es `primerDiaGenerable`, el mismo día
// desde el que Bloque 2 permite generar el reporte — no se duplica ninguna regla de día hábil, se reutiliza
// reportes.calendario.js. "Enviado" = existe el reporte_mensual, sin importar aprobación de profesor/coordinador
// (regla 8): por construcción `numero` siempre es max(num_reporte existentes) + 1 (mismo invariante de Bloque 2), así
// que en cuanto el alumno hace el primer envío la siguiente preparación ya evalúa el periodo SIGUIENTE, cuyo Día 1
// vuelve a estar en el futuro — el aviso desaparece solo, y no reaparece si ese envío es rechazado después (la
// corrección modifica la misma fila, nunca crea una nueva; `numero` no cambia).
const DIAS_PLAZO_ENVIO = 5;

const SIN_AVISO_PLAZO_ENVIO = Object.freeze({
  aplica: false, estado: null, diaHabilActual: null, diasPlazo: DIAS_PLAZO_ENVIO,
  primerDia: null, fechaLimite: null, fechaLimiteTexto: null,
});

/**
 * Estado del aviso de plazo para el periodo que se está evaluando. Antes de `primerDiaGenerable` (Día 1) no hay
 * aviso. Del día 1 al día DIAS_PLAZO_ENVIO: 'preventivo'. Después: 'vencido' (aquí solo se informa; el bloqueo real
 * de bitácoras se implementa en otro bloque, no en este).
 */
function derivarPlazoEnvio({ periodoGenerable, primerDiaGenerable, hoy, eventosMapeados }) {
  if (!periodoGenerable) return SIN_AVISO_PLAZO_ENVIO;

  const diaHabilActual = contarDiasHabilesAdministrativos(primerDiaGenerable, hoy, eventosMapeados);
  const diasDelPlazo = diasHabilesAdministrativosDesde(primerDiaGenerable, DIAS_PLAZO_ENVIO, eventosMapeados);
  const fechaLimite = diasDelPlazo.length === DIAS_PLAZO_ENVIO ? diasDelPlazo[DIAS_PLAZO_ENVIO - 1] : null;

  return {
    aplica: true,
    estado: diaHabilActual <= DIAS_PLAZO_ENVIO ? 'preventivo' : 'vencido',
    diaHabilActual,
    diasPlazo: DIAS_PLAZO_ENVIO,
    primerDia: primerDiaGenerable,
    fechaLimite,
    fechaLimiteTexto: fechaLimite ? formatearFechaLarga(fechaLimite) : null,
  };
}

// Ventana de aviso de la duración máxima del servicio: últimos días HÁBILES ADMINISTRATIVOS antes del límite.
const DIAS_AVISO_LIMITE_SERVICIO = 5;

const SIN_LIMITE_SERVICIO = Object.freeze({
  fechaLimite: null, fechaLimiteTexto: null, diasHabilesRestantes: null, estado: null,
});

/**
 * Estado del límite de duración del servicio (2 años desde el inicio oficial). SOLO informativo: ningún flujo de
 * Reportes se bloquea por esto — mensuales, correcciones, revisiones y global siguen igual antes y después.
 *
 *  - 'excedido'   : hoy ya pasó la fecha límite.
 *  - 'alcanzado'  : hoy ES la fecha límite (todavía válida).
 *  - 'por_vencer' : quedan entre 1 y DIAS_AVISO_LIMITE_SERVICIO días hábiles administrativos (incluido hoy).
 *  - null         : fuera de la ventana y sin vencer.
 *
 * `diasHabilesRestantes` reutiliza contarDiasHabilesAdministrativos y su definición ya existente (L-V sin Inhabil
 * ni Vacacional); `eventos` debe cubrir hasta la fecha límite o el conteo ignoraría días no laborables cercanos.
 */
function derivarLimiteServicio({ fechaLimite, hoy, eventosMapeados }) {
  if (!fechaLimite) return SIN_LIMITE_SERVICIO;

  const diasHabilesRestantes = contarDiasHabilesAdministrativos(hoy, fechaLimite, eventosMapeados);
  const base = { fechaLimite, fechaLimiteTexto: formatearFechaLarga(fechaLimite), diasHabilesRestantes };

  if (hoy > fechaLimite) return { ...base, estado: 'excedido' };
  if (hoy === fechaLimite) return { ...base, estado: 'alcanzado' };
  if (diasHabilesRestantes >= 1 && diasHabilesRestantes <= DIAS_AVISO_LIMITE_SERVICIO) {
    return { ...base, estado: 'por_vencer' };
  }
  return { ...base, estado: null };
}

/**
 * Día 1 (primerDiaGenerable) + el aviso de plazo derivado, a partir del periodo del reporte candidato y los eventos
 * que lo cubren. La misma pieza la usa prepararReporteMensual (Bloque 3) y plazoEnvioReporteMensualVencido, el
 * chequeo que usa AH para bloquear nuevas bitácoras (Bloque 4) — ninguno de los dos vuelve a calcular el día hábil
 * administrativo por su cuenta.
 */
function calcularPlazoDesdeEventos({ periodo, eventosMapeados, hoy, solicitudId }) {
  const primerDiaGenerable = primerDiaHabilAdministrativoDesde(sumarDiasISO(periodo.fin, 1), eventosMapeados);
  if (primerDiaGenerable === null) {
    console.warn(
      `[reportes] No se encontró un día hábil administrativo dentro de ${TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO} `
      + `días después del fin del periodo (${periodo.fin}) de la solicitud ${solicitudId}; revisar el calendario institucional.`,
    );
  }
  const periodoGenerable = primerDiaGenerable !== null && hoy >= primerDiaGenerable;
  const plazoEnvio = derivarPlazoEnvio({ periodoGenerable, primerDiaGenerable, hoy, eventosMapeados });
  return { primerDiaGenerable, periodoGenerable, plazoEnvio };
}

// deps ({ prisma, ahora }) solo se usa en pruebas.
async function prepararReporteMensual(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const hoy = normalizarFechaISO(calcularDiaMexicoUTC(deps.ahora ?? new Date()));

  const { alumno, solicitud } = await resolverAlumnoYSolicitud(prisma, usuarioId);

  const eventoOficial = solicitud.periodo_registro?.evento_calendario ?? null;
  const fechaInicio = eventoOficial?.fecha_inicio ? normalizarFechaISO(eventoOficial.fecha_inicio) : null;
  const fechaFin = eventoOficial?.fecha_fin ? normalizarFechaISO(eventoOficial.fecha_fin) : null;
  // Duración máxima del servicio (2 años desde el inicio oficial). Solo se informa: no bloquea ningún flujo de
  // Reportes, y el bloqueo de nuevas bitácoras que le corresponde es responsabilidad de AH, no de este módulo.
  const fechaLimiteServicio = eventoOficial?.fecha_inicio
    ? normalizarFechaISO(calcularFechaLimiteServicio(eventoOficial.fecha_inicio))
    : null;

  const reportes = await consultarReportes(prisma, solicitud.id);
  const numero = reportes.reduce((max, r) => Math.max(max, r.num_reporte), 0) + 1;

  const reporteExistenteFila = reportes.find((r) => r.num_reporte === numero) ?? null;
  const reporteExistente = reporteExistenteFila
    ? {
        id: reporteExistenteFila.id,
        numero: reporteExistenteFila.num_reporte,
        estadoReporte: reporteExistenteFila.estado_reporte,
        puedeModificar: ESTADOS_REPORTE_RECHAZADOS.includes(reporteExistenteFila.estado_reporte),
      }
    : null;

  // Informativo únicamente (Bloque 2: ya no bloquean la generación del siguiente reporte). Reportes anteriores que
  // existen pero todavía no están aprobado_coordinador — queda listo para el futuro aviso persistente al alumno.
  const reportesSinAprobacionFinal = reportes
    .filter((r) => r.num_reporte < numero && r.estado_reporte !== ESTADO_REPORTE_APROBACION_FINAL)
    .map((r) => ({
      id: r.id,
      numero: r.num_reporte,
      estadoReporte: r.estado_reporte,
      puedeModificar: ESTADOS_REPORTE_RECHAZADOS.includes(r.estado_reporte),
    }));

  const { alumno: datosAlumno, profesor, programa, motivosDatos } = datosDeImpresion(alumno, solicitud);

  const base = {
    alumno: datosAlumno,
    profesor,
    servicio: {
      fechaInicio,
      fechaFin,
      servicioIniciado: fechaInicio ? servicioIniciado(fechaInicio, hoy) : false,
      hoy,
      programa,
    },
    firma: {
      tieneRubrica: Boolean(alumno.usuario.rubrica_imagen),
      requiereSubirRubrica: !alumno.usuario.rubrica_imagen,
    },
    reporteExistente,
    reportesAnteriores: { total: reportes.length, sinAprobacionFinal: reportesSinAprobacionFinal },
  };

  const inicioEnFinDeSemana = Boolean(fechaInicio) && esFinDeSemanaISO(fechaInicio);
  if (inicioEnFinDeSemana) {
    console.warn(
      `[reportes] Inconsistencia en el Periodo de la solicitud ${solicitud.id}: la fecha de inicio del servicio (${fechaInicio}) `
      + 'cae en sábado o domingo. Reportes no la corrige; revisar el Periodo en ADM.',
    );
  }

  if (!fechaInicio || inicioEnFinDeSemana) {
    return {
      ...base,
      reporte: null,
      resumen: { diasLaborados: 0, horas: 0, bitacorasQueCuentan: 0 },
      bitacoras: [],
      calendario: { dias: [], eventos: [] },
      actividades: [],
      puedeGenerar: false,
      motivosBloqueo: evaluarBloqueos({
        servicio: base.servicio, periodo: null, hoy, diasLaborados: 0, reporteExistente, motivosDatos,
      }),
      diagnostico: {
        inconsistenciasCalendario: [],
        bitacorasNoResueltas: [],
        plazoEnvio: SIN_AVISO_PLAZO_ENVIO,
        // Sin periodo oficial utilizable no se consultan eventos, y sin ellos el conteo de días hábiles sería
        // incorrecto: se informa neutro, igual que plazoEnvio.
        limiteServicio: SIN_LIMITE_SERVICIO,
      },
    };
  }

  const periodo = calcularPeriodoReporte({ fechaInicio, fechaFin, numero });

  // La ventana de eventos se extiende más allá de periodo.fin: hace falta para ubicar el primer día hábil
  // administrativo posterior (Bloque 2), que puede caer varios días después si hay Inhabil/Vacacional encadenados.
  // Misma consulta de Calendario que ya se usaba; solo cambia hasta dónde se le pide. Además debe llegar hasta la
  // fecha límite del servicio: si quedara corta, el conteo de días hábiles restantes ignoraría los Inhabil o
  // Vacacional cercanos al límite.
  const ventanaBaseFin = sumarDiasISO(periodo.fin, TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO);
  const ventanaEventosFin = fechaLimiteServicio && fechaLimiteServicio > ventanaBaseFin
    ? fechaLimiteServicio
    : ventanaBaseFin;

  const [eventosFilas, bitacorasDelPeriodo, { actividades, registros }] = await Promise.all([
    consultarEventosNoLaborables(prisma, periodo.inicio, ventanaEventosFin),
    consultarBitacorasDelPeriodo(prisma, solicitud.id, periodo.inicio, periodo.fin),
    consultarActividadesConRegistros(prisma, solicitud.id, periodo.fin),
  ]);

  // Cuentan para dias_laborados/horas_reportadas: aprobada + rechazada. Las tres sin decisión final (en_curso,
  // pendiente_datos, pendiente_revision) se separan aparte: no cuentan ni bloquean el reporte (evaluarBloqueos nunca
  // las recibe), solo se exponen en diagnostico para avisar.
  const bitacorasFilas = bitacorasDelPeriodo.filter((b) => ESTADOS_BITACORA_QUE_CUENTAN.includes(b.estado));
  const bitacorasNoResueltasFilas = bitacorasDelPeriodo.filter((b) => ESTADOS_BITACORA_NO_RESUELTOS.includes(b.estado));

  const bitacoras = bitacorasFilas.map((b) => ({
    id: b.id,
    estado: b.estado,
    fecha: normalizarFechaISO(b.fecha_registro),
    fechaRevision: b.fecha_revision.toISOString(),
    horas: b.horas_contabilizadas ?? 0,
  }));
  const bitacorasNoResueltas = bitacorasNoResueltasFilas.map((b) => ({ id: b.id, estado: b.estado, fecha: normalizarFechaISO(b.fecha_registro) }));

  const eventosMapeados = mapearEventosNoLaborables(eventosFilas);

  const calendario = construirCalendarioPeriodo({
    inicio: periodo.inicio,
    fin: periodo.fin,
    eventos: eventosMapeados,
    bitacoras,
  });

  // Solo se informa; Reportes no corrige AH.
  if (calendario.inconsistencias.length > 0) {
    console.warn(
      `[reportes] Inconsistencia AH/calendario en la solicitud ${solicitud.id}: ` +
        `${calendario.inconsistencias.length} bitácora(s) aprobada(s) en días no laborables ` +
        `(${calendario.inconsistencias.map((i) => i.fecha).join(', ')}). Revisar en AH.`,
    );
  }

  // Bloque 2: el reporte se puede generar desde el primer día hábil ADMINISTRATIVO posterior a periodo.fin (L-V,
  // sin Inhabil ni Vacacional), no desde el día siguiente sin más.
  const { primerDiaGenerable, periodoGenerable, plazoEnvio } = calcularPlazoDesdeEventos({
    periodo, eventosMapeados, hoy, solicitudId: solicitud.id,
  });
  const limiteServicio = derivarLimiteServicio({ fechaLimite: fechaLimiteServicio, hoy, eventosMapeados });

  const diasLaborados = bitacoras.length;
  const horas = bitacoras.reduce((suma, b) => suma + b.horas, 0);

  const motivosBloqueo = evaluarBloqueos({
    servicio: base.servicio, periodo, hoy, periodoGenerable, diasLaborados, reporteExistente, motivosDatos,
  });

  return {
    ...base,
    reporte: {
      numero,
      titulo: tituloReporteMensual(numero),
      esquema: periodo.esquema,
      periodo: {
        inicio: periodo.inicio,
        fin: periodo.fin,
        inicioTexto: formatearFechaLarga(periodo.inicio),
        finTexto: formatearFechaLarga(periodo.fin),
        esPrimero: periodo.esPrimero,
        cerrado: periodoGenerable,
        // Informativo: indica que el periodo va más allá de la fecha administrativa de término. Ya no bloquea.
        rebasaFinServicio: periodo.rebasaFinServicio,
      },
    },
    resumen: { diasLaborados, horas, bitacorasQueCuentan: bitacoras.length },
    bitacoras,
    calendario: { dias: calendario.dias, eventos: calendario.eventos },
    actividades: calcularAvanceActividades({ actividades, registros, inicio: periodo.inicio, fin: periodo.fin }),
    puedeGenerar: motivosBloqueo.length === 0,
    motivosBloqueo,
    diagnostico: { inconsistenciasCalendario: calendario.inconsistencias, bitacorasNoResueltas, plazoEnvio, limiteServicio },
  };
}

/**
 * Bloque 4: true si el plazo de envío del reporte mensual SIGUIENTE ya venció — lo usa AH para bloquear el inicio de
 * nuevas bitácoras (nunca las existentes). Mismo cálculo que diagnostico.plazoEnvio de prepararReporteMensual
 * (mismo periodo vía calcularPeriodoReporte, mismo Día 1 y aviso vía calcularPlazoDesdeEventos/derivarPlazoEnvio);
 * solo se omite lo que aquí no hace falta (bitácoras/actividades del periodo, calendario completo).
 *
 * Aplica igual a los reportes posteriores a fecha_fin (R8, R9…): esa fecha es administrativa y no detiene la
 * secuencia mensual, así que su plazo de envío se exige como el de cualquier otro periodo.
 *
 * false ante cualquier situación que Reportes ya trata como "sin periodo válido para generar" (sin alumno/solicitud,
 * sin periodo oficial, inicio en fin de semana): ese caso no es responsabilidad de este bloqueo — evaluarBloqueos ya
 * lo cubre del lado de Reportes, y aquí nunca debe impedir que AH siga funcionando con normalidad.
 */
async function plazoEnvioReporteMensualVencido(alumnoUsuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const hoy = normalizarFechaISO(calcularDiaMexicoUTC(deps.ahora ?? new Date()));

  let solicitud;
  try {
    ({ solicitud } = await resolverAlumnoYSolicitud(prisma, alumnoUsuarioId));
  } catch {
    return false;
  }

  const eventoOficial = solicitud.periodo_registro?.evento_calendario ?? null;
  const fechaInicio = eventoOficial?.fecha_inicio ? normalizarFechaISO(eventoOficial.fecha_inicio) : null;
  const fechaFin = eventoOficial?.fecha_fin ? normalizarFechaISO(eventoOficial.fecha_fin) : null;
  if (!fechaInicio || esFinDeSemanaISO(fechaInicio)) return false;

  const reportes = await consultarReportes(prisma, solicitud.id);
  const numero = reportes.reduce((max, r) => Math.max(max, r.num_reporte), 0) + 1;
  // fechaFin solo alimenta el flag informativo rebasaFinServicio; no cambia los límites del periodo ni el plazo.
  const periodo = calcularPeriodoReporte({ fechaInicio, fechaFin, numero });

  const ventanaEventosFin = sumarDiasISO(periodo.fin, TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO);
  const eventosFilas = await consultarEventosNoLaborables(prisma, periodo.inicio, ventanaEventosFin);
  const eventosMapeados = mapearEventosNoLaborables(eventosFilas);

  const { plazoEnvio } = calcularPlazoDesdeEventos({ periodo, eventosMapeados, hoy, solicitudId: solicitud.id });
  return plazoEnvio.estado === 'vencido';
}

module.exports = {
  prepararReporteMensual,
  resolverAlumnoYSolicitud,
  datosDeImpresion,
  calcularAvanceActividades,
  evaluarBloqueos,
  evaluarBloqueosDeDatos,
  derivarPlazoEnvio,
  DIAS_PLAZO_ENVIO,
  plazoEnvioReporteMensualVencido,
  consultas: {
    consultarReportes,
    consultarEventosNoLaborables,
    consultarBitacorasDelPeriodo,
    consultarActividadesConRegistros,
  },
};
