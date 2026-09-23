// CU-ADM-09 (el profesor solicita la baja de un alumno), CU-ADM-11 (el alumno solicita la suya) y
// CU-ADM-12 (Coordinación resuelve ambas). Son un solo flujo con dos puertas de entrada.
//
// ORIGEN DERIVADO: no hay columna de tipo. Si `solicitante_id` es el usuario del propio alumno la
// solicitud viene de ADM-11; si no, de ADM-09. El expediente se detecta con `documento_id`.
//
// UNA BAJA APROBADA BORRA AL ALUMNO. Es una decisión deliberada: se elimina `usuario` y el CASCADE
// del schema arrastra alumno, solicitud_registro, bitácoras, actividades, reportes, revisiones
// (incluidas las firmas del profesor y de Coordinación), documentos, acumulados y LSS. Así el
// alumno puede volver a registrarse desde cero con la misma boleta y el mismo correo: son tres
// índices únicos (solicitud_registro.alumno_id, alumno.boleta, usuario.correo_institucional) y
// solo borrando `usuario` caen los tres. Por eso esta misma fila de solicitud_baja también
// desaparece: las únicas que permanecen son las RECHAZADAS.
//
// CUPOS: una baja aprobada devuelve exactamente 1 lugar a la oferta con `liberarLugarOferta` de GR,
// y SOLO si la oferta sigue en 'aprobada' (el único estado que puede recibir alumnos). El cupo
// GLOBAL no se libera: se deja de contar solo, porque `contarCuposOcupados` filtra por estados y la
// solicitud_registro desaparece. `profesor.cupos_totales` NO se toca nunca.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { contarCuposOcupados, bloquearProfesor } = require('../../../lib/cupos');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../gr/gr.shared');
const { liberarLugarOferta } = require('../../gr/gr.service');
const { cifrarBuffer, descifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const { crearNotificacion } = require('../../notificaciones/notificaciones.service');
const { enviarCorreoBajaAprobada } = require('../../../lib/mailer');
const { emitirAUsuario } = require('../../../sockets/socket.server');

// Misma carpeta base que GR y Reportes: uploads/documentos/<boleta>/
const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../uploads/documentos');

const ESTADO_PENDIENTE = 'pendiente';
const ESTADO_APROBADA = 'aprobada';
const ESTADO_RECHAZADA = 'rechazada';

const TIPO_DOCUMENTO_BAJA = 'expediente_baja';
const DOC_EN_REVISION = 'en_revision';
const DOC_APROBADA = 'aprobada';
const DOC_RECHAZADA = 'rechazada';

// Único estado de oferta que puede recibir alumnos (gr.service.js y ofertas.service.js).
const ESTADO_OFERTA_RECEPTORA = 'aprobada';

const RUTA_BANDEJA_COORDINACION = '/coordinacion/gestionar-bajas';
const RUTA_PROFESOR = '/profesor/solicitar-baja-alumno';
const RUTA_ALUMNO = '/alumno/solicitar-baja';

const BOLETA_VALIDA = /^[A-Za-z0-9]{10}$/;

function crearError(mensaje, status = 400, code, datos) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  if (datos) err.datos = datos;
  return err;
}

const nombreCompleto = (usuario) => `${usuario.nombre} ${usuario.apellidos}`.trim();
const limpiar = (texto) => (typeof texto === 'string' ? texto.trim() : '');

async function perfilProfesor(usuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId }, include: { usuario: true } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404, 'SIN_PERFIL_PROFESOR');
  return profesor;
}

async function perfilAlumno(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { usuario: true, solicitud_registro: { include: { oferta: true } } },
  });
  if (!alumno) throw crearError('No se encontró tu perfil de alumno.', 404, 'SIN_PERFIL_ALUMNO');
  return alumno;
}

async function bajaPendienteDe(boleta, tx = prisma) {
  return tx.solicitud_baja.findFirst({ where: { alumno_id: boleta, estado: ESTADO_PENDIENTE } });
}

// ── Vistas ──────────────────────────────────────────────────────────────────

const vistaSolicitud = (solicitud, alumnoUsuarioId) => ({
  id: solicitud.id,
  estado: solicitud.estado,
  motivo: solicitud.motivo,
  comentario: solicitud.comentario,
  fecha: solicitud.fecha,
  fechaRespuesta: solicitud.fecha_respuesta,
  // Sin columna de tipo: el origen sale de quién es el solicitante.
  origen: solicitud.solicitante_id === alumnoUsuarioId ? 'alumno' : 'profesor',
  tieneExpediente: solicitud.documento_id !== null,
  estadoExpediente: solicitud.documento?.estado_documento ?? null,
});

/**
 * Detalle para Coordinación. `enRevisionInstitucional` es solo para la etiqueta de la UI: una baja
 * de ADM-11 pendiente cuyo expediente sigue 'en_revision' está en manos de las autoridades del
 * Instituto (puede tardar ~3 meses). No es un estado de solicitud_baja, es una derivación.
 */
function detallarSolicitud(solicitud) {
  const alumnoUsuarioId = solicitud.alumno.usuario_id;
  const base = vistaSolicitud(solicitud, alumnoUsuarioId);
  const sr = solicitud.alumno.solicitud_registro;

  return {
    ...base,
    puedeResolverse: solicitud.estado === ESTADO_PENDIENTE,
    enRevisionInstitucional: base.origen === 'alumno'
      && solicitud.estado === ESTADO_PENDIENTE
      && solicitud.documento?.estado_documento === DOC_EN_REVISION,
    alumno: {
      boleta: solicitud.alumno.boleta,
      nombre: nombreCompleto(solicitud.alumno.usuario),
      correo: solicitud.alumno.usuario.correo_institucional,
      carrera: solicitud.alumno.carrera,
    },
    solicitante: {
      nombre: nombreCompleto(solicitud.solicitante),
      rol: solicitud.solicitante.rol,
    },
    servicio: sr
      ? {
          estadoSolicitud: sr.estado_solicitud,
          oferta: sr.oferta ? { id: sr.oferta.id, nombre: sr.oferta.nombre_proyecto, estado: sr.oferta.estado_oferta } : null,
          profesor: sr.oferta?.profesor ? nombreCompleto(sr.oferta.profesor.usuario) : null,
        }
      : null,
  };
}

const INCLUDE_COMPLETO = {
  documento: true,
  solicitante: true,
  alumno: {
    include: {
      usuario: true,
      solicitud_registro: { include: { oferta: { include: { profesor: { include: { usuario: true } } } } } },
    },
  },
};

// ── CU-ADM-09 · Profesor ────────────────────────────────────────────────────

/**
 * Alumnos que este profesor supervisa AHORA. Mismo filtro canónico que usa AH en todos sus
 * servicios: estado 'alumno_asignado' + oferta de este profesor. Las faltas viajan como APOYO a la
 * decisión; no son requisito y el alta de la solicitud ni siquiera las consulta.
 */
async function listarMisAlumnos({ usuarioId }) {
  const profesor = await perfilProfesor(usuarioId);

  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesor.id } },
    include: {
      alumno: { include: { usuario: true, cumulo_horas_y_faltas: true } },
      oferta: true,
    },
    orderBy: { id: 'asc' },
  });

  const boletas = solicitudes.map((s) => s.alumno_id);
  const pendientes = boletas.length
    ? await prisma.solicitud_baja.findMany({ where: { alumno_id: { in: boletas }, estado: ESTADO_PENDIENTE } })
    : [];
  const conBajaPendiente = new Set(pendientes.map((p) => p.alumno_id));

  return {
    alumnos: solicitudes.map((s) => {
      const c = s.alumno.cumulo_horas_y_faltas;
      return {
        boleta: s.alumno.boleta,
        nombre: nombreCompleto(s.alumno.usuario),
        correo: s.alumno.usuario.correo_institucional,
        carrera: s.alumno.carrera,
        oferta: s.oferta?.nombre_proyecto ?? null,
        horasNetas: Math.max(0, (c?.horas_acumuladas ?? 0) - (c?.horas_rechazadas ?? 0)),
        faltasAcumuladas: c?.faltas_acumuladas ?? 0,
        faltasConsecutivas: c?.faltas_consecutivas ?? 0,
        tieneBajaPendiente: conBajaPendiente.has(s.alumno.boleta),
      };
    }),
  };
}

// El alumno debe estar asignado a ESTE profesor. El profesor sale del token, nunca del cuerpo.
async function asegurarAlumnoDelProfesor(profesorId, boleta) {
  const solicitud = await prisma.solicitud_registro.findFirst({
    where: { alumno_id: boleta, estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesorId } },
    include: { alumno: { include: { usuario: true } } },
  });
  if (!solicitud) throw crearError('Ese alumno no está asignado a ti.', 404, 'ALUMNO_NO_ASIGNADO');
  return solicitud;
}

async function solicitarBajaProfesor({ usuarioId, alumnoBoleta, motivo }) {
  const motivoLimpio = limpiar(motivo);
  if (motivoLimpio === '') throw crearError('El motivo de la solicitud es obligatorio.', 400);

  const profesor = await perfilProfesor(usuarioId);
  const solicitud = await asegurarAlumnoDelProfesor(profesor.id, alumnoBoleta);

  if (await bajaPendienteDe(alumnoBoleta)) {
    throw crearError('Ese alumno ya tiene una solicitud de baja pendiente.', 409, 'BAJA_PENDIENTE_EXISTENTE');
  }

  // Sin expediente: la baja pedida por el profesor es una decisión administrativa, no documental.
  const creada = await prisma.solicitud_baja.create({
    data: {
      alumno_id: alumnoBoleta,
      solicitante_id: usuarioId,
      coordinador_id: null,
      documento_id: null,
      estado: ESTADO_PENDIENTE,
      motivo: motivoLimpio,
      fecha: new Date(),
      fecha_respuesta: null,
      comentario: null,
    },
  });

  await avisarACoordinacion(creada, {
    mensaje: `${nombreCompleto(profesor.usuario)} solicitó la baja de ${nombreCompleto(solicitud.alumno.usuario)} `
      + `(${alumnoBoleta}).`,
  });

  return vistaSolicitud(creada, solicitud.alumno.usuario_id);
}

/**
 * Amonestación: NO es una entidad. No hay tabla, ni historial, ni snapshot, y NO toca los contadores
 * de AH — el cron sigue siendo la única fuente de verdad de las faltas. Es exactamente un aviso
 * individual, así que se resuelve con una `notificacion` y nada más. El profesor decide libremente
 * cuántas oportunidades da antes de solicitar la baja: no hay regla automática.
 */
async function amonestarAlumno({ usuarioId, alumnoBoleta, observaciones }) {
  const texto = limpiar(observaciones);
  if (texto === '') throw crearError('Las observaciones de la amonestación son obligatorias.', 400);

  const profesor = await perfilProfesor(usuarioId);
  const solicitud = await asegurarAlumnoDelProfesor(profesor.id, alumnoBoleta);

  await crearNotificacion({
    usuarioId: solicitud.alumno.usuario_id,
    tipo: 'urgente',
    mensaje: `Amonestación de ${nombreCompleto(profesor.usuario)}: ${texto}`,
    rutaRelacionada: '/alumno/horas', // misma ruta que ya usa AH para las faltas
  });

  try {
    emitirAUsuario(solicitud.alumno.usuario_id, 'amonestacion:recibida', {});
  } catch (err) {
    console.error('Error al emitir amonestacion:recibida:', err.message);
  }

  return { amonestado: true };
}

// ── CU-ADM-11 · Alumno ──────────────────────────────────────────────────────

async function consultarMiSolicitud({ usuarioId }) {
  const alumno = await perfilAlumno(usuarioId);
  const solicitudes = await prisma.solicitud_baja.findMany({
    where: { alumno_id: alumno.boleta },
    include: { documento: true },
    orderBy: { id: 'desc' },
  });

  const pendiente = solicitudes.find((s) => s.estado === ESTADO_PENDIENTE) ?? null;

  return {
    alumno: { boleta: alumno.boleta, nombre: nombreCompleto(alumno.usuario) },
    solicitudPendiente: pendiente ? vistaSolicitud(pendiente, alumno.usuario_id) : null,
    historial: solicitudes.map((s) => vistaSolicitud(s, alumno.usuario_id)),
  };
}

/**
 * El expediente se guarda con el MISMO mecanismo de GR: multer en memoria (el PDF nunca toca el
 * disco en claro), cifrado AES-256-GCM, nombre aleatorio y ruta relativa en BD.
 *
 * El archivo se escribe ANTES de la transacción y se borra si esta falla — igual que
 * subirExpediente en gr.service.js.
 *
 * El oficio/resolución institucional NO se almacena aquí: ese trámite vive fuera del sistema.
 */
async function solicitarBajaAlumno({ usuarioId, motivo, archivoPdf }) {
  const motivoLimpio = limpiar(motivo);
  if (motivoLimpio === '') throw crearError('El motivo de la solicitud es obligatorio.', 400);
  if (!archivoPdf || !archivoPdf.buffer?.length) {
    throw crearError('El expediente en PDF es obligatorio.', 400, 'EXPEDIENTE_REQUERIDO');
  }

  const alumno = await perfilAlumno(usuarioId);

  if (await bajaPendienteDe(alumno.boleta)) {
    throw crearError('Ya tienes una solicitud de baja en curso.', 409, 'BAJA_PENDIENTE_EXISTENTE');
  }

  const carpeta = carpetaSeguraDeAlumno(alumno.boleta);
  fs.mkdirSync(carpeta, { recursive: true });
  const rutaRelativa = path.join(alumno.boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(archivoPdf.buffer));

  const ahora = new Date();
  let creada;
  try {
    creada = await prisma.$transaction(async (tx) => {
      const documento = await tx.documento.create({
        data: {
          alumno_id: alumno.boleta,
          creador_id: usuarioId,
          tipo_documento: TIPO_DOCUMENTO_BAJA,
          fecha_creacion: ahora,
          estado_documento: DOC_EN_REVISION,
          ruta_archivo: rutaRelativa,
        },
      });

      return tx.solicitud_baja.create({
        data: {
          alumno_id: alumno.boleta,
          solicitante_id: usuarioId,
          coordinador_id: null,
          documento_id: documento.id,
          estado: ESTADO_PENDIENTE,
          motivo: motivoLimpio,
          fecha: ahora,
          fecha_respuesta: null,
          comentario: null,
        },
        include: { documento: true },
      });
    });
  } catch (err) {
    // La fila no quedó: el archivo cifrado no debe sobrevivir.
    try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa)); } catch { /* ya no está */ }
    throw err;
  }

  await avisarACoordinacion(creada, {
    mensaje: `${nombreCompleto(alumno.usuario)} (${alumno.boleta}) solicitó su baja del servicio social `
      + 'y adjuntó su expediente.',
  });

  return vistaSolicitud(creada, alumno.usuario_id);
}

// ── CU-ADM-12 · Coordinación ────────────────────────────────────────────────

async function listarSolicitudes() {
  const [pendientesFilas, resueltasFilas] = await Promise.all([
    prisma.solicitud_baja.findMany({
      where: { estado: ESTADO_PENDIENTE },
      include: INCLUDE_COMPLETO,
      orderBy: { fecha: 'asc' },
    }),
    prisma.solicitud_baja.findMany({
      where: { estado: { in: [ESTADO_APROBADA, ESTADO_RECHAZADA] } },
      include: INCLUDE_COMPLETO,
      orderBy: { fecha_respuesta: 'desc' },
    }),
  ]);

  const pendientes = pendientesFilas.map(detallarSolicitud);
  const resueltas = resueltasFilas.map(detallarSolicitud);

  return { pendientes, resueltas, totales: { pendientes: pendientes.length, resueltas: resueltas.length } };
}

async function obtenerSolicitud({ solicitudId }) {
  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);
  return detallarSolicitud(solicitud);
}

/** Descifra el expediente para que Coordinación lo consulte. Mismo patrón que GR. */
async function obtenerExpediente({ solicitudId }) {
  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: { documento: true } });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);
  if (!solicitud.documento) throw crearError('Esta solicitud no tiene expediente adjunto.', 404, 'SIN_EXPEDIENTE');

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, solicitud.documento.ruta_archivo));
  } catch {
    throw crearError('El archivo ya no está disponible.', 404);
  }
  return { pdf: descifrarBuffer(bufferCifrado), boleta: solicitud.alumno_id };
}

/**
 * APROBACIÓN — elimina al alumno y su proceso completo.
 *
 * Todo lo que se necesite DESPUÉS del borrado (correo, notificaciones, ruta de archivos) se captura
 * ANTES: tras el DELETE no hay de dónde leerlo.
 *
 * Concurrencia, con las tres guardas:
 *  - `bloquearProfesor` (SELECT ... FOR UPDATE) como primera sentencia, igual que la aceptación de
 *    alumnos en GR: serializa contra ella y contra otra baja del mismo profesor.
 *  - CAS sobre solicitud_baja: solo la ejecución que la saca de 'pendiente' continúa. Dos
 *    coordinadores aprobando a la vez → uno gana, el otro recibe 409.
 *  - CAS sobre solicitud_registro: solo quien la saca de un estado que ocupaba lugar libera el cupo.
 *    Es el contrato que exige `liberarLugarOferta` y protege contra el borrado parcial de GR
 *    corriendo en paralelo sobre la misma solicitud.
 */
async function aprobarSolicitud({ solicitudId, coordinadorUsuarioId, comentario }) {
  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);
  if (solicitud.estado !== ESTADO_PENDIENTE) {
    throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const sr = solicitud.alumno.solicitud_registro;
  // Capturado ANTES del DELETE: después nada de esto existe.
  const cap = {
    boleta: solicitud.alumno.boleta,
    nombre: nombreCompleto(solicitud.alumno.usuario),
    correo: solicitud.alumno.usuario.correo_institucional,
    usuarioId: solicitud.alumno.usuario_id,
    motivo: solicitud.motivo,
    origen: solicitud.solicitante_id === solicitud.alumno.usuario_id ? 'alumno' : 'profesor',
    solicitanteUsuarioId: solicitud.solicitante_id,
    documentoId: solicitud.documento_id,
    solicitudRegistroId: sr?.id ?? null,
    ofertaId: sr?.oferta_id ?? null,
    estadoOferta: sr?.oferta?.estado_oferta ?? null,
    profesorId: sr?.oferta?.profesor_id ?? null,
    profesorUsuarioId: sr?.oferta?.profesor?.usuario_id ?? null,
    nombreOferta: sr?.oferta?.nombre_proyecto ?? null,
  };

  const comentarioLimpio = limpiar(comentario) || null;
  const ahora = new Date();

  const resultado = await prisma.$transaction(async (tx) => {
    if (cap.profesorId) await bloquearProfesor(cap.profesorId, tx);

    const claim = await tx.solicitud_baja.updateMany({
      where: { id: solicitudId, estado: ESTADO_PENDIENTE },
      data: {
        estado: ESTADO_APROBADA,
        fecha_respuesta: ahora,
        comentario: comentarioLimpio,
        coordinador_id: coordinador.id,
      },
    });
    if (claim.count === 0) throw crearError('Esta solicitud ya fue resuelta.', 409, 'SOLICITUD_YA_RESUELTA');

    // Resolución del expediente antes del borrado. La fila se elimina enseguida por CASCADE, así
    // que no deja rastro consultable: queda como parte del flujo, no como dato.
    if (cap.documentoId) {
      await tx.documento.update({ where: { id: cap.documentoId }, data: { estado_documento: DOC_APROBADA } });
    }

    // Solo quien saca la solicitud de un estado que ocupaba lugar puede devolverlo.
    let cupoLiberado = false;
    if (cap.solicitudRegistroId) {
      const tomado = await tx.solicitud_registro.updateMany({
        where: { id: cap.solicitudRegistroId, estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } },
        data: { estado_solicitud: 'baja_aprobada' }, // testigo del CAS; la fila se borra abajo
      });
      // Solo si la oferta sigue pudiendo recibir alumnos. Cerrada/concluida/rechazada: no se toca.
      if (tomado.count === 1 && cap.ofertaId && cap.estadoOferta === ESTADO_OFERTA_RECEPTORA) {
        cupoLiberado = await liberarLugarOferta(tx, cap.ofertaId);
      }
    }

    // Un solo DELETE: el CASCADE del schema elimina alumno, solicitud_registro, bitácoras,
    // actividades, reportes, revisiones, documentos, acumulados, LSS y esta misma solicitud_baja.
    await tx.usuario.delete({ where: { id: cap.usuarioId } });

    return { cupoLiberado };
  });

  // ── Fuera de la transacción: nada de esto puede revertir la baja ──
  const carpetaEliminada = eliminarCarpetaDelAlumno(cap.boleta);

  try {
    await enviarCorreoBajaAprobada({ to: cap.correo, nombre: cap.nombre });
  } catch (err) {
    console.error(`[bajas] No se pudo enviar el correo de baja a ${cap.correo}:`, err.message);
  }

  await avisarResolucionAprobada(cap);

  return {
    id: solicitudId,
    estado: ESTADO_APROBADA,
    boleta: cap.boleta,
    nombre: cap.nombre,
    cupoLiberado: resultado.cupoLiberado,
    carpetaEliminada,
  };
}

/**
 * RECHAZO — no borra nada. El alumno conserva su cuenta, su servicio y su cupo, y puede volver a
 * solicitar la baja más adelante (fila nueva; esta permanece como historial).
 */
async function rechazarSolicitud({ solicitudId, coordinadorUsuarioId, comentario }) {
  const comentarioLimpio = limpiar(comentario);
  if (comentarioLimpio === '') throw crearError('Debes capturar el motivo del rechazo.', 400);

  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    const claim = await tx.solicitud_baja.updateMany({
      where: { id: solicitudId, estado: ESTADO_PENDIENTE },
      data: {
        estado: ESTADO_RECHAZADA,
        fecha_respuesta: ahora,
        comentario: comentarioLimpio,
        coordinador_id: coordinador.id,
      },
    });
    if (claim.count === 0) throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');

    if (solicitud.documento_id) {
      await tx.documento.update({ where: { id: solicitud.documento_id }, data: { estado_documento: DOC_RECHAZADA } });
    }
  });

  const esDelAlumno = solicitud.solicitante_id === solicitud.alumno.usuario_id;
  await avisarAlSolicitante(solicitud, {
    tipo: 'urgente',
    mensaje: esDelAlumno
      ? `Tu solicitud de baja del servicio social fue rechazada. Motivo: ${comentarioLimpio}`
      : `La baja que solicitaste de ${nombreCompleto(solicitud.alumno.usuario)} fue rechazada. `
        + `Motivo: ${comentarioLimpio}`,
    ruta: esDelAlumno ? RUTA_ALUMNO : RUTA_PROFESOR,
  });

  const actualizada = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: { documento: true } });
  return vistaSolicitud(actualizada, solicitud.alumno.usuario_id);
}

// ── Archivos ────────────────────────────────────────────────────────────────

/**
 * Ruta de la carpeta del alumno, validada en tres pasos antes de devolverla: formato de boleta,
 * resolución a ruta absoluta y confirmación de que sigue DENTRO de RUTA_BASE_DOCUMENTOS. Un borrado
 * recursivo construido con un dato variable merece esa comprobación aunque venga de la BD.
 */
function carpetaSeguraDeAlumno(boleta) {
  if (!BOLETA_VALIDA.test(boleta ?? '')) {
    throw crearError('Boleta con formato inválido.', 400, 'BOLETA_INVALIDA');
  }
  const destino = path.resolve(RUTA_BASE_DOCUMENTOS, boleta);
  if (destino !== path.join(RUTA_BASE_DOCUMENTOS, boleta) || !destino.startsWith(RUTA_BASE_DOCUMENTOS + path.sep)) {
    throw crearError('Ruta de expediente fuera de la carpeta permitida.', 400, 'RUTA_INVALIDA');
  }
  return destino;
}

/**
 * Borra uploads/documentos/<boleta>/ completa (Reportes, Rubrica y expedientes). Nunca toca las
 * carpetas de profesores ni la de Coordinación, que no cuelgan de <boleta>.
 * Idempotente (`force`) y siempre fuera de la transacción: un fallo aquí NO revierte la baja.
 */
function eliminarCarpetaDelAlumno(boleta) {
  try {
    const carpeta = carpetaSeguraDeAlumno(boleta);
    fs.rmSync(carpeta, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error(`[bajas] No se pudo eliminar la carpeta del alumno ${boleta}:`, err.message);
    return false;
  }
}

// ── Notificaciones ──────────────────────────────────────────────────────────
// Bandeja COMPARTIDA: se avisa a CADA coordinador, igual que reportes-revision y gr.service.
// Fail-open por destinatario; un fallo notificando nunca revierte lo ya escrito en BD.

async function avisarACoordinacion(solicitud, { mensaje }) {
  let coordinadores;
  try {
    coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
  } catch (err) {
    console.error('[bajas] No se pudo listar a los coordinadores:', err.message);
    return;
  }

  for (const { usuario_id: coordinadorId } of coordinadores) {
    try {
      await crearNotificacion({
        usuarioId: coordinadorId,
        tipo: 'info',
        mensaje,
        rutaRelacionada: `${RUTA_BANDEJA_COORDINACION}?destacar=${solicitud.id}`,
      });
      emitirAUsuario(coordinadorId, 'baja:solicitada', { solicitudId: solicitud.id });
    } catch (err) {
      console.error(`[bajas] Error al avisar al coordinador ${coordinadorId}:`, err.message);
    }
  }
}

async function avisarAlSolicitante(solicitud, { tipo, mensaje, ruta }) {
  try {
    await crearNotificacion({
      usuarioId: solicitud.solicitante_id,
      tipo,
      mensaje,
      rutaRelacionada: `${ruta}?destacar=${solicitud.id}`,
    });
    emitirAUsuario(solicitud.solicitante_id, 'baja:resuelta', { solicitudId: solicitud.id, estado: solicitud.estado });
  } catch (err) {
    console.error('[bajas] Error al notificar la resolución al solicitante:', err.message);
  }
}

/**
 * Tras aprobar, al alumno NO se le crea notificación: su usuario acaba de desaparecer y la fila se
 * borraría con él. Se le avisa por correo. Profesor y coordinadores sí reciben notificación, porque
 * sus filas no cuelgan del alumno y sobreviven.
 */
async function avisarResolucionAprobada(cap) {
  const mensaje = `La baja de ${cap.nombre} (${cap.boleta}) fue aprobada. Su proceso de servicio social `
    + 'fue eliminado del sistema.';

  const destinatarios = new Set();
  if (cap.profesorUsuarioId) destinatarios.add(cap.profesorUsuarioId);
  if (cap.origen === 'profesor' && cap.solicitanteUsuarioId) destinatarios.add(cap.solicitanteUsuarioId);

  try {
    const coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
    for (const c of coordinadores) destinatarios.add(c.usuario_id);
  } catch (err) {
    console.error('[bajas] No se pudo listar a los coordinadores para avisar la aprobación:', err.message);
  }

  for (const usuarioId of destinatarios) {
    try {
      await crearNotificacion({ usuarioId, tipo: 'info', mensaje, rutaRelacionada: RUTA_BANDEJA_COORDINACION });
      emitirAUsuario(usuarioId, 'baja:resuelta', { estado: ESTADO_APROBADA, boleta: cap.boleta });
    } catch (err) {
      console.error(`[bajas] Error al avisar la aprobación a ${usuarioId}:`, err.message);
    }
  }
}

module.exports = {
  listarMisAlumnos,
  solicitarBajaProfesor,
  amonestarAlumno,
  consultarMiSolicitud,
  solicitarBajaAlumno,
  listarSolicitudes,
  obtenerSolicitud,
  obtenerExpediente,
  aprobarSolicitud,
  rechazarSolicitud,
  ESTADO_PENDIENTE,
  ESTADO_APROBADA,
  ESTADO_RECHAZADA,
  TIPO_DOCUMENTO_BAJA,
  RUTA_BASE_DOCUMENTOS,
};
