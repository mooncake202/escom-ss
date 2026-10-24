// Login de los usuarios de prueba y lectura de los reportes, SOLO en setup(): un token por usuario, reutilizado en todas
// las iteraciones (nunca hay login dentro de la carga). Los IDs de reportes salen de los listados de la API.

import http from 'k6/http';
import { API, PASSWORD, correosAlumnos, correosProfesores, correosCoordinadores } from './config.js';
// Solo los usuarios que se conectan en las pruebas: alumnos, profesores BASE y coordinadores (nunca los adicionales).

const ETIQUETA_SETUP = { rnf: 'setup', op: 'setup' };
export const conToken = (token, op, rnf) => ({ headers: { Authorization: `Bearer ${token}` }, tags: { rnf, op } });

function login(correos) {
  const respuestas = http.batch(correos.map((correo) => ({
    method: 'POST',
    url: `${API}/auth/login`,
    body: JSON.stringify({ correo_institucional: correo, contrasena: PASSWORD }),
    params: { headers: { 'Content-Type': 'application/json' }, tags: { ...ETIQUETA_SETUP, op: 'login' } },
  })));
  return respuestas.map((r, i) => {
    if (r.status !== 200) throw new Error(`login de ${correos[i]} respondió ${r.status}: ${r.body}. ¿Corriste datos/preparar-datos.js con el mismo K6_PREFIJO?`);
    return { correo: correos[i], token: r.json('token') };
  });
}

function listar(usuarios, ruta, extraer) {
  const respuestas = http.batch(usuarios.map((u) => ({
    method: 'GET', url: `${API}${ruta}`, params: { headers: { Authorization: `Bearer ${u.token}` }, tags: { ...ETIQUETA_SETUP, op: 'listado' } },
  })));
  return respuestas.map((r, i) => {
    if (r.status !== 200) throw new Error(`${ruta} de ${usuarios[i].correo} respondió ${r.status}`);
    return extraer(r.json());
  });
}

const deBandeja = (cuerpo) => [...(cuerpo.pendientes ?? []), ...(cuerpo.procesados ?? [])].map((x) => ({ id: x.id, tipo: x.tipoReporte }));

/** Datos de setup(): por rol, cada usuario con su token y los reportes que puede abrir. */
export function prepararUsuarios() {
  const alumnos = login(correosAlumnos());
  const profesores = login(correosProfesores());
  const coordinadores = login(correosCoordinadores());

  listar(alumnos, '/reportes', (c) => (c.reportes ?? []).map((x) => ({ id: x.id, tipo: x.tipoReporte })))
    .forEach((reportes, i) => { alumnos[i].reportes = reportes; });
  listar(profesores, '/profesor/reportes', deBandeja)
    .forEach((reportes, i) => { profesores[i].reportes = reportes; });

  // Coordinación ve TODOS los reportes en coordinación; solo se abren los del lote (los de sus alumnos).
  const delLote = new Set(alumnos.flatMap((a) => a.reportes.map((r) => `${r.tipo}:${r.id}`)));
  listar(coordinadores, '/coordinador/reportes', deBandeja)
    .forEach((reportes, i) => { coordinadores[i].reportes = reportes.filter((r) => delLote.has(`${r.tipo}:${r.id}`)); });

  for (const [rol, lista] of [['alumno', alumnos], ['profesor', profesores], ['coordinacion', coordinadores]]) {
    if (lista.length === 0) throw new Error(`No hay usuarios de rol ${rol}.`);
    if (lista.every((u) => u.reportes.length === 0)) throw new Error(`Ningún usuario de rol ${rol} tiene reportes que abrir.`);
  }
  return { alumno: alumnos, profesor: profesores, coordinacion: coordinadores };
}
