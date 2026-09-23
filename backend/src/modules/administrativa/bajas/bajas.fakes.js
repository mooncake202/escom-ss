// BD falsa en memoria para CU-ADM-09/11/12.
//
// Lo importante: `usuario.delete` SIMULA LAS CASCADAS REALES del schema. No basta con borrar la
// fila de usuario — hay que reproducir lo que MySQL haría, o los tests dirían que el proceso se
// eliminó cuando en realidad solo se borró una fila. El árbol implementado abajo es el que
// verifiqué contra information_schema: usuario → alumno → solicitud_registro → (bitácoras,
// actividades, reportes, revisiones, LSS) y alumno → (documentos, cúmulo, solicitud_baja).
//
// El conteo de ocupados NO se simula aparte: `solicitud_registro.count` aplica el mismo `where`
// que construye contarCuposOcupados, para que los tests ejerciten la regla real de lib/cupos.js.

const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../gr/gr.shared');

const ESTADO_LSS_TERMINAL = 'constancia_disponible';
const clonar = (x) => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)));

function crearBd({ usuarios = [], alumnos = [], profesores = [], ofertas = [], solicitudesRegistro = [], bajas = [], documentos = [], cumulos = [], bitacoras = [], actividades = [], reportes = [] } = {}) {
  const bd = {
    usuarios: usuarios.map((x) => ({ ...x })),
    alumnos: alumnos.map((x) => ({ ...x })),
    profesores: profesores.map((x) => ({ ...x })),
    ofertas: ofertas.map((x) => ({ ...x })),
    solicitudesRegistro: solicitudesRegistro.map((x) => ({ ...x })),
    bajas: bajas.map((x) => ({ ...x })),
    documentos: documentos.map((x) => ({ ...x })),
    cumulos: cumulos.map((x) => ({ ...x })),
    bitacoras: bitacoras.map((x) => ({ ...x })),
    actividades: actividades.map((x) => ({ ...x })),
    reportes: reportes.map((x) => ({ ...x })),
    coordinadores: [{ id: 1, usuario_id: 900 }, { id: 2, usuario_id: 901 }],
    notificaciones: [],
    escrituras: [],
    locks: [],
    borrados: [],
  };

  const registrar = (modelo, operacion, datos) => bd.escrituras.push({ modelo, operacion, ...datos });

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const ofertaDe = (id) => bd.ofertas.find((o) => o.id === id) ?? null;
  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;

  const alumnoConRelaciones = (a, include = {}) => {
    if (!a) return null;
    const salida = { ...a };
    if (include.usuario) salida.usuario = usuarioDe(a.usuario_id);
    if (include.cumulo_horas_y_faltas) salida.cumulo_horas_y_faltas = bd.cumulos.find((c) => c.alumno_id === a.boleta) ?? null;
    if (include.solicitud_registro) {
      const sr = bd.solicitudesRegistro.find((s) => s.alumno_id === a.boleta) ?? null;
      salida.solicitud_registro = sr ? srConRelaciones(sr, include.solicitud_registro.include ?? {}) : null;
    }
    return salida;
  };

  const srConRelaciones = (sr, include = {}) => {
    if (!sr) return null;
    const salida = { ...sr };
    if (include.oferta) {
      const o = ofertaDe(sr.oferta_id);
      const incO = include.oferta.include ?? {};
      salida.oferta = o
        ? { ...o, ...(incO.profesor ? { profesor: { ...profesorDe(o.profesor_id), usuario: usuarioDe(profesorDe(o.profesor_id)?.usuario_id) } } : {}) }
        : null;
    }
    if (include.alumno) salida.alumno = alumnoConRelaciones(bd.alumnos.find((a) => a.boleta === sr.alumno_id), include.alumno.include ?? {});
    return salida;
  };

  const bajaConRelaciones = (b, include = {}) => {
    if (!b) return null;
    const salida = { ...b };
    if (include.documento) salida.documento = bd.documentos.find((d) => d.id === b.documento_id) ?? null;
    if (include.solicitante) salida.solicitante = usuarioDe(b.solicitante_id);
    if (include.alumno) salida.alumno = alumnoConRelaciones(bd.alumnos.find((a) => a.boleta === b.alumno_id), include.alumno.include ?? {});
    return salida;
  };

  const ocupaCupo = (sr) => ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(sr.estado_solicitud)
    && (sr.liberacion == null || sr.liberacion !== ESTADO_LSS_TERMINAL);

  // Reproduce el árbol de CASCADE real del schema.
  function borrarUsuarioEnCascada(usuarioId) {
    const alumno = bd.alumnos.find((a) => a.usuario_id === usuarioId);
    bd.usuarios = bd.usuarios.filter((u) => u.id !== usuarioId);
    bd.notificaciones = bd.notificaciones.filter((n) => n.usuario_id !== usuarioId);
    bd.borrados.push({ modelo: 'usuario', id: usuarioId });

    if (!alumno) return;
    const boleta = alumno.boleta;
    const srIds = bd.solicitudesRegistro.filter((s) => s.alumno_id === boleta).map((s) => s.id);

    bd.alumnos = bd.alumnos.filter((a) => a.boleta !== boleta);
    bd.cumulos = bd.cumulos.filter((c) => c.alumno_id !== boleta);
    bd.documentos = bd.documentos.filter((d) => d.alumno_id !== boleta);
    bd.bajas = bd.bajas.filter((b) => b.alumno_id !== boleta && b.solicitante_id !== usuarioId);
    bd.solicitudesRegistro = bd.solicitudesRegistro.filter((s) => s.alumno_id !== boleta);
    bd.bitacoras = bd.bitacoras.filter((x) => !srIds.includes(x.solicitud_registro_id));
    bd.actividades = bd.actividades.filter((x) => !srIds.includes(x.solicitud_registro_id));
    bd.reportes = bd.reportes.filter((x) => !srIds.includes(x.solicitud_registro_id));
    bd.borrados.push({ modelo: 'cascada', boleta });
  }

  const modelos = {
    usuario: {
      findUnique: async ({ where }) => clonar(usuarioDe(where.id)),
      delete: async ({ where }) => {
        registrar('usuario', 'delete', { where });
        borrarUsuarioEnCascada(where.id);
        return { id: where.id };
      },
    },
    alumno: {
      findUnique: async ({ where, include }) => clonar(alumnoConRelaciones(
        bd.alumnos.find((a) => (where.boleta !== undefined ? a.boleta === where.boleta : a.usuario_id === where.usuario_id)), include)),
    },
    profesor: {
      findUnique: async ({ where, include }) => {
        const p = bd.profesores.find((x) => (where.id !== undefined ? x.id === where.id : x.usuario_id === where.usuario_id));
        if (!p) return null;
        return clonar({ ...p, ...(include?.usuario ? { usuario: usuarioDe(p.usuario_id) } : {}) });
      },
    },
    coordinador: {
      findFirst: async () => clonar(bd.coordinadores[0] ?? null),
      findMany: async () => clonar(bd.coordinadores),
      findUnique: async ({ where }) => clonar(bd.coordinadores.find((c) => c.usuario_id === where.usuario_id) ?? null),
    },
    solicitud_registro: {
      findFirst: async ({ where, include }) => {
        const sr = bd.solicitudesRegistro.find((s) => (where.alumno_id === undefined || s.alumno_id === where.alumno_id)
          && (where.estado_solicitud === undefined || s.estado_solicitud === where.estado_solicitud)
          && (where.oferta?.profesor_id === undefined || ofertaDe(s.oferta_id)?.profesor_id === where.oferta.profesor_id));
        return clonar(srConRelaciones(sr, include));
      },
      findMany: async ({ where = {}, include }) => bd.solicitudesRegistro
        .filter((s) => (where.estado_solicitud === undefined || s.estado_solicitud === where.estado_solicitud)
          && (where.oferta?.profesor_id === undefined || ofertaDe(s.oferta_id)?.profesor_id === where.oferta.profesor_id))
        .map((s) => clonar(srConRelaciones(s, include))),
      updateMany: async ({ where, data }) => {
        const filas = bd.solicitudesRegistro.filter((s) => s.id === where.id
          && (where.estado_solicitud?.in ? where.estado_solicitud.in.includes(s.estado_solicitud) : true));
        for (const f of filas) Object.assign(f, data);
        registrar('solicitud_registro', 'updateMany', { where, data, count: filas.length });
        return { count: filas.length };
      },
      count: async ({ where }) => bd.solicitudesRegistro.filter((s) => ofertaDe(s.oferta_id)?.profesor_id === where.oferta.profesor_id && ocupaCupo(s)).length,
    },
    oferta_servicio: {
      updateMany: async ({ where, data }) => {
        // Reproduce el techo que liberarLugarOferta evalúa dentro del propio UPDATE.
        const o = ofertaDe(where.id);
        const cabe = o && (
          (o.tipo_oferta === 'individual' && o.cupos_disponibles < 1)
          || (o.tipo_oferta === 'proyecto' && o.cupos_ofertados != null && o.cupos_disponibles < o.cupos_ofertados)
        );
        if (!cabe) {
          registrar('oferta_servicio', 'updateMany', { where, data, count: 0 });
          return { count: 0 };
        }
        o.cupos_disponibles += 1;
        registrar('oferta_servicio', 'updateMany', { where, data, count: 1 });
        return { count: 1 };
      },
      fields: { cupos_ofertados: 'cupos_ofertados' },
    },
    solicitud_baja: {
      findFirst: async ({ where, include }) => clonar(bajaConRelaciones(
        bd.bajas.find((b) => b.alumno_id === where.alumno_id && (where.estado === undefined || b.estado === where.estado)), include)),
      findUnique: async ({ where, include }) => clonar(bajaConRelaciones(bd.bajas.find((b) => b.id === where.id), include)),
      findMany: async ({ where = {}, include, orderBy }) => {
        const coincide = (b) => (where.alumno_id === undefined
            || (where.alumno_id.in ? where.alumno_id.in.includes(b.alumno_id) : b.alumno_id === where.alumno_id))
          && (where.estado === undefined || (where.estado.in ? where.estado.in.includes(b.estado) : b.estado === where.estado));
        let filas = bd.bajas.filter(coincide);
        if (orderBy?.id === 'desc') filas = [...filas].sort((a, b) => b.id - a.id);
        if (orderBy?.fecha === 'asc') filas = [...filas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        if (orderBy?.fecha_respuesta === 'desc') filas = [...filas].sort((a, b) => new Date(b.fecha_respuesta ?? 0) - new Date(a.fecha_respuesta ?? 0));
        return filas.map((b) => clonar(bajaConRelaciones(b, include)));
      },
      create: async ({ data, include }) => {
        const fila = { id: Math.max(0, ...bd.bajas.map((b) => b.id)) + 1, ...data };
        bd.bajas.push(fila);
        registrar('solicitud_baja', 'create', { data });
        return clonar(bajaConRelaciones(fila, include));
      },
      updateMany: async ({ where, data }) => {
        const filas = bd.bajas.filter((b) => b.id === where.id && (where.estado === undefined || b.estado === where.estado));
        for (const f of filas) Object.assign(f, data);
        registrar('solicitud_baja', 'updateMany', { where, data, count: filas.length });
        return { count: filas.length };
      },
    },
    documento: {
      create: async ({ data }) => {
        const fila = { id: Math.max(0, ...bd.documentos.map((d) => d.id)) + 1, ...data };
        bd.documentos.push(fila);
        registrar('documento', 'create', { data });
        return clonar(fila);
      },
      update: async ({ where, data }) => {
        const d = bd.documentos.find((x) => x.id === where.id);
        if (d) Object.assign(d, data);
        registrar('documento', 'update', { where, data });
        return clonar(d);
      },
    },
    notificacion: {
      create: async ({ data }) => {
        const fila = { id: bd.notificaciones.length + 1, ...data };
        bd.notificaciones.push(fila);
        return clonar(fila);
      },
    },
    cumulo_horas_y_faltas: {
      findUnique: async ({ where }) => clonar(bd.cumulos.find((c) => c.alumno_id === where.alumno_id) ?? null),
      update: async (args) => { registrar('cumulo_horas_y_faltas', 'update', args); return null; },
    },
  };

  const prisma = new Proxy({}, {
    get: (_, propiedad) => {
      if (propiedad === '$transaction') return async (cb) => cb(prisma);
      if (propiedad === '$queryRaw') {
        return async (_textos, profesorId) => {
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

// ── Constructores ──

const usuario = ({ id, nombre = 'Ana', apellidos = 'Torres Vega', correo = 'ana.torres@alumno.ipn.mx', rol = 'alumno_asignado' }) =>
  ({ id, nombre, apellidos, correo_institucional: correo, rol });

const alumno = ({ boleta = '2022630001', usuarioId = 10, carrera = 'ISC' } = {}) => ({ boleta, usuario_id: usuarioId, carrera });

const profesor = ({ id = 1, usuarioId = 20, cuposTotales = 3 } = {}) => ({ id, usuario_id: usuarioId, cupos_totales: cuposTotales });

const oferta = ({ id = 1, profesorId = 1, estado = 'aprobada', tipo = 'proyecto', ofertados = 5, disponibles = 1 } = {}) =>
  ({ id, profesor_id: profesorId, nombre_proyecto: 'Proyecto de prueba', estado_oferta: estado, tipo_oferta: tipo, cupos_ofertados: ofertados, cupos_disponibles: disponibles });

const solicitudRegistro = ({ id = 1, boleta = '2022630001', ofertaId = 1, estado = 'alumno_asignado' } = {}) =>
  ({ id, alumno_id: boleta, oferta_id: ofertaId, estado_solicitud: estado, liberacion: null });

const baja = ({ id = 1, boleta = '2022630001', solicitanteId = 10, estado = 'pendiente', documentoId = null, motivo = 'Motivo suficiente.', fecha = new Date('2026-09-20T10:00:00Z'), comentario = null, fechaRespuesta = null, coordinadorId = null } = {}) =>
  ({ id, alumno_id: boleta, solicitante_id: solicitanteId, coordinador_id: coordinadorId, documento_id: documentoId, estado, motivo, fecha, comentario, fecha_respuesta: fechaRespuesta });

const documento = ({ id = 1, boleta = '2022630001', creadorId = 10, estado = 'en_revision', tipo = 'expediente_baja', ruta = '2022630001/abc.enc' } = {}) =>
  ({ id, alumno_id: boleta, creador_id: creadorId, tipo_documento: tipo, estado_documento: estado, ruta_archivo: ruta, fecha_creacion: new Date() });

const cumulo = ({ boleta = '2022630001', horas = 40, rechazadas = 0, faltas = 3, consecutivas = 2 } = {}) =>
  ({ alumno_id: boleta, horas_acumuladas: horas, horas_rechazadas: rechazadas, faltas_acumuladas: faltas, faltas_consecutivas: consecutivas });

module.exports = { crearBd, usuario, alumno, profesor, oferta, solicitudRegistro, baja, documento, cumulo };
