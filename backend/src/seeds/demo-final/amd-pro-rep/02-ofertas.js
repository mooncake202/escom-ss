// 02-ofertas.js — amd-pro-rep · PRO
//
// Siembra las 11 ofertas de _datos.js (OFERTAS) con los servicios REALES:
//   CU-PRO-01 crear     → ofertas.controller.solicitarRegistroOferta (la creación
//                         solo existe en el controlador; se llama con req/res simulados)
//   CU-PRO-02 decidir   → ofertas.service.decidirOferta (aprobar con Programa/
//                         Actividad SISS del catálogo, o rechazar con motivo)
//   CU-PRO-04 cerrar    → ofertas.service.cerrarOfertaManual
//   concluida           → UPDATE directo: no hay forma real sin un alumno liberado
//                         por LSS (decisión de Sol: S6 sin alumnos). Se crea además
//                         la misma notificación que crearía el cron, ya leída.
//
// Fechas (solo en mis filas): los servicios escriben "ahora", así que después se
// ajustan a la cadena registro < decisión < cierre/conclusión < REF:
//   oferta.fecha_registro                     ← registro
//   notificación de la decisión (al profesor) ← decisión (fecha_creacion) y lectura
//   notificación de conclusión (S6)           ← conclusión
// cerrarOfertaManual no guarda fecha ni notificación: no hay nada que ajustar.
//
// Notificaciones de profesor: todas leídas salvo la del rechazo de S4.
// Idempotente: cada oferta se busca por profesor + título y se avanza desde el
// estado en que esté hasta su estado final; las fechas se reajustan siempre.

const prisma = require('../../../lib/prisma');
const ofertasController = require('../../../modules/ofertas/ofertas.controller');
const ofertasService = require('../../../modules/ofertas/ofertas.service');
const { crearNotificacion } = require('../../../modules/notificaciones/notificaciones.service');
const { PROFESORES, OFERTAS, FECHA_CREACION_PROFESORES } = require('./_datos');
const { REF, buscarPeriodoOficial, diaHabil, enHoraMexico } = require('./_helpers');

const HORA = { registro: '10:30', decision: '12:15', lectura: '09:40', conclusion: '00:05', lecturaConclusion: '09:30' };

const rutaDeOferta = (ofertaId) => `/profesor/proyectos?destacar=${ofertaId}`;
const mensajeConclusion = (titulo) => `Tu oferta "${titulo}" ha concluido: todos los alumnos terminaron su servicio social.`;

/**
 * Fechas de la cadena de una oferta (objetos Date, hora de México).
 * P2: fijas en _datos.js. P1/P3: derivadas del periodo oficial de sus alumnos
 * (registro 15 días hábiles antes de fecha_max_expediente, decisión 2 después).
 */
async function calcularFechasOferta(o) {
  let registro = o.registro;
  let decision = o.decision ?? null;
  let periodo = null;
  if (o.periodoInicio) {
    periodo = await buscarPeriodoOficial(o.periodoInicio);
    registro = await diaHabil(periodo.maxExpediente, -15);
    decision = await diaHabil(registro, 2);
  }
  const f = {
    registro: enHoraMexico(registro, HORA.registro),
    decision: decision ? enHoraMexico(decision, HORA.decision) : null,
    lecturaDecision: decision && o.estadoFinal !== 'rechazada' ? enHoraMexico(await diaHabil(decision, 1), HORA.lectura) : null,
    cierre: o.cierre ? enHoraMexico(o.cierre, '13:00') : null,
    conclusion: o.conclusion ? enHoraMexico(o.conclusion, HORA.conclusion) : null,
    lecturaConclusion: o.conclusion ? enHoraMexico(o.conclusion, HORA.lecturaConclusion) : null,
    periodo,
  };
  return f;
}

/** Valida registro < decisión < lectura/cierre/conclusión < REF (y decisión < expediente en P1/P3). */
function validarCadena(o, f) {
  const alta = new Date(FECHA_CREACION_PROFESORES);
  const cadena = [['alta del profesor', alta], ['registro', f.registro], ['decisión', f.decision],
    ['lectura de la decisión', f.lecturaDecision], ['cierre', f.cierre], ['conclusión', f.conclusion],
    ['lectura de la conclusión', f.lecturaConclusion]].filter(([, d]) => d);
  for (let i = 1; i < cadena.length; i += 1) {
    if (!(cadena[i - 1][1] < cadena[i][1])) {
      throw new Error(`${o.clave}: ${cadena[i - 1][0]} (${cadena[i - 1][1].toISOString()}) no es anterior a ${cadena[i][0]} (${cadena[i][1].toISOString()})`);
    }
  }
  const ultima = cadena[cadena.length - 1];
  if (!(ultima[1] < REF)) throw new Error(`${o.clave}: ${ultima[0]} queda en el futuro (${ultima[1].toISOString()})`);
  if (f.periodo && f.decision >= enHoraMexico(f.periodo.maxExpediente, '00:00')) {
    throw new Error(`${o.clave}: la aprobación debe ser anterior a la fecha límite de expediente ${f.periodo.maxExpediente}`);
  }
}

/** CU-PRO-01 real: el controlador con req/res simulados. */
async function crearOfertaReal(profesorUsuarioId, o) {
  const req = {
    usuario: { sub: profesorUsuarioId, rol: 'profesor' },
    body: {
      nombre_proyecto: o.titulo,
      descripcion_actividades: o.descripcion,
      tipo_oferta: o.tipo,
      cupos_ofertados: o.tipo === 'proyecto' ? o.cupos : null,
      carreras: o.carreras,
    },
  };
  const res = {
    codigo: null, cuerpo: null,
    status(c) { this.codigo = c; return this; },
    json(b) { this.cuerpo = b; return this; },
  };
  await ofertasController.solicitarRegistroOferta(req, res);
  if (res.codigo !== 201) throw new Error(`${o.clave}: CU-PRO-01 respondió ${res.codigo}: ${res.cuerpo?.message}`);
  return res.cuerpo.oferta;
}

async function coordinadorPorCorreo(correo) {
  const u = await prisma.usuario.findUnique({ where: { correo_institucional: correo }, include: { coordinador: true } });
  if (!u?.coordinador) throw new Error(`No existe el coordinador ${correo} (00-comun).`);
  return u.coordinador.id;
}

async function notificacionDeDecision(profesorUsuarioId, oferta) {
  const verbo = oferta.estado_oferta === 'rechazada' ? 'fue rechazada' : 'fue aprobada';
  return prisma.notificacion.findFirst({
    where: { usuario_id: profesorUsuarioId, ruta_relacionada: rutaDeOferta(oferta.id), mensaje: { contains: verbo } },
    orderBy: { id: 'asc' },
  });
}

async function sembrarOferta(o) {
  const datosProfesor = PROFESORES[o.profesor];
  const usuario = await prisma.usuario.findUnique({ where: { correo_institucional: datosProfesor.correo }, include: { profesor: true } });
  if (!usuario?.profesor) throw new Error(`${o.clave}: no existe ${datosProfesor.correo}; corre primero 01-profesores.`);
  const profesorId = usuario.profesor.id;

  const f = await calcularFechasOferta(o);
  validarCadena(o, f);

  let oferta = await prisma.oferta_servicio.findFirst({ where: { profesor_id: profesorId, nombre_proyecto: o.titulo } });
  let creada = false;
  if (!oferta) {
    oferta = await crearOfertaReal(usuario.id, o);
    creada = true;
  }

  // Avanza hacia el estado final.
  if (oferta.estado_oferta === 'pendiente_revision' && o.estadoFinal !== 'pendiente_revision') {
    const coordinadorId = await coordinadorPorCorreo(o.revisor);
    if (o.estadoFinal === 'rechazada') {
      await ofertasService.decidirOferta(oferta.id, 'rechazar', o.motivoRechazo, null, coordinadorId);
    } else {
      await ofertasService.decidirOferta(oferta.id, 'aprobar', null, { programaSISS: o.programa, actividadSISS: o.actividad }, coordinadorId);
    }
    oferta = await prisma.oferta_servicio.findUnique({ where: { id: oferta.id } });
  }
  if (oferta.estado_oferta === 'aprobada' && o.estadoFinal === 'cerrada') {
    await ofertasService.cerrarOfertaManual(oferta.id, profesorId);
  }
  if (oferta.estado_oferta === 'aprobada' && o.estadoFinal === 'concluida') {
    await prisma.oferta_servicio.updateMany({
      where: { id: oferta.id, estado_oferta: 'aprobada' },
      data: { estado_oferta: 'concluida', cupos_disponibles: 0 },
    });
    await ofertasService.invalidarCacheOfertas();
  }
  oferta = await prisma.oferta_servicio.findUnique({ where: { id: oferta.id } });
  if (oferta.estado_oferta !== o.estadoFinal) {
    throw new Error(`${o.clave}: quedó en ${oferta.estado_oferta} y se esperaba ${o.estadoFinal}.`);
  }

  // Fechas de la cadena (solo mis filas).
  await prisma.oferta_servicio.update({ where: { id: oferta.id }, data: { fecha_registro: f.registro } });

  if (f.decision) {
    const n = await notificacionDeDecision(usuario.id, oferta);
    if (!n) throw new Error(`${o.clave}: no se encontró la notificación de la decisión.`);
    await prisma.notificacion.update({
      where: { id: n.id },
      data: {
        fecha_creacion: f.decision,
        leida: Boolean(f.lecturaDecision),
        fecha_leida: f.lecturaDecision,
      },
    });
  }

  if (o.estadoFinal === 'concluida') {
    let n = await prisma.notificacion.findFirst({
      where: { usuario_id: usuario.id, ruta_relacionada: rutaDeOferta(oferta.id), mensaje: mensajeConclusion(o.titulo) },
    });
    if (!n) {
      n = await crearNotificacion({ usuarioId: usuario.id, tipo: 'success', mensaje: mensajeConclusion(o.titulo), rutaRelacionada: rutaDeOferta(oferta.id) });
    }
    await prisma.notificacion.update({
      where: { id: n.id },
      data: { fecha_creacion: f.conclusion, leida: true, fecha_leida: f.lecturaConclusion },
    });
  }

  const fechaTxt = f.registro.toISOString().slice(0, 10);
  console.log(`  ${creada ? '✅' : '↷'} ${o.clave} ${o.titulo} · ${o.estadoFinal} · registro ${fechaTxt}${f.periodo ? ` · periodo ${f.periodo.inicio}` : ''} (id ${oferta.id})`);
  return { ofertaId: oferta.id, creada };
}

async function main() {
  const resultado = {};
  for (const o of OFERTAS) {
    resultado[o.clave] = await sembrarOferta(o);
  }
  return resultado;
}

module.exports = { main, calcularFechasOferta, rutaDeOferta, mensajeConclusion };
