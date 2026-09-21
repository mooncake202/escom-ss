// BD falsa con estado propio para probar el envío (fase 6): transacciones con confirmación/reversa, bloqueo de filas
// (SELECT ... FOR UPDATE sobre la solicitud, en cola como InnoDB) e inyección de fallos por operación.
// Convenciones que hace cumplir: dentro de la transacción no se escribe ni se hace lectura bloqueante sin haber
// tomado antes el bloqueo de la solicitud; y ningún modelo fuera del previsto se puede tocar.

const { utc, ahoraMx } = require('./reportes.vista-previa.fixtures');

const SOLICITUD_ID = 42;
const PROFESOR_USUARIO_ID = 60;

function clonar(db) {
  return {
    usuarios: db.usuarios,
    documentos: db.documentos.map((d) => ({ ...d })),
    reportes: db.reportes.map((r) => ({ ...r })),
    revisiones: db.revisiones.map((r) => ({ ...r })),
    globales: db.globales.map((r) => ({ ...r })),
    revisionesGlobales: db.revisionesGlobales.map((r) => ({ ...r })),
  };
}

function crearBdEnvio(opciones = {}) {
  const {
    usuarioId = 7,
    rubrica = null,
    carrera = 'IIA',
    correoPersonal = 'ana.garcia@example.com',
    programa = 'Programa SISS de prueba',
    fechaFin = '2026-05-14', // fin del periodo oficial (null = sin fecha de término)
    sinPeriodo = false,      // solicitud sin periodo oficial
    profesorUsuario = { nombre: 'LUIS', apellidos: 'TORRES VEGA' },
    nombre = 'ANA',
    apellidos = 'GARCIA LOPEZ',
    bitacoras = [
      { id: 1, estado: 'aprobada', fecha_registro: utc('2025-10-16'), fecha_revision: new Date('2025-10-17T16:00:00.000Z'), horas_contabilizadas: 4 },
      { id: 2, estado: 'aprobada', fecha_registro: utc('2025-10-17'), fecha_revision: new Date('2025-10-18T16:00:00.000Z'), horas_contabilizadas: 3 },
    ],
    reportesIniciales = [],
    globalesIniciales = [], // reportes globales que ya existen (CU-REP-07)
    fallos = {},            // { 'documento.create': Error, ... } → falla esa operación dentro de la transacción
    falloTrasCommit = null, // Error lanzado DESPUÉS de confirmar (commit con resultado dudoso)
  } = opciones;

  // `perfil` es mutable: las pruebas lo cambian para simular datos que se modifican a mitad del envío.
  const perfil = { correoPersonal, programa, profesorUsuario, nombre, apellidos, carrera, fechaFin, sinPeriodo };
  const db = {
    usuarios: { [usuarioId]: { id: usuarioId, rubrica_imagen: rubrica, rubrica_ip: null, rubrica_fecha_registro: null } },
    documentos: [],
    reportes: reportesIniciales.map((r) => ({ solicitud_registro_id: SOLICITUD_ID, ...r })),
    revisiones: [],
    globales: globalesIniciales.map((r) => ({ solicitud_registro_id: SOLICITUD_ID, ...r })),
    revisionesGlobales: [],
  };
  const operaciones = [];
  const contadores = { documento: 0, reporte: 0, revision: 0, global: 0, revisionGlobal: 0 };
  const colas = new Map();

  const alumno = () => ({
    boleta: '2022630001',
    carrera: perfil.carrera,
    semestre: 8,
    celular: '5512345678',
    creditos: '85.50',
    correo_personal: perfil.correoPersonal,
    usuario: {
      nombre: perfil.nombre,
      apellidos: perfil.apellidos,
      correo_institucional: 'agarcia@alumno.ipn.mx',
      rubrica_imagen: db.usuarios[usuarioId].rubrica_imagen,
    },
    solicitud_registro: {
      id: SOLICITUD_ID,
      periodo_registro: perfil.sinPeriodo ? null : { evento_calendario: { fecha_inicio: utc('2025-10-16'), fecha_fin: perfil.fechaFin ? utc(perfil.fechaFin) : null } },
      oferta: {
        id: 3,
        nombre_proyecto: 'Proyecto X',
        programa_SISS: perfil.programa,
        profesor: perfil.profesorUsuario ? { usuario_id: PROFESOR_USUARIO_ID, usuario: perfil.profesorUsuario } : null,
      },
    },
  });

  async function bloquear(id) {
    const previa = colas.get(id) ?? Promise.resolve();
    let liberar;
    const mia = new Promise((resolver) => { liberar = resolver; });
    colas.set(id, previa.then(() => mia));
    await previa;
    return liberar;
  }

  // `contexto`: { fuente: () => estado visible, enTx: bool, adquirir(id) }
  function crearCliente(contexto) {
    const registrar = (operacion) => operaciones.push(`${contexto.enTx ? 'tx:' : ''}${operacion}`);
    const exigirBloqueo = (operacion) => {
      if (contexto.enTx && !contexto.bloqueado()) throw new Error(`${operacion} antes de tomar el bloqueo de la solicitud`);
    };
    const escribir = (operacion, fn) => async (args) => {
      registrar(operacion);
      if (!contexto.enTx) throw new Error(`Escritura fuera de una transacción: ${operacion}`);
      exigirBloqueo(operacion);
      if (fallos[operacion]) throw fallos[operacion];
      return fn(args);
    };
    const leer = (operacion, fn) => async (args) => { registrar(operacion); return fn(args); };
    const fuente = () => contexto.fuente();

    const modelos = {
      alumno: { findUnique: leer('alumno.findUnique', async () => alumno()) },
      usuario: {
        findUnique: leer('usuario.findUnique', async ({ where }) => {
          const u = db.usuarios[where.id];
          return u ? { id: u.id, rubrica_imagen: u.rubrica_imagen } : null;
        }),
        // Solo para preparar la prueba (guardarRubrica de la fase 4); el envío nunca la usa.
        updateMany: leer('usuario.updateMany', async ({ where, data }) => {
          const u = db.usuarios[where.id];
          if (!u || (where.rubrica_imagen === null && u.rubrica_imagen !== null)) return { count: 0 };
          Object.assign(u, data);
          return { count: 1 };
        }),
      },
      reporte_mensual: {
        findMany: leer('reporte_mensual.findMany', async () => fuente().reportes.map((r) => ({ ...r }))),
        create: escribir('reporte_mensual.create', async ({ data }) => {
          const fila = { id: 500 + (contadores.reporte += 1), ...data };
          fuente().reportes.push(fila);
          return { ...fila };
        }),
      },
      documento: {
        findFirst: leer('documento.findFirst', async ({ where }) => {
          const fila = fuente().documentos.find((d) => d.ruta_archivo === where.ruta_archivo);
          return fila ? { id: fila.id } : null;
        }),
        create: escribir('documento.create', async ({ data }) => {
          const fila = { id: 900 + (contadores.documento += 1), aprobado_por_id: null, nombre_expediente: null, ...data };
          fuente().documentos.push(fila);
          return { ...fila };
        }),
      },
      revision_reporte_mensual: {
        create: escribir('revision_reporte_mensual.create', async ({ data }) => {
          const fila = { id: 700 + (contadores.revision += 1), ...data };
          fuente().revisiones.push(fila);
          return { ...fila };
        }),
      },
      // CU-REP-07: el reporte global y sus revisiones (misma forma que el mensual).
      reporte_global: {
        findMany: leer('reporte_global.findMany', async () => fuente().globales.map((r) => ({ ...r }))),
        create: escribir('reporte_global.create', async ({ data }) => {
          const fila = { id: 800 + (contadores.global += 1), ...data };
          fuente().globales.push(fila);
          return { ...fila };
        }),
      },
      revision_reporte_global: {
        create: escribir('revision_reporte_global.create', async ({ data }) => {
          const fila = { id: 600 + (contadores.revisionGlobal += 1), ...data };
          fuente().revisionesGlobales.push(fila);
          return { ...fila };
        }),
      },
      evento_calendario: { findMany: leer('evento_calendario.findMany', async () => []) },
      bitacora: {
        findMany: leer('bitacora.findMany', async () => bitacoras),
        // Suma de horas de las bitácoras aprobadas (las horas acumuladas del reporte global).
        aggregate: leer('bitacora.aggregate', async ({ where }) => {
          const filas = bitacoras.filter((b) => b.estado === where.estado);
          return { _sum: { horas_contabilizadas: filas.length ? filas.reduce((n, b) => n + (b.horas_contabilizadas ?? 0), 0) : null } };
        }),
      },
      actividad: { findMany: leer('actividad.findMany', async () => []) },
      registro_bitacora_actividades: { findMany: leer('registro_bitacora_actividades.findMany', async () => []) },
    };

    const raiz = {
      $queryRaw: async (cadenas, ...valores) => {
        const sql = cadenas.join('?');
        registrar(`$queryRaw(${/FROM solicitud_registro/.test(sql) ? 'solicitud_registro' : /FROM reporte_global/.test(sql) ? 'reporte_global' : 'reporte_mensual'})`);
        if (!contexto.enTx) throw new Error('Lectura bloqueante fuera de una transacción');
        if (!/FOR UPDATE/.test(sql)) throw new Error(`Consulta cruda inesperada: ${sql}`);
        if (/FROM solicitud_registro/.test(sql)) {
          await contexto.adquirir(valores[0]);
          return [{ id: valores[0] }];
        }
        if (/FROM reporte_global/.test(sql)) {
          exigirBloqueo('$queryRaw(reporte_global)');
          return fuente().globales.filter((r) => r.solicitud_registro_id === valores[0]).map((r) => ({ id: r.id, estado_reporte: r.estado_reporte }));
        }
        if (/FROM reporte_mensual/.test(sql)) {
          exigirBloqueo('$queryRaw(reporte_mensual)');
          return fuente().reportes.filter((r) => r.solicitud_registro_id === valores[0])
            .map((r) => ({ id: r.id, num_reporte: r.num_reporte, estado_reporte: r.estado_reporte }));
        }
        throw new Error(`Consulta cruda inesperada: ${sql}`);
      },
    };

    return new Proxy(raiz, {
      get(objetivo, propiedad) {
        if (typeof propiedad !== 'string') return undefined;
        if (propiedad in objetivo) return objetivo[propiedad];
        if (propiedad === '$transaction' && !contexto.enTx) return transaccion;
        if (!(propiedad in modelos)) throw new Error(`Modelo no permitido en el envío: ${propiedad}`);
        return new Proxy(modelos[propiedad], {
          get(m, operacion) {
            if (!(operacion in m)) throw new Error(`Operación no permitida: ${propiedad}.${String(operacion)}`);
            return m[operacion];
          },
        });
      },
    });
  }

  async function transaccion(fn) {
    operaciones.push('$transaction.inicio');
    let staged = null;
    const liberadores = [];
    const contexto = {
      enTx: true,
      fuente: () => staged ?? db,
      bloqueado: () => staged !== null,
      adquirir: async (id) => {
        liberadores.push(await bloquear(id));
        staged = clonar(db); // la lectura posterior al bloqueo ve lo último confirmado
      },
    };
    let confirmada = false;
    try {
      const resultado = await fn(crearCliente(contexto));
      if (staged) {
        db.documentos = staged.documentos;
        db.reportes = staged.reportes;
        db.revisiones = staged.revisiones;
        db.globales = staged.globales;
        db.revisionesGlobales = staged.revisionesGlobales;
      }
      confirmada = true;
      operaciones.push('$transaction.commit');
      if (falloTrasCommit) throw falloTrasCommit;
      return resultado;
    } catch (err) {
      if (!confirmada) operaciones.push('$transaction.rollback');
      throw err;
    } finally {
      liberadores.forEach((liberar) => liberar());
    }
  }

  const prisma = crearCliente({ enTx: false, fuente: () => db });
  const escrituras = () => operaciones.filter((op) => /\.(create|update|updateMany|delete|deleteMany|upsert)$/.test(op));
  // `bitacoras` es el arreglo vivo que lee la BD falsa: una prueba puede agregar o quitar bitácoras a mitad del envío.
  return { prisma, db, perfil, bitacoras, operaciones, escrituras, ahora: ahoraMx('2025-11-20'), SOLICITUD_ID };
}

module.exports = { crearBdEnvio, SOLICITUD_ID, PROFESOR_USUARIO_ID };
