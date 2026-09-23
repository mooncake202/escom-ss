// BD falsa en memoria para CU-ADM-15/16. Modela lo justo: profesores, catálogo, solicitudes de
// característica y las solicitudes de registro que ocupan cupo.
//
// El conteo de ocupados NO se simula aparte: los tests llaman al contarCuposOcupados real de
// lib/cupos.js, y este fake implementa solicitud_registro.count aplicando el mismo `where` que esa
// función construye (estados que ocupan + liberación no terminal + oferta del profesor). Así lo que
// se prueba es la regla real, no una copia.

const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../gr/gr.shared');

const ESTADO_LSS_TERMINAL = 'constancia_disponible';

const CATALOGO = [
  { id: 1, nombre: 'Investigador', incremento_cupos: 1 },
  { id: 2, nombre: 'Coordinador', incremento_cupos: 2 },
  { id: 3, nombre: 'Presidente_de_academia', incremento_cupos: 2 },
  { id: 4, nombre: 'Jefe_de_departamento', incremento_cupos: 3 },
  { id: 5, nombre: 'Funcionario', incremento_cupos: 3 },
  { id: 6, nombre: 'Profesor_coordinador_de_clubes', incremento_cupos: 3 },
];

const clonar = (x) => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x), (_, v) => v));

function crearBd({ profesores = [], solicitudes = [], ocupantes = [] } = {}) {
  const bd = {
    catalogo: CATALOGO.map((c) => ({ ...c })),
    profesores: profesores.map((p) => ({ ...p })),
    solicitudes: solicitudes.map((s) => ({ ...s })),
    // Cada ocupante: { profesorId, estado_solicitud, liberacion }
    ocupantes: ocupantes.map((o) => ({ ...o })),
    // Bandeja COMPARTIDA: por defecto hay dos coordinadores, como la BD real.
    coordinadores: [{ id: 1, usuario_id: 900 }, { id: 2, usuario_id: 901 }],
    // Bitácora de escrituras, para afirmar qué se tocó y qué NO.
    escrituras: [],
    locks: [],
    notificaciones: [],
  };

  const caracteristicaDe = (id) => (id === null || id === undefined ? null : bd.catalogo.find((c) => c.id === id) ?? null);

  const conRelaciones = (solicitud, include = {}) => {
    if (!solicitud) return null;
    const salida = { ...solicitud };
    if (include.caracteristica) salida.caracteristica = caracteristicaDe(solicitud.caracteristica_id);
    if (include.profesor) {
      const p = bd.profesores.find((x) => x.id === solicitud.profesor_id);
      const incluyeProfesor = include.profesor.include ?? {};
      salida.profesor = {
        ...p,
        ...(incluyeProfesor.usuario ? { usuario: p.usuario } : {}),
        ...(incluyeProfesor.caracteristica ? { caracteristica: caracteristicaDe(p.caracteristica_id) } : {}),
      };
    }
    return salida;
  };

  const profesorConRelaciones = (p, include = {}) => {
    if (!p) return null;
    return {
      ...p,
      ...(include.caracteristica ? { caracteristica: caracteristicaDe(p.caracteristica_id) } : {}),
      ...(include.usuario ? { usuario: p.usuario } : {}),
    };
  };

  // Mismo criterio que WHERE_SOLICITUD_OCUPA_CUPO en lib/cupos.js.
  const ocupaCupo = (o) => ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(o.estado_solicitud)
    && (o.liberacion == null || o.liberacion !== ESTADO_LSS_TERMINAL);

  const modelos = {
    profesor: {
      findUnique: async ({ where, include }) => {
        const p = bd.profesores.find((x) => (where.id !== undefined ? x.id === where.id : x.usuario_id === where.usuario_id));
        return clonar(profesorConRelaciones(p, include));
      },
      update: async ({ where, data }) => {
        const p = bd.profesores.find((x) => x.id === where.id);
        Object.assign(p, data);
        bd.escrituras.push({ modelo: 'profesor', operacion: 'update', where, data });
        return clonar(p);
      },
    },
    caracteristica: {
      findUnique: async ({ where }) => clonar(bd.catalogo.find((c) => c.id === where.id) ?? null),
      findMany: async () => clonar(bd.catalogo),
    },
    coordinador: {
      findFirst: async () => clonar(bd.coordinadores[0] ?? null),
      findMany: async () => clonar(bd.coordinadores),
    },
    solicitud_caracteristica: {
      findFirst: async ({ where, include }) => {
        const s = bd.solicitudes.find((x) => x.profesor_id === where.profesor_id && (!where.estado || x.estado === where.estado));
        return clonar(conRelaciones(s, include));
      },
      findUnique: async ({ where, include }) => clonar(conRelaciones(bd.solicitudes.find((x) => x.id === where.id), include)),
      findMany: async ({ where = {}, include, orderBy }) => {
        // `estado` puede venir como literal o como { in: [...] } (pendientes vs historial).
        const coincideEstado = (x) => where.estado === undefined
          || (where.estado.in ? where.estado.in.includes(x.estado) : x.estado === where.estado);
        let filas = bd.solicitudes.filter((x) => (where.profesor_id === undefined || x.profesor_id === where.profesor_id)
          && coincideEstado(x));
        if (orderBy?.id === 'desc') filas = [...filas].sort((a, b) => b.id - a.id);
        if (orderBy?.fecha === 'asc') filas = [...filas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        if (orderBy?.fecha_respuesta === 'desc') {
          filas = [...filas].sort((a, b) => new Date(b.fecha_respuesta ?? 0) - new Date(a.fecha_respuesta ?? 0));
        }
        return filas.map((s) => clonar(conRelaciones(s, include)));
      },
      create: async ({ data, include }) => {
        const fila = { id: Math.max(0, ...bd.solicitudes.map((s) => s.id)) + 1, ...data };
        bd.solicitudes.push(fila);
        bd.escrituras.push({ modelo: 'solicitud_caracteristica', operacion: 'create', data });
        return clonar(conRelaciones(fila, include));
      },
      update: async ({ where, data, include }) => {
        const fila = bd.solicitudes.find((x) => x.id === where.id);
        Object.assign(fila, data);
        bd.escrituras.push({ modelo: 'solicitud_caracteristica', operacion: 'update', where, data });
        return clonar(conRelaciones(fila, include));
      },
      updateMany: async ({ where, data }) => {
        const filas = bd.solicitudes.filter((x) => x.id === where.id && (where.estado === undefined || x.estado === where.estado));
        for (const f of filas) Object.assign(f, data);
        bd.escrituras.push({ modelo: 'solicitud_caracteristica', operacion: 'updateMany', where, data, count: filas.length });
        return { count: filas.length };
      },
      deleteMany: async ({ where }) => {
        bd.escrituras.push({ modelo: 'solicitud_caracteristica', operacion: 'deleteMany', where });
        return { count: 0 };
      },
    },
    solicitud_registro: {
      count: async ({ where }) => bd.ocupantes.filter((o) => o.profesorId === where.oferta.profesor_id && ocupaCupo(o)).length,
    },
    // Presentes solo para detectar que este módulo NUNCA los toca.
    oferta_servicio: new Proxy({}, {
      get: (_, operacion) => async (args) => {
        bd.escrituras.push({ modelo: 'oferta_servicio', operacion, args });
        return operacion === 'findMany' ? [] : null;
      },
    }),
    notificacion: {
      create: async ({ data }) => {
        const fila = { id: bd.notificaciones.length + 1, ...data };
        bd.notificaciones.push(fila);
        return clonar(fila);
      },
      // Solo existen para detectar que este módulo NUNCA retira notificaciones ajenas.
      update: async (args) => { bd.escrituras.push({ modelo: 'notificacion', operacion: 'update', args }); return null; },
      updateMany: async (args) => { bd.escrituras.push({ modelo: 'notificacion', operacion: 'updateMany', args }); return { count: 0 }; },
      deleteMany: async (args) => { bd.escrituras.push({ modelo: 'notificacion', operacion: 'deleteMany', args }); return { count: 0 }; },
    },
  };

  const prisma = new Proxy({}, {
    get: (_, propiedad) => {
      if (propiedad === '$transaction') return async (cb) => cb(prisma);
      // bloquearProfesor: SELECT ... FOR UPDATE. Se registra para poder afirmar que el lock se tomó
      // y que fue la PRIMERA sentencia de la transacción.
      if (propiedad === '$queryRaw') {
        return async (_textos, profesorId) => {
          bd.locks.push({ profesorId, escriturasPrevias: bd.escrituras.length });
          const p = bd.profesores.find((x) => x.id === profesorId);
          return p ? [{ id: p.id, cupos_totales: p.cupos_totales }] : [];
        };
      }
      if (propiedad === '$disconnect') return async () => {};
      return modelos[propiedad];
    },
  });

  return { bd, prisma };
}

const profesor = ({ id = 1, usuarioId = 10, caracteristicaId = null, cuposTotales = 3, nombre = 'Ana', apellidos = 'Torres Vega' } = {}) => ({
  id,
  usuario_id: usuarioId,
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5511112222',
  horario_atencion: 'L-V 10:00',
  cubiculo: 'A-1',
  cupos_totales: cuposTotales,
  caracteristica_id: caracteristicaId,
  usuario: { id: usuarioId, nombre, apellidos, correo_institucional: 'ana.torres@ipn.mx' },
});

const solicitud = ({ id = 1, profesorId = 1, caracteristicaId = null, estado = 'pendiente', justificacion = 'Motivo suficiente.', fecha = new Date('2026-09-20T10:00:00Z'), comentario = null, fechaRespuesta = null } = {}) => ({
  id,
  profesor_id: profesorId,
  caracteristica_id: caracteristicaId,
  justificacion,
  estado,
  fecha,
  comentario,
  fecha_respuesta: fechaRespuesta,
});

// n alumnos ocupando cupo de ese profesor, en un estado real de los que ocupan.
const ocupantes = (profesorId, n) => Array.from({ length: n }, () => ({ profesorId, estado_solicitud: 'alumno_asignado', liberacion: null }));

module.exports = { crearBd, profesor, solicitud, ocupantes, CATALOGO };
