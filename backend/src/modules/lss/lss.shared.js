// Constantes compartidas del módulo LSS (Liberación del Servicio Social).
// Centralizadas aquí para que dashboard.service.js y los archivos propios
// de lss/ usen la MISMA fuente de verdad para los valores de
// liberacion_proceso.estado — antes dashboard.service.js las tenía
// hardcodeadas localmente por su cuenta.

const crypto = require('crypto');

// Mismo cálculo que usa Reportes (reportes-envio.service.js) — se duplica
// aquí en vez de importarse (ese módulo no existe todavía en esta rama).
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const ESTADO_EVALUACION_SOLICITADA = 'evaluacion_solicitada';
const ESTADO_EXPEDIENTE_EN_REVISION = 'expediente_en_revision';
const ESTADO_TERMINAL = 'constancia_disponible'; // último estado del flujo LSS

// Valor real de reporte_mensual.estado_reporte / reporte_global.estado_reporte
// cuando Coordinación aprobó definitivamente (CU-REP-06). Confirmado contra
// reportes.shared.js (rama feature/reportes, todavía no fusionada — por eso
// se duplica aquí en vez de importarse). Al fusionar, reemplazar por un
// import real de ESTADOS_REPORTE.APROBADO_COORDINADOR.
const ESTADO_REPORTE_APROBADO_COORDINADOR = 'aprobado_coordinador';

// Catálogo de evaluacion_desempeno.estado (CU-LSS-02/03/04) — diseño nuevo,
// sin precedente real todavía (LSS-03/04 no existen), definido aquí para
// que CU-LSS-02 lo consuma y LSS-03/04 lo reutilicen cuando se construyan.
// Mismo criterio de nombres ya usado en Reportes (pendiente_revision_*,
// aprobado_coordinador) por consistencia dentro del proyecto. El "sin
// evaluar" (profesor no ha hecho nada) NO es un valor de estado — se
// representa por la AUSENCIA de la fila evaluacion_desempeno, ya que
// documento_id es obligatorio ahí y no hay documento hasta que el
// profesor evalúa.
// Corregido: los 2 primeros valores fueron una suposición al construir
// CU-LSS-02 sin tener CU-LSS-03 disponible — los nombres/valores reales
// (confirmados contra la investigación de CU-LSS-03) son distintos. El
// tercero (aprobado_coordinador) sí coincidió, pertenece a CU-LSS-04.
const ESTADO_EVALUACION_RECHAZADA_POR_SISS = 'rechazada_por_siss';
const ESTADO_EVALUACION_PENDIENTE_DICTAMEN = 'pendiente_dictamen';
const ESTADO_EVALUACION_APROBADO_COORDINADOR = 'aprobado_coordinador';

// Valor que CU-LSS-04 (coordinación) escribirá cuando devuelva la
// evaluación al profesor para que la corrija (RN-LSS-11) — CU-LSS-04 no
// existe todavía, pero corregirYReenviar (CU-LSS-03, Alterno 1.3) ya exige
// este estado como precondición, así que se define aquí desde ahora para
// que ambos CU usen el mismo valor cuando LSS-04 se construya.
const ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION = 'devuelta_para_correccion';

// liberacion_proceso.estado al que se avanza cuando el alumno completa el
// Alterno D de CU-LSS-02 (descargó + subió a SISS + solicitó). Confirmado
// que no existía en ningún lado del código antes de esta tarea.
const ESTADO_SOLICITUD_CARTA_TERMINO = 'solicitud_carta_termino';

// Fuente canónica de los 7 factores del formulario real de CU-LSS-03
// (confirmado contra el mockup FormEvaluacion.jsx, NO contra los párrafos
// largos del .docx — decisión confirmada: el mock es la forma real con la
// que el profesor interactúa). Cada factor tiene 4 niveles de puntaje fijo
// {100,95,90,85} — el profesor elige UNO por factor (radio buttons), nunca
// un valor libre. Se usa tanto para validar el payload del backend
// (registrarEvaluacion/corregirYReenviar) como para renderizar el PDF real
// (lss.pdf.js) resaltando el nivel elegido.
const FACTORES_EVALUACION = [
  {
    nombre: 'Calidad del trabajo',
    opciones: [
      { valor: 100, label: 'Realiza trabajos excelentes' },
      { valor: 95, label: 'Realiza trabajos buenos con un mínimo de errores' },
      { valor: 90, label: 'Comete errores frecuentemente' },
      { valor: 85, label: 'Comete alto grado de errores' },
    ],
  },
  {
    nombre: 'Aplicación de conocimientos',
    opciones: [
      { valor: 100, label: 'Ejecuta adecuadamente las acciones encomendadas' },
      { valor: 95, label: 'Requiere ocasionalmente asesoría' },
      { valor: 90, label: 'Requiere constante asesoría' },
      { valor: 85, label: 'No tiene noción para ejecutar lo asignado' },
    ],
  },
  {
    nombre: 'Adquisición de conocimientos',
    opciones: [
      { valor: 100, label: 'Entendimiento adecuado de las instrucciones' },
      { valor: 95, label: 'Entendimiento parcial con asesoría ocasional' },
      { valor: 90, label: 'Percepción inadecuada, requiere asesoría constante' },
      { valor: 85, label: 'Aplica acciones erróneas constantemente' },
    ],
  },
  {
    nombre: 'Disciplina',
    opciones: [
      { valor: 100, label: 'Se sujeta a las indicaciones establecidas' },
      { valor: 95, label: 'Ocasionalmente pone objeciones' },
      { valor: 90, label: 'Frecuentemente manifiesta inconformidad' },
      { valor: 85, label: 'No cumple o evade instrucciones' },
    ],
  },
  {
    nombre: 'Presentación personal',
    opciones: [
      { valor: 100, label: 'Higiene personal excelente' },
      { valor: 95, label: 'Ocasionalmente se presentó sucio' },
      { valor: 90, label: 'Frecuentemente se presentó sucio' },
      { valor: 85, label: 'Constantemente desaliñado' },
    ],
  },
  {
    nombre: 'Iniciativa',
    opciones: [
      { valor: 100, label: 'Realizó aportaciones importantes' },
      { valor: 95, label: 'Eventualmente hizo aportaciones' },
      { valor: 90, label: 'Se limita a reportar anomalías' },
      { valor: 85, label: 'Solo sigue rutinas establecidas' },
    ],
  },
  {
    nombre: 'Relaciones interpersonales',
    opciones: [
      { valor: 100, label: 'Mantiene acertadas relaciones' },
      { valor: 95, label: 'Ocasionalmente inadecuadas' },
      { valor: 90, label: 'Frecuentemente inconforme' },
      { valor: 85, label: 'No cumple o evade relaciones laborales' },
    ],
  },
];

const VALORES_VALIDOS_FACTOR = [100, 95, 90, 85];
const SUMA_TOTAL_MAXIMA = FACTORES_EVALUACION.length * 100;

// carrera.nombre en BD guarda solo la sigla (VARCHAR(3), diseño original de
// la tabla) — este mapeo a nombre completo solo existía en el frontend
// (front/src/features/gestion-registro/CU-GR-01-enviar-solicitud/utils/constants.js,
// arreglo CARRERAS) hasta ahora; se duplica aquí (mismo criterio de
// duplicación ya usado en todo el módulo LSS) porque el PDF de evaluación
// se genera en el backend. "IA" es "Inteligencia Artificial" a secas —
// SIN "Ingeniería en" — confirmado contra el catálogo real de GR.
const NOMBRES_CARRERA = {
  ISC: 'Ingeniería en Sistemas Computacionales',
  IA: 'Inteligencia Artificial',
  LCD: 'Licenciatura en Ciencia de Datos',
};

function nombreCompletoCarrera(sigla) {
  return NOMBRES_CARRERA[sigla] ?? sigla ?? '';
}

/**
 * RN-LSS-08: valida que `valores` traiga exactamente las 7 claves de
 * FACTORES_EVALUACION, cada una con uno de los 4 puntajes fijos — nunca un
 * valor libre ni un factor faltante. Regresa la suma total RECALCULADA en
 * servidor (nunca se confía en ningún `total` que mande el cliente, mismo
 * criterio ya usado en todo el proyecto).
 */
function validarYCalcularPuntajes(valores) {
  if (!valores || typeof valores !== 'object' || Array.isArray(valores)) {
    const error = new Error('Debes completar la evaluación por factores antes de continuar.');
    error.status = 422;
    error.code = 'PUNTAJES_FALTANTES';
    throw error;
  }

  let total = 0;
  for (const factor of FACTORES_EVALUACION) {
    const puntaje = valores[factor.nombre];
    if (!VALORES_VALIDOS_FACTOR.includes(puntaje)) {
      const error = new Error(`Falta calificar el factor "${factor.nombre}" (o su valor no es válido).`);
      error.status = 422;
      error.code = 'PUNTAJES_FALTANTES';
      throw error;
    }
    total += puntaje;
  }

  return total;
}

/**
 * Guardia reutilizable para las funciones de servicio de LSS-03 en
 * adelante: valida que `proceso.estado` sea exactamente el esperado antes
 * de procesar, mismo patrón 409 "ya fue procesada" que GR ya usa en cada
 * una de sus funciones (ej. gr-profesor.service.js, gr.service.js) — GR
 * nunca centralizó ese chequeo, cada función repite su propio `if`, pero
 * aquí sí conviene centralizarlo desde ahora porque LSS todavía tiene ~9
 * funciones futuras (CU-LSS-03 a 11) que necesitarán exactamente este
 * mismo chequeo, y así no hay que decidirlo de nuevo cada vez.
 */
function exigirEstadoLiberacion(proceso, estadoEsperado, mensaje) {
  if (proceso.estado !== estadoEsperado) {
    const error = new Error(mensaje || 'Tu proceso de liberación ya no está en el paso esperado.');
    error.status = 409;
    throw error;
  }
}

/**
 * Mismo patrón que exigirEstadoLiberacion, pero para evaluacion_desempeno
 * (CU-LSS-02/03/04). `evaluacion` puede ser null (fila inexistente = Alterno
 * A) — en ese caso también falla, ya que ningún estado esperado real puede
 * coincidir con "no existe".
 */
function exigirEstadoEvaluacion(evaluacion, estadoEsperado, mensaje) {
  if (!evaluacion || evaluacion.estado !== estadoEsperado) {
    const error = new Error(mensaje || 'Tu evaluación de desempeño ya no está en el paso esperado.');
    error.status = 409;
    throw error;
  }
}

module.exports = {
  sha256,
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_TERMINAL,
  ESTADO_REPORTE_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_RECHAZADA_POR_SISS,
  ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
  ESTADO_SOLICITUD_CARTA_TERMINO,
  FACTORES_EVALUACION,
  VALORES_VALIDOS_FACTOR,
  SUMA_TOTAL_MAXIMA,
  NOMBRES_CARRERA,
  nombreCompletoCarrera,
  validarYCalcularPuntajes,
  exigirEstadoLiberacion,
  exigirEstadoEvaluacion,
};
