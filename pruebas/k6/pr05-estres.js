// PR-05 · Estrés: alumnos en 50 durante 2 min y luego de 10 en 10 hasta 100, 2 min por nivel; 10 profesores y 2
// coordinadores constantes. Consultas y PDF de cada rol. Cada VU usa un usuario distinto de su rol.
// Los umbrales se evalúan y se reportan, pero NO detienen la prueba (ninguno tiene abortOnFail).
//   Oficial (equipo externo): k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr05-estres.js

import { umbrales } from './lib/config.js';
import { prepararUsuarios } from './lib/auth.js';
import { escenariosEstres } from './lib/escenarios.js';
import { CONSULTAS, PDFS, funcionesPorRol, resumen } from './lib/operaciones.js';

export const options = {
  setupTimeout: '3m',
  scenarios: escenariosEstres(),
  thresholds: umbrales(['consulta', 'pdf']),
};

export function setup() { return prepararUsuarios(); }

const todas = (rol) => [...CONSULTAS[rol], ...PDFS[rol]];
export const { alumno, profesor, coordinacion } = funcionesPorRol({ alumno: todas('alumno'), profesor: todas('profesor'), coordinacion: todas('coordinacion') });

export function handleSummary(data) { return resumen('pr05-estres', ['consulta', 'pdf'], data); }
