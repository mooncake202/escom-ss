const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');

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
      estado_oferta: 'Aprobada',
      cupos_disponibles: { gt: 0 },
    },
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  const resultado = ofertas.map((o) => ({
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

/**
 * Calcula la capacidad disponible de un profesor y si tiene la
 * característica 'Investigador' aprobada.
 */
async function calcularCuposDisponibles(profesorId) {
  const profesor = await prisma.profesor.findUnique({
    where: { id: profesorId },
    include: {
      solicitud_caracteristica: {
        where: { estado: 'aprobada' },
        include: { caracteristica: true },
      },
      oferta_servicio: true,
    },
  });

  if (!profesor) {
    return null;
  }

  const cupos_comprometidos_profesor = profesor.oferta_servicio
    .filter((o) => o.estado_oferta !== 'Rechazada')
    .reduce((sum, o) => {
      if (o.tipo_oferta === 'individual') return sum + 1;
      if (o.cupos_investigador) return sum;
      return sum + (o.cupos_ofertados || 0);
    }, 0);

  const cupos_disponibles_profesor = profesor.cupos_totales - cupos_comprometidos_profesor;

  const es_investigador = profesor.solicitud_caracteristica.some(
    (sc) => sc.caracteristica.nombre === 'Investigador'
  );

  return { profesor, cupos_disponibles_profesor, es_investigador };
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

  if (oferta.estado_oferta !== 'Pendiente_revision') {
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

    const actualizada = await prisma.oferta_servicio.update({
      where: { id: ofertaId },
      data: {
        estado_oferta: 'Aprobada',
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
      data: { estado_oferta: 'Rechazada', motivo_rechazo: motivoRechazo },
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
    where: { estado_oferta: 'Pendiente_revision' },
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
      cuposDisponiblesProfesor: cuposInfo?.cupos_disponibles_profesor ?? null,
      esInvestigador: cuposInfo?.es_investigador ?? false,
      perfilDeseado: o.deseo_de_carrera.map((d) => d.carrera.nombre),
    };
  }));
}

// CU-PRO-05: Consultar historial de ofertas (profesor ve las suyas)
const ESTATUS_POR_ESTADO = {
  Pendiente_revision: 'en_revision',
  Aprobada: 'activo',
  Rechazada: 'rechazada',
  Concluida: 'concluido',
  Cerrada: 'cerrado',
};

async function listarMisOfertas(profesorId) {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { profesor_id: profesorId },
    include: {
      deseo_de_carrera: { include: { carrera: true } },
      solicitud_registro: {
        include: { alumno: { include: { usuario: true } } },
      },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  return ofertas.map((o) => {
    const cuposTotales = o.tipo_oferta === 'individual' ? 1 : (o.cupos_investigador ?? o.cupos_ofertados ?? 0);
    const alumnosVinculados = o.solicitud_registro.map(
      (s) => `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`
    );

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
    estadoWhere = 'Pendiente_revision';
  } else if (vista === 'historial') {
    estadoWhere = (estadoOferta === 'Aprobada' || estadoOferta === 'Rechazada')
      ? estadoOferta
      : { in: ['Aprobada', 'Rechazada'] };
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
    cuposRegistrados: o.cupos_investigador ?? (o.tipo_oferta === 'individual' ? 1 : o.cupos_ofertados),
    cuposDisponibles: o.cupos_disponibles,
    esInvestigador: o.cupos_investigador !== null,
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
    throw Object.assign(new Error('No tienes permiso para modificar esta oferta.'), { status: 403 });
  }
  if (oferta.estado_oferta !== 'Rechazada') {
    throw Object.assign(new Error('Solo se pueden corregir y reenviar ofertas rechazadas.'), { status: 400 });
  }

  const { nombre_proyecto, nombre_SISS, programa_SISS, descripcion_actividades, tipo_oferta, cupos_ofertados, carreras } = datos;

  if (!nombre_proyecto || !nombre_SISS || !programa_SISS || !descripcion_actividades || !tipo_oferta) {
    throw Object.assign(new Error('Faltan campos obligatorios.'), { status: 400 });
  }
  if (!['individual', 'proyecto'].includes(tipo_oferta)) {
    throw Object.assign(new Error("tipo_oferta debe ser 'individual' o 'proyecto'."), { status: 400 });
  }
  if (!Array.isArray(carreras) || carreras.length === 0) {
    throw Object.assign(new Error('Debe seleccionar al menos un perfil de carrera.'), { status: 400 });
  }

  const resultado = await calcularCuposDisponibles(profesorId);
  const { cupos_disponibles_profesor, es_investigador } = resultado;

  let dataActualizada = {
    nombre_SISS,
    programa_SISS,
    nombre_proyecto,
    descripcion_actividades,
    tipo_oferta,
    estado_oferta: 'Pendiente_revision',
    motivo_rechazo: null,
    cupos_ofertados: null,
    cupos_investigador: null,
  };

  if (tipo_oferta === 'individual') {
    if (cupos_disponibles_profesor < 1) {
      throw Object.assign(new Error('No tienes cupos disponibles. Solicita modificación de características en Gestión Administrativa.'), { status: 400 });
    }
    dataActualizada.cupos_disponibles = 1;
  } else {
    const cupos = parseInt(cupos_ofertados, 10);
    if (!Number.isInteger(cupos) || cupos < 2) {
      throw Object.assign(new Error('Para modalidad proyecto, cupos_ofertados debe ser un entero mayor o igual a 2.'), { status: 400 });
    }
    if (cupos > cupos_disponibles_profesor) {
      if (es_investigador) {
        dataActualizada.cupos_ofertados = cupos;
        dataActualizada.cupos_investigador = cupos;
        dataActualizada.cupos_disponibles = cupos;
      } else {
        throw Object.assign(new Error('No tienes cupos disponibles suficientes. Solicita modificación de características en Gestión Administrativa.'), { status: 400 });
      }
    } else {
      dataActualizada.cupos_ofertados = cupos;
      dataActualizada.cupos_disponibles = cupos;
    }
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

async function cerrarOfertaManual(ofertaId, profesorId) {
  const oferta = await prisma.oferta_servicio.findUnique({
    where: { id: ofertaId },
    include: { solicitud_registro: true },
  });

  if (!oferta) {
    throw Object.assign(new Error('Oferta no encontrada.'), { status: 404 });
  }
  if (oferta.profesor_id !== profesorId) {
    throw Object.assign(new Error('No tienes permiso para modificar esta oferta.'), { status: 403 });
  }
  if (oferta.tipo_oferta !== 'proyecto') {
    throw Object.assign(new Error('Las ofertas individuales no se pueden cerrar manualmente.'), { status: 400 });
  }
  if (oferta.estado_oferta !== 'Aprobada') {
    throw Object.assign(new Error('Solo se pueden cerrar ofertas que estén Aprobadas.'), { status: 400 });
  }

  const alumnosActivos = oferta.solicitud_registro.filter(
    (s) => !ESTADOS_RECHAZO_SOLICITUD.includes(s.estado_solicitud)
  ).length;

  if (alumnosActivos > 0) {
    throw Object.assign(
      new Error(`No se puede cerrar: hay ${alumnosActivos} alumno(s) con servicio activo en esta oferta.`),
      { status: 400 }
    );
  }
  if (oferta.cupos_disponibles <= 0) {
    throw Object.assign(new Error('No se puede cerrar: la oferta ya tiene todos sus cupos ocupados.'), { status: 400 });
  }

  return prisma.oferta_servicio.update({
    where: { id: ofertaId },
    data: { estado_oferta: 'Cerrada' },
  });
}
// CU-PRO-04: Concluir ofertas automáticamente (RN-PRO-18/19/20)
const ESTADO_LSS_TERMINAL = 'constancia_disponible'; // mismo valor que usa dashboard.service.js

async function revisarConclusionAutomatica() {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { estado_oferta: 'Aprobada' },
    include: {
      profesor: { include: { usuario: true } },
      solicitud_registro: {
        include: { liberacion_proceso: true },
      },
    },
  });

  let concluidas = 0;

  for (const oferta of ofertas) {
    const alumnosActivos = oferta.solicitud_registro.filter(
      (s) => !ESTADOS_RECHAZO_SOLICITUD.includes(s.estado_solicitud)
    );

    let debeConcluir = false;

    if (oferta.tipo_oferta === 'individual') {
      debeConcluir = alumnosActivos.length === 1
        && alumnosActivos[0].liberacion_proceso?.estado === ESTADO_LSS_TERMINAL;
    } else {
      const cuposLlenos = oferta.cupos_disponibles <= 0;
      const todosTerminaron = alumnosActivos.length > 0 &&
        alumnosActivos.every((s) => s.liberacion_proceso?.estado === ESTADO_LSS_TERMINAL);
      debeConcluir = cuposLlenos && todosTerminaron;
    }

    if (debeConcluir) {
      await prisma.oferta_servicio.update({
        where: { id: oferta.id },
        data: { estado_oferta: 'Concluida' },
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
  decidirOferta,
  listarOfertasPendientes,
  listarMisOfertas,
  consultarOfertas,
  reenviarOferta,
  cerrarOfertaManual,
  revisarConclusionAutomatica,
};