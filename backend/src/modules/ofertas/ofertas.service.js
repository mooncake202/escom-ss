const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');

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
    // Si Redis falla, seguimos sin caché en vez de tumbar el endpoint.
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
    // ⚠️ El schema solo tiene UN campo (descripcion_actividades); el frontend
    // original (OfertaCard) esperaba dos campos separados (descripcion +
    // actividades). Se manda el mismo texto en ambos por ahora — si quieres
    // separarlos de verdad, hay que agregar una columna nueva en CU-PRO.
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
 * Reusa la tabla `carrera` que ya existe — NO se crean tablas perfilDeseado.
 * Sin caché: es una tabla catálogo diminuta, no vale la pena.
 */
async function listarPerfilesDisponibles() {
  const carreras = await prisma.carrera.findMany({ orderBy: { nombre: 'asc' } });
  return carreras.map((c) => ({ id: c.id, nombre: c.nombre }));
}

module.exports = { listarOfertasDisponibles, listarPerfilesDisponibles };