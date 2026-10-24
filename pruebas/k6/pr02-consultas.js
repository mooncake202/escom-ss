// PR-02 · Consultas (rnf: consulta). Alumnos suben a 50 en 1 min y se mantienen 5 min; 10 profesores y 2 coordinadores
// constantes durante toda la prueba (un escenario por rol, en paralelo).
// También es PR-04 (línea base): mismo script con BASE_URL=http://localhost dentro de la VM y K6_NOMBRE=pr04-consultas.
//   Oficial (equipo externo): k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr02-consultas.js
//   Validación rápida (no oficial): -e K6_REDUCIDO=1 (5 alumnos, 1 profesor, 1 coordinador, 30 s)

import { umbrales } from './lib/config.js';
import { prepararUsuarios } from './lib/auth.js';
import { escenariosCarga } from './lib/escenarios.js';
import { CONSULTAS, funcionesPorRol, resumen } from './lib/operaciones.js';

export const options = {
  setupTimeout: '3m',
  scenarios: escenariosCarga(),
  thresholds: umbrales(['consulta']),
};

export function setup() { return prepararUsuarios(); }

export const { alumno, profesor, coordinacion } = funcionesPorRol(CONSULTAS);

export function handleSummary(data) { return resumen(__ENV.K6_NOMBRE || 'pr02-consultas', ['consulta'], data); }
