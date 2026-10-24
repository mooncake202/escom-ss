// Configuración ÚNICA de las pruebas de rendimiento: la leen los scripts de k6 (__ENV) y los de datos en Node (process.env).
// Todo sale de variables de entorno; los valores por omisión de abajo son los del lote oficial: 100 alumnos, 10 profesores
// base (los que se conectan en las pruebas) más los profesores adicionales necesarios para asignar a todos, y 2 coordinadores.
// Este módulo no importa nada de k6 para que Node también pueda cargarlo.

const ENV = typeof __ENV !== 'undefined' ? __ENV : process.env;
const entero = (nombre, porOmision) => {
  const valor = ENV[nombre] === undefined || ENV[nombre] === '' ? porOmision : Number(ENV[nombre]);
  if (!Number.isInteger(valor) || valor < 0) throw new Error(`${nombre} debe ser un entero >= 0 (llegó "${ENV[nombre]}").`);
  return valor;
};

// ── Lote de datos ────────────────────────────────────────────
// Solo letras: el correo del alumno debe cumplir LETRAS + 4 DÍGITOS + @alumno.ipn.mx (validators.js y LoginPage.jsx).
export const PREFIJO = (ENV.K6_PREFIJO || 'kseis').toLowerCase();
if (!/^[a-z]{2,12}$/.test(PREFIJO)) throw new Error(`K6_PREFIJO debe ser solo letras (2-12); llegó "${PREFIJO}".`);
export const ALUMNOS = entero('K6_ALUMNOS', 100);
// Profesores BASE: los únicos que usan los escenarios de k6. Los adicionales solo existen para que todos los alumnos tengan
// oferta sin rebasar el cupo real (CUPOS_BASE, caracteristicas.service.js); los crea preparar-datos.js.
export const PROFESORES = entero('K6_PROFESORES', 10);
export const COORDINADORES = entero('K6_COORDINADORES', 2);
// Cupo de un profesor sin característica (CUPOS_BASE del sistema). preparar-datos.js comprueba que coincida con el backend.
export const CUPOS_BASE = 3;
export const PASSWORD = ENV.K6_PASSWORD || '12345678';
// Boletas válidas (^(19|20)\d{2}63\d{4}$): K6_BOLETA_BASE (6 dígitos, termina en 63) + 4 dígitos desde K6_BOLETA_DESDE.
export const BOLETA_BASE = ENV.K6_BOLETA_BASE || '201963';
export const BOLETA_DESDE = entero('K6_BOLETA_DESDE', 9001);
// Marca de las filas sin correo ni boleta (ofertas, evento del periodo) para poder borrarlas.
export const MARCA = `[K6-${PREFIJO.toUpperCase()}]`;
// Nombre de los usuarios del lote: solo letras, como exige el registro (validators.js, NOMBRE_REGEX).
export const MARCA_NOMBRE = PREFIJO.toUpperCase();
// Datos (solo los usan los scripts de Node).
export const BACKEND_DIR = ENV.K6_BACKEND_DIR || '/app/backend';
export const DIAS_ATRAS = entero('K6_DIAS_ATRAS', 120);
export const BITACORAS_POR_PERIODO = entero('K6_BITACORAS_POR_PERIODO', 10);

const dos = (n) => String(n).padStart(2, '0');
const cuatro = (n) => String(n).padStart(4, '0');
export const correosAlumnos = () => Array.from({ length: ALUMNOS }, (_, i) => `${PREFIJO}alumno${cuatro(i + 1)}@alumno.ipn.mx`);
export const correosProfesores = () => Array.from({ length: PROFESORES }, (_, i) => `${PREFIJO}profesor${dos(i + 1)}@ipn.mx`);
export const correosCoordinadores = () => Array.from({ length: COORDINADORES }, (_, i) => `${PREFIJO}coord${dos(i + 1)}@ipn.mx`);
/** Profesores adicionales: los que hagan falta, con CUPOS_BASE cada uno, después de llenar a los base. */
export const profesoresAdicionales = () => Math.ceil(Math.max(0, ALUMNOS - PROFESORES * CUPOS_BASE) / CUPOS_BASE);
export const correosProfesoresAdicionales = () => Array.from({ length: profesoresAdicionales() }, (_, i) => `${PREFIJO}profadic${dos(i + 1)}@ipn.mx`);
/** Usuarios que inician sesión en las pruebas (alumnos, profesores base y coordinadores). */
export const correosDeLasPruebas = () => [...correosAlumnos(), ...correosProfesores(), ...correosCoordinadores()];
export const todosLosCorreos = () => [...correosDeLasPruebas(), ...correosProfesoresAdicionales()];
/** Cualquier correo de un lote con este prefijo, de esta versión o de una anterior (para limpiar sin dejar huérfanos). */
export const PATRON_CORREO_LOTE = new RegExp(`^${PREFIJO}(alumno\\d{4}@alumno\\.ipn\\.mx|(profesor|profadic|coord)\\d{2}@ipn\\.mx)$`);
export const boletas = () => Array.from({ length: ALUMNOS }, (_, i) => `${BOLETA_BASE}${cuatro(BOLETA_DESDE + i)}`);

// ── Ejecución de k6 ──────────────────────────────────────────
export const BASE_URL = (ENV.BASE_URL || 'http://localhost').replace(/\/+$/, '');
export const API = `${BASE_URL}/api`;
export const PAUSA_MIN_S = Number(ENV.K6_PAUSA_MIN || 1);
export const PAUSA_MAX_S = Number(ENV.K6_PAUSA_MAX || 3);
export const RESULTADOS_DIR = ENV.K6_RESULTADOS_DIR || 'pruebas/k6/resultados';
// Validación local rápida: K6_REDUCIDO=1 reemplaza los escenarios oficiales por K6_VUS_REDUCIDO alumnos, 1 profesor y
// 1 coordinador durante K6_DURACION_REDUCIDA.
export const REDUCIDO = ENV.K6_REDUCIDO === '1';
export const VUS_REDUCIDO = entero('K6_VUS_REDUCIDO', 5);
export const DURACION_REDUCIDA = ENV.K6_DURACION_REDUCIDA || '30s';

// Usuarios virtuales constantes de profesores y coordinación en PR-02, PR-03 y PR-05 (uno por usuario base).
export const VUS_PROFESORES = entero('K6_VUS_PROFESORES', PROFESORES);
export const VUS_COORDINADORES = entero('K6_VUS_COORDINADORES', COORDINADORES);

// Umbrales del RNF (los de cada op se agregan con valores laxos solo para que aparezcan en el resumen).
export const UMBRALES_RNF = {
  consulta: { 'http_req_duration{rnf:consulta}': ['p(95)<2000'] },
  pdf: { 'http_req_duration{rnf:pdf}': ['p(95)<3000'] },
};
export const UMBRAL_ERRORES = { http_req_failed: ['rate<0.01'] };

export const OPS = {
  consulta: ['alumno_perfil', 'alumno_estado', 'alumno_historial', 'profesor_bandeja', 'profesor_alumnos', 'profesor_perfil', 'coord_bandeja', 'coord_ofertas_pendientes', 'coord_resumen'],
  pdf: ['alumno_vista_previa', 'alumno_pdf', 'profesor_pdf', 'coord_pdf'],
};

/** Umbrales oficiales + sub-métricas por op (siempre se cumplen) para que handleSummary tenga p95 y error de cada op. */
export function umbrales(rnfs) {
  const u = { ...UMBRAL_ERRORES };
  for (const rnf of rnfs) {
    Object.assign(u, UMBRALES_RNF[rnf]);
    for (const op of OPS[rnf]) {
      u[`http_req_duration{op:${op}}`] = ['p(95)>=0'];
      u[`http_req_failed{op:${op}}`] = ['rate>=0'];
    }
  }
  return u;
}
