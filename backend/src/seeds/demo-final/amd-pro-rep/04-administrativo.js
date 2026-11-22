// 04-administrativo.js — amd-pro-rep · ADM
//
//   9. Característica de P2 (Investigador, 3 → 4): pendiente y SÍ aprobable (contraste con P1).
//  11–13. Bajas de 2501, 2601 y 2701 (P3, oferta A1, periodo 3-nov), con los servicios reales de
//        bajas.service: solicitarBajaProfesor, solicitarBajaAlumno, completarExpedienteDeBaja,
//        marcarEnRevision, rechazarSolicitud y amonestarAlumno.
//  14. Anuncios de P1 y P3 (anuncios.service.publicar + marcarVisto). Ninguno de coordinación.
//  15. Carta compromiso firmada (ADM-14, carta-firmada.service.registrarCarta) de 2301, 2101 y 2201.
//
// Los servicios escriben "ahora": después de cada paso se ajustan, SOLO en mis filas, la fecha de la
// baja, su respuesta, el documento del expediente, el anuncio, la carta y las notificaciones que
// ese paso generó (identificadas por id: las creadas durante el paso).
//
// Notificaciones (decisión de Sol):
//   coordinadores → sin leer solo la baja de 2601 (más las características de P1 y P2)
//   alumnos y P3  → todo leído salvo la amonestación de 2501
//
// Idempotente: cada paso se salta si ya está hecho (por alumno + estado de su baja, por
// profesor + título del anuncio, por alumno + tipo de documento).

const prisma = require('../../../lib/prisma');
const H = require('./_helpers');
const {
  PROFESORES, OFERTAS, ALUMNOS, ALUMNOS_BAJAS, ANUNCIOS, CARTAS_FIRMADAS,
  SOLICITUD_CARACTERISTICA_P2, CORREO_COORDINADOR_CREADOR,
} = require('./_datos');
const rep = require('./03-reportes');
const bajas = require('../../../modules/administrativa/bajas/bajas.service');
const anuncios = require('../../../modules/administrativa/anuncios/anuncios.service');
const cartaFirmada = require('../../../modules/administrativa/documentos/carta-firmada.service');

const RUTA_AMONESTACION = '/alumno/horas';

// ── Notificaciones generadas por un paso ──────────────────────────────────

async function maxNotificacionId() {
  const r = await prisma.notificacion.aggregate({ _max: { id: true } });
  return r._max.id ?? 0;
}

/**
 * Ejecuta `fn` y fecha las notificaciones que creó con `fecha`. `sinLeer(n)` decide cuáles se
 * quedan sin leer; las demás se marcan leídas el siguiente día hábil a las 9:00 (o 2 h después
 * si eso cayera en el futuro).
 */
async function conNotificaciones(fecha, sinLeer, fn) {
  H.ahoraSeguro(fecha);
  const antes = await maxNotificacionId();
  const resultado = await fn();
  const nuevas = await prisma.notificacion.findMany({ where: { id: { gt: antes } } });
  for (const n of nuevas) {
    const pendiente = sinLeer(n);
    let leida = null;
    if (!pendiente) {
      leida = H.enHoraMexico(await H.diaHabil(fecha.toISOString().slice(0, 10), 1), '09:00');
      if (!(leida < H.REF)) leida = new Date(fecha.getTime() + 2 * 3600 * 1000);
    }
    await prisma.notificacion.update({
      where: { id: n.id },
      data: { fecha_creacion: fecha, leida: !pendiente, fecha_leida: leida },
    });
  }
  return resultado;
}

// ── Contexto ──────────────────────────────────────────────────────────────

async function usuarioPorCorreo(correo) {
  const u = await prisma.usuario.findUnique({ where: { correo_institucional: correo }, include: { profesor: true, coordinador: true } });
  if (!u) throw new Error(`No existe ${correo}.`);
  return u;
}

async function contexto() {
  const coord = await usuarioPorCorreo(CORREO_COORDINADOR_CREADOR);
  const coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
  return {
    coordinadorUsuarioId: coord.id,
    idsCoordinadores: new Set(coordinadores.map((c) => c.usuario_id)),
    p1: await usuarioPorCorreo(PROFESORES.P1.correo),
    p3: await usuarioPorCorreo(PROFESORES.P3.correo),
  };
}

// ── Bajas ─────────────────────────────────────────────────────────────────

async function sembrarAlumnoBaja(al, ctx) {
  const oferta = OFERTAS.find((o) => o.clave === al.oferta);
  const ofertaRow = await prisma.oferta_servicio.findFirst({ where: { profesor_id: ctx.p3.profesor.id, nombre_proyecto: oferta.titulo } });
  if (!ofertaRow) throw new Error(`No existe la oferta ${oferta.clave}; corre primero 02-ofertas.`);
  const periodo = await H.buscarPeriodoOficial(al.periodoInicio);
  const linea = await rep.lineaGR(oferta, periodo);

  const yaExistia = Boolean(await prisma.usuario.findUnique({ where: { correo_institucional: al.correoInst } }));
  const { usuarioId, solicitudId } = await rep.registrarYAsignar(al, ofertaRow.id, periodo, ctx.p3.id, ctx.coordinadorUsuarioId);
  await rep.ajustarFechasGR(al, usuarioId, solicitudId, linea);
  const ah = await rep.sembrarAH(al, solicitudId);

  for (const paso of al.baja.pasos) {
    await aplicarPaso(al, paso, usuarioId, ctx);
  }

  const baja = await prisma.solicitud_baja.findFirst({ where: { alumno_id: al.boleta }, orderBy: { id: 'desc' } });
  if (baja?.estado !== al.baja.estadoFinal) throw new Error(`${al.correoInst}: la baja quedó en ${baja?.estado} y se esperaba ${al.baja.estadoFinal}.`);
  console.log(`  ${yaExistia ? '↷' : '✅'} ${al.sufijo} ${al.correoInst} · ${ah.bitacoras} bitácoras, ${ah.horas} h · baja ${baja.estado}${baja.documento_id ? ' (con expediente)' : ''}`);
  return { usuarioId, creado: !yaExistia };
}

async function aplicarPaso(al, paso, alumnoUsuarioId, ctx) {
  const fecha = H.enHoraMexico(paso.fecha, paso.hora);
  const baja = await prisma.solicitud_baja.findFirst({ where: { alumno_id: al.boleta }, orderBy: { id: 'desc' } });
  // Coordinadores: solo la baja de 2601 queda sin leer. Alumno y P3: todo leído salvo la amonestación.
  const sinLeer = (n) => (ctx.idsCoordinadores.has(n.usuario_id) ? al.sufijo === '2601' : n.ruta_relacionada === RUTA_AMONESTACION);
  const pdf = { buffer: await H.pdfEjemplo('expediente_baja', alumnoUsuarioId), mimetype: 'application/pdf', originalname: `expediente_baja_${al.boleta}.pdf` };

  switch (paso.accion) {
    case 'profesor_solicita':
    case 'alumno_solicita': {
      if (baja) return;
      const creada = await conNotificaciones(fecha, sinLeer, () => (paso.accion === 'profesor_solicita'
        ? bajas.solicitarBajaProfesor({ usuarioId: ctx.p3.id, alumnoBoleta: al.boleta, motivo: paso.motivo })
        : bajas.solicitarBajaAlumno({ usuarioId: alumnoUsuarioId, motivo: paso.motivo, archivoPdf: pdf })));
      const fila = await prisma.solicitud_baja.findFirst({ where: { alumno_id: al.boleta }, orderBy: { id: 'desc' } });
      await prisma.solicitud_baja.update({ where: { id: fila.id }, data: { fecha } });
      if (fila.documento_id) await prisma.documento.update({ where: { id: fila.documento_id }, data: { fecha_creacion: fecha } });
      return creada;
    }
    case 'alumno_adjunta': {
      if (!baja || baja.documento_id || baja.estado !== 'pendiente') return;
      await conNotificaciones(fecha, sinLeer, () => bajas.completarExpedienteDeBaja({ usuarioId: alumnoUsuarioId, archivoPdf: pdf }));
      const fila = await prisma.solicitud_baja.findUnique({ where: { id: baja.id } });
      await prisma.documento.update({ where: { id: fila.documento_id }, data: { fecha_creacion: fecha } });
      return;
    }
    case 'coordinacion_turna': {
      if (!baja || baja.estado !== 'pendiente') return;
      await conNotificaciones(fecha, sinLeer, () => bajas.marcarEnRevision({ solicitudId: baja.id, coordinadorUsuarioId: ctx.coordinadorUsuarioId }));
      return;
    }
    case 'coordinacion_rechaza': {
      if (!baja || !['pendiente', 'en_revision'].includes(baja.estado)) return;
      await conNotificaciones(fecha, sinLeer, () => bajas.rechazarSolicitud({ solicitudId: baja.id, coordinadorUsuarioId: ctx.coordinadorUsuarioId, comentario: paso.comentario }));
      await prisma.solicitud_baja.update({ where: { id: baja.id }, data: { fecha_respuesta: fecha } });
      return;
    }
    case 'profesor_amonesta': {
      const ya = await prisma.notificacion.findFirst({ where: { usuario_id: alumnoUsuarioId, ruta_relacionada: RUTA_AMONESTACION, mensaje: { startsWith: 'Amonestación' } } });
      if (ya) return;
      await conNotificaciones(fecha, sinLeer, () => bajas.amonestarAlumno({ usuarioId: ctx.p3.id, alumnoBoleta: al.boleta, observaciones: paso.observaciones }));
      return;
    }
    default:
      throw new Error(`Paso de baja desconocido: ${paso.accion}`);
  }
}

// ── Anuncios ──────────────────────────────────────────────────────────────

async function sembrarAnuncios() {
  const todos = [...ALUMNOS, ...ALUMNOS_BAJAS];
  const resumen = [];
  for (const a of ANUNCIOS) {
    const prof = await usuarioPorCorreo(PROFESORES[a.profesor].correo);
    let anuncio = await prisma.anuncio.findFirst({ where: { usuario_id: prof.id, titulo: a.titulo } });
    const existia = Boolean(anuncio);
    if (!anuncio) {
      const r = await anuncios.publicar({ usuarioId: prof.id, rol: 'profesor', titulo: a.titulo, contenido: a.contenido });
      anuncio = await prisma.anuncio.findUnique({ where: { id: r.anuncio.id } });
    }
    const fecha = H.enHoraMexico(a.fecha, a.hora);
    H.ahoraSeguro(fecha);
    await prisma.anuncio.update({ where: { id: anuncio.id }, data: { fecha_publicacion: fecha } });

    for (const sufijo of a.vistoPor) {
      const al = todos.find((x) => x.sufijo === sufijo);
      const alumno = await prisma.alumno.findUnique({ where: { boleta: al.boleta } });
      const visto = await prisma.registro_anuncio_visto.findFirst({ where: { alumno_id: al.boleta, anuncio_id: anuncio.id } });
      if (!visto) await anuncios.marcarVisto({ usuarioId: alumno.usuario_id, anuncioId: anuncio.id });
    }
    resumen.push(`${existia ? '↷' : '✅'} anuncio ${a.profesor} "${a.titulo}" (${a.fecha}, visto por ${a.vistoPor.length})`);
  }
  return resumen;
}

// ── Carta compromiso firmada (ADM-14) ─────────────────────────────────────

async function sembrarCartasFirmadas(ctx) {
  const hechas = [];
  for (const { sufijo, fecha: dia, hora } of CARTAS_FIRMADAS) {
    const al = ALUMNOS.find((x) => x.sufijo === sufijo);
    const fecha = H.enHoraMexico(dia, hora);
    H.ahoraSeguro(fecha);
    if (!(await H.esHabil(dia))) throw new Error(`Carta firmada de ${sufijo}: ${dia} no es día hábil.`);
    let doc = await prisma.documento.findFirst({ where: { alumno_id: al.boleta, tipo_documento: cartaFirmada.TIPO_CARTA_FIRMADA } });
    const existia = Boolean(doc);
    if (!doc) {
      await cartaFirmada.registrarCarta({
        usuarioId: ctx.coordinadorUsuarioId,
        boleta: al.boleta,
        archivoPdf: { buffer: await H.pdfEjemplo('carta_compromiso_firmada', (await prisma.alumno.findUnique({ where: { boleta: al.boleta } })).usuario_id), mimetype: 'application/pdf', originalname: `carta_compromiso_${al.boleta}.pdf` },
      });
      doc = await prisma.documento.findFirst({ where: { alumno_id: al.boleta, tipo_documento: cartaFirmada.TIPO_CARTA_FIRMADA } });
    }
    await prisma.documento.update({ where: { id: doc.id }, data: { fecha_creacion: fecha } });
    hechas.push(`${existia ? '↷' : '✅'} carta compromiso firmada ${sufijo} (${fecha.toISOString().slice(0, 10)})`);
  }
  return hechas;
}

// ── Principal ─────────────────────────────────────────────────────────────

const crearSolicitudCaracteristicaP2 = () => rep.crearSolicitudCaracteristica(SOLICITUD_CARACTERISTICA_P2);

async function main() {
  const ctx = await contexto();

  await crearSolicitudCaracteristicaP2();

  const resultado = {};
  for (const al of ALUMNOS_BAJAS) {
    resultado[al.sufijo] = await sembrarAlumnoBaja(al, ctx);
  }

  const resAnuncios = await sembrarAnuncios();
  resAnuncios.forEach((r) => console.log(`  ${r}`));

  const cartas = await sembrarCartasFirmadas(ctx);
  cartas.forEach((c) => console.log(`  ${c}`));

  return resultado;
}

module.exports = { main };
