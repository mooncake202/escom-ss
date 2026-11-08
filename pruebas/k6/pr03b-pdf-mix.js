// PR-03b · PDF, mezcla realista (rnf: pdf): mismos roles y operaciones que PR-03 (vista previa del mensual para el
// alumno; apertura de PDF ya generado para profesor y coordinación), pero con concurrencia TOTAL = 50 repartida entre
// los tres roles, en vez de 50 alumnos + 10 profesores + 2 coordinadores = 62 como en PR-03. El número de alumnos es
// el único valor que se ajusta (K6_ALUMNOS_VU); profesores y coordinadores se mantienen en los mismos 10 y 2 ya
// usados en el resto del lote oficial (K6_VUS_PROFESORES / K6_VUS_COORDINADORES, lib/config.js), para no inventar una
// proporción nueva. El objetivo es encontrar, por tanteo, el número máximo de alumnos concurrentes generando vista
// previa de reporte de forma sostenida con el que el p95 de esa operación siga cumpliendo el umbral de 3 s del RNF 5,
// dentro de una concurrencia total que sigue cumpliendo el mínimo de 50 del RNF 8.
//
//   k6 run -e BASE_URL=https://ttservicio.com -e K6_ALUMNOS_VU=38 pruebas/k6/pr03b-pdf-mix.js
//   Validación rápida (no oficial): -e K6_REDUCIDO=1

import { umbrales, VUS_PROFESORES, VUS_COORDINADORES, REDUCIDO, VUS_REDUCIDO, DURACION_REDUCIDA } from './lib/config.js';
import { prepararUsuarios } from './lib/auth.js';
import { planEscenarios, duracionDeEtapas } from './lib/operaciones.js';
import { PDFS, funcionesPorRol, resumen } from './lib/operaciones.js';

const ENV = typeof __ENV !== 'undefined' ? __ENV : process.env;
const ALUMNOS_VU = Number(ENV.K6_ALUMNOS_VU || 38);
if (!Number.isInteger(ALUMNOS_VU) || ALUMNOS_VU < 0) {
  throw new Error(`K6_ALUMNOS_VU debe ser un entero >= 0 (llegó "${ENV.K6_ALUMNOS_VU}").`);
}

const constante = (vus, duration) => ({ executor: 'constant-vus', vus, duration });

function construirEscenarios() {
  if (REDUCIDO) {
    return planEscenarios({
      alumno: constante(VUS_REDUCIDO, DURACION_REDUCIDA),
      profesor: constante(1, DURACION_REDUCIDA),
      coordinacion: constante(1, DURACION_REDUCIDA),
    });
  }
  const alumno = { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '1m', target: ALUMNOS_VU }, { duration: '5m', target: ALUMNOS_VU }] };
  const total = duracionDeEtapas(alumno.stages);
  return planEscenarios({
    alumno,
    profesor: constante(VUS_PROFESORES, total),
    coordinacion: constante(VUS_COORDINADORES, total),
  });
}

export const options = {
  setupTimeout: '3m',
  scenarios: construirEscenarios(),
  thresholds: umbrales(['pdf']),
};

export function setup() { return prepararUsuarios(); }

export const { alumno, profesor, coordinacion } = funcionesPorRol(PDFS);

export function handleSummary(data) { return resumen('pr03b-pdf-mix', ['pdf'], data); }
