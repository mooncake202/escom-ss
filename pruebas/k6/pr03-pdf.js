// PR-03 · PDF sin TSA (rnf: pdf): vista previa del mensual (alumno) y descarga de PDF ya generados (alumno, profesor,
// coordinación). Alumnos suben a 50 en 1 min y se mantienen 5 min; 10 profesores y 2 coordinadores constantes.
//   Oficial (equipo externo): k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr03-pdf.js
//   Validación rápida (no oficial): -e K6_REDUCIDO=1

import { umbrales } from './lib/config.js';
import { prepararUsuarios } from './lib/auth.js';
import { escenariosCarga } from './lib/escenarios.js';
import { PDFS, funcionesPorRol, resumen } from './lib/operaciones.js';

export const options = {
  setupTimeout: '3m',
  scenarios: escenariosCarga(),
  thresholds: umbrales(['pdf']),
};

export function setup() { return prepararUsuarios(); }

export const { alumno, profesor, coordinacion } = funcionesPorRol(PDFS);

export function handleSummary(data) { return resumen('pr03-pdf', ['pdf'], data); }
