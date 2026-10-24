// PR-01 · Humo: 1 alumno, 1 profesor y 1 coordinador (un escenario por rol, en paralelo) durante 1 minuto; cada iteración
// recorre todas las consultas y los PDF de su rol.
//   Oficial (equipo externo): k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr01-humo.js

import { umbrales } from './lib/config.js';
import { prepararUsuarios } from './lib/auth.js';
import { CONSULTAS, PDFS, planEscenarios, funcionesPorRol, resumen } from './lib/operaciones.js';

const uno = { executor: 'constant-vus', vus: 1, duration: '1m' };

export const options = {
  setupTimeout: '3m',
  scenarios: planEscenarios({ alumno: uno, profesor: uno, coordinacion: uno }),
  thresholds: umbrales(['consulta', 'pdf']),
};

export function setup() { return prepararUsuarios(); }

const todas = (rol) => [...CONSULTAS[rol], ...PDFS[rol]];
export const { alumno, profesor, coordinacion } = funcionesPorRol({ alumno: todas('alumno'), profesor: todas('profesor'), coordinacion: todas('coordinacion') });

export function handleSummary(data) { return resumen('pr01-humo', ['consulta', 'pdf'], data); }
