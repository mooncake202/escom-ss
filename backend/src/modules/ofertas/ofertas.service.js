const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const {
  construirContextoCupos,
  ofertaPuedeRecibirAlumno,
  contarCuposOcupados,
  obtenerSolicitudesOcupandoOfertas,
  bloquearProfesor,
  ESTADOS_LSS_LIBERAN_CUPO,
} = require('../../lib/cupos');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../gr/gr.shared');

const CACHE_KEY_OFERTAS = 'cache:ofertas';
const CACHE_TTL_OFERTAS = 30; // segundos — corto a propósito: cupos cambian con cada aceptación/rechazo

// Valores del enum `TipoOfertaServicio`. Se exporta para que el registro (CU-PRO-01), el reenvío
// (CU-PRO-05) y la consulta (CU-PRO-03) validen contra la MISMA lista en vez de repetir el literal.
// La consulta lo necesita porque el valor va al `where` de un campo enum: sin validar, Prisma lanza
// un error de validación que el controller traduce a 500 en vez de 400.
const TIPOS_OFERTA = Object.freeze(['individual', 'proyecto']);
const MENSAJE_TIPO_OFERTA_INVALIDO = "tipo_oferta debe ser 'individual' o 'proyecto'.";

// Normalización para buscar sin distinguir mayúsculas ni acentos. Mismo comportamiento que
// `sinAcentos` de front/.../CU-REP-05-revisar-reportes-profesor/revisionReportes.js; se duplica
// porque esta búsqueda corre en el backend y los dos árboles no comparten paquete.
const sinAcentos = (texto) => String(texto).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

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

// Invalida el caché de 30s de listarOfertasDisponibles cuando una oferta cambia de estado
// (CU-PRO-02 aprobar/rechazar) — sin esto, RN-PRO-12/RF-PRO-14 ("de inmediato") dependían de
// esperar el TTL. No crítico: si Redis falla, el próximo listado igual expira solo en 30s.
async function invalidarCacheOfertas() {
  try {
    await redis.del(CACHE_KEY_OFERTAS);
  } catch (err) {
    console.error('Error al invalidar caché de ofertas (no crítico):', err.message);
  }
}

/**
 * Catálogo de "perfiles" (carrera deseada) para el filtro de StepSeleccionOferta.
 */
async function listarPerfilesDisponibles() {
  const carreras = await prisma.carrera.findMany({ orderBy: { nombre: 'asc' } });
  return carreras.map((c) => ({ id: c.id, nombre: c.nombre }));
}

// CU-PRO-01: Solicitar registro

// Texto obligatorio recortado: devuelve el valor sin espacios sobrantes, o null si no es una
// cadena con contenido. Evita que una llamada directa a la API guarde "   " como nombre: el
// frontend ya recorta, pero el backend no puede confiar en eso.
function textoObligatorioRecortado(valor) {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

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

// Socket — mismo patrón exacto que emitirATodosLosCoordinadores en gr.service.js y
// lss-alumno.service.js: cualquier coordinador puede revisar/decidir cualquier oferta (no hay
// reparto real entre ellos), así que se emite individualmente a cada coordinador existente en vez
// de a uno solo. Fail-open, nunca tumba la operación de negocio.
async function emitirATodosLosCoordinadores(evento, datos, { excluirCoordinadorId } = {}) {
  try {
    const coordinadores = await prisma.coordinador.findMany({ select: { id: true, usuario_id: true } });
    for (const c of coordinadores) {
      // `excluirCoordinadorId` evita avisar a quien acaba de provocar el cambio: su pantalla ya se
      // recarga sola, así que el evento solo le costaría una petición repetida. Se filtra en el
      // servidor y no en el cliente porque la sesión del frontend guarda `usuario.id`, no
      // `coordinador.id`, y no podría compararlos. Sin el parámetro, el comportamiento es el de
      // siempre: se avisa a todos (registro y reenvío lo usan así).
      if (excluirCoordinadorId !== undefined && c.id === excluirCoordinadorId) continue;
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

// CU-PRO-02: Revisar solicitud de oferta
async function decidirOferta(ofertaId, decision, motivoRechazo, datosAprobacion, coordinadorId) {
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

    // Se valida y se persiste el MISMO valor recortado, igual que en CU-PRO-01: antes se validaba
    // con trim() pero se guardaba la cadena cruda, así que un valor con espacios alrededor quedaba
    // en BD con ellos. `textoObligatorioRecortado` cubre además el caso no-cadena, que antes
    // reventaba en `.trim()` y salía como 500.
    const programaLimpio = textoObligatorioRecortado(programaSISS);
    const actividadLimpia = textoObligatorioRecortado(actividadSISS);

    if (!programaLimpio) {
      throw Object.assign(new Error('Debes seleccionar el Programa SISS antes de aprobar.'), { status: 400 });
    }
    if (!actividadLimpia) {
      throw Object.assign(new Error('Debes seleccionar la Actividad SISS antes de aprobar.'), { status: 400 });
    }

    // Fail-fast: con el profesor ya lleno no vale la pena abrir una transacción ni tomar el lock.
    // No sustituye a la revalidación de abajo — la de aquí puede quedar obsoleta en microsegundos.
    await validarCapacidadParaTramitarOferta(oferta.profesor_id);

    // El tope de la oferta se fijó al crearla o reenviarla contra la capacidad de ESE momento, pero
    // una característica aprobada por ADM puede haberla bajado mientras la oferta esperaba revisión
    // (Características baja cupos_totales sin tocar jamás oferta_servicio, por diseño). Así que la
    // invariante cupos_ofertados <= cupos_totales se revalida aquí, con el valor vigente.
    await prisma.$transaction(async (tx) => {
      // PRIMERA sentencia de la transacción: SELECT ... FOR UPDATE sobre la fila del profesor, el
      // mismo patrón de GR, Bajas y Características. Devuelve cupos_totales leído bajo el lock, de
      // modo que ninguna aprobación de característica pueda colarse entre leer y comparar.
      const profesorBloqueado = await bloquearProfesor(oferta.profesor_id, tx);

      // REGLA GENERAL (individual Y proyecto): el profesor debe conservar capacidad. Se recalcula
      // AQUÍ, bajo el lock, y no solo en el fail-fast de arriba: el único flujo que sube los
      // ocupados es la aceptación de un alumno (CU-GR-02), que serializa sobre esta misma fila de
      // `profesor`. Mientras el lock esté tomado, ese conteo no puede crecer, así que el valor es
      // firme hasta el commit. Sin esto, un alumno aceptado entre el fail-fast y la escritura dejaba
      // aprobar una oferta de un profesor ya lleno.
      //
      // Es una regla DISTINTA e INDEPENDIENTE de la de proyecto que viene después: esta compara
      // ocupados contra cupos_totales; la otra compara cupos_ofertados contra cupos_totales. No se
      // suman ni se combinan — son dos límites separados por diseño.
      const ocupados = await contarCuposOcupados(oferta.profesor_id, tx);

      if (ocupados > profesorBloqueado.cupos_totales) {
        throw Object.assign(
          new Error('La capacidad actual del profesor presenta una inconsistencia.'),
          { status: 409 }
        );
      }
      if (ocupados === profesorBloqueado.cupos_totales) {
        throw Object.assign(
          new Error('El profesor ha alcanzado su capacidad máxima de alumnos.'),
          { status: 409 }
        );
      }

      // REGLA ADICIONAL, solo proyecto: una oferta individual tiene cupos_ofertados NULL y 1 lugar fijo, nunca puede
      // exceder la capacidad por su propio tamaño. Se exige entero para que un NULL/undefined no
      // entre a la comparación.
      if (oferta.tipo_oferta === 'proyecto' && Number.isInteger(oferta.cupos_ofertados)) {
        if (oferta.cupos_ofertados > profesorBloqueado.cupos_totales) {
          // 409 y la oferta se queda en pendiente_revision: rechazarla es una decisión del
          // coordinador, con su propio motivo, no un efecto automático de esta guarda.
          throw Object.assign(
            new Error(
              `No se puede aprobar: la oferta ofrece ${oferta.cupos_ofertados} cupos y la capacidad `
              + `actual del profesor es de ${profesorBloqueado.cupos_totales}. El profesor debe `
              + `corregir la oferta, o puedes rechazarla indicando el motivo.`
            ),
            { status: 409 }
          );
        }
      }

      // Condicionado a que SIGA pendiente_revision en el instante de escribir — cierra la ventana
      // de carrera entre el chequeo de arriba y este update: si otro coordinador ya decidió sobre
      // esta misma oferta mientras se validaba, count=0 y no se aplica ningún cambio.
      const { count } = await tx.oferta_servicio.updateMany({
        where: { id: ofertaId, estado_oferta: 'pendiente_revision' },
        data: {
          estado_oferta: 'aprobada',
          motivo_rechazo: null,
          programa_SISS: programaLimpio,
          nombre_SISS: actividadLimpia,
          coordinador_id: coordinadorId,
        },
      });

      if (count === 0) {
        throw Object.assign(
          new Error('Esta oferta ya fue revisada por otro coordinador mientras la consultabas.'),
          { status: 409 }
        );
      }
    });

    const actualizada = await prisma.oferta_servicio.findUnique({ where: { id: ofertaId } });

    await invalidarCacheOfertas();

    // Fail-open, igual que el socket de abajo y que el resto de los avisos del proyecto (REP,
    // Bajas, Características): la decisión ya está confirmada en BD, así que un fallo al notificar
    // se registra pero NUNCA la invalida ni la hace parecer fallida con un 500.
    try {
      await crearNotificacion({
        usuarioId: oferta.profesor.usuario_id,
        tipo: 'success',
        mensaje: `Tu oferta "${oferta.nombre_proyecto}" fue aprobada. Programa SISS: "${programaLimpio}" · Actividad SISS: "${actividadLimpia}" (validados por coordinación).`,
        rutaRelacionada: `/profesor/proyectos?destacar=${oferta.id}`,
      });
    } catch (err) {
      console.error('Error al crear la notificación de oferta aprobada:', err.message);
    }

    try {
      emitirAUsuario(oferta.profesor.usuario_id, 'oferta:decidida', {
        ofertaId: oferta.id,
        resultado: 'aprobada',
      });
    } catch (err) {
      console.error('Error al emitir oferta:decidida:', err.message);
    }

    // Los DEMÁS coordinadores comparten esta bandeja, así que su pantalla de consulta debe
    // enterarse de la decisión. Mismo evento que ya emiten el registro y el reenvío. Se excluye a
    // quien decidió: su pantalla ya recarga sola. `emitirATodosLosCoordinadores` es fail-open por
    // dentro, igual que el socket de arriba: nunca invalida una decisión ya confirmada.
    await emitirATodosLosCoordinadores('oferta:actualizada', {
      ofertaId: oferta.id,
      decididaPor: coordinadorId,
    }, { excluirCoordinadorId: coordinadorId });

    return actualizada;
  }

  if (decision === 'rechazar') {
    // Mismo criterio que en la rama de aprobación: se persiste el valor recortado que se validó.
    const motivoLimpio = textoObligatorioRecortado(motivoRechazo);

    if (!motivoLimpio) {
      throw Object.assign(new Error('Debes capturar el motivo del rechazo.'), { status: 400 });
    }

    const { count } = await prisma.oferta_servicio.updateMany({
      where: { id: ofertaId, estado_oferta: 'pendiente_revision' },
      data: { estado_oferta: 'rechazada', motivo_rechazo: motivoLimpio, coordinador_id: coordinadorId },
    });

    if (count === 0) {
      throw Object.assign(
        new Error('Esta oferta ya fue revisada por otro coordinador mientras la consultabas.'),
        { status: 409 }
      );
    }

    const actualizada = await prisma.oferta_servicio.findUnique({ where: { id: ofertaId } });

    await invalidarCacheOfertas();

    // Fail-open, igual que en la rama de aprobación: el rechazo ya está confirmado en BD.
    try {
      await crearNotificacion({
        usuarioId: oferta.profesor.usuario_id,
        tipo: 'urgente',
        mensaje: `Tu oferta "${oferta.nombre_proyecto}" fue rechazada. Motivo: ${motivoLimpio}`,
        rutaRelacionada: `/profesor/proyectos?destacar=${oferta.id}`,
      });
    } catch (err) {
      console.error('Error al crear la notificación de oferta rechazada:', err.message);
    }

    try {
      emitirAUsuario(oferta.profesor.usuario_id, 'oferta:decidida', {
        ofertaId: oferta.id,
        resultado: 'rechazada',
      });
    } catch (err) {
      console.error('Error al emitir oferta:decidida:', err.message);
    }

    // Los DEMÁS coordinadores comparten esta bandeja, así que su pantalla de consulta debe
    // enterarse de la decisión. Mismo evento que ya emiten el registro y el reenvío. Se excluye a
    // quien decidió: su pantalla ya recarga sola. `emitirATodosLosCoordinadores` es fail-open por
    // dentro, igual que el socket de arriba: nunca invalida una decisión ya confirmada.
    await emitirATodosLosCoordinadores('oferta:actualizada', {
      ofertaId: oferta.id,
      decididaPor: coordinadorId,
    }, { excluirCoordinadorId: coordinadorId });

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
      estatus: ESTATUS_POR_ESTADO[o.estado_oferta.toLowerCase()] ?? 'desconocido',
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

  // Sin esta guarda, un `tipo` fuera del enum llega al `where` y Prisma lanza un error de
  // validación sin `status`, que el controller convierte en 500. El filtro es opcional: solo se
  // valida cuando viene.
  if (tipoOferta && !TIPOS_OFERTA.includes(tipoOferta)) {
    throw Object.assign(new Error(MENSAJE_TIPO_OFERTA_INVALIDO), { status: 400 });
  }

  const where = {
    estado_oferta: estadoWhere,
    ...(tipoOferta && { tipo_oferta: tipoOferta }),
  };

  const ofertasEncontradas = await prisma.oferta_servicio.findMany({
    where,
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  // La búsqueda se filtra en memoria (no en el WHERE de Prisma) para que las 4 comparaciones
  // — nombre de la oferta, nombre del profesor, apellidos, y nombre completo concatenado — usen
  // exactamente la misma regla de coincidencia. El volumen de esta tabla es bajo (pantalla interna
  // de coordinación, no una búsqueda pública), así que traer las filas ya filtradas por
  // estado/tipo y filtrar aquí no representa un problema de escala.
  // El término se recorta ANTES de comparar, y el recorte decide si hay búsqueda: un texto que
  // queda vacío tras recortarlo (solo espacios) se comporta como "sin búsqueda", no como "0
  // resultados". El espacio INTERIOR se conserva, así que "Prueba de" sigue encontrando "Prueba de
  // integración". `busqueda` viene del query string y puede no ser cadena; `sinAcentos` ya hace
  // String(), así que un valor no textual sigue sin provocar 500: simplemente no coincide con nada.
  const termino = sinAcentos(busqueda ?? '').trim();

  const ofertas = termino
    ? ofertasEncontradas.filter((o) => {
        const nombre = o.profesor.usuario.nombre;
        const apellidos = o.profesor.usuario.apellidos;
        return (
          sinAcentos(o.nombre_proyecto).includes(termino) ||
          sinAcentos(nombre).includes(termino) ||
          sinAcentos(apellidos).includes(termino) ||
          sinAcentos(`${nombre} ${apellidos}`).includes(termino)
        );
      })
    : ofertasEncontradas;

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

  const nombreLimpio = textoObligatorioRecortado(nombre_proyecto);
  const descripcionLimpia = textoObligatorioRecortado(descripcion_actividades);

  if (!nombreLimpio || !descripcionLimpia || !tipo_oferta) {
    throw Object.assign(new Error('Faltan campos obligatorios.'), { status: 400 });
  }
  if (!TIPOS_OFERTA.includes(tipo_oferta)) {
    throw Object.assign(new Error(MENSAJE_TIPO_OFERTA_INVALIDO), { status: 400 });
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
    nombre_proyecto: nombreLimpio,
    descripcion_actividades: descripcionLimpia,
    tipo_oferta,
    estado_oferta: 'pendiente_revision',
    motivo_rechazo: null,
    cupos_ofertados: null,
    // Vuelve a NULL: el coordinador que la rechazó ya no es "quien decide" sobre esta versión
    // reenviada — nadie ha decidido todavía, la próxima decisión (de cualquier coordinador) es
    // la que debe quedar registrada aquí.
    coordinador_id: null,
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

  // Igual que en el registro (CU-PRO-01): se busca el valor LITERAL del catálogo, sin traducir.
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

  // Igual que en el registro (CU-PRO-01): hecho calculado, se avisa a los 4 coordinadores por
  // socket, sin persistir fila en `notificacion`.
  emitirATodosLosCoordinadores('oferta:actualizada', { ofertaId: actualizada.id });
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
  // rechazadas ni los alumnos que ya concluyeron su servicio (ver ESTADOS_LSS_LIBERAN_CUPO).
  const procesosActivos = oferta.solicitud_registro.filter(
    (s) =>
      !ESTADOS_RECHAZO_SOLICITUD.includes(s.estado_solicitud) &&
      !ESTADOS_LSS_LIBERAN_CUPO.includes(s.liberacion_proceso?.estado)
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

  const actualizada = await prisma.oferta_servicio.update({
    where: { id: ofertaId },
    data: { estado_oferta: 'cerrada' },
  });

  await invalidarCacheOfertas();

  return actualizada;
}

// CU-PRO-04: Concluir ofertas automáticamente (RN-PRO-18/19/20)
//
// El hito por el que un alumno cuenta como terminado es UNO —'solicitud_constancia_termino'— y ya no
// es un literal local: se toma de lib/cupos.js, el MISMO criterio con el que se cuentan los cupos
// ocupados del profesor, para que el cierre de la oferta y la liberación de capacidad no puedan
// desincronizarse. `ESTADOS_LSS_LIBERAN_CUPO` añade a ese hito el estado posterior de LSS, que solo
// conserva la condición de "ya liberado" (ver la explicación completa en lib/cupos.js).
//
// TODO ADM: excluir bajas aprobadas (pendiente de integración con el módulo de Bajas).

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
        && ESTADOS_LSS_LIBERAN_CUPO.includes(alumnosActivos[0].liberacion_proceso?.estado);
    } else {
      const cuposLlenos = oferta.cupos_disponibles === 0;
      const todosTerminaron = alumnosActivos.length > 0 &&
        alumnosActivos.every((s) => ESTADOS_LSS_LIBERAN_CUPO.includes(s.liberacion_proceso?.estado));
      debeConcluir = cuposLlenos && todosTerminaron;
    }

    if (debeConcluir) {
      // Condicionado a que la oferta SIGA 'aprobada' en el instante de escribir — mismo patrón CAS
      // que decidirOferta más arriba. Entre el findMany del inicio y este update pueden pasar
      // minutos, y en esa ventana el profesor puede cerrarla a mano (CU-PRO: 'cerrada'). Sin esta
      // guarda, el cron pisaría su decisión con 'concluida'. La única transición que puede aplicar
      // es 'aprobada' → 'concluida'; cualquier otro estado concurrente la deja intacta.
      const { count } = await prisma.oferta_servicio.updateMany({
        where: { id: oferta.id, estado_oferta: 'aprobada' },
        data: { estado_oferta: 'concluida' },
      });

      // count=0: alguien más ya movió la oferta y su decisión gana. No se notifica ni se cuenta una
      // conclusión que no ocurrió. No es un error: es el resultado legítimo de la carrera.
      if (count === 0) continue;

      await invalidarCacheOfertas();

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
  TIPOS_OFERTA,
  MENSAJE_TIPO_OFERTA_INVALIDO,
  textoObligatorioRecortado,
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
  emitirATodosLosCoordinadores,
  invalidarCacheOfertas,
};