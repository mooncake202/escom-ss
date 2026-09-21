// Servicio del calendario institucional (CU-ADM-08). Reglas en calendario.validaciones.js;
// la BD solo se toca después de validar. Redis (metadata y caché) se actualiza tras el commit y nunca rompe el CRUD.

const {
  validarCrearEvento,
  validarActualizarInhabil,
  evaluarModificabilidad,
  obtenerContextoMexico,
  fechaISOValida,
} = require('./calendario.validaciones');
const { TIPOS_EVENTO, CODIGOS_ERROR, semestreApiAPrisma, semestrePrismaAApi } = require('./calendario.shared');
const {
  leerUltimaModificacion,
  registrarUltimaModificacion,
  invalidarCachePeriodos,
} = require('./calendario.redis');

const CODIGO_NO_ENCONTRADO = 'EVENTO_NO_ENCONTRADO';
const CODIGO_ROL_SIN_ACCESO = 'ROL_SIN_ACCESO';
const CODIGO_PERFIL_NO_ENCONTRADO = 'PERFIL_NO_ENCONTRADO';

// La restricción de visibilidad vive aquí, no en el frontend. alumno_asignado no ve Periodos;
// alumno_sin_asignar (y cualquier rol ausente de este mapa) no tiene acceso al calendario.
const TIPOS_VISIBLES_POR_ROL = Object.freeze({
  coordinador: [TIPOS_EVENTO.PERIODO, TIPOS_EVENTO.VACACIONAL, TIPOS_EVENTO.INHABIL],
  profesor: [TIPOS_EVENTO.PERIODO, TIPOS_EVENTO.VACACIONAL, TIPOS_EVENTO.INHABIL],
  alumno_asignado: [TIPOS_EVENTO.VACACIONAL, TIPOS_EVENTO.INHABIL],
});

const MENSAJES = Object.freeze({
  [CODIGOS_ERROR.INHABIL_DUPLICADO]: 'Ya existe un día inhábil en esa fecha.',
  [CODIGOS_ERROR.VACACIONAL_CRUZADO]: 'Ya existe un periodo vacacional que se cruza con las fechas seleccionadas.',
  [CODIGOS_ERROR.EVENTO_INMUTABLE]: 'Los periodos y periodos vacacionales publicados no pueden editarse ni eliminarse.',
  [CODIGOS_ERROR.EVENTO_YA_EN_VIGOR]: 'Este día inhábil ya entró en vigor y no puede modificarse ni eliminarse.',
  [CODIGO_NO_ENCONTRADO]: 'Evento no encontrado.',
  [CODIGO_ROL_SIN_ACCESO]: 'No tienes acceso al calendario institucional.',
  [CODIGO_PERFIL_NO_ENCONTRADO]: 'No se encontró tu perfil de coordinador.',
});

function crearError(mensaje, status, code, extra = {}) {
  return Object.assign(new Error(mensaje), { status, code, ...extra });
}

const errorDeCodigo = (codigo, status) => crearError(MENSAJES[codigo], status, codigo);

function errorDeValidacion({ codigo, errores }) {
  const mensaje = codigo === CODIGOS_ERROR.CONFIRMACION_REQUERIDA
    ? errores.confirmacionPublicacion
    : 'Revisa los campos marcados.';
  return crearError(mensaje, 400, codigo, { errores });
}

// ── Conversión BD ↔ API ──
// `hora` es TIME sin zona: se guarda como reloj de México (1970-01-01THH:mm:00Z), sin conversión.

const fechaADate = (iso) => new Date(`${iso}T00:00:00.000Z`);
const dateAFecha = (fecha) => fecha.toISOString().slice(0, 10);
const horaADate = (hora) => new Date(`1970-01-01T${hora}:00.000Z`);
const dateAHora = (fecha) => fecha.toISOString().slice(11, 16);

function resolverDeps(deps) {
  return {
    prisma: deps.prisma ?? require('../../../lib/prisma'),
    redis: deps.redis ?? require('../../../lib/redis'),
    ahora: deps.ahora ?? new Date(),
    opcionesRedis: deps.timeoutRedisMs === undefined ? {} : { timeoutMs: deps.timeoutRedisMs },
  };
}

function serializarEvento(fila, { rol, ahora }) {
  const tipo = fila.tipo;
  const hora = fila.hora ? dateAHora(fila.hora) : null;
  const fechaInicio = dateAFecha(fila.fecha_inicio);
  const periodo = fila.periodo_registro
    ? {
        id: fila.periodo_registro.id,
        anio: fila.periodo_registro.anio,
        semestre: semestrePrismaAApi(fila.periodo_registro.semestre),
        fechaMaxExpediente: dateAFecha(fila.periodo_registro.fecha_max_expediente),
      }
    : null;

  const evento = {
    id: fila.id,
    tipo,
    nombre: fila.nombre,
    fechaInicio,
    fechaFin: fila.fecha_fin ? dateAFecha(fila.fecha_fin) : null,
    hora,
    todoElDia: tipo === TIPOS_EVENTO.INHABIL ? hora === null : null,
    periodo,
  };

  // Solo el coordinador puede modificar: a los demás roles no se les envían estas banderas.
  if (rol !== 'coordinador') return evento;
  const modificabilidad = evaluarModificabilidad({ tipo, fechaInicio, hora }, ahora);
  return {
    ...evento,
    editable: modificabilidad.editable,
    eliminable: modificabilidad.eliminable,
    motivoNoEditable: modificabilidad.motivo,
  };
}

function parsearId(id) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero < 1) throw errorDeCodigo(CODIGO_NO_ENCONTRADO, 404);
  return numero;
}

function formatearHoraActual(segundosDelDia) {
  const horas = String(Math.floor(segundosDelDia / 3600)).padStart(2, '0');
  const minutos = String(Math.floor((segundosDelDia % 3600) / 60)).padStart(2, '0');
  return `${horas}:${minutos}`;
}

// ── Lectura ──

function validarFiltros({ tipo, desde, hasta }) {
  const errores = {};
  if (tipo !== undefined && !Object.values(TIPOS_EVENTO).includes(tipo)) errores.tipo = 'El tipo debe ser Inhabil, Vacacional o Periodo.';
  if (desde !== undefined && !fechaISOValida(desde)) errores.desde = 'La fecha inicial no es válida (AAAA-MM-DD).';
  if (hasta !== undefined && !fechaISOValida(hasta)) errores.hasta = 'La fecha final no es válida (AAAA-MM-DD).';
  if (!errores.desde && !errores.hasta && desde !== undefined && hasta !== undefined && desde > hasta) {
    errores.hasta = 'La fecha final no puede ser anterior a la inicial.';
  }
  if (Object.keys(errores).length > 0) {
    throw crearError('Revisa los filtros.', 400, CODIGOS_ERROR.VALIDACION, { errores });
  }
}

/** Eventos visibles para `rol`, con `ultimaModificacion` (null si Redis no la tiene). */
async function listarEventos({ rol, filtros = {} }, deps = {}) {
  // Primero el acceso: un rol sin permiso se rechaza sin tocar BD ni Redis.
  const visibles = TIPOS_VISIBLES_POR_ROL[rol];
  if (!visibles) throw errorDeCodigo(CODIGO_ROL_SIN_ACCESO, 403);

  const { prisma, redis, ahora, opcionesRedis } = resolverDeps(deps);
  validarFiltros(filtros);

  const { tipo, desde, hasta } = filtros;
  const tipos = tipo === undefined ? visibles : visibles.filter((t) => t === tipo);

  // Un evento entra si su intervalo [fecha_inicio, fecha_fin ?? fecha_inicio] toca [desde, hasta].
  const condiciones = [];
  if (hasta !== undefined) condiciones.push({ fecha_inicio: { lte: fechaADate(hasta) } });
  if (desde !== undefined) {
    condiciones.push({
      OR: [
        { fecha_fin: { gte: fechaADate(desde) } },
        { AND: [{ fecha_fin: null }, { fecha_inicio: { gte: fechaADate(desde) } }] },
      ],
    });
  }

  const [filas, ultimaModificacion] = await Promise.all([
    tipos.length === 0
      ? []
      : prisma.evento_calendario.findMany({
          where: { tipo: { in: tipos }, ...(condiciones.length > 0 ? { AND: condiciones } : {}) },
          include: { periodo_registro: true },
          orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }],
        }),
    leerUltimaModificacion(redis, opcionesRedis),
  ]);

  const contexto = obtenerContextoMexico(ahora);
  return {
    eventos: filas.map((fila) => serializarEvento(fila, { rol, ahora })),
    ultimaModificacion,
    contexto: { hoy: contexto.hoy, horaActual: formatearHoraActual(contexto.segundosDelDia) },
  };
}

// ── Escritura ──

// Un solo Inhabil por fecha (sin importar la hora). No hay UNIQUE en BD: la comprobación va dentro de la
// transacción, pero dos altas simultáneas de la misma fecha aún podrían coincidir (ventana conocida).
async function asegurarSinInhabilEnFecha(tx, fechaISO, idExcluido) {
  const existente = await tx.evento_calendario.findFirst({
    where: {
      tipo: TIPOS_EVENTO.INHABIL,
      fecha_inicio: fechaADate(fechaISO),
      ...(idExcluido === null ? {} : { id: { not: idExcluido } }),
    },
    select: { id: true },
  });
  if (existente) throw errorDeCodigo(CODIGOS_ERROR.INHABIL_DUPLICADO, 409);
}

// Dos Vacacionales se cruzan si nuevoInicio <= existenteFin y nuevoFin >= existenteInicio (extremos incluidos).
// Misma ventana de concurrencia que el Inhabil: no hay UNIQUE ni bloqueo en BD.
async function asegurarSinVacacionalCruzado(tx, fechaInicioISO, fechaFinISO) {
  const existente = await tx.evento_calendario.findFirst({
    where: {
      tipo: TIPOS_EVENTO.VACACIONAL,
      fecha_inicio: { lte: fechaADate(fechaFinISO) },
      fecha_fin: { gte: fechaADate(fechaInicioISO) },
    },
    select: { id: true },
  });
  if (existente) throw errorDeCodigo(CODIGOS_ERROR.VACACIONAL_CRUZADO, 409);
}

function exigirModificable(fila, ahora) {
  const modificabilidad = evaluarModificabilidad(
    {
      tipo: fila.tipo,
      fechaInicio: dateAFecha(fila.fecha_inicio),
      hora: fila.hora ? dateAHora(fila.hora) : null,
    },
    ahora,
  );
  if (!modificabilidad.editable) throw errorDeCodigo(modificabilidad.motivo, 409);
}

// Metadata en Redis solo tras el commit; ambas operaciones son tolerantes a fallos.
async function actualizarRedisTrasCambio({ redis, ahora, opcionesRedis }, { invalidarPeriodos = false } = {}) {
  const [ultimaModificacion] = await Promise.all([
    registrarUltimaModificacion(redis, ahora, opcionesRedis),
    invalidarPeriodos ? invalidarCachePeriodos(redis, opcionesRedis) : null,
  ]);
  return ultimaModificacion;
}

async function crearEvento({ usuarioId, entrada }, deps = {}) {
  const contexto = resolverDeps(deps);
  const { prisma, ahora } = contexto;

  const validacion = validarCrearEvento(entrada, ahora);
  if (!validacion.ok) throw errorDeValidacion(validacion);
  const datos = validacion.datos;

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: usuarioId }, select: { id: true } });
  if (!coordinador) throw errorDeCodigo(CODIGO_PERFIL_NO_ENCONTRADO, 404);

  const fila = await prisma.$transaction(async (tx) => {
    if (datos.tipo === TIPOS_EVENTO.INHABIL) await asegurarSinInhabilEnFecha(tx, datos.fechaInicio, null);
    if (datos.tipo === TIPOS_EVENTO.VACACIONAL) await asegurarSinVacacionalCruzado(tx, datos.fechaInicio, datos.fechaFin);

    const evento = await tx.evento_calendario.create({
      data: {
        coordinador_id: coordinador.id,
        nombre: datos.nombre,
        tipo: datos.tipo,
        fecha_inicio: fechaADate(datos.fechaInicio),
        fecha_fin: datos.fechaFin ? fechaADate(datos.fechaFin) : null,
        hora: datos.hora ? horaADate(datos.hora) : null,
      },
    });
    if (datos.tipo !== TIPOS_EVENTO.PERIODO) return evento;

    const periodo = await tx.periodo_registro.create({
      data: {
        evento_calendario_id: evento.id,
        anio: datos.periodo.anio,
        semestre: semestreApiAPrisma(datos.periodo.semestre),
        fecha_max_expediente: fechaADate(datos.periodo.fechaMaxExpediente),
      },
    });
    return { ...evento, periodo_registro: periodo };
  });

  const ultimaModificacion = await actualizarRedisTrasCambio(contexto, { invalidarPeriodos: datos.tipo === TIPOS_EVENTO.PERIODO });
  return { evento: serializarEvento(fila, { rol: 'coordinador', ahora }), ultimaModificacion };
}

async function actualizarInhabil({ id, entrada }, deps = {}) {
  const contexto = resolverDeps(deps);
  const { prisma, ahora } = contexto;
  const idEvento = parsearId(id);

  // Orden: existe → sigue siendo modificable → cuerpo válido → sin duplicado.
  const fila = await prisma.$transaction(async (tx) => {
    const existente = await tx.evento_calendario.findUnique({ where: { id: idEvento }, include: { periodo_registro: true } });
    if (!existente) throw errorDeCodigo(CODIGO_NO_ENCONTRADO, 404);
    exigirModificable(existente, ahora);

    const validacion = validarActualizarInhabil(entrada, ahora);
    if (!validacion.ok) throw errorDeValidacion(validacion);
    const datos = validacion.datos;

    await asegurarSinInhabilEnFecha(tx, datos.fechaInicio, idEvento);
    return tx.evento_calendario.update({
      where: { id: idEvento },
      data: {
        nombre: datos.nombre,
        fecha_inicio: fechaADate(datos.fechaInicio),
        fecha_fin: null,
        hora: datos.hora ? horaADate(datos.hora) : null,
      },
    });
  });

  const ultimaModificacion = await actualizarRedisTrasCambio(contexto);
  return { evento: serializarEvento(fila, { rol: 'coordinador', ahora }), ultimaModificacion };
}

async function eliminarInhabil({ id }, deps = {}) {
  const contexto = resolverDeps(deps);
  const { prisma, ahora } = contexto;
  const idEvento = parsearId(id);

  await prisma.$transaction(async (tx) => {
    const existente = await tx.evento_calendario.findUnique({ where: { id: idEvento } });
    if (!existente) throw errorDeCodigo(CODIGO_NO_ENCONTRADO, 404);
    exigirModificable(existente, ahora);
    await tx.evento_calendario.delete({ where: { id: idEvento } });
  });

  const ultimaModificacion = await actualizarRedisTrasCambio(contexto);
  return { eliminado: true, id: idEvento, ultimaModificacion };
}

module.exports = {
  TIPOS_VISIBLES_POR_ROL,
  listarEventos,
  crearEvento,
  actualizarInhabil,
  eliminarInhabil,
};
