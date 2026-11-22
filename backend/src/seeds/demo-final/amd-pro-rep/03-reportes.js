// 03-reportes.js — amd-pro-rep · REP
//
// 6 alumnos de P1 (lozano) con su historia completa:
//   GR real (crearYRegistrar + avanzarHastaAsignadoHistorico) → actividades y
//   bitácoras (insert directo, como Karen) → rúbricas reales (guardarRubrica) →
//   reportes con los servicios REALES de REP (PDF, firma, SHA-256, sello TSA,
//   cifrado) con fechas simuladas en el pasado.
//
// Además, `crearSolicitudCaracteristicaP1()` (lo llama index.js ANTES de main):
// P1 pide la característica Investigador (capacidad 4) cuando aún tiene 0
// alumnos; al terminar main tiene 6, así que coordinación ya no puede aprobarla.
//
// Inserciones directas (no hay servicio real con fechas pasadas): actividades,
// bitácoras (+ registro de actividades + cúmulo de horas), la subida del
// expediente sin chequeo de fecha (patrón de Karen) y el ajuste de fechas de
// MIS filas (usuario, solicitud, documentos de GR, notificaciones, fecha de la
// solicitud de característica).
//
// Si la TSA no responde (principal y respaldo), el servicio lanza 503 ANTES de
// escribir nada: este archivo se detiene con error y al volver a correrlo
// retoma desde el estado en que quedó cada reporte (por alumno y número).

const prisma = require('../../../lib/prisma');
const H = require('./_helpers');
const { ALUMNOS, PROFESORES, OFERTAS, SOLICITUD_CARACTERISTICA_P1, CORREO_COORDINADOR_CREADOR, TEXTOS_REPORTES } = require('./_datos');
const { calcularFechasOferta } = require('./02-ofertas');
const P = require('../../../modules/reportes/reportes.periodos');
const C = require('../../../modules/reportes/reportes.calendario');
const repAlumno = require('../../../modules/reportes/reportes-alumno.service');
const caracteristicasService = require('../../../modules/administrativa/caracteristicas/caracteristicas.service');

// Días con cierre administrativo parcial (00-comun): no se siembran bitácoras.
const DIAS_PARCIALES = ['2026-10-08', '2026-10-22'];
const FECHA_FALTAS = '2026-12-01';
const LIMITE_ACTIVIDAD_ABIERTA = '2026-12-18';

// Actividades por oferta: [título, desde, hasta]; `hasta: null` = abierta (en progreso).
const ACTIVIDADES = {
  L1: [
    ['Levantamiento de requerimientos del módulo de egresados', '2026-04-16', '2026-06-15'],
    ['Diseño de la base de datos y de las encuestas', '2026-06-16', '2026-08-14'],
    ['Desarrollo del módulo de encuestas en línea', '2026-08-17', '2026-10-15'],
    ['Reportes por generación y pruebas finales', '2026-10-16', '2026-10-30'],
  ],
  L2: [
    ['Inventario de páginas y contenidos del portal', '2026-07-01', '2026-07-31'],
    ['Rediseño de la navegación del portal', '2026-08-03', '2026-09-30'],
    ['Migración de contenidos al nuevo gestor', '2026-10-01', '2026-10-30'],
    ['Pruebas de accesibilidad y correcciones', '2026-11-02', null],
  ],
  L3: [
    ['Levantamiento físico del inventario de laboratorios', '2026-10-01', '2026-10-30'],
    ['Carga del inventario y del historial de mantenimiento', '2026-11-02', null],
  ],
  L4: [
    ['Análisis de las plantillas de constancias vigentes', '2026-10-16', '2026-10-30'],
    ['Generador de constancias con folio y bitácora de emisión', '2026-11-02', null],
  ],
  A1: [
    ['Etiquetado del acervo fotográfico 2010–2015', '2026-11-03', null],
  ],
};

const FRASES = [
  'Se avanzó según lo planeado y se documentó el resultado en la carpeta del proyecto.',
  'Se revisó el avance con el profesor y se ajustaron los pendientes de la semana.',
  'Se corrigieron las observaciones de la revisión anterior y se actualizó la evidencia.',
  'Se completaron las tareas del día y se registraron los hallazgos en el documento de seguimiento.',
];

// ── Fechas ────────────────────────────────────────────────────────────────

let EVENTOS = null;
async function eventosNoLaborables() {
  if (!EVENTOS) {
    const filas = await repAlumno.consultas.consultarEventosNoLaborables(prisma, '2026-01-01', '2027-03-31');
    EVENTOS = filas.map((e) => ({
      id: e.id, nombre: e.nombre, tipo: e.tipo,
      fechaInicio: P.normalizarFechaISO(e.fecha_inicio),
      fechaFin: e.fecha_fin ? P.normalizarFechaISO(e.fecha_fin) : null,
    }));
  }
  return EVENTOS;
}

/** Periodo mensual n y su primer día generable (misma regla que REP). */
async function periodoReporte(fechaInicio, numero) {
  const per = P.calcularPeriodoReporte({ fechaInicio, numero });
  const generable = C.primerDiaHabilAdministrativoDesde(P.sumarDiasISO(per.fin, 1), await eventosNoLaborables());
  return { ...per, generable };
}

/** Fechas de un reporte: envío el primer día generable (12:30); profesor +1 hábil (13:00); coordinación +1 hábil (12:00). */
async function fechasReporte(fechaInicio, numero) {
  const per = await periodoReporte(fechaInicio, numero);
  const rev1 = await H.diaHabil(per.generable, 1);
  const rev2 = await H.diaHabil(rev1, 1);
  return {
    periodo: per,
    // 12:30: después de la jornada de ese día (8:00–12:00).
    envio: H.enHoraMexico(per.generable, '12:30'),
    profesor: H.enHoraMexico(rev1, '13:00'),
    coordinacion: H.enHoraMexico(rev2, '12:00'),
  };
}

/** Línea de tiempo de GR de un alumno, a partir de la aprobación de su oferta. */
async function lineaGR(oferta, periodo) {
  const fo = await calcularFechasOferta(oferta);
  const decision = fo.decision.toISOString().slice(0, 10);
  const registro = await H.diaHabil(decision, 2);
  const docs = await H.diaHabil(registro, 2);
  const carta = await H.diaHabil(registro, 4);
  const expediente = await H.diaHabil(registro, 6);
  const aprobacion = await H.diaHabil(expediente, 2);
  const lectura = await H.diaHabil(aprobacion, 1);
  if (!(expediente < periodo.maxExpediente)) throw new Error(`El expediente (${expediente}) quedaría después de la fecha límite ${periodo.maxExpediente}.`);
  if (!(lectura < periodo.inicio)) throw new Error(`La asignación (${aprobacion}) quedaría después del inicio del periodo ${periodo.inicio}.`);
  return { registro, docs, carta, expediente, aprobacion, lectura };
}

// ── Contexto ──────────────────────────────────────────────────────────────

async function contexto() {
  const p1 = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES.P1.correo }, include: { profesor: true } });
  if (!p1?.profesor) throw new Error('No existe P1; corre primero 01-profesores.');
  const coord = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR_CREADOR } });
  return { p1, coordinadorUsuarioId: coord.id };
}

// ── Característica de P1 (antes de asignarle alumnos) ─────────────────────

async function crearSolicitudCaracteristica(d) {
  const prof = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES[d.profesor].correo }, include: { profesor: true } });
  const caracteristica = await prisma.caracteristica.findFirst({ where: { nombre: d.caracteristica } });
  if (!caracteristica) throw new Error(`No existe la característica ${d.caracteristica} (00-comun).`);

  let sol = await prisma.solicitud_caracteristica.findFirst({ where: { profesor_id: prof.profesor.id, caracteristica_id: caracteristica.id } });
  if (sol) {
    console.log(`  ↷ solicitud de característica de ${d.profesor} ya existía (${sol.estado})`);
  } else {
    const creada = await caracteristicasService.crearSolicitud({ usuarioId: prof.id, caracteristicaId: caracteristica.id, justificacion: d.justificacion });
    sol = await prisma.solicitud_caracteristica.findUnique({ where: { id: creada.id } });
    console.log(`  ✅ ${d.profesor} solicita ${d.caracteristica} (capacidad ${3 + caracteristica.incremento_cupos})`);
  }
  const fecha = H.enHoraMexico(d.fecha, '10:20');
  H.ahoraSeguro(fecha);
  await prisma.solicitud_caracteristica.update({ where: { id: sol.id }, data: { fecha } });
  // Aviso real a los coordinadores: misma fecha; se queda SIN LEER (caso en vivo).
  await prisma.notificacion.updateMany({
    where: { ruta_relacionada: `/coordinacion/solicitudes-caracteristicas?destacar=${sol.id}` },
    data: { fecha_creacion: fecha },
  });
  return sol.id;
}

const crearSolicitudCaracteristicaP1 = () => crearSolicitudCaracteristica(SOLICITUD_CARACTERISTICA_P1);

// ── GR ────────────────────────────────────────────────────────────────────

async function registrarYAsignar(alumno, ofertaId, periodo, profesorUsuarioId, coordinadorUsuarioId) {
  const r = await H.crearYRegistrar(alumno, ofertaId, periodo.periodoId);
  const sol = await prisma.solicitud_registro.findUnique({ where: { id: r.solicitudId } });
  if (sol.estado_solicitud === 'espera_respuesta_de_profesor') {
    await H.avanzarHastaAsignadoHistorico(r.usuarioId, r.solicitudId, profesorUsuarioId, coordinadorUsuarioId);
  } else if (sol.estado_solicitud !== 'alumno_asignado') {
    throw new Error(`${alumno.correoInst}: la solicitud quedó en un estado intermedio (${sol.estado_solicitud}). Vuelve a sembrar desde cero.`);
  }
  await H.marcarBienvenidaLeida(r.usuarioId);
  return r;
}

async function ajustarFechasGR(alumno, usuarioId, solicitudId, linea) {
  await prisma.usuario.update({ where: { id: usuarioId }, data: { fecha_creacion: H.enHoraMexico(linea.registro, '10:00') } });
  await prisma.solicitud_registro.update({
    where: { id: solicitudId },
    data: { fecha_aplicacion: H.enHoraMexico(linea.registro, '10:05'), fecha_carta_compromiso: H.enHoraMexico(linea.carta, '12:00') },
  });
  await prisma.documento.updateMany({
    where: { alumno_id: alumno.boleta, tipo_documento: { in: ['carta_creditos', 'constancia_seguro_social'] } },
    data: { fecha_creacion: H.enHoraMexico(linea.docs, '11:00') },
  });
  await prisma.documento.updateMany({
    where: { alumno_id: alumno.boleta, tipo_documento: 'expediente' },
    data: { fecha_creacion: H.enHoraMexico(linea.expediente, '11:00') },
  });
  // Notificaciones de GR del alumno (bienvenida y cualquier otra que no sea de REP, bajas o
  // amonestación, que se ajustan en su propio paso): leídas.
  await prisma.notificacion.updateMany({
    where: {
      usuario_id: usuarioId,
      NOT: [
        { ruta_relacionada: { startsWith: '/alumno/reportes' } },
        { ruta_relacionada: { startsWith: '/alumno/solicitar-baja' } },
        { ruta_relacionada: { startsWith: '/alumno/horas' } },
      ],
    },
    data: { fecha_creacion: H.enHoraMexico(linea.aprobacion, '13:00'), leida: true, fecha_leida: H.enHoraMexico(linea.lectura, '09:00') },
  });
}

// ── AH: actividades y bitácoras ───────────────────────────────────────────

async function diasDeBitacora(alumno) {
  const b = alumno.bitacoras;
  const dias = [];
  let horas = 0;
  let d = alumno.periodoInicio;
  const tope = b.hasta480 ? '2026-11-13' : b.hasta;
  while (d <= tope) {
    if (!DIAS_PARCIALES.includes(d) && !(b.faltas ?? []).includes(d) && (await H.esHabil(d))) {
      const h = 4;
      dias.push({ fecha: d, horas: h, aprobada: d !== b.pendiente });
      horas += h;
      if (b.hasta480 && horas >= 480) break;
    }
    d = H.sumarDiasISO(d, 1);
  }
  if (b.hasta480 && horas < 480) throw new Error(`${alumno.correoInst}: no alcanza 480 h antes del 13-nov.`);
  return dias;
}

async function sembrarAH(alumno, solicitudId) {
  const dias = await diasDeBitacora(alumno);
  const plan = ACTIVIDADES[alumno.oferta];

  for (const [titulo, desde, hastaDef] of plan) {
    const enRango = dias.filter((x) => x.fecha >= desde && (hastaDef === null || x.fecha <= hastaDef));
    if (!enRango.length) continue;
    const abierta = hastaDef === null;
    const fechaLimite = abierta ? LIMITE_ACTIVIDAD_ABIERTA : hastaDef;

    let actividad = await prisma.actividad.findFirst({ where: { solicitud_registro_id: solicitudId, titulo } });
    if (!actividad) {
      actividad = await prisma.actividad.create({
        data: {
          solicitud_registro_id: solicitudId,
          titulo,
          descripcion: `${titulo}, conforme al plan de trabajo de la oferta.`,
          entregable_esperado: abierta ? 'Avance documentado y verificado por el profesor.' : 'Entregable revisado y aprobado por el profesor.',
          fecha_limite: H.utc(fechaLimite),
          estado: 'sin_comenzar',
          fecha_asignacion: H.enHoraMexico(desde, '09:00'),
        },
      });
    }

    const n = enRango.length;
    for (let i = 0; i < n; i += 1) {
      const x = enRango[i];
      const existe = await prisma.bitacora.findFirst({ where: { solicitud_registro_id: solicitudId, fecha_registro: H.utc(x.fecha) } });
      if (existe) continue;
      const pct = abierta ? Math.min(90, Math.round(((i + 1) / (n + 6)) * 100)) : (i === n - 1 ? 100 : Math.round(((i + 1) / n) * 100));
      await H.crearBitacoraHistorica({
        solicitudId, boleta: alumno.boleta, actividadId: actividad.id, fechaISO: x.fecha, horas: x.horas,
        porcentajeAvance: pct, descripcion: `${titulo}. ${FRASES[i % FRASES.length]}`,
        evidencia: `https://drive.example.com/${alumno.boleta}/${x.fecha}`, aprobada: x.aprobada,
      });
    }
  }

  await prisma.cumulo_horas_y_faltas.update({
    where: { alumno_id: alumno.boleta },
    data: { fecha_ultima_evaluacion_faltas: H.utc(FECHA_FALTAS), faltas_acumuladas: 0, faltas_consecutivas: 0 },
  });
  const total = dias.reduce((s, x) => s + x.horas, 0);
  const cruce = alumno.bitacoras.hasta480 ? dias[dias.length - 1].fecha : null;
  return { bitacoras: dias.length, horas: total, cruce };
}

// ── REP ───────────────────────────────────────────────────────────────────

const ESTADO_FINAL = {
  AC: 'aprobado_coordinador', RC: 'rechazado_coordinador', PC: 'pendiente_revision_coordinador',
  RP: 'rechazado_profesor', PP: 'pendiente_revision_profesor',
};

async function textoActividades(solicitudId, per) {
  const acts = await prisma.actividad.findMany({
    where: { solicitud_registro_id: solicitudId },
    include: { registro_bitacora_actividades: { include: { bitacora: true } } },
    orderBy: { id: 'asc' },
  });
  const lineas = acts
    .filter((a) => a.registro_bitacora_actividades.some((r) => {
      const f = r.bitacora.fecha_registro.toISOString().slice(0, 10);
      return f >= per.inicio && f <= per.fin && r.bitacora.estado === 'aprobada';
    }))
    .map((a) => `${a.titulo}.`);
  lineas.push('Registro diario de avances y evidencias en la bitácora del servicio.');
  return lineas.join('\n');
}

async function sembrarReportes(alumno, usuarioId, solicitudId, ctx) {
  const resumen = [];
  for (let i = 0; i < alumno.reportes.length; i += 1) {
    const numero = i + 1;
    const objetivo = alumno.reportes[i];
    const f = await fechasReporte(alumno.periodoInicio, numero);

    let rep = await prisma.reporte_mensual.findFirst({ where: { solicitud_registro_id: solicitudId, num_reporte: numero } });
    if (!rep) {
      // Texto redactado del reporte (_datos.js); si no hay, se arma con las actividades del periodo.
      const redactado = TEXTOS_REPORTES[alumno.sufijo]?.[numero - 1];
      const texto = redactado ? redactado.join('\n') : await textoActividades(solicitudId, f.periodo);
      const enviado = await H.enviarMensual(usuarioId, texto, f.envio);
      rep = await prisma.reporte_mensual.findUnique({ where: { id: enviado.id } });
      if (rep.num_reporte !== numero) throw new Error(`${alumno.correoInst}: REP generó el reporte ${rep.num_reporte} y se esperaba el ${numero}.`);
    }

    const estado = async () => (await prisma.reporte_mensual.findUnique({ where: { id: rep.id } })).estado_reporte;
    if (await estado() === 'pendiente_revision_profesor') {
      if (objetivo === 'RP') await H.profesorRechaza(ctx.p1.id, 'mensual', rep.id, alumno.rechazos[numero], f.profesor);
      else if (objetivo !== 'PP') await H.profesorAprueba(ctx.p1.id, 'mensual', rep.id, f.profesor);
    }
    if (await estado() === 'pendiente_revision_coordinador') {
      if (objetivo === 'RC') await H.coordinacionRechaza(ctx.coordinadorUsuarioId, 'mensual', rep.id, alumno.rechazos[numero], f.coordinacion);
      else if (objetivo === 'AC') await H.coordinacionAprueba(ctx.coordinadorUsuarioId, 'mensual', rep.id, f.coordinacion);
    }
    const final = await estado();
    if (final !== ESTADO_FINAL[objetivo]) throw new Error(`${alumno.correoInst} R${numero}: quedó en ${final} y se esperaba ${ESTADO_FINAL[objetivo]}.`);
    resumen.push(`R${numero} ${objetivo}`);
  }
  return resumen;
}

/**
 * Notificaciones de REP del alumno: cada revisión de profesor o coordinación crea
 * una (en el mismo orden). Se les pone la fecha de su revisión; quedan leídas,
 * salvo los rechazos que el alumno todavía tiene que corregir.
 */
async function ajustarNotificacionesREP(usuarioId, solicitudId) {
  const revisiones = await prisma.revision_reporte_mensual.findMany({
    where: { reporte_mensual: { solicitud_registro_id: solicitudId }, tipo_revisor: { in: ['profesor', 'coordinador'] } },
    include: { reporte_mensual: true },
    orderBy: { id: 'asc' },
  });
  const notis = await prisma.notificacion.findMany({
    where: { usuario_id: usuarioId, ruta_relacionada: { startsWith: '/alumno/reportes' } },
    orderBy: { id: 'asc' },
  });
  if (notis.length !== revisiones.length) {
    throw new Error(`Notificaciones de REP (${notis.length}) ≠ revisiones (${revisiones.length}) para la solicitud ${solicitudId}.`);
  }
  for (let i = 0; i < notis.length; i += 1) {
    const r = revisiones[i];
    const pendienteDeCorregir = r.estado === 'rechazado' && r.reporte_mensual.estado_reporte.startsWith('rechazado');
    const creada = new Date(r.fecha.getTime() + 60 * 1000);
    let leida = null;
    if (!pendienteDeCorregir) {
      leida = H.enHoraMexico(await H.diaHabil(r.fecha.toISOString().slice(0, 10), 1), '09:00');
      if (!(leida < H.REF)) leida = new Date(creada.getTime() + 2 * 3600 * 1000);
    }
    await prisma.notificacion.update({
      where: { id: notis[i].id },
      data: { fecha_creacion: creada, leida: !pendienteDeCorregir, fecha_leida: leida },
    });
  }
}

// ── Principal ─────────────────────────────────────────────────────────────

async function sembrarAlumno(alumno, ctx) {
  const oferta = OFERTAS.find((o) => o.clave === alumno.oferta);
  const ofertaRow = await prisma.oferta_servicio.findFirst({ where: { profesor_id: ctx.p1.profesor.id, nombre_proyecto: oferta.titulo } });
  if (!ofertaRow) throw new Error(`No existe la oferta ${oferta.clave}; corre primero 02-ofertas.`);
  const periodo = await H.buscarPeriodoOficial(alumno.periodoInicio);
  const linea = await lineaGR(oferta, periodo);

  const yaExistia = Boolean(await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } }));
  const { usuarioId, solicitudId } = await registrarYAsignar(alumno, ofertaRow.id, periodo, ctx.p1.id, ctx.coordinadorUsuarioId);
  await ajustarFechasGR(alumno, usuarioId, solicitudId, linea);

  const ah = await sembrarAH(alumno, solicitudId);

  // Rúbrica del alumno: antes de su primer envío (o en la fecha de _datos.js).
  const primerEnvio = alumno.reportes.length ? (await fechasReporte(alumno.periodoInicio, 1)).envio : null;
  const fechaRubrica = primerEnvio ? new Date(primerEnvio.getTime() - 30 * 60 * 1000) : H.enHoraMexico(alumno.rubrica, '10:00');
  await H.sembrarRubricaSiFalta(usuarioId, H.FIRMA_ALUMNO, fechaRubrica);

  const reportes = await sembrarReportes(alumno, usuarioId, solicitudId, ctx);
  await ajustarNotificacionesREP(usuarioId, solicitudId);

  console.log(`  ${yaExistia ? '↷' : '✅'} ${alumno.sufijo} ${alumno.correoInst} · inicio ${alumno.periodoInicio} · ${ah.bitacoras} bitácoras, ${ah.horas} h${ah.cruce ? ` (cruza 480 h el ${ah.cruce})` : ''} · ${reportes.join(', ') || 'sin reportes'}`);
  return { usuarioId, solicitudId, creado: !yaExistia, cruce480: ah.cruce };
}

async function main() {
  const ctx = await contexto();

  // Rúbrica de P1: antes de su primera revisión (R1 de 2301, el alumno más antiguo).
  const masAntiguo = [...ALUMNOS].filter((a) => a.reportes.length).sort((a, b) => a.periodoInicio.localeCompare(b.periodoInicio))[0];
  const primerEnvioGlobal = (await fechasReporte(masAntiguo.periodoInicio, 1)).envio;
  await H.sembrarRubricaSiFalta(ctx.p1.id, H.FIRMA_PROFESOR, new Date(primerEnvioGlobal.getTime() - 2 * 3600 * 1000));

  // Orden cronológico (el más antiguo primero).
  const orden = [...ALUMNOS].sort((a, b) => a.periodoInicio.localeCompare(b.periodoInicio));
  const resultado = {};
  for (const alumno of orden) {
    resultado[alumno.sufijo] = await sembrarAlumno(alumno, ctx);
  }
  return resultado;
}

module.exports = {
  main, crearSolicitudCaracteristica, crearSolicitudCaracteristicaP1, fechasReporte, periodoReporte, lineaGR,
  registrarYAsignar, ajustarFechasGR, sembrarAH, ACTIVIDADES,
};
