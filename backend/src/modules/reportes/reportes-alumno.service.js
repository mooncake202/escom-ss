// CU-REP-01 fase 1: datos para preparar el reporte mensual. Solo lectura.
// Inicio/fin del servicio: solicitud → periodo_registro → evento_calendario (nunca las bitácoras).
// Solo cuentan bitácoras 'aprobada'. Una bitácora pertenece al reporte cuyo periodo contiene su fecha_revision (el día,
// en México, en que AH la dejó aprobada, también al aprobarla después desde AH-06), NO su fecha_registro.
// diasLaborados = cantidad de bitácoras aprobadas del periodo; horas = SUM(horas_contabilizadas) tal como las guarda AH.

const { calcularDiaMexicoUTC } = require('../../lib/fechas');
const {
  ESTADO_REPORTE_APROBACION_FINAL,
  ESTADOS_REPORTE_RECHAZADOS,
  ESTADO_BITACORA_APROBADA,
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
  periodoCerrado,
  servicioIniciado,
} = require('./reportes.periodos');
const { construirCalendarioPeriodo } = require('./reportes.calendario');

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

function consultarBitacorasAprobadas(prisma, solicitudId, inicio, fin) {
  return prisma.bitacora.findMany({
    where: {
      solicitud_registro_id: solicitudId,
      estado: ESTADO_BITACORA_APROBADA,
      // Días completos en México: desde el inicio del primer día hasta antes del día siguiente al último.
      fecha_revision: { gte: inicioDiaMexico(inicio), lt: inicioDiaSiguienteMexico(fin) },
    },
    orderBy: { fecha_revision: 'asc' },
    select: { id: true, fecha_registro: true, fecha_revision: true, horas_contabilizadas: true },
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
        bitacora: { estado: ESTADO_BITACORA_APROBADA, fecha_registro: { lte: aDateUTC(fin) } },
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
 * Avance con bitácoras aprobadas únicamente. Cada registro guarda el % acumulado de ese día,
 * así que alInicio/alCierre son el ÚLTIMO registro antes del periodo / hasta su fin (no el máximo).
 * porcentajeActual (actividad.porcentaje_progreso) incluye avances aún no aprobados.
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
  servicio, periodo, hoy, diasLaborados, reporteExistente, reportesBloqueantes, motivosDatos = [],
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

  if (periodo.rebasaFinServicio === null) agregar(MOTIVOS_BLOQUEO.FECHA_FIN_NO_DISPONIBLE);
  else if (periodo.rebasaFinServicio) agregar(MOTIVOS_BLOQUEO.PERIODO_REBASA_FIN_SERVICIO);

  if (!periodoCerrado(periodo, hoy)) agregar(MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO);
  else if (diasLaborados === 0) agregar(MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS);

  if (reporteExistente) agregar(MOTIVOS_BLOQUEO.REPORTE_YA_EXISTE);
  if (reportesBloqueantes.length > 0) agregar(MOTIVOS_BLOQUEO.REPORTE_ANTERIOR_SIN_APROBACION_FINAL);

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

// deps ({ prisma, ahora }) solo se usa en pruebas.
async function prepararReporteMensual(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const hoy = normalizarFechaISO(calcularDiaMexicoUTC(deps.ahora ?? new Date()));

  const { alumno, solicitud } = await resolverAlumnoYSolicitud(prisma, usuarioId);

  const eventoOficial = solicitud.periodo_registro?.evento_calendario ?? null;
  const fechaInicio = eventoOficial?.fecha_inicio ? normalizarFechaISO(eventoOficial.fecha_inicio) : null;
  const fechaFin = eventoOficial?.fecha_fin ? normalizarFechaISO(eventoOficial.fecha_fin) : null;

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

  const reportesBloqueantes = reportes
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
    reportesAnteriores: { total: reportes.length, bloqueantes: reportesBloqueantes },
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
      resumen: { diasLaborados: 0, horas: 0, bitacorasAprobadas: 0 },
      bitacoras: [],
      calendario: { dias: [], eventos: [] },
      actividades: [],
      puedeGenerar: false,
      motivosBloqueo: evaluarBloqueos({
        servicio: base.servicio, periodo: null, hoy, diasLaborados: 0, reporteExistente, reportesBloqueantes,
        motivosDatos,
      }),
      diagnostico: { inconsistenciasCalendario: [] },
    };
  }

  const periodo = calcularPeriodoReporte({ fechaInicio, fechaFin, numero });

  const [eventosFilas, bitacorasFilas, { actividades, registros }] = await Promise.all([
    consultarEventosNoLaborables(prisma, periodo.inicio, periodo.fin),
    consultarBitacorasAprobadas(prisma, solicitud.id, periodo.inicio, periodo.fin),
    consultarActividadesConRegistros(prisma, solicitud.id, periodo.fin),
  ]);

  const bitacoras = bitacorasFilas.map((b) => ({
    id: b.id,
    fecha: normalizarFechaISO(b.fecha_registro),
    fechaRevision: b.fecha_revision.toISOString(),
    horas: b.horas_contabilizadas ?? 0,
  }));

  const calendario = construirCalendarioPeriodo({
    inicio: periodo.inicio,
    fin: periodo.fin,
    eventos: eventosFilas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      tipo: e.tipo,
      fechaInicio: normalizarFechaISO(e.fecha_inicio),
      fechaFin: e.fecha_fin ? normalizarFechaISO(e.fecha_fin) : null,
    })),
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

  const diasLaborados = bitacoras.length;
  const horas = bitacoras.reduce((suma, b) => suma + b.horas, 0);

  const motivosBloqueo = evaluarBloqueos({
    servicio: base.servicio, periodo, hoy, diasLaborados, reporteExistente, reportesBloqueantes, motivosDatos,
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
        cerrado: periodoCerrado(periodo, hoy),
        rebasaFinServicio: periodo.rebasaFinServicio,
      },
    },
    resumen: { diasLaborados, horas, bitacorasAprobadas: bitacoras.length },
    bitacoras,
    calendario: { dias: calendario.dias, eventos: calendario.eventos },
    actividades: calcularAvanceActividades({ actividades, registros, inicio: periodo.inicio, fin: periodo.fin }),
    puedeGenerar: motivosBloqueo.length === 0,
    motivosBloqueo,
    diagnostico: { inconsistenciasCalendario: calendario.inconsistencias },
  };
}

module.exports = {
  prepararReporteMensual,
  resolverAlumnoYSolicitud,
  datosDeImpresion,
  calcularAvanceActividades,
  evaluarBloqueos,
  evaluarBloqueosDeDatos,
  consultas: {
    consultarReportes,
    consultarEventosNoLaborables,
    consultarBitacorasAprobadas,
    consultarActividadesConRegistros,
  },
};
