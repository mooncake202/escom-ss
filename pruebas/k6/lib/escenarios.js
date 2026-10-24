// Escenarios por rol de PR-02, PR-03 y PR-05 (oficiales y reducido). Profesores y coordinación son constantes durante
// toda la prueba; solo los alumnos cambian de nivel.

import { REDUCIDO, VUS_REDUCIDO, DURACION_REDUCIDA, VUS_PROFESORES, VUS_COORDINADORES } from './config.js';
import { planEscenarios, duracionDeEtapas } from './operaciones.js';

const constante = (vus, duration) => ({ executor: 'constant-vus', vus, duration });

/** K6_REDUCIDO=1: 5 alumnos, 1 profesor y 1 coordinador durante 30 s (validación local, no oficial). */
const reducido = () => planEscenarios({
  alumno: constante(VUS_REDUCIDO, DURACION_REDUCIDA), profesor: constante(1, DURACION_REDUCIDA), coordinacion: constante(1, DURACION_REDUCIDA),
});

/** Alumnos con las etapas dadas; profesores y coordinadores constantes durante la misma duración total. */
function conAlumnos(alumno) {
  if (REDUCIDO) return reducido();
  const total = duracionDeEtapas(alumno.stages);
  return planEscenarios({ alumno, profesor: constante(VUS_PROFESORES, total), coordinacion: constante(VUS_COORDINADORES, total) });
}

/** PR-02 y PR-03: alumnos suben a 50 en 1 min y se mantienen 5 min. */
export const escenariosCarga = () => conAlumnos({
  executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '1m', target: 50 }, { duration: '5m', target: 50 }],
});

/** PR-05: alumnos en 50 durante 2 min y luego de 10 en 10 hasta 100, 2 min por nivel. */
export function escenariosEstres() {
  const niveles = [];
  for (let vus = 60; vus <= 100; vus += 10) niveles.push({ duration: '10s', target: vus }, { duration: '2m', target: vus });
  return conAlumnos({ executor: 'ramping-vus', startVUs: 50, stages: [{ duration: '2m', target: 50 }, ...niveles] });
}
