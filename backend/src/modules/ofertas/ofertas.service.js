const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const {
  construirContextoCupos,
  ofertaPuedeRecibirAlumno,
  contarCuposOcupados,
  obtenerSolicitudesOcupandoOfertas,
} = require('../../lib/cupos');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../gr/gr.shared');

const CACHE_KEY_OFERTAS = 'cache:ofertas';
const CACHE_TTL_OFERTAS = 30; // segundos — corto a propósito: cupos cambian con cada aceptación/rechazo

/**
 * RF-GR-06: solo ofertas activas y con cupos disponibles al momento de la consulta.
 */
async function listarOfertasDisponibles() {
  try {
    const cacheado = await redis.get(CACHE_KEY_OFERTAS);
    if (cacheado) return JSON.parse(cacheado);
  } catch (err) {
    console.error('Error al leer caché de ofertas (se continúa sin caché):', err.message);
  }

  const ofertas = await prisma.oferta_servicio.findMany({
    where: {
      estado_oferta: 'aprobada',
      cupos_disponibles: { gt: 0 },
    },
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  // Filtra las ofertas cuyo profesor ya alcanzó su capacidad global. El conteo
  // de alumnos que ocupan capacidad se resuelve por lotes en UNA sola consulta
  // (construirContextoCupos), no una por oferta.
  const contexto = await construirContextoCupos(ofertas);
  const permisos = await Promise.all(
    ofertas.map((o) => ofertaPuedeRecibirAlumno(o, o.profesor, contexto))
  );
  const ofertasDisponibles = ofertas.filter((_, i) => permisos[i]);

  const resultado = ofertasDisponibles.map((o) => ({
    id: o.id,
    titulo: o.nombre_proyecto,
    profesor: `${o.profesor.usuario.nombre} ${o.profesor.usuario.apellidos}`,
    descripcion: o.descripcion_actividades,
    actividades: o.descripcion_actividades,
    cuposDisponibles: o.cupos_disponibles,
    perfiles: o.deseo_de_carrera.map((d) => d.carrera.nombre).join(','),
  }));

  try {
    await redis.set(CACHE_KEY_OFERTAS, JSON.stringify(resultado), 'EX', CACHE_TTL_OFERTAS);
  } catch (err) {
    console.error('Error al guardar caché de ofertas (no crítico):', err.message);
  }

  return resultado;
}

/**
 * Catálogo de "perfiles" (carrera deseada) para el filtro de StepSeleccionOferta.
 */
async function listarPerfilesDisponibles() {
  const carreras = await prisma.carrera.findMany({ orderBy: { nombre: 'asc' } });
  return carreras.map((c) => ({ id: c.id, nombre: c.nombre }));
}

// CU-PRO-01: Solicitar registro

async function calcularCuposDisponibles(profesorId) {
  const profesor = await prisma.profesor.findUnique({
    where: { id: profesorId },
  });

  if (!profesor) {
    return null;
  }

  const cuposOcupados = await contarCuposOcupados(profesorId);
  const cuposDisponiblesProfesor = Math.max(
    profesor.cupos_totales - cuposOcupados,
    0
  );

  return {
    profesor,
    cuposOcupados,
    cuposDisponiblesProfesor,
  };
}

// esAccionDelProfesor solo cambia la redacción del mensaje (profesor en 2ª persona, coordinador en 3ª).
async function validarCapacidadParaTramitarOferta(profesorId, esAccionDelProfesor = false) {
  const capacidad = await calcularCuposDisponibles(profesorId);

  if (!capacidad) {
    throw Object.assign(new Error('Profesor no encontrado.'), { status: 404 });
  }

  const { cuposOcupados, profesor } = capacidad;

  // Un profesor nunca debe superar su capacidad institucional.
  if (cuposOcupados > profesor.cupos_totales) {
    throw Object.assign(
      new Error('La capacidad actual del profesor presenta una inconsistencia.'),
      { status: 409 }
    );
  }

  // Si está lleno, no puede registrar, reenviar ni aprobar nuevas ofertas.
  if (cuposOcupados === profesor.cupos_totales) {
    throw Object.assign(
      new Error(
        esAccionDelProfesor
          ? 'Has alcanzado tu capacidad máxima de alumnos.'
          : 'El profesor ha alcanzado su capacidad máxima de alumnos.'
      ),
      { status: 409 }
    );
  }

  return capacidad;
}

const { emitirAUsuario } = require('../../sockets/socket.server');

// CU-PRO-02: Revisar solicitud de oferta
async function decidirOferta(ofertaId, decision, motivoRechazo, datosAprobacion) {
  const oferta = await prisma.oferta_servicio.findUnique({
    where: { id: ofertaId },
    include: { profesor: { include: { usuario: true } } },
  });

  if (!oferta) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }

  if (oferta.estado_oferta !== 'pendiente_revision') {
    throw Object.assign(new Error('Esta oferta ya fue revisada anteriormente.'), { status: 400 });
  }

  if (decision === 'aprobar') {
    const { programaSISS, actividadSISS } = datosAprobacion || {};

    if (!programaSISS || !programaSISS.trim()) {
      throw Object.assign(new Error('Debes seleccionar el Programa SISS antes de aprobar.'), { status: 400 });
    }
    if (!actividadSISS || !actividadSISS.trim()) {
      throw Object.assign(new Error('Debes seleccionar la Actividad SISS antes de aprobar.'), { status: 400 });
    }

    await validarCapacidadParaTramitarOferta(oferta.profesor_id);

    const actualizada = await prisma.oferta_servicio.update({
      where: { id: ofertaId },
      data: {
        estado_oferta: 'aprobada',
        motivo_rechazo: null,
        programa_SISS: programaSISS,
        nombre_SISS: actividadSISS,
      },
    });

    await crearNotificacion({
      usuarioId: oferta.profesor.usuario_id,
      tipo: 'success',
      mensaje: `Tu oferta "${oferta.nombre_proyecto}" fue aprobada. Programa SISS: "${programaSISS}" · Actividad SISS: "${actividadSISS}" (validados por coordinación).`,
      rutaRelacionada: `/profesor/proyectos?destacar=${oferta.id}`,
    });

    try {
      emitirAUsuario(oferta.profesor.usuario_id, 'oferta:decidida', {
        ofertaId: oferta.id,
        resultado: 'aprobada',
      });
    } catch (err) {
      console.error('Error al emitir oferta:decidida:', err.message);
    }

    return actualizada;
  }

  if (decision === 'rechazar') {
    if (!motivoRechazo || motivoRechazo.trim() === '') {
      throw Object.assign(new Error('Debes capturar el motivo del rechazo.'), { status: 400 });
    }

    const actualizada = await prisma.oferta_servicio.update({
      where: { id: ofertaId },
      data: { estado_oferta: 'rechazada', motivo_rechazo: motivoRechazo },
    });

    await crearNotificacion({
      usuarioId: oferta.profesor.usuario_id,
      tipo: 'urgente',
      mensaje: `Tu oferta "${oferta.nombre_proyecto}" fue rechazada. Motivo: ${motivoRechazo}`,
      rutaRelacionada: `/profesor/proyectos?destacar=${oferta.id}`,
    });

    try {
      emitirAUsuario(oferta.profesor.usuario_id, 'oferta:decidida', {
        ofertaId: oferta.id,
        resultado: 'rechazada',
      });
    } catch (err) {
      console.error('Error al emitir oferta:decidida:', err.message);
    }

    return actualizada;
  }

  throw Object.assign(new Error("decision debe ser 'aprobar' o 'rechazar'."), { status: 400 });
}

// CU-PRO-02 (parte de listado): ofertas pendientes de revisión
async function listarOfertasPendientes() {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { estado_oferta: 'pendiente_revision' },
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  return Promise.all(ofertas.map(async (o) => {
    const cuposInfo = await calcularCuposDisponibles(o.profesor_id);
    return {
      id: o.id,
      modalidad: o.tipo_oferta,
      titulo: o.nombre_proyecto,
      tituloSISS: o.nombre_SISS,
      programaSISS: o.programa_SISS,
      profesor: `${o.profesor.usuario.nombre} ${o.profesor.usuario.apellidos}`,
      fechaSolicitud: o.fecha_registro,
      descripcion: o.descripcion_actividades,
      actividades: o.descripcion_actividades,
      cuposSolicitados: o.tipo_oferta === 'individual' ? 1 : o.cupos_ofertados,
      cuposOcupadosProfesor: cuposInfo?.cuposOcupados ?? 0,
      cuposTotalesProfesor: cuposInfo?.profesor?.cupos_totales ?? null,
      cuposDisponiblesProfesor: cuposInfo?.cuposDisponiblesProfesor ?? null,
      perfilDeseado: o.deseo_de_carrera.map((d) => d.carrera.nombre),
    };
  }));
}

// CU-PRO-05: Consultar historial de ofertas (profesor ve las suyas)
const ESTATUS_POR_ESTADO = {
  pendiente_revision: 'en_revision',
  aprobada: 'activo',
  rechazada: 'rechazada',
  concluida: 'concluido',
  cerrada: 'cerrado',
};

async function listarMisOfertas(profesorId) {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { profesor_id: profesorId },
    include: {
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  // Alumnos que actualmente ocupan un lugar en estas ofertas
  const solicitudesOcupando = await obtenerSolicitudesOcupandoOfertas(
    ofertas.map((o) => o.id)
  );

  const alumnosPorOferta = new Map();

  for (const s of solicitudesOcupando) {
    const alumnos = alumnosPorOferta.get(s.oferta_id) || [];

    alumnos.push(
      `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`
    );

    alumnosPorOferta.set(s.oferta_id, alumnos);
  }
  return ofertas.map((o) => {
    const cuposTotales = o.tipo_oferta === 'individual' ? 1 : (o.cupos_ofertados ?? 0);
    const alumnosVinculados = alumnosPorOferta.get(o.id) || [];

    return {
      id: o.id,
      tipo: o.tipo_oferta,
      titulo: o.nombre_proyecto,
      tituloSISS: o.nombre_SISS,
      programaSISS: o.programa_SISS,
      descripcion: o.descripcion_actividades,
      cupos: cuposTotales,
      cuposOcupados: cuposTotales - o.cupos_disponibles,
      cuposDisponibles: o.cupos_disponibles,
      alumnosActivos: alumnosVinculados.length,
      alumnos: alumnosVinculados,
      estatus: ESTATUS_POR_ESTADO[o.estado_oferta] ?? o.estado_oferta,
      carreras: o.deseo_de_carrera.map((d) => d.carrera.nombre),
      motivoRechazo: o.motivo_rechazo,
      fechaRegistro: o.fecha_registro.toISOString().slice(0, 10),
    };
  });
}

// CU-PRO-03: Consultar ofertas (coordinador, 2 vistas + búsqueda/filtros)
async function consultarOfertas({ vista, busqueda, tipoOferta, estadoOferta }) {
  let estadoWhere;
  if (vista === 'pendientes') {
    estadoWhere = 'pendiente_revision';
  } else if (vista === 'historial') {
    estadoWhere = (estadoOferta === 'aprobada' || estadoOferta === 'rechazada')
      ? estadoOferta
      : { in: ['aprobada', 'rechazada'] };
  } else {
    throw Object.assign(new Error("vista debe ser 'pendientes' o 'historial'."), { status: 400 });
  }

  const where = {
    estado_oferta: estadoWhere,
    ...(tipoOferta && { tipo_oferta: tipoOferta }),
    ...(busqueda && {
      OR: [
        { nombre_proyecto: { contains: busqueda } },
        { profesor: { usuario: { OR: [
          { nombre: { contains: busqueda } },
          { apellidos: { contains: busqueda } },
        ] } } },
      ],
    }),
  };

  const ofertas = await prisma.oferta_servicio.findMany({
    where,
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  const { cuposOcupadosPorProfesor } = await construirContextoCupos(ofertas);


  return ofertas.map((o) => ({
    id: o.id,
    titulo: o.nombre_proyecto,
    nombreSISS: o.nombre_SISS,
    programaSISS: o.programa_SISS,
    profesor: `${o.profesor.usuario.nombre} ${o.profesor.usuario.apellidos}`,
    modalidad: o.tipo_oferta,
    estado: o.estado_oferta,
    descripcion: o.descripcion_actividades,
    actividades: o.descripcion_actividades,
    cuposRegistrados: o.tipo_oferta === 'individual' ? 1 : o.cupos_ofertados,
    cuposDisponibles: o.cupos_disponibles,
    cuposOcupadosProfesor: cuposOcupadosPorProfesor.get(o.profesor_id) || 0,
    cuposTotalesProfesor: o.profesor.cupos_totales,
    perfilCarrera: o.deseo_de_carrera.map((d) => d.carrera.nombre),
    motivoRechazo: o.motivo_rechazo,
    fechaRegistro: o.fecha_registro.toISOString().slice(0, 10),
  }));
}

// CU-PRO-05 (Flujo A): Corregir y reenviar oferta rechazada
async function reenviarOferta(ofertaId, profesorId, datos) {
  const oferta = await prisma.oferta_servicio.findUnique({ where: { id: ofertaId } });

  if (!oferta) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }
  if (oferta.profesor_id !== profesorId) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }
  if (oferta.estado_oferta !== 'rechazada') {
    throw Object.assign(new Error('Solo se pueden corregir y reenviar ofertas rechazadas.'), { status: 400 });
  }

  const { nombre_proyecto, descripcion_actividades, tipo_oferta, cupos_ofertados, carreras } = datos;

  if (!nombre_proyecto || !descripcion_actividades || !tipo_oferta) {
    throw Object.assign(new Error('Faltan campos obligatorios.'), { status: 400 });
  }
  if (!['individual', 'proyecto'].includes(tipo_oferta)) {
    throw Object.assign(new Error("tipo_oferta debe ser 'individual' o 'proyecto'."), { status: 400 });
  }
  if (!Array.isArray(carreras) || carreras.length === 0) {
    throw Object.assign(new Error('Debe seleccionar al menos un perfil de carrera.'), { status: 400 });
  }

  // Capacidad institucional actual del profesor
  const profesor = await prisma.profesor.findUnique({
    where: { id: profesorId },
    select: { cupos_totales: true },
  });

  if (!profesor) {
    throw Object.assign(new Error('Profesor no encontrado.'), { status: 404 });
  }

  await validarCapacidadParaTramitarOferta(profesorId, true);

  let dataActualizada = {
    nombre_proyecto,
    descripcion_actividades,
    tipo_oferta,
    estado_oferta: 'pendiente_revision',
    motivo_rechazo: null,
    cupos_ofertados: null,
  };

  if (tipo_oferta === 'individual') {
    dataActualizada.cupos_disponibles = 1;
  } else {
    const cupos = parseInt(cupos_ofertados, 10);

    if (!Number.isInteger(cupos) || cupos < 2) {
      throw Object.assign(
        new Error('Para modalidad proyecto, cupos_ofertados debe ser un entero mayor o igual a 2.'),
        { status: 400 }
      );
    }

    // Una oferta no puede superar la capacidad total del profesor
    if (cupos > profesor.cupos_totales) {
      throw Object.assign(
        new Error(`La oferta no puede tener más de ${profesor.cupos_totales} cupos.`),
        { status: 400 }
      );
    }

    dataActualizada.cupos_ofertados = cupos;
    dataActualizada.cupos_disponibles = cupos;
  }

  const carrerasEncontradas = await prisma.carrera.findMany({ where: { nombre: { in: carreras } } });
  if (carrerasEncontradas.length !== carreras.length) {
    throw Object.assign(new Error('Una o más carreras seleccionadas no son válidas.'), { status: 400 });
  }

  const actualizada = await prisma.$transaction(async (tx) => {
    await tx.deseo_de_carrera.deleteMany({ where: { oferta_id: ofertaId } });
    return tx.oferta_servicio.update({
      where: { id: ofertaId },
      data: {
        ...dataActualizada,
        deseo_de_carrera: {
          create: carrerasEncontradas.map((c) => ({ carrera: { connect: { id: c.id } } })),
        },
      },
    });
  });

  const coordinador = await prisma.coordinador.findFirst();
  if (coordinador) {
    await crearNotificacion({
      usuarioId: coordinador.usuario_id,
      tipo: 'info',
      mensaje: `Oferta reenviada tras corrección: "${actualizada.nombre_proyecto}".`,
      rutaRelacionada: `/coordinacion/ofertas?destacar=${actualizada.id}`,
    });

    try {
      emitirAUsuario(coordinador.usuario_id, 'oferta:reenviada', { ofertaId: actualizada.id });
    } catch (err) {
      console.error('Error al emitir oferta:reenviada:', err.message);
    }
  }
  return actualizada;
}

// CU-PRO-04: Gestionar estado de oferta (cierre MANUAL, profesor)

const ESTADOS_RECHAZO_SOLICITUD = [
  'rechazada_definitivamente',
  'rechazada_por_cupos',
  'rechazada_por_profesor',
];

// TODO ADM/LSS: excluir bajas aprobadas y confirmar el estado terminal de liberación
async function cerrarOfertaManual(ofertaId, profesorId) {
  const oferta = await prisma.oferta_servicio.findUnique({
    where: { id: ofertaId },
    include: { solicitud_registro: { include: { liberacion_proceso: true } } },
  });

  if (!oferta) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }

  if (oferta.profesor_id !== profesorId) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }

  if (oferta.estado_oferta !== 'aprobada') {
    throw Object.assign(
      new Error('Solo se pueden cerrar ofertas que estén Aprobadas.'),
      { status: 400 }
    );
  }

  // Solicitudes o alumnos que todavía mantienen viva la oferta: no cuentan las
  // rechazadas ni los alumnos que ya terminaron su servicio (estado terminal LSS).
  const procesosActivos = oferta.solicitud_registro.filter(
    (s) =>
      !ESTADOS_RECHAZO_SOLICITUD.includes(s.estado_solicitud) &&
      s.liberacion_proceso?.estado !== ESTADO_LSS_TERMINAL
  ).length;

  if (procesosActivos > 0) {
    throw Object.assign(
      new Error(
        'No puedes cerrar esta oferta porque todavía tiene solicitudes o alumnos activos.'
      ),
      { status: 400 }
    );
  }

  if (oferta.cupos_disponibles === 0) {
    throw Object.assign(
      new Error(
        'No se puede cerrar: la oferta ya tiene todos sus cupos ocupados.'
      ),
      { status: 400 }
    );
  }

  return prisma.oferta_servicio.update({
    where: { id: ofertaId },
    data: { estado_oferta: 'cerrada' },
  });
}

// CU-PRO-04: Concluir ofertas automáticamente (RN-PRO-18/19/20)
// TODO ADM/LSS: excluir bajas aprobadas y confirmar el estado terminal de liberación
const ESTADO_LSS_TERMINAL = 'constancia_disponible'; // mismo valor que usa dashboard.service.js

async function revisarConclusionAutomatica() {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { estado_oferta: 'aprobada' },
    include: {
      profesor: { include: { usuario: true } },
      solicitud_registro: {
        include: { liberacion_proceso: true },
      },
    },
  });

  let concluidas = 0;

  for (const oferta of ofertas) {
    // Solo solicitudes que ya ocupan un lugar de la oferta (aceptadas por el profesor o posteriores).
    const alumnosActivos = oferta.solicitud_registro.filter(
      (s) => ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(s.estado_solicitud)
    );

    let debeConcluir = false;

    if (oferta.tipo_oferta === 'individual') {
      debeConcluir = oferta.cupos_disponibles === 0
        && alumnosActivos.length === 1
        && alumnosActivos[0].liberacion_proceso?.estado === ESTADO_LSS_TERMINAL;
    } else {
      const cuposLlenos = oferta.cupos_disponibles === 0;
      const todosTerminaron = alumnosActivos.length > 0 &&
        alumnosActivos.every((s) => s.liberacion_proceso?.estado === ESTADO_LSS_TERMINAL);
      debeConcluir = cuposLlenos && todosTerminaron;
    }

    if (debeConcluir) {
      await prisma.oferta_servicio.update({
        where: { id: oferta.id },
        data: { estado_oferta: 'concluida' },
      });

      await crearNotificacion({
        usuarioId: oferta.profesor.usuario_id,
        tipo: 'success',
        mensaje: `Tu oferta "${oferta.nombre_proyecto}" ha concluido: todos los alumnos terminaron su servicio social.`,
        rutaRelacionada: `/profesor/proyectos?destacar=${oferta.id}`,
      });

      try {
        emitirAUsuario(oferta.profesor.usuario_id, 'oferta:concluida', { ofertaId: oferta.id });
      } catch (err) {
        console.error('Error al emitir oferta:concluida:', err.message);
      }

      concluidas++;
    }
  }

  return concluidas;
}

module.exports = {
  listarOfertasDisponibles,
  listarPerfilesDisponibles,
  calcularCuposDisponibles,
  validarCapacidadParaTramitarOferta,
  decidirOferta,
  listarOfertasPendientes,
  listarMisOfertas,
  consultarOfertas,
  reenviarOferta,
  cerrarOfertaManual,
  revisarConclusionAutomatica,
};