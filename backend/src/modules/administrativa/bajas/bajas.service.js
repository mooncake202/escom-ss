// CU-ADM-09 (el profesor solicita la baja de un alumno), CU-ADM-11 (el alumno solicita la suya) y
// CU-ADM-12 (Coordinación resuelve ambas). Son un solo flujo con dos puertas de entrada.
//
// ORIGEN DERIVADO: no hay columna de tipo. Si `solicitante_id` es el usuario del propio alumno la
// solicitud viene de ADM-11; si no, de ADM-09. El expediente se detecta con `documento_id`.
//
// UNA BAJA APROBADA **NO** BORRA AL ALUMNO. Cancela su servicio social actual y lo devuelve al
// flujo de Gestión de Registro para que pueda modificar su solicitud y postularse a otra oferta:
//
//   CONSERVA  usuario, alumno, la MISMA solicitud_registro, la solicitud_baja aprobada y el
//             documento `expediente_baja` que la sustenta (con su archivo en disco).
//   REVIERTE  usuario.rol -> 'alumno_sin_asignar' y solicitud_registro al estado de CU-GR-13,
//             'modificar_reenviar', para que entre DIRECTO a modificar su solicitud.
//   ELIMINA   solo el AVANCE del servicio abandonado: bitácoras, actividades, reportes, sus
//             revisiones, el proceso de liberación y los documentos del expediente.
//   REINICIA  cumulo_horas_y_faltas a cero.
//
// No se inventa ningún estado nuevo ni se simula un rechazo: 'modificar_reenviar' ya existe y está en
// ESTADOS_SIN_RELOJ, fuera de ESTADOS_CON_CUPO_CONSUMIDO y de ESTADOS_QUE_OCUPAN_CUPO_PROFESOR, y el
// frontend lo enruta directo a la pantalla de CU-GR-13. `periodo_registro_id = null` además deja la
// solicitud fuera del alcance de los relojes de vencimiento (verificarYAplicarVencimiento sale
// temprano sin periodo), igual que ya hacen GR-07 y GR-13.
//
// CUPOS: una baja aprobada devuelve exactamente 1 lugar a la oferta con `liberarLugarOferta` de GR,
// y SOLO si la oferta sigue en 'aprobada' (el único estado que puede recibir alumnos). El cupo del
// PROFESOR se libera solo, sin tocar nada: 'modificar_reenviar' no está en
// ESTADOS_QUE_OCUPAN_CUPO_PROFESOR y `contarCuposOcupados` filtra por estado.
// `profesor.cupos_totales` NO se toca nunca.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { contarCuposOcupados, bloquearProfesor } = require('../../../lib/cupos');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../gr/gr.shared');
const { liberarLugarOferta } = require('../../gr/gr.service');
const { cifrarBuffer, descifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const { crearNotificacion } = require('../../notificaciones/notificaciones.service');
const { emitirAUsuario } = require('../../../sockets/socket.server');

// Misma carpeta base que GR y Reportes: uploads/documentos/<boleta>/
const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../uploads/documentos');

// Estados y máquina de estados: viven en bajas.resumen.js, que solo depende de prisma. Así el
// dashboard puede consultarlos sin arrastrar gr.service.js (y con él, JWT_SECRET).
const {
  ESTADO_PENDIENTE, ESTADO_EN_REVISION, ESTADO_APROBADA, ESTADO_RECHAZADA,
  ESTADOS_ACTIVOS, ES_RESUELTA, ORIGEN_VALIDO, ETAPAS_BAJA, etapaDeBaja,
  resumenBajaDelAlumno, resumenBajasDelProfesor, resumenBajasDeCoordinacion,
} = require('./bajas.resumen');

const TIPO_DOCUMENTO_BAJA = 'expediente_baja';
const DOC_EN_REVISION = 'en_revision';
const DOC_APROBADA = 'aprobada';
const DOC_RECHAZADA = 'rechazada';

// Único estado de oferta que puede recibir alumnos (gr.service.js y ofertas.service.js).
const ESTADO_OFERTA_RECEPTORA = 'aprobada';

// Estado de retorno al flujo de GR. Es el estado REAL de CU-GR-13: el que exigen
// `obtenerInfoModificarSolicitud` y `reenviarSolicitudModificada` para que el alumno pueda modificar
// sus datos y postularse a otra oferta.
//
// NO se pasa por 'rechazada_definitivamente': ese es solo la puerta de entrada del botón "Modificar
// solicitud y reenviar", y usarlo hacía que una baja se mostrara como un rechazo del proceso de
// registro. Una baja NO es un rechazo, así que `tipo_rechazo` y `motivo_rechazo` quedan en null: el
// motivo y el comentario viven donde corresponde, en `solicitud_baja`.
const ESTADO_RETORNO_GR = 'modificar_reenviar';
const ROL_ALUMNO_SIN_ASIGNAR = 'alumno_sin_asignar';

// Subcarpetas de <boleta>/ que pertenecen al servicio que se cancela. El PDF del `expediente_baja`
// se guarda en la RAÍZ de <boleta>/ (ver solicitarBajaAlumno), así que ninguna de estas lo alcanza.
const SUBCARPETAS_DEL_SERVICIO = Object.freeze(['Reportes', 'Rubrica', 'CartaCompromisoFirmada']);

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

/**
 * Baja en curso de un alumno: la que impide abrir otra. Cubre 'pendiente' y 'en_revision', porque
 * una solicitud turnada a las autoridades sigue viva.
 */
async function bajaActivaDe(boleta, tx = prisma) {
  return tx.solicitud_baja.findFirst({ where: { alumno_id: boleta, estado: { in: ESTADOS_ACTIVOS } } });
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
  // Misma etapa que ven Coordinación y el profesor: la pantalla del alumno no vuelve a deducirla.
  etapa: etapaDeBaja(solicitud),
  tieneExpediente: solicitud.documento_id !== null,
  estadoExpediente: solicitud.documento?.estado_documento ?? null,
  // El alumno debe completar el expediente de una baja que pidió su profesor. Es lo que habilita
  // ADM-11 a mostrarle el aviso y el formulario de carga en vez del de una solicitud nueva.
  requiereExpedienteDelAlumno: solicitud.estado === ESTADO_PENDIENTE
    && solicitud.documento_id === null
    && solicitud.solicitante_id !== alumnoUsuarioId,
});

/**
 * Detalle para Coordinación, con las acciones que su estado permite. La pantalla NO decide la
 * máquina de estados: solo dibuja los botones que estas banderas habilitan.
 *
 * `enRevisionInstitucional` ya no se deriva del estado del documento: ahora 'en_revision' es un
 * estado REAL de la solicitud, así que hay una sola fuente de verdad.
 */
function detallarSolicitud(solicitud) {
  const alumnoUsuarioId = solicitud.alumno.usuario_id;
  const base = vistaSolicitud(solicitud, alumnoUsuarioId);
  const sr = solicitud.alumno.solicitud_registro;

  return {
    ...base,
    puedeResolverse: ESTADOS_ACTIVOS.includes(solicitud.estado),
    enRevisionInstitucional: solicitud.estado === ESTADO_EN_REVISION,
    // Turnar a las autoridades exige expediente: sin PDF no hay nada que turnar.
    puedeEnviarARevision: solicitud.estado === ESTADO_PENDIENTE && solicitud.documento_id !== null,
    puedeAprobarse: solicitud.estado === ESTADO_EN_REVISION,
    puedeRechazarse: ESTADOS_ACTIVOS.includes(solicitud.estado),
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

/**
 * Seguimiento de una baja tal como lo ve el PROFESOR (CU-ADM-09). Solo lectura y solo lo necesario:
 *
 *   - `etapa` resume en qué punto está el trámite, sin que el profesor tenga que interpretar estados.
 *   - `motivo` viaja ÚNICAMENTE si la baja la pidió él: es su propio texto. Si la abrió el alumno,
 *     ese motivo es información suya y no se expone.
 *   - `comentario` de Coordinación solo aparece cuando ya hay resolución.
 *
 * No se expone el id del documento, ni rutas, ni el coordinador que la atendió.
 */
function vistaSeguimientoProfesor(solicitud, profesorUsuarioId) {
  if (!solicitud) return null;
  const laPidioEsteProfesor = solicitud.solicitante_id === profesorUsuarioId;

  return {
    id: solicitud.id,
    estado: solicitud.estado,
    etapa: etapaDeBaja(solicitud),
    origen: solicitud.solicitante_id === solicitud.alumno?.usuario_id ? 'alumno' : 'profesor',
    laSolicitasteTu: laPidioEsteProfesor,
    tieneExpediente: solicitud.documento_id !== null,
    fecha: solicitud.fecha,
    fechaRespuesta: solicitud.fecha_respuesta,
    // Su propio texto, no el de otro.
    motivo: laPidioEsteProfesor ? solicitud.motivo : null,
    comentario: ES_RESUELTA(solicitud.estado) ? solicitud.comentario : null,
  };
}

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
  // Se trae la baja ACTIVA de cada alumno para que el profesor pueda consultar su seguimiento en
  // SOLO LECTURA (CU-ADM-09). No se listan las resueltas: la lista es de alumnos asignados, y un
  // alumno con la baja aprobada ya no lo está.
  const activas = boletas.length
    ? await prisma.solicitud_baja.findMany({
        where: { alumno_id: { in: boletas }, estado: { in: ESTADOS_ACTIVOS } },
        include: { alumno: { select: { usuario_id: true } } },
        orderBy: { id: 'desc' },
      })
    : [];
  const bajaPorAlumno = new Map();
  for (const b of activas) if (!bajaPorAlumno.has(b.alumno_id)) bajaPorAlumno.set(b.alumno_id, b);

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
        tieneBajaPendiente: bajaPorAlumno.has(s.alumno.boleta),
        baja: vistaSeguimientoProfesor(bajaPorAlumno.get(s.alumno.boleta), usuarioId),
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

  if (await bajaActivaDe(alumnoBoleta)) {
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

  // El alumno tiene que enterarse: es él quien debe completar el expediente de esta solicitud.
  await avisarAlAlumno(solicitud.alumno.usuario_id, {
    tipo: 'urgente',
    mensaje: `${nombreCompleto(profesor.usuario)} solicitó tu baja del servicio social. `
      + 'Debes completar el expediente correspondiente.',
    evento: 'baja:solicitada_por_profesor',
    datos: { solicitudId: creada.id },
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

  // ACTIVA = 'pendiente' O 'en_revision'. Mirar solo 'pendiente' dejaba una baja ya turnada fuera de
  // `solicitudPendiente`, y ADM-11 volvía a ofrecer el formulario para solicitar OTRA baja.
  const activa = solicitudes.find((s) => ESTADOS_ACTIVOS.includes(s.estado)) ?? null;

  return {
    alumno: { boleta: alumno.boleta, nombre: nombreCompleto(alumno.usuario) },
    solicitudPendiente: activa ? vistaSolicitud(activa, alumno.usuario_id) : null,
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
/**
 * Escribe el PDF cifrado en uploads/documentos/<boleta>/ con nombre aleatorio y devuelve su ruta
 * relativa. El archivo se escribe ANTES de la transacción; quien la llama debe borrarlo si la
 * transacción falla, igual que subirExpediente en gr.service.js.
 *
 * Lo comparten las dos entradas del expediente: la solicitud del alumno (ADM-11) y la de un alumno
 * que completa la baja que pidió su profesor (ADM-09 → ADM-11).
 */
function escribirExpedienteCifrado(boleta, archivoPdf) {
  const carpeta = carpetaSeguraDeAlumno(boleta);
  fs.mkdirSync(carpeta, { recursive: true });
  const rutaRelativa = path.join(boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(archivoPdf.buffer));
  return rutaRelativa;
}

const borrarSiQuedoHuerfano = (rutaRelativa) => {
  try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa)); } catch { /* ya no está */ }
};

async function solicitarBajaAlumno({ usuarioId, motivo, archivoPdf }) {
  const motivoLimpio = limpiar(motivo);
  if (motivoLimpio === '') throw crearError('El motivo de la solicitud es obligatorio.', 400);
  if (!archivoPdf || !archivoPdf.buffer?.length) {
    throw crearError('El expediente en PDF es obligatorio.', 400, 'EXPEDIENTE_REQUERIDO');
  }

  const alumno = await perfilAlumno(usuarioId);

  const enCurso = await bajaActivaDe(alumno.boleta);
  if (enCurso) {
    // Si la pidió su profesor y todavía no tiene expediente, lo que toca es COMPLETARLA con
    // completarExpedienteDeBaja, no abrir una segunda solicitud.
    if (enCurso.estado === ESTADO_PENDIENTE && enCurso.documento_id === null
      && enCurso.solicitante_id !== usuarioId) {
      throw crearError(
        'Tu profesor ya solicitó tu baja. Adjunta el expediente de esa solicitud en lugar de crear una nueva.',
        409, 'COMPLETA_LA_BAJA_DEL_PROFESOR',
      );
    }
    throw crearError('Ya tienes una solicitud de baja en curso.', 409, 'BAJA_PENDIENTE_EXISTENTE');
  }

  const rutaRelativa = escribirExpedienteCifrado(alumno.boleta, archivoPdf);

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
    borrarSiQuedoHuerfano(rutaRelativa);
    throw err;
  }

  await avisarACoordinacion(creada, {
    mensaje: `${nombreCompleto(alumno.usuario)} (${alumno.boleta}) solicitó su baja del servicio social `
      + 'y adjuntó su expediente.',
  });

  return vistaSolicitud(creada, alumno.usuario_id);
}

/**
 * El alumno COMPLETA con su expediente la baja que solicitó su profesor (CU-ADM-09 → CU-ADM-11).
 *
 * NO crea una segunda solicitud_baja: adjunta el documento a la que ya existe, conservando su id, su
 * origen (`solicitante_id` del profesor), el motivo que él escribió y su fecha. Esa es la única forma
 * de que el expediente administrativo siga siendo trazable hasta el profesor que la pidió.
 *
 * La solicitud se deriva del TOKEN, nunca de un id del cliente: un alumno no puede nombrar la
 * solicitud de otro. Las guardas son las cuatro que definen el caso:
 *   - existe una baja suya en estado 'pendiente';
 *   - la pidió su profesor (no él mismo);
 *   - todavía no tiene expediente — un PDF ya asociado NO se sustituye por aquí;
 *   - el PDF cumple lo mismo que en ADM-11 (lo valida el controlador: 5 MB y application/pdf).
 */
async function completarExpedienteDeBaja({ usuarioId, archivoPdf }) {
  if (!archivoPdf || !archivoPdf.buffer?.length) {
    throw crearError('El expediente en PDF es obligatorio.', 400, 'EXPEDIENTE_REQUERIDO');
  }

  const alumno = await perfilAlumno(usuarioId);
  const solicitud = await prisma.solicitud_baja.findFirst({
    where: { alumno_id: alumno.boleta, estado: ESTADO_PENDIENTE },
    orderBy: { id: 'desc' },
  });

  if (!solicitud) {
    throw crearError('No tienes una solicitud de baja pendiente que completar.', 404, 'SIN_BAJA_PENDIENTE');
  }
  if (solicitud.solicitante_id === alumno.usuario_id) {
    throw crearError('Esta solicitud la enviaste tú y ya incluye tu expediente.', 409, 'BAJA_PROPIA');
  }
  if (solicitud.documento_id !== null) {
    throw crearError('Esta solicitud ya tiene un expediente adjunto.', 409, 'EXPEDIENTE_YA_ADJUNTO');
  }

  const rutaRelativa = escribirExpedienteCifrado(alumno.boleta, archivoPdf);
  const ahora = new Date();

  let actualizada;
  try {
    actualizada = await prisma.$transaction(async (tx) => {
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

      // CAS: solo se adjunta si la solicitud SIGUE pendiente y sin expediente. Dos envíos
      // simultáneos no pueden dejar dos documentos asociados ni sustituir uno por otro.
      const { count } = await tx.solicitud_baja.updateMany({
        where: { id: solicitud.id, estado: ESTADO_PENDIENTE, documento_id: null },
        data: { documento_id: documento.id },
      });
      if (count === 0) throw crearError('Esta solicitud ya fue actualizada.', 409, 'EXPEDIENTE_YA_ADJUNTO');

      return tx.solicitud_baja.findUnique({ where: { id: solicitud.id }, include: { documento: true } });
    });
  } catch (err) {
    borrarSiQuedoHuerfano(rutaRelativa);
    throw err;
  }

  await avisarACoordinacion(solicitud, {
    mensaje: `${nombreCompleto(alumno.usuario)} (${alumno.boleta}) adjuntó el expediente de la baja `
      + 'que solicitó su profesor.',
  });

  return vistaSolicitud(actualizada, alumno.usuario_id);
}

// ── CU-ADM-12 · Coordinación ────────────────────────────────────────────────

async function listarSolicitudes() {
  // "Pendientes" = las dos activas: 'pendiente' y 'en_revision'. Una solicitud turnada a las
  // autoridades sigue en la bandeja de trabajo de Coordinación, no en el historial.
  const [pendientesFilas, resueltasFilas] = await Promise.all([
    prisma.solicitud_baja.findMany({
      where: { estado: { in: ESTADOS_ACTIVOS } },
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
 * pendiente → en_revision. Coordinación ya revisó el expediente a mano y lo turna a las autoridades
 * del Instituto; a partir de aquí la baja puede aprobarse.
 *
 * EXIGE expediente: sin `documento_id` no hay nada que turnar. No se valida el CONTENIDO del PDF —
 * eso es precisamente lo que Coordinación revisó de forma manual antes de pulsar el botón.
 *
 * Idempotencia: la transición es un CAS sobre 'pendiente'. Si otra petición ya la hizo, count=0 y
 * esta ejecución no vuelve a notificar al alumno.
 */
async function marcarEnRevision({ solicitudId, coordinadorUsuarioId }) {
  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);
  if (!ORIGEN_VALIDO[ESTADO_EN_REVISION].includes(solicitud.estado)) {
    throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }
  if (!solicitud.documento_id) {
    throw crearError(
      'Esta solicitud todavía no tiene expediente. El alumno debe adjuntar su expediente en PDF antes '
      + 'de turnarla a las autoridades.',
      409, 'EXPEDIENTE_REQUERIDO',
    );
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const { count } = await prisma.solicitud_baja.updateMany({
    where: { id: solicitudId, estado: ESTADO_PENDIENTE },
    data: { estado: ESTADO_EN_REVISION, coordinador_id: coordinador.id },
  });
  // Solo quien hizo la transición avisa: así una doble pulsación no duplica la notificación.
  if (count === 0) throw crearError('Esta solicitud ya fue resuelta.', 409, 'SOLICITUD_YA_RESUELTA');

  await avisarAlAlumno(solicitud.alumno.usuario_id, {
    tipo: 'info',
    mensaje: 'Tu solicitud de baja está en revisión por las autoridades correspondientes.',
    evento: 'baja:en_revision',
    datos: { solicitudId },
  });

  const actualizada = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  return detallarSolicitud(actualizada);
}

/**
 * Borra del avance del servicio SOLO lo que cuelga de esta solicitud_registro, en orden explícito de
 * dependencia. No se delega en el CASCADE del schema a propósito: `documento` y `reporte_*` tienen
 * cascada cruzada (reporte_*.documento_id), así que borrar documentos primero eliminaría reportes en
 * silencio. Con el orden escrito aquí, cada borrado es visible y comprobable.
 *
 * Solo se invoca DENTRO de la transacción, y solo cuando esta ejecución fue la que hizo la
 * transición de estado.
 */
async function eliminarAvanceDelServicio(tx, solicitudRegistroId) {
  // Reportes y sus firmas (revision_reporte_* guarda hash, IP y sello de tiempo del PDF que
  // desaparece: no tiene sentido conservar la firma de un documento que ya no existe).
  await tx.revision_reporte_mensual.deleteMany({ where: { reporte_mensual: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.revision_reporte_global.deleteMany({ where: { reporte_global: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.reporte_mensual.deleteMany({ where: { solicitud_registro_id: solicitudRegistroId } });
  await tx.reporte_global.deleteMany({ where: { solicitud_registro_id: solicitudRegistroId } });

  // Bitácoras y actividades. El enlace se borra por AMBOS lados: nada en el schema garantiza que una
  // bitácora y la actividad que registra pertenezcan a la misma solicitud.
  await tx.registro_bitacora_actividades.deleteMany({ where: { bitacora: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.registro_bitacora_actividades.deleteMany({ where: { actividad: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.bitacora.deleteMany({ where: { solicitud_registro_id: solicitudRegistroId } });
  await tx.actividad.deleteMany({ where: { solicitud_registro_id: solicitudRegistroId } });

  // Liberación del servicio social (LSS). Si el alumno ni la había iniciado, los cuatro deleteMany
  // no encuentran nada y no cuesta nada haberlos intentado.
  await tx.revision_desempeno.deleteMany({ where: { evaluacion_desempeno: { liberacion_proceso: { solicitud_registro_id: solicitudRegistroId } } } });
  await tx.evaluacion_desempeno.deleteMany({ where: { liberacion_proceso: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.carta_termino.deleteMany({ where: { liberacion_proceso: { solicitud_registro_id: solicitudRegistroId } } });
  await tx.liberacion_proceso.deleteMany({ where: { solicitud_registro_id: solicitudRegistroId } });
}

/**
 * en_revision → aprobada. ÚNICO punto donde se ejecuta la baja definitiva: cancela el servicio social
 * actual y devuelve al alumno al flujo de CU-GR-13. Ver la cabecera del archivo para el detalle de
 * qué se conserva, qué se revierte y qué se elimina.
 *
 * Todo lo que se necesite DESPUÉS de los borrados (notificaciones, rutas de archivos) se captura
 * ANTES: después ya no hay de dónde leerlo.
 *
 * Concurrencia, con las tres guardas:
 *  - `bloquearProfesor` (SELECT ... FOR UPDATE) como primera sentencia, igual que la aceptación de
 *    alumnos en GR: serializa contra ella y contra otra baja del mismo profesor.
 *  - CAS sobre solicitud_baja: solo la ejecución que la saca de 'en_revision' continúa. Dos
 *    coordinadores aprobando a la vez → uno gana, el otro recibe 409.
 *  - CAS sobre solicitud_registro: solo quien la saca de un estado que ocupaba lugar libera el cupo.
 *    Es el contrato que exige `liberarLugarOferta` y protege contra el borrado parcial de GR
 *    corriendo en paralelo sobre la misma solicitud.
 */
async function aprobarSolicitud({ solicitudId, coordinadorUsuarioId, comentario }) {
  const solicitud = await prisma.solicitud_baja.findUnique({ where: { id: solicitudId }, include: INCLUDE_COMPLETO });
  if (!solicitud) throw crearError('La solicitud de baja no existe.', 404);
  // La baja definitiva solo se ejecuta cuando las autoridades ya la revisaron. Una solicitud que
  // todavía está 'pendiente' debe turnarse primero con marcarEnRevision.
  if (solicitud.estado === ESTADO_PENDIENTE) {
    throw crearError(
      'Antes de aprobar la baja debes marcar la solicitud como "En revisión" y turnarla a las autoridades.',
      409, 'REQUIERE_EN_REVISION',
    );
  }
  if (!ORIGEN_VALIDO[ESTADO_APROBADA].includes(solicitud.estado)) {
    throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const sr = solicitud.alumno.solicitud_registro;
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
    estadoServicio: sr?.estado_solicitud ?? null,
    ofertaId: sr?.oferta_id ?? null,
    estadoOferta: sr?.oferta?.estado_oferta ?? null,
    profesorId: sr?.oferta?.profesor_id ?? null,
    profesorUsuarioId: sr?.oferta?.profesor?.usuario_id ?? null,
    nombreOferta: sr?.oferta?.nombre_proyecto ?? null,
  };

  // Rutas capturadas ANTES de borrar las filas: después ya no habría de dónde sacarlas. Mismo orden
  // seguro que usan GR-07 y ejecutarBorradoParcial (primero la BD, luego el disco).
  // El `expediente_baja` queda FUERA: sustenta la solicitud_baja, que ahora sobrevive.
  const documentosAEliminar = await prisma.documento.findMany({
    where: { alumno_id: cap.boleta, tipo_documento: { not: TIPO_DOCUMENTO_BAJA } },
    select: { id: true, ruta_archivo: true },
  });

  const comentarioLimpio = limpiar(comentario) || null;
  const ahora = new Date();

  const resultado = await prisma.$transaction(async (tx) => {
    if (cap.profesorId) await bloquearProfesor(cap.profesorId, tx);

    const claim = await tx.solicitud_baja.updateMany({
      where: { id: solicitudId, estado: ESTADO_EN_REVISION },
      data: {
        estado: ESTADO_APROBADA,
        fecha_respuesta: ahora,
        comentario: comentarioLimpio,
        coordinador_id: coordinador.id,
      },
    });
    if (claim.count === 0) throw crearError('Esta solicitud ya fue resuelta.', 409, 'SOLICITUD_YA_RESUELTA');

    // El expediente de la baja queda aprobado y SE CONSERVA: es la evidencia de la resolución.
    if (cap.documentoId) {
      await tx.documento.update({ where: { id: cap.documentoId }, data: { estado_documento: DOC_APROBADA } });
    }

    let cupoLiberado = false;
    if (cap.solicitudRegistroId) {
      // CAS sobre el estado EXACTO que se leyó (mismo patrón que ejecutarBorradoParcial): así se
      // conoce el estado_anterior real y solo una ejecución concurrente puede hacer la transición.
      const tomado = await tx.solicitud_registro.updateMany({
        where: { id: cap.solicitudRegistroId, estado_solicitud: cap.estadoServicio },
        data: {
          estado_solicitud: ESTADO_RETORNO_GR,
          // `estado_anterior` es el marcador de ORIGEN: 'modificar_reenviar' + 'alumno_asignado' solo
          // lo produce una baja aprobada (iniciarModificarSolicitud escribe 'rechazada_definitivamente'
          // ahí). De eso deriva GR-13 su `origenBaja`.
          estado_anterior: cap.estadoServicio,
          // No hubo rechazo: estos dos campos pertenecen al flujo de rechazos de GR.
          tipo_rechazo: null,
          motivo_rechazo: null,
          oferta_id: null,
          motivacion_oferta: null,
          periodo_registro_id: null,
          registro_siss: false,
          docs_iniciales: false,
          carta_compromiso: false,
          fecha_carta_compromiso: null,
          expediente: false,
        },
      });
      if (tomado.count === 0) throw crearError('Esta solicitud ya fue resuelta.', 409, 'SOLICITUD_YA_RESUELTA');

      // Solo quien saca la solicitud de un estado que ocupaba lugar puede devolverlo, y solo si la
      // oferta sigue pudiendo recibir alumnos. Cerrada/concluida/rechazada: no se toca.
      if (ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(cap.estadoServicio)
        && cap.ofertaId && cap.estadoOferta === ESTADO_OFERTA_RECEPTORA) {
        cupoLiberado = await liberarLugarOferta(tx, cap.ofertaId);
      }

      await eliminarAvanceDelServicio(tx, cap.solicitudRegistroId);
    }

    // Documentos del expediente del servicio anterior. El `expediente_baja` no entra en el filtro.
    await tx.documento.deleteMany({
      where: { alumno_id: cap.boleta, tipo_documento: { not: TIPO_DOCUMENTO_BAJA } },
    });

    // El cúmulo es 1:1 por ALUMNO, no por solicitud: si no se reiniciara, el servicio siguiente
    // arrancaría con las horas y faltas del anterior. Se reinicia en vez de borrarse porque AH lo
    // crea con un upsert perezoso y así el reinicio es idempotente.
    await tx.cumulo_horas_y_faltas.updateMany({
      where: { alumno_id: cap.boleta },
      data: {
        horas_acumuladas: 0,
        horas_rechazadas: 0,
        faltas_acumuladas: 0,
        faltas_consecutivas: 0,
        fecha_ultima_evaluacion_faltas: null,
      },
    });

    // El rol vuelve a 'alumno_sin_asignar': las tres rutas de CU-GR-13 lo exigen.
    // La rúbrica se limpia junto con su archivo: si la ruta quedara apuntando a un archivo borrado,
    // obtenerRubricaAlumno lanzaría un 500 ("contacta a soporte") en vez de pedirla de nuevo.
    await tx.usuario.update({
      where: { id: cap.usuarioId },
      data: {
        rol: ROL_ALUMNO_SIN_ASIGNAR,
        rubrica_imagen: null,
        rubrica_ip: null,
        rubrica_fecha_registro: null,
      },
    });

    return { cupoLiberado };
  });

  // ── Fuera de la transacción: nada de esto puede revertir la baja ──
  const archivosEliminados = eliminarArchivosDelServicio(cap.boleta, documentosAEliminar);

  await avisarResolucionAprobada(cap);

  return {
    id: solicitudId,
    estado: ESTADO_APROBADA,
    boleta: cap.boleta,
    nombre: cap.nombre,
    cupoLiberado: resultado.cupoLiberado,
    archivosEliminados,
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
  if (!ORIGEN_VALIDO[ESTADO_RECHAZADA].includes(solicitud.estado)) {
    throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: coordinadorUsuarioId } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404);

  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    // Se rechaza desde cualquiera de los dos estados activos, pero solo una vez.
    const claim = await tx.solicitud_baja.updateMany({
      where: { id: solicitudId, estado: { in: ESTADOS_ACTIVOS } },
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
 * Borra del disco SOLO lo que pertenecía al servicio cancelado:
 *   - las subcarpetas del servicio (Reportes, Rubrica, CartaCompromisoFirmada);
 *   - el archivo de cada documento eliminado de la BD (los de GR viven en la raíz de <boleta>/).
 *
 * NUNCA borra la carpeta <boleta>/ completa: ahí sigue el PDF del `expediente_baja`, que sustenta la
 * solicitud_baja aprobada. Tampoco toca las carpetas de profesores ni la de Coordinación, que no
 * cuelgan de <boleta>.
 *
 * Idempotente y siempre FUERA de la transacción: un fallo aquí no revierte la baja, solo deja un
 * archivo huérfano y un registro en consola.
 *
 * @returns {number} cuántas rutas se eliminaron sin error.
 */
function eliminarArchivosDelServicio(boleta, documentos) {
  let eliminados = 0;
  let carpeta;
  try {
    carpeta = carpetaSeguraDeAlumno(boleta);
  } catch (err) {
    console.error(`[bajas] No se pudo resolver la carpeta del alumno ${boleta}:`, err.message);
    return 0;
  }

  for (const sub of SUBCARPETAS_DEL_SERVICIO) {
    try {
      fs.rmSync(path.join(carpeta, sub), { recursive: true, force: true });
      eliminados += 1;
    } catch (err) {
      console.error(`[bajas] No se pudo eliminar ${boleta}/${sub}:`, err.message);
    }
  }

  for (const { ruta_archivo: relativa } of documentos) {
    // `ruta_archivo` es relativa a la base y ya la escribió el sistema, pero se revalida que no
    // escape de la carpeta de ESTE alumno antes de borrar nada.
    const absoluta = path.resolve(RUTA_BASE_DOCUMENTOS, relativa);
    if (absoluta !== carpeta && !absoluta.startsWith(carpeta + path.sep)) {
      console.error(`[bajas] Se omitió una ruta fuera de la carpeta de ${boleta}: ${relativa}`);
      continue;
    }
    try {
      fs.unlinkSync(absoluta);
      eliminados += 1;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`[bajas] No se pudo eliminar ${relativa}:`, err.message);
    }
  }

  return eliminados;
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

/**
 * Notificación PERSISTENTE al alumno + evento por socket. Un fallo aquí nunca revierte la
 * transición ya escrita (fail-open, igual que el resto de los avisos del módulo).
 *
 * Es el único canal del proceso de baja hacia el alumno: este flujo ya no manda correo.
 */
async function avisarAlAlumno(alumnoUsuarioId, { tipo, mensaje, evento, datos = {} }) {
  try {
    await crearNotificacion({ usuarioId: alumnoUsuarioId, tipo, mensaje, rutaRelacionada: RUTA_ALUMNO });
    emitirAUsuario(alumnoUsuarioId, evento, datos);
  } catch (err) {
    console.error(`[bajas] Error al notificar al alumno ${alumnoUsuarioId}:`, err.message);
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
 * Tras aprobar se avisa al profesor, al solicitante (si fue el profesor) y a todos los coordinadores.
 *
 * El ALUMNO también recibe su propia notificación —su usuario ya no desaparece— y además un evento
 * `baja:aplicada`. Este proceso NO manda correo: todo se comunica por estados y notificaciones.
 * Ese evento es además el mecanismo mínimo para la sesión: su JWT sigue firmado con
 * 'alumno_asignado' (requireRole valida el rol del token, no la BD), así que el frontend usa el
 * evento para cerrar la sesión local y obligarlo a entrar de nuevo, ya como 'alumno_sin_asignar'.
 * No se toca JWT, Redis ni el middleware: solo se reutiliza el socket que este módulo ya usaba.
 */
async function avisarResolucionAprobada(cap) {
  const mensaje = `La baja de ${cap.nombre} (${cap.boleta}) fue aprobada. Su servicio social actual `
    + 'quedó cancelado y su lugar en la oferta fue liberado.';

  const destinatarios = new Set();
  if (cap.profesorUsuarioId) destinatarios.add(cap.profesorUsuarioId);
  if (cap.origen === 'profesor' && cap.solicitanteUsuarioId) destinatarios.add(cap.solicitanteUsuarioId);

  let coordinadores = [];
  try {
    coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
    for (const c of coordinadores) destinatarios.add(c.usuario_id);
  } catch (err) {
    console.error('[bajas] No se pudo listar a los coordinadores para avisar la aprobación:', err.message);
  }

  // Cada rol recibe una ruta a la que REALMENTE puede entrar: mandar al profesor a la bandeja de
  // Coordinación lo dejaba con una notificación que no podía abrir.
  const esCoordinador = new Set(coordinadores.map((c) => c.usuario_id));
  for (const usuarioId of destinatarios) {
    try {
      await crearNotificacion({
        usuarioId,
        tipo: 'info',
        mensaje,
        rutaRelacionada: esCoordinador.has(usuarioId) ? RUTA_BANDEJA_COORDINACION : RUTA_PROFESOR,
      });
      emitirAUsuario(usuarioId, 'baja:resuelta', { estado: ESTADO_APROBADA, boleta: cap.boleta });
    } catch (err) {
      console.error(`[bajas] Error al avisar la aprobación a ${usuarioId}:`, err.message);
    }
  }

  await avisarAlAlumno(cap.usuarioId, {
    tipo: 'info',
    mensaje: 'Tu baja del servicio social fue aprobada. Tu cuenta se conserva: puedes modificar tu '
      + 'solicitud y postularte a otra oferta.',
    evento: 'baja:aplicada',
    datos: { boleta: cap.boleta },
  });
}

module.exports = {
  listarMisAlumnos,
  solicitarBajaProfesor,
  amonestarAlumno,
  consultarMiSolicitud,
  solicitarBajaAlumno,
  completarExpedienteDeBaja,
  listarSolicitudes,
  obtenerSolicitud,
  obtenerExpediente,
  marcarEnRevision,
  aprobarSolicitud,
  rechazarSolicitud,
  resumenBajaDelAlumno,
  resumenBajasDelProfesor,
  resumenBajasDeCoordinacion,
  ETAPAS_BAJA,
  ESTADO_PENDIENTE,
  ESTADO_EN_REVISION,
  ESTADO_APROBADA,
  ESTADO_RECHAZADA,
  TIPO_DOCUMENTO_BAJA,
  RUTA_BASE_DOCUMENTOS,
};
