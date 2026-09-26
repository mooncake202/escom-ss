// BD falsa en memoria para la DECISIÓN de ofertas (CU-PRO-02). Modela lo justo: profesores, las
// ofertas que se revisan y las solicitudes de registro que ocupan cupo.
//
// El conteo de ocupados NO se simula aparte: los tests llaman al contarCuposOcupados real de
// lib/cupos.js, y este fake implementa solicitud_registro.count aplicando el mismo `where` que esa
// función construye (estados que ocupan + liberación no terminal + oferta del profesor). Así lo que
// se prueba es la regla real, no una copia.
//
// Mismo estilo que caracteristicas.fakes.js, incluida la simulación de bloquearProfesor: $queryRaw
// registra el lock junto al número de escrituras previas, para poder afirmar que el SELECT ... FOR
// UPDATE fue la PRIMERA sentencia de la transacción.

const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../gr/gr.shared');

// Copia deliberada de ESTADOS_LSS_LIBERAN_CUPO (lib/cupos.js): no se importa de ahí porque ese
// módulo hace require('./prisma') y este archivo se carga ANTES de que el test sustituya el prisma
// global. La prueba de consistencia afirma que ambos coinciden.
const ESTADOS_LSS_LIBERAN_CUPO = ['solicitud_constancia_termino', 'constancia_disponible'];

const clonar = (x) => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)));

function crearBd({ profesores = [], ofertas = [], ocupantes = [] } = {}) {
  const bd = {
    profesores: profesores.map((p) => ({ ...p })),
    ofertas: ofertas.map((o) => ({ ...o })),
    // Cada ocupante: { profesorId, estado_solicitud, liberacion }
    ocupantes: ocupantes.map((o) => ({ ...o })),
    // Bitácora de escrituras, para afirmar qué se tocó y qué NO.
    escrituras: [],
    locks: [],
    // Gancho para simular una escritura concurrente: se dispara DENTRO del $queryRaw del lock, antes
    // de leer cupos_totales. Permite probar que la guarda compara contra el valor leído bajo el lock
    // y no contra una lectura anterior. Se asigna sobre `bd` desde el test.
    antesDelLock: null,
  };

  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;

  const ofertaConRelaciones = (oferta, include = {}) => {
    if (!oferta) return null;
    const salida = { ...oferta };
    if (include.profesor) {
      const p = profesorDe(oferta.profesor_id);
      const incluyeProfesor = include.profesor.include ?? {};
      salida.profesor = p && {
        ...p,
        ...(incluyeProfesor.usuario ? { usuario: p.usuario } : {}),
      };
    }
    return salida;
  };

  // Mismo criterio que WHERE_SOLICITUD_OCUPA_CUPO en lib/cupos.js.
  const ocupaCupo = (o) => ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(o.estado_solicitud)
    && (o.liberacion == null || !ESTADOS_LSS_LIBERAN_CUPO.includes(o.liberacion));

  const modelos = {
    profesor: {
      findUnique: async ({ where }) => clonar(profesorDe(where.id)),
      update: async ({ where, data }) => {
        const p = profesorDe(where.id);
        Object.assign(p, data);
        bd.escrituras.push({ modelo: 'profesor', operacion: 'update', where, data });
        return clonar(p);
      },
    },
    oferta_servicio: {
      findUnique: async ({ where, include }) => {
        const o = bd.ofertas.find((x) => x.id === where.id);
        return clonar(ofertaConRelaciones(o, include));
      },
      // Aplica el `where` COMPLETO, incluido el estado de origen: así el test ejercita la guarda CAS
      // real y no una versión permisiva.
      updateMany: async ({ where, data }) => {
        const afectadas = bd.ofertas.filter((o) => (
          o.id === where.id
          && (where.estado_oferta === undefined || o.estado_oferta === where.estado_oferta)
        ));
        for (const o of afectadas) Object.assign(o, data);
        bd.escrituras.push({
          modelo: 'oferta_servicio', operacion: 'updateMany', where, data, count: afectadas.length,
        });
        return { count: afectadas.length };
      },
    },
    solicitud_registro: {
      count: async ({ where }) => bd.ocupantes
        .filter((o) => o.profesorId === where.oferta.profesor_id && ocupaCupo(o)).length,
    },
  };

  const prisma = new Proxy({}, {
    get: (_, propiedad) => {
      if (propiedad === '$transaction') return async (cb) => cb(prisma);
      // bloquearProfesor: SELECT ... FOR UPDATE. Se registra para poder afirmar que el lock se tomó
      // y que fue la PRIMERA sentencia de la transacción.
      if (propiedad === '$queryRaw') {
        return async (_textos, profesorId) => {
          if (bd.antesDelLock) bd.antesDelLock();
          bd.locks.push({ profesorId, escriturasPrevias: bd.escrituras.length });
          const p = profesorDe(profesorId);
          return p ? [{ id: p.id, cupos_totales: p.cupos_totales }] : [];
        };
      }
      if (propiedad === '$disconnect') return async () => {};
      return modelos[propiedad];
    },
  });

  return { bd, prisma };
}

const profesor = ({ id = 1, usuarioId = 10, cuposTotales = 3, nombre = 'Ana', apellidos = 'Torres Vega' } = {}) => ({
  id,
  usuario_id: usuarioId,
  departamento: 'Sistemas Computacionales',
  cupos_totales: cuposTotales,
  caracteristica_id: null,
  usuario: { id: usuarioId, nombre, apellidos, correo_institucional: 'ana.torres@ipn.mx' },
});

// Una oferta de PROYECTO: cupos_ofertados es su tope declarado.
const ofertaProyecto = ({ id = 1, profesorId = 1, cuposOfertados = 3, estado = 'pendiente_revision' } = {}) => ({
  id,
  profesor_id: profesorId,
  nombre_proyecto: 'Sistema de seguimiento académico',
  descripcion_actividades: 'Desarrollo y pruebas del módulo de seguimiento.',
  tipo_oferta: 'proyecto',
  estado_oferta: estado,
  cupos_ofertados: cuposOfertados,
  cupos_disponibles: cuposOfertados,
  motivo_rechazo: null,
  programa_SISS: null,
  nombre_SISS: null,
  coordinador_id: null,
});

// Una oferta INDIVIDUAL: cupos_ofertados es NULL y su lugar es 1, fijo.
const ofertaIndividual = ({ id = 1, profesorId = 1, estado = 'pendiente_revision' } = {}) => ({
  ...ofertaProyecto({ id, profesorId, estado }),
  tipo_oferta: 'individual',
  cupos_ofertados: null,
  cupos_disponibles: 1,
});

// n alumnos ocupando cupo de ese profesor, en un estado real de los que ocupan.
const ocupantes = (profesorId, n) => Array.from(
  { length: n },
  () => ({ profesorId, estado_solicitud: 'alumno_asignado', liberacion: null }),
);

module.exports = {
  crearBd, profesor, ofertaProyecto, ofertaIndividual, ocupantes, ESTADOS_LSS_LIBERAN_CUPO,
};
