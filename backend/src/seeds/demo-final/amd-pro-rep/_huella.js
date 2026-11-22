// _huella.js — amd-pro-rep
//
// Huella FILA POR FILA de los registros que NO son míos: los de Karen
// (cred-gr-ah-lss) y los de 00-comun. Una fila es "ajena" si su DUEÑO no es
// mío, y el dueño se decide SIEMPRE por correo o boleta (_datos.js), nunca por
// id fijo:
//   usuario/profesor/anuncio/notificacion   → correo del usuario
//   alumno/documento/cumulo/baja/visto      → boleta del alumno
//   solicitud_registro y todo lo que cuelga de ella (actividad, bitácora,
//     reportes y sus revisiones, liberación, evaluación, carta) → boleta
//   oferta_servicio/deseo_de_carrera/solicitud_caracteristica → correo del profesor
//   coordinador, calendario, carrera, característica, recurso, contacto → 00-comun
//
// index.js toma la huella antes y después de sembrar y FALLA si alguna fila
// ajena que existía:
//   - cambió (cualquier columna), o
//   - desapareció.
// Filas ajenas NUEVAS: fallan también (mi seed no debe crear nada a nombre de
// Karen o de 00-comun), EXCEPTO en `notificacion`, donde los servicios reales
// avisan a coordinadores o profesores; esas solo se reportan como información.
//
// Las filas mías (ofertas, solicitudes, reportes, revisiones que hace un
// coordinador sobre MIS reportes, etc.) no entran: puedo crearlas y cambiarlas
// sin que la huella falle. inicio_sesion y token_contrasena no se miden
// (son bitácora de accesos).

const crypto = require('crypto');
const prisma = require('../../../lib/prisma');
const { esCorreoMio, esBoletaMia } = require('./_datos');

// Tablas donde una fila ajena nueva solo se informa.
const NUEVAS_PERMITIDAS = new Set(['notificacion']);

function serializar(valor) {
  return JSON.stringify(valor, (_k, v) => {
    if (typeof v === 'bigint') return v.toString();
    if (v && typeof v === 'object' && v.constructor?.name === 'Decimal') return v.toString();
    return v;
  });
}

function hashFila(fila) {
  return crypto.createHash('sha256').update(serializar(fila)).digest('hex').slice(0, 16);
}

function aMapa(filas, clave = (f) => f.id) {
  const m = new Map();
  for (const f of filas) m.set(String(clave(f)), hashFila(f));
  return m;
}

const todas = (modelo, orderBy = { id: 'asc' }) => prisma[modelo].findMany({ orderBy });

async function tomarHuella() {
  // ── Dueños ajenos, por correo y boleta ──
  const usuarios = (await todas('usuario')).filter((u) => !esCorreoMio(u.correo_institucional));
  const idsUsuarios = new Set(usuarios.map((u) => u.id));

  const profesores = (await todas('profesor')).filter((p) => idsUsuarios.has(p.usuario_id));
  const idsProfesores = new Set(profesores.map((p) => p.id));

  const alumnos = (await todas('alumno', { boleta: 'asc' })).filter((a) => !esBoletaMia(a.boleta));
  const boletas = new Set(alumnos.map((a) => a.boleta));

  const solicitudes = (await todas('solicitud_registro')).filter((s) => boletas.has(s.alumno_id));
  const idsSol = new Set(solicitudes.map((s) => s.id));
  const deSol = (filas) => filas.filter((f) => idsSol.has(f.solicitud_registro_id));

  const ofertas = (await todas('oferta_servicio')).filter((o) => idsProfesores.has(o.profesor_id));
  const idsOfertas = new Set(ofertas.map((o) => o.id));

  const reportesM = deSol(await todas('reporte_mensual'));
  const reportesG = deSol(await todas('reporte_global'));
  const idsRM = new Set(reportesM.map((r) => r.id));
  const idsRG = new Set(reportesG.map((r) => r.id));

  const bitacoras = deSol(await todas('bitacora'));
  const idsBit = new Set(bitacoras.map((b) => b.id));

  const liberaciones = deSol(await todas('liberacion_proceso'));
  const idsLib = new Set(liberaciones.map((l) => l.id));
  const evaluaciones = (await todas('evaluacion_desempeno')).filter((e) => idsLib.has(e.liberacion_proceso_id));
  const idsEval = new Set(evaluaciones.map((e) => e.id));

  // documento: por boleta del alumno; si no tiene alumno, por su creador.
  const documentos = (await todas('documento')).filter((d) => (d.alumno_id ? boletas.has(d.alumno_id) : idsUsuarios.has(d.creador_id)));

  const tablas = {
    usuario: usuarios,
    profesor: profesores,
    alumno: [alumnos, (a) => a.boleta],
    solicitud_registro: solicitudes,
    oferta_servicio: ofertas,
    deseo_de_carrera: (await todas('deseo_de_carrera')).filter((d) => idsOfertas.has(d.oferta_id)),
    solicitud_caracteristica: (await todas('solicitud_caracteristica')).filter((s) => idsProfesores.has(s.profesor_id)),
    documento: documentos,
    cumulo_horas_y_faltas: (await todas('cumulo_horas_y_faltas')).filter((c) => boletas.has(c.alumno_id)),
    actividad: deSol(await todas('actividad')),
    bitacora: bitacoras,
    registro_bitacora_actividades: (await todas('registro_bitacora_actividades')).filter((r) => idsBit.has(r.bitacora_id)),
    reporte_mensual: reportesM,
    reporte_global: reportesG,
    revision_reporte_mensual: (await todas('revision_reporte_mensual')).filter((r) => idsRM.has(r.reporte_mensual_id)),
    revision_reporte_global: (await todas('revision_reporte_global')).filter((r) => idsRG.has(r.reporte_global_id)),
    liberacion_proceso: liberaciones,
    evaluacion_desempeno: evaluaciones,
    revision_desempeno: (await todas('revision_desempeno')).filter((r) => idsEval.has(r.evaluacion_desempeno_id)),
    carta_termino: (await todas('carta_termino')).filter((c) => idsLib.has(c.liberacion_proceso_id)),
    solicitud_baja: (await todas('solicitud_baja')).filter((b) => boletas.has(b.alumno_id)),
    anuncio: (await todas('anuncio')).filter((a) => idsUsuarios.has(a.usuario_id)),
    registro_anuncio_visto: (await todas('registro_anuncio_visto')).filter((r) => boletas.has(r.alumno_id)),
    notificacion: (await todas('notificacion')).filter((n) => idsUsuarios.has(n.usuario_id)),
    // 00-comun (no tienen dueño mío posible)
    coordinador: await todas('coordinador'),
    carrera: await todas('carrera'),
    caracteristica: await todas('caracteristica'),
    evento_calendario: await todas('evento_calendario'),
    periodo_registro: await todas('periodo_registro'),
    recurso: await todas('recurso'),
    contacto_institucional: await todas('contacto_institucional'),
  };

  const huella = {};
  for (const [nombre, def] of Object.entries(tablas)) {
    huella[nombre] = Array.isArray(def) && typeof def[1] === 'function' ? aMapa(def[0], def[1]) : aMapa(def);
  }
  return huella;
}

/**
 * @returns {{ errores: string[], info: string[] }}
 *   errores: filas ajenas modificadas, borradas o creadas (fuera de NUEVAS_PERMITIDAS)
 *   info:    filas ajenas nuevas en NUEVAS_PERMITIDAS (p. ej. notificaciones)
 */
function compararHuellas(antes, despues) {
  const errores = [];
  const info = [];
  for (const tabla of Object.keys(antes)) {
    const a = antes[tabla];
    const d = despues[tabla] ?? new Map();
    const modificadas = [];
    const borradas = [];
    for (const [k, h] of a) {
      if (!d.has(k)) borradas.push(k);
      else if (d.get(k) !== h) modificadas.push(k);
    }
    const nuevas = [...d.keys()].filter((k) => !a.has(k));
    const lista = (xs) => `${xs.slice(0, 10).join(', ')}${xs.length > 10 ? '…' : ''}`;
    if (modificadas.length) errores.push(`${tabla}: ${modificadas.length} fila(s) ajena(s) modificada(s) [${lista(modificadas)}]`);
    if (borradas.length) errores.push(`${tabla}: ${borradas.length} fila(s) ajena(s) borrada(s) [${lista(borradas)}]`);
    if (nuevas.length) {
      const msg = `${tabla}: ${nuevas.length} fila(s) nueva(s) a nombre de Karen/00-comun [${lista(nuevas)}]`;
      (NUEVAS_PERMITIDAS.has(tabla) ? info : errores).push(msg);
    }
  }
  return { errores, info };
}

function totalFilas(huella) {
  return Object.values(huella).reduce((s, m) => s + m.size, 0);
}

module.exports = { tomarHuella, compararHuellas, totalFilas };
