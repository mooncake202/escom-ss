// BD falsa en memoria para CU-ADM-09/11/12.
//
// Una baja aprobada ya NO borra al usuario: cancela el servicio. Por eso este falso NO simula
// cascadas — el servicio borra EXPLÍCITAMENTE cada tabla del avance, y cada `deleteMany` que emite
// se ejecuta y se registra aquí. Así los tests comprueban lo que el servicio realmente pide, en vez
// de lo que una cascada haría por él.
//
// `usuario.delete` se conserva a propósito y registra su uso: si alguna vez alguien volviera a
// borrar al alumno desde este flujo, el test lo vería.
//
// El conteo de ocupados NO se simula aparte: `solicitud_registro.count` aplica el mismo `where`
// que construye contarCuposOcupados, para que los tests ejerciten la regla real de lib/cupos.js.

const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../gr/gr.shared');

// Copia deliberada de ESTADOS_LSS_LIBERAN_CUPO (lib/cupos.js): no se importa de ahí porque ese
// módulo hace require('./prisma') y este archivo se carga ANTES de que el test sustituya el prisma
// global. La prueba "el fake replica el criterio real de cupos" afirma que ambos coinciden, así que
// una desincronización falla de inmediato en vez de pasar inadvertida.
//
// El HITO de liberación es solo el primero ('solicitud_constancia_termino'); el segundo es el estado
// posterior de LSS, que únicamente conserva la condición de "ya liberado".
const ESTADOS_LSS_LIBERAN_CUPO = ['solicitud_constancia_termino', 'constancia_disponible'];
const clonar = (x) => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)));

function crearBd({
  usuarios = [], alumnos = [], profesores = [], ofertas = [], solicitudesRegistro = [], bajas = [],
  documentos = [], cumulos = [], bitacoras = [], actividades = [], reportes = [],
  reportesGlobales = [], revisionesMensuales = [], revisionesGlobales = [], registrosBitacora = [],
  liberaciones = [], evaluaciones = [], revisionesDesempeno = [], cartasTermino = [],
  carreras = [], periodos = [],
} = {}) {
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
    reportesGlobales: reportesGlobales.map((x) => ({ ...x })),
    revisionesMensuales: revisionesMensuales.map((x) => ({ ...x })),
    revisionesGlobales: revisionesGlobales.map((x) => ({ ...x })),
    registrosBitacora: registrosBitacora.map((x) => ({ ...x })),
    liberaciones: liberaciones.map((x) => ({ ...x })),
    evaluaciones: evaluaciones.map((x) => ({ ...x })),
    revisionesDesempeno: revisionesDesempeno.map((x) => ({ ...x })),
    cartasTermino: cartasTermino.map((x) => ({ ...x })),
    carreras: carreras.map((x) => ({ ...x })),
    periodos: periodos.map((x) => ({ ...x })),
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
    && (sr.liberacion == null || !ESTADOS_LSS_LIBERAN_CUPO.includes(sr.liberacion));

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

  // `where` de documento tal como lo emite el servicio: alumno_id y `tipo_documento: { not }`.
  const coincideDocumento = (d, where) => (where.alumno_id === undefined || d.alumno_id === where.alumno_id)
    && (where.tipo_documento === undefined
      || (where.tipo_documento.not !== undefined
        ? d.tipo_documento !== where.tipo_documento.not
        : d.tipo_documento === where.tipo_documento));

  // deleteMany sobre una tabla que cuelga DIRECTO de solicitud_registro.
  const borradoPorSolicitud = (coleccion, modelo) => ({
    deleteMany: async ({ where }) => {
      const srId = where.solicitud_registro_id;
      const victimas = bd[coleccion].filter((x) => x.solicitud_registro_id === srId);
      bd[coleccion] = bd[coleccion].filter((x) => x.solicitud_registro_id !== srId);
      registrar(modelo, 'deleteMany', { where, count: victimas.length });
      return { count: victimas.length };
    },
  });

  // deleteMany sobre una tabla que se alcanza por FILTRO DE RELACIÓN (revisiones, enlaces, LSS).
  // `solicitudDe` extrae el solicitud_registro_id del `where` anidado que emite el servicio.
  const solicitudDe = (where) => {
    const rama = where.reporte_mensual ?? where.reporte_global ?? where.bitacora ?? where.actividad
      ?? where.liberacion_proceso ?? where.evaluacion_desempeno?.liberacion_proceso;
    return rama?.solicitud_registro_id;
  };
  const borradoPorPadre = (coleccion, modelo, pertenece) => ({
    deleteMany: async ({ where }) => {
      const srId = solicitudDe(where);
      const victimas = bd[coleccion].filter((x) => pertenece(x, srId, where));
      bd[coleccion] = bd[coleccion].filter((x) => !victimas.includes(x));
      registrar(modelo, 'deleteMany', { where, count: victimas.length });
      return { count: victimas.length };
    },
  });

  const modelos = {
    usuario: {
      findUnique: async ({ where }) => clonar(usuarioDe(where.id)),
      update: async ({ where, data }) => {
        const u = usuarioDe(where.id);
        if (u) Object.assign(u, data);
        registrar('usuario', 'update', { where, data });
        return clonar(u);
      },
      delete: async ({ where }) => {
        registrar('usuario', 'delete', { where });
        borrarUsuarioEnCascada(where.id);
        return { id: where.id };
      },
    },
    alumno: {
      findUnique: async ({ where, include }) => clonar(alumnoConRelaciones(
        bd.alumnos.find((a) => (where.boleta !== undefined ? a.boleta === where.boleta : a.usuario_id === where.usuario_id)), include)),
      update: async ({ where, data }) => {
        const a = bd.alumnos.find((x) => x.boleta === where.boleta);
        if (a) Object.assign(a, data);
        registrar('alumno', 'update', { where, data });
        return clonar(a);
      },
    },
    carrera: {
      findFirst: async ({ where }) => clonar(bd.carreras.find((c) => c.nombre === where.nombre) ?? null),
    },
    periodo_registro: {
      findUnique: async ({ where }) => clonar(bd.periodos.find((x) => x.id === where.id) ?? null),
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
      update: async ({ where, data }) => {
        const sr = bd.solicitudesRegistro.find((s) => s.id === where.id);
        if (sr) Object.assign(sr, data);
        registrar('solicitud_registro', 'update', { where, data });
        return clonar(sr);
      },
      updateMany: async ({ where, data }) => {
        const coincideEstado = (s) => {
          if (where.estado_solicitud === undefined) return true;
          if (where.estado_solicitud?.in) return where.estado_solicitud.in.includes(s.estado_solicitud);
          return s.estado_solicitud === where.estado_solicitud; // CAS por estado exacto
        };
        const filas = bd.solicitudesRegistro.filter((s) => s.id === where.id && coincideEstado(s));
        for (const f of filas) Object.assign(f, data);
        registrar('solicitud_registro', 'updateMany', { where, data, count: filas.length });
        return { count: filas.length };
      },
      count: async ({ where }) => bd.solicitudesRegistro.filter((s) => ofertaDe(s.oferta_id)?.profesor_id === where.oferta.profesor_id && ocupaCupo(s)).length,
    },
    oferta_servicio: {
      findUnique: async ({ where, include }) => {
        const o = ofertaDe(Number(where.id));
        if (!o) return null;
        return clonar({ ...o, ...(include?.profesor ? { profesor: profesorDe(o.profesor_id) } : {}) });
      },
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
      findFirst: async ({ where, include, orderBy }) => {
        const coincideEstado = (b) => where.estado === undefined
          || (where.estado.in ? where.estado.in.includes(b.estado) : b.estado === where.estado);
        let filas = bd.bajas.filter((b) => b.alumno_id === where.alumno_id && coincideEstado(b));
        if (orderBy?.id === 'desc') filas = [...filas].sort((a, b) => b.id - a.id);
        return clonar(bajaConRelaciones(filas[0], include));
      },
      findUnique: async ({ where, include }) => clonar(bajaConRelaciones(bd.bajas.find((b) => b.id === where.id), include)),
      findMany: async ({ where = {}, include, orderBy }) => {
        // Filtro de RELACIÓN que usa resumenBajasDelProfesor:
        //   alumno: { solicitud_registro: { estado_solicitud, oferta: { profesor_id } } }
        // Sin implementarlo, el falso devolvería bajas de alumnos ajenos y la prueba de alcance del
        // profesor no mediría nada.
        const coincideAlumnoRelacionado = (b) => {
          const filtro = where.alumno?.solicitud_registro;
          if (!filtro) return true;
          const sr = bd.solicitudesRegistro.find((s) => s.alumno_id === b.alumno_id);
          if (!sr) return false;
          if (filtro.estado_solicitud !== undefined && sr.estado_solicitud !== filtro.estado_solicitud) return false;
          if (filtro.oferta?.profesor_id !== undefined
            && ofertaDe(sr.oferta_id)?.profesor_id !== filtro.oferta.profesor_id) return false;
          return true;
        };
        const coincide = (b) => (where.alumno_id === undefined
            || (where.alumno_id.in ? where.alumno_id.in.includes(b.alumno_id) : b.alumno_id === where.alumno_id))
          && (where.estado === undefined || (where.estado.in ? where.estado.in.includes(b.estado) : b.estado === where.estado))
          && coincideAlumnoRelacionado(b);
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
        const coincideEstado = (b) => where.estado === undefined
          || (where.estado.in ? where.estado.in.includes(b.estado) : b.estado === where.estado);
        // `documento_id: null` es parte del CAS que evita sustituir un expediente ya adjunto.
        const coincideDoc = (b) => where.documento_id === undefined
          || (where.documento_id === null ? b.documento_id === null : b.documento_id === where.documento_id);
        const filas = bd.bajas.filter((b) => b.id === where.id && coincideEstado(b) && coincideDoc(b));
        for (const f of filas) Object.assign(f, data);
        registrar('solicitud_baja', 'updateMany', { where, data, count: filas.length });
        return { count: filas.length };
      },
    },
    documento: {
      findMany: async ({ where = {} }) => bd.documentos
        .filter((d) => coincideDocumento(d, where))
        .map((d) => clonar(d)),
      deleteMany: async ({ where = {} }) => {
        const victimas = bd.documentos.filter((d) => coincideDocumento(d, where));
        bd.documentos = bd.documentos.filter((d) => !victimas.includes(d));
        registrar('documento', 'deleteMany', { where, count: victimas.length });
        return { count: victimas.length };
      },
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
      updateMany: async ({ where, data }) => {
        const filas = bd.cumulos.filter((c) => c.alumno_id === where.alumno_id);
        for (const f of filas) Object.assign(f, data);
        registrar('cumulo_horas_y_faltas', 'updateMany', { where, data, count: filas.length });
        return { count: filas.length };
      },
    },

    // ── Avance del servicio. El servicio los borra EXPLÍCITAMENTE, uno por uno ──
    reporte_mensual: borradoPorSolicitud('reportes', 'reporte_mensual'),
    reporte_global: borradoPorSolicitud('reportesGlobales', 'reporte_global'),
    bitacora: borradoPorSolicitud('bitacoras', 'bitacora'),
    actividad: borradoPorSolicitud('actividades', 'actividad'),
    liberacion_proceso: borradoPorSolicitud('liberaciones', 'liberacion_proceso'),

    revision_reporte_mensual: borradoPorPadre('revisionesMensuales', 'revision_reporte_mensual',
      (r, srId) => bd.reportes.some((x) => x.id === r.reporte_mensual_id && x.solicitud_registro_id === srId)),
    revision_reporte_global: borradoPorPadre('revisionesGlobales', 'revision_reporte_global',
      (r, srId) => bd.reportesGlobales.some((x) => x.id === r.reporte_global_id && x.solicitud_registro_id === srId)),
    registro_bitacora_actividades: borradoPorPadre('registrosBitacora', 'registro_bitacora_actividades',
      (r, srId, where) => (where.bitacora
        ? bd.bitacoras.some((x) => x.id === r.bitacora_id && x.solicitud_registro_id === srId)
        : bd.actividades.some((x) => x.id === r.actividad_id && x.solicitud_registro_id === srId))),
    evaluacion_desempeno: borradoPorPadre('evaluaciones', 'evaluacion_desempeno',
      (e, srId) => bd.liberaciones.some((l) => l.id === e.liberacion_proceso_id && l.solicitud_registro_id === srId)),
    carta_termino: borradoPorPadre('cartasTermino', 'carta_termino',
      (c, srId) => bd.liberaciones.some((l) => l.id === c.liberacion_proceso_id && l.solicitud_registro_id === srId)),
    revision_desempeno: borradoPorPadre('revisionesDesempeno', 'revision_desempeno',
      (r, srId) => bd.evaluaciones.some((e) => e.id === r.evaluacion_desempeno_id
        && bd.liberaciones.some((l) => l.id === e.liberacion_proceso_id && l.solicitud_registro_id === srId))),
  };

  const prisma = new Proxy({}, {
    get: (_, propiedad) => {
      // Las dos formas reales: callback (bajas) y array de promesas (CU-GR-13).
      if (propiedad === '$transaction') {
        return async (arg) => (Array.isArray(arg) ? Promise.all(arg) : arg(prisma));
      }
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

// `estado`: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada'.
const baja = ({ id = 1, boleta = '2022630001', solicitanteId = 10, estado = 'pendiente', documentoId = null, motivo = 'Motivo suficiente.', fecha = new Date('2026-09-20T10:00:00Z'), comentario = null, fechaRespuesta = null, coordinadorId = null } = {}) =>
  ({ id, alumno_id: boleta, solicitante_id: solicitanteId, coordinador_id: coordinadorId, documento_id: documentoId, estado, motivo, fecha, comentario, fecha_respuesta: fechaRespuesta });

const documento = ({ id = 1, boleta = '2022630001', creadorId = 10, estado = 'en_revision', tipo = 'expediente_baja', ruta = '2022630001/abc.enc' } = {}) =>
  ({ id, alumno_id: boleta, creador_id: creadorId, tipo_documento: tipo, estado_documento: estado, ruta_archivo: ruta, fecha_creacion: new Date() });

const cumulo = ({ boleta = '2022630001', horas = 40, rechazadas = 0, faltas = 3, consecutivas = 2 } = {}) =>
  ({ alumno_id: boleta, horas_acumuladas: horas, horas_rechazadas: rechazadas, faltas_acumuladas: faltas, faltas_consecutivas: consecutivas });

const carrera = ({ id = 1, nombre = 'Ingeniería en Sistemas Computacionales' } = {}) => ({ id, nombre });

const periodo = ({ id = 1, fechaMaxExpediente = new Date('2027-01-15T00:00:00Z') } = {}) =>
  ({ id, fecha_max_expediente: fechaMaxExpediente });

// ESTADOS_LSS_LIBERAN_CUPO se exporta solo para que la prueba de consistencia lo compare contra el
// de lib/cupos.js; no es parte del fake que usen los tests de negocio.
module.exports = { crearBd, usuario, alumno, profesor, oferta, solicitudRegistro, baja, documento, cumulo, carrera, periodo, ESTADOS_LSS_LIBERAN_CUPO };
