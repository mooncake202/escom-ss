// Operaciones por rol, plan de escenarios (uno por rol, en paralelo) y resumen por op. Compartido por los cuatro scripts.
// Ninguna operación llama a la TSA: solo consultas, la vista previa (PDF en memoria) y la descarga de PDF ya generados.

import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import { API, OPS, PAUSA_MIN_S, PAUSA_MAX_S, RESULTADOS_DIR } from './config.js';
import { conToken } from './auth.js';

export const pausa = () => sleep(PAUSA_MIN_S + Math.random() * (PAUSA_MAX_S - PAUSA_MIN_S));

// ── Plan de escenarios ───────────────────────────────────────
//
// Un escenario por rol (alumno, coordinacion, profesor), ejecutados en paralelo; el nombre del escenario es el rol y la
// función que ejecuta. Cada usuario virtual usa un usuario DISTINTO de su rol (sin reutilización cíclica).
//
// Cómo se garantiza: k6 reparte los IDs de VU (exec.vu.idInTest) intercalados entre escenarios, así que el ID no sirve
// para saber "qué número de VU del rol" es cada uno. En cambio, exec.scenario.iterationInTest es un contador atómico POR
// ESCENARIO. Cada VU ejecuta UNA sola iteración larga (un ciclo de operaciones hasta el fin de su escenario) y toma su
// usuario al empezarla: así el contador vale 0, 1, 2… una vez por VU, sin repetirse, tanto en VUs constantes como en
// los que se suman durante una rampa. Si hubiera más VUs que usuarios del rol, la prueba se detiene.
// Con K6_DEPURAR_USUARIOS=1 cada VU imprime qué usuario tomó (para comprobar el reparto).

const ROLES = ['alumno', 'coordinacion', 'profesor'];
let PLAN = null;

// Fin del escenario en milisegundos desde su inicio (constant-vus: duration; ramping-vus: suma de etapas).
const duracionMs = (e) => 1000 * (e.executor === 'constant-vus' ? segundos(e.duration) : e.stages.reduce((t, s) => t + segundos(s.duration), 0));
const vusMaximos = (e) => (e.executor === 'constant-vus' ? e.vus : Math.max(e.startVUs ?? 0, ...e.stages.map((s) => s.target)));
// "1m", "30s", "2m10s" → segundos.
function segundos(duracion) {
  const m = /^(?:(\d+)m)?(?:(\d+)s)?$/.exec(duracion);
  if (!m) throw new Error(`Duración no soportada: ${duracion}`);
  return Number(m[1] || 0) * 60 + Number(m[2] || 0);
}
export const duracionDeEtapas = (stages) => `${stages.reduce((t, s) => t + segundos(s.duration), 0)}s`;

/** escenariosPorRol: { alumno: {executor…}, profesor: {…}, coordinacion: {…} }. Regresa `scenarios` para options. */
export function planEscenarios(escenariosPorRol) {
  const scenarios = {};
  const vus = {};
  const duracion = {};
  for (const rol of ROLES) {
    const e = escenariosPorRol[rol];
    if (!e) continue;
    scenarios[rol] = { ...e, exec: rol };
    vus[rol] = vusMaximos(e);
    duracion[rol] = duracionMs(e);
  }
  PLAN = { vus, duracion };
  return scenarios;
}

export const vusPorRol = () => ({ ...(PLAN?.vus ?? {}) });

let usuarioAsignado = null; // por VU: se calcula una vez

/** Usuario de este VU dentro de su rol: uno distinto por VU; detiene la prueba si hay más VUs que usuarios del rol. */
export function usuarioDelVU(datos, rol) {
  if (usuarioAsignado) return usuarioAsignado;
  if (exec.scenario.name !== rol) exec.test.abort(`El VU ${exec.vu.idInTest} del escenario ${exec.scenario.name} pidió un usuario de rol ${rol}.`);
  const lista = datos[rol];
  if (PLAN.vus[rol] > lista.length) exec.test.abort(`El escenario ${rol} usa ${PLAN.vus[rol]} VUs y solo hay ${lista.length} usuarios de ese rol; prepara más datos o baja los VUs.`);
  const indice = exec.scenario.iterationInTest; // única iteración de este VU → 0, 1, 2… sin repetirse en el escenario
  if (indice >= lista.length) exec.test.abort(`El escenario ${rol} pidió el usuario #${indice + 1} y solo hay ${lista.length}.`);
  usuarioAsignado = lista[indice];
  if (__ENV.K6_DEPURAR_USUARIOS === '1') console.log(`VU ${exec.vu.idInTest} ${rol} → ${usuarioAsignado.correo}`);
  return usuarioAsignado;
}

// ── Peticiones ───────────────────────────────────────────────

const esJson = (r) => (r.headers['Content-Type'] || '').includes('application/json');
const esPdf = (r) => (r.headers['Content-Type'] || '').includes('application/pdf');

function get(token, ruta, op, rnf) {
  const r = http.get(`${API}${ruta}`, conToken(token, op, rnf));
  check(r, { [`${op}: 200`]: (x) => x.status === 200, [`${op}: ${rnf === 'pdf' ? 'PDF' : 'JSON'}`]: rnf === 'pdf' ? esPdf : esJson }, { rnf, op });
  return r;
}

const reporteAlAzar = (u) => u.reportes[Math.floor(Math.random() * u.reportes.length)];

// ── Consultas (rnf: consulta) ────────────────────────────────
export const CONSULTAS = {
  alumno: [
    (u) => get(u.token, '/perfil/alumno', 'alumno_perfil', 'consulta'),
    (u) => get(u.token, '/dashboard/resumen', 'alumno_estado', 'consulta'),
    (u) => get(u.token, '/reportes', 'alumno_historial', 'consulta'),
  ],
  profesor: [
    (u) => get(u.token, '/profesor/reportes', 'profesor_bandeja', 'consulta'),
    (u) => get(u.token, '/profesor/actividades/alumnos', 'profesor_alumnos', 'consulta'),
    (u) => get(u.token, '/perfil/profesor', 'profesor_perfil', 'consulta'),
  ],
  coordinacion: [
    (u) => get(u.token, '/coordinador/reportes', 'coord_bandeja', 'consulta'),
    (u) => get(u.token, '/ofertas/pendientes', 'coord_ofertas_pendientes', 'consulta'),
    (u) => get(u.token, '/dashboard/resumen', 'coord_resumen', 'consulta'),
  ],
};

// ── PDF (rnf: pdf) — sin TSA ─────────────────────────────────
function vistaPrevia(u) {
  const op = 'alumno_vista_previa';
  const r = http.post(`${API}/reportes/mensual/vista-previa`, JSON.stringify({ actividades: 'Actividades del periodo para la vista previa de la prueba de rendimiento.' }), {
    headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' }, tags: { rnf: 'pdf', op },
  });
  check(r, { [`${op}: 200`]: (x) => x.status === 200, [`${op}: PDF`]: esPdf }, { rnf: 'pdf', op });
  return r;
}
const abrirPdf = (prefijoRuta, op) => (u) => { const rep = reporteAlAzar(u); return get(u.token, `${prefijoRuta}/${rep.tipo}/${rep.id}/pdf`, op, 'pdf'); };

export const PDFS = {
  alumno: [vistaPrevia, abrirPdf('/reportes', 'alumno_pdf')],
  profesor: [abrirPdf('/profesor/reportes', 'profesor_pdf')],
  coordinacion: [abrirPdf('/coordinador/reportes', 'coord_pdf')],
};

/** Ejecuta las operaciones dadas, con pausa aleatoria entre petición y petición. */
export function ejecutar(usuario, operaciones) {
  for (const op of operaciones) {
    op(usuario);
    pausa();
  }
}

/**
 * Funciones de escenario por rol. Cada VU hace UNA iteración: toma su usuario (distinto por VU) y repite las operaciones
 * de su rol, con pausas, hasta el fin de su escenario. Los VUs que se suman en una rampa empiezan al activarse.
 */
export function funcionesPorRol(operacionesPorRol) {
  const crear = (rol) => (datos) => {
    const usuario = usuarioDelVU(datos, rol);
    const fin = exec.scenario.startTime + PLAN.duracion[rol];
    while (Date.now() < fin) ejecutar(usuario, operacionesPorRol[rol]);
  };
  return { alumno: crear('alumno'), profesor: crear('profesor'), coordinacion: crear('coordinacion') };
}

// ── Resumen ──────────────────────────────────────────────────
const ms = (v) => (v === undefined || v === null ? '   —   ' : `${v.toFixed(0).padStart(6)} ms`);
const pct = (v) => (v === undefined || v === null ? '  —  ' : `${(v * 100).toFixed(2).padStart(6)} %`);

/** handleSummary: JSON completo en RESULTADOS_DIR y, en consola, p95 y tasa de error por op y VUs por rol. */
export function resumen(nombre, rnfs, data) {
  const marca = new Date().toISOString().replace(/[:.]/g, '-');
  const m = data.metrics;
  const vus = vusPorRol();
  const lineas = [
    `\n== ${nombre} · ${marca} ==`,
    `VUs por rol (máximo configurado): alumno ${vus.alumno ?? 0} · profesor ${vus.profesor ?? 0} · coordinación ${vus.coordinacion ?? 0}`,
    '', 'op                           rnf        p95        error     peticiones',
  ];
  const filas = [];
  for (const rnf of rnfs) {
    for (const op of OPS[rnf]) {
      const dur = m[`http_req_duration{op:${op}}`]?.values;
      const fal = m[`http_req_failed{op:${op}}`]?.values;
      // Las Trend no traen conteo: las peticiones salen de la sub-métrica de fallos (passes + fails).
      const peticiones = fal ? fal.passes + fal.fails : 0;
      if (!dur || peticiones === 0) continue;
      filas.push({ op, rnf, p95_ms: dur['p(95)'], tasa_error: fal.rate, peticiones });
      lineas.push(`${op.padEnd(28)} ${rnf.padEnd(9)} ${ms(dur['p(95)'])}  ${pct(fal.rate)}  ${String(peticiones).padStart(8)}`);
    }
  }
  const umbral = (k) => {
    const met = m[k];
    if (!met) return `${k}: sin datos`;
    const ok = Object.values(met.thresholds || {}).every((t) => t.ok);
    const v = met.values;
    return `${k}: ${ok ? 'CUMPLE' : 'NO CUMPLE'} (${v['p(95)'] !== undefined ? `p95 ${v['p(95)'].toFixed(0)} ms` : `tasa ${(v.rate * 100).toFixed(2)} %`})`;
  };
  lineas.push('', 'Umbrales del RNF:');
  for (const k of ['http_req_duration{rnf:consulta}', 'http_req_duration{rnf:pdf}', 'http_req_failed']) if (m[k]) lineas.push(`  ${umbral(k)}`);
  if (m.checks) lineas.push(`  checks: ${(m.checks.values.rate * 100).toFixed(2)} % OK (${m.checks.values.passes}/${m.checks.values.passes + m.checks.values.fails})`);
  // Cada VU hace una sola iteración larga (ver funcionesPorRol): `iterations` = VUs que llegaron a arrancar.
  if (m.vus_max) lineas.push(`  VUs máx simultáneos: ${m.vus_max.values.max}; VUs que arrancaron: ${m.iterations?.values.count ?? 0}`);
  const archivo = `${RESULTADOS_DIR}/${nombre}-${marca}.json`;
  lineas.push(`\nResultado completo: ${archivo}\n`);
  return { stdout: lineas.join('\n'), [archivo]: JSON.stringify({ prueba: nombre, fecha: marca, vus_por_rol: vus, ops: filas, metricas: data.metrics, estado: data.state }, null, 2) };
}
