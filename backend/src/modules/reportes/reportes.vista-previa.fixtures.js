// Prisma falso para probar la vista previa: un alumno con reporte generable (periodo 16-oct-2025 al 15-nov-2025 cerrado)
// y la rúbrica en una tabla `usuario` en memoria. Registra cada operación; cualquier modelo no previsto lanza un error.

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
// Instante (UTC) cuyo día calendario en México es `iso` a mediodía.
const ahoraMx = (iso) => new Date(`${iso}T18:00:00.000Z`);

const OPERACIONES_DE_LECTURA = new Set(['findUnique', 'findMany', 'findFirst', 'count']);

function crearBdReporte(opciones = {}) {
  const {
    usuarioId = 7,
    rubrica = null,
    carrera = 'IIA',
    correoPersonal = 'ana.garcia@example.com',
    programa = 'Programa SISS de prueba',
    profesorUsuario = { nombre: 'LUIS', apellidos: 'TORRES VEGA' },
    nombre = 'ANA',
    apellidos = 'GARCIA LOPEZ',
    bitacoras = [
      { id: 1, estado: 'aprobada', fecha_registro: utc('2025-10-16'), fecha_revision: new Date('2025-10-17T16:00:00.000Z'), horas_contabilizadas: 4 },
      { id: 2, estado: 'aprobada', fecha_registro: utc('2025-10-17'), fecha_revision: new Date('2025-10-18T16:00:00.000Z'), horas_contabilizadas: 3 },
    ],
    sinAlumno = false,
  } = opciones;

  const usuarios = { [usuarioId]: { id: usuarioId, rubrica_imagen: rubrica, rubrica_ip: null, rubrica_fecha_registro: null } };
  const operaciones = [];

  const alumno = () => (sinAlumno
    ? null
    : {
        boleta: '2022630001',
        carrera,
        semestre: 8,
        celular: '5512345678',
        creditos: '85.50',
        correo_personal: correoPersonal,
        usuario: { nombre, apellidos, correo_institucional: 'agarcia@alumno.ipn.mx', rubrica_imagen: usuarios[usuarioId].rubrica_imagen },
        solicitud_registro: {
          id: 42,
          periodo_registro: { evento_calendario: { fecha_inicio: utc('2025-10-16'), fecha_fin: utc('2026-05-14') } },
          oferta: { id: 3, nombre_proyecto: 'Proyecto X', programa_SISS: programa, profesor: profesorUsuario ? { usuario: profesorUsuario } : null },
        },
      });

  const modelos = {
    alumno: { findUnique: async () => alumno() },
    usuario: {
      findUnique: async ({ where }) => {
        const u = usuarios[where.id];
        if (!u) return null;
        // Reorganización de almacenamiento: la identidad de la rúbrica (reportes.rubricas.js) sale de aquí
        // (rol + boleta del alumno anidada), nunca del cliente. Esta BD falsa solo representa alumnos.
        return { id: u.id, rol: 'alumno_asignado', rubrica_imagen: u.rubrica_imagen, correo_institucional: 'agarcia@alumno.ipn.mx', alumno: sinAlumno ? null : { boleta: '2022630001' } };
      },
      updateMany: async ({ where, data }) => {
        const u = usuarios[where.id];
        if (!u || (where.rubrica_imagen === null && u.rubrica_imagen !== null)) return { count: 0 };
        Object.assign(u, data);
        return { count: 1 };
      },
    },
    reporte_mensual: { findMany: async () => [] },
    evento_calendario: { findMany: async () => [] },
    bitacora: { findMany: async () => bitacoras },
    actividad: { findMany: async () => [] },
    registro_bitacora_actividades: { findMany: async () => [] },
  };

  const prisma = new Proxy({}, {
    get(_, modelo) {
      if (typeof modelo !== 'string') return undefined;
      if (!(modelo in modelos)) throw new Error(`Modelo no permitido en la vista previa: ${modelo}`);
      return new Proxy(modelos[modelo], {
        get(objetivo, operacion) {
          if (!(operacion in objetivo)) throw new Error(`Operación no permitida: ${modelo}.${String(operacion)}`);
          return (...args) => { operaciones.push(`${modelo}.${operacion}`); return objetivo[operacion](...args); };
        },
      });
    },
  });

  // Las lecturas de la vista previa; las escrituras solo las hace guardarRubrica (fase 4) cuando la prueba la invoca.
  const escrituras = () => operaciones.filter((op) => !OPERACIONES_DE_LECTURA.has(op.split('.')[1]));
  return { prisma, usuarios, operaciones, escrituras, ahora: ahoraMx('2025-11-20') };
}

module.exports = { crearBdReporte, ahoraMx, utc };
