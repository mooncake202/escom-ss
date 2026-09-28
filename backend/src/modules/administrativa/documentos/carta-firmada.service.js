// CU-ADM-14 — Envío de carta compromiso firmada.
//
// Coordinación sube el PDF de la carta que el alumno entregó y firmó presencialmente en CU-GR-06/07,
// para que quede almacenada y el alumno pueda consultarla y descargarla desde su expediente
// (CU-ADM-13).
//
// UNIVERSO: todos los alumnos actualmente `alumno_asignado`, que es justo el estado en que los deja
// CU-GR-11 al aprobar el expediente.
//
// EL ESTADO NO SE ALMACENA, SE DERIVA:
//   Pendiente = NO existe documento con tipo_documento 'carta_compromiso_firmada'
//   Enviada   = SÍ existe
// No hay columna de estado de carta en ninguna tabla, y no hace falta.
//
// SUSTITUCIÓN: UPDATE sobre la MISMA fila (ruta_archivo, fecha_creacion, estado_documento). Sin
// versionado, sin historial y sin notificación — decisiones tomadas en el análisis previo.
//
// El PDF nunca toca el disco en claro: multer lo mantiene en memoria y se cifra con AES-256-GCM
// antes de escribirlo, igual que GR y Bajas.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const { ESTADO_ASIGNADO, crearError, nombreCompleto } = require('../directorio/directorio.shared');
const { RUTA_BASE_DOCUMENTOS } = require('./documentos.service');

const TIPO_CARTA_FIRMADA = 'carta_compromiso_firmada';
// Mismo valor que ya usa CU-GR-11 al aprobar el expediente: no se inventa un estado nuevo.
const ESTADO_APROBADO = 'aprobado';
// Subcarpeta propia dentro del alumno, como ya hacen Reportes ("Reportes") y la rúbrica ("Rubrica").
const SUBCARPETA = 'CartaCompromisoFirmada';

const BOLETA_VALIDA = /^[0-9]{10}$/;

function validarBoleta(boleta) {
  const limpia = String(boleta ?? '').trim();
  if (!BOLETA_VALIDA.test(limpia)) throw crearError('Boleta con formato inválido.', 400, 'BOLETA_INVALIDA');
  return limpia;
}

/**
 * Datos de detalle que exige la ficha.
 *
 * `profesor` es el responsable REAL de la oferta del alumno, por la MISMA relación que usa ADM-13:
 * alumno → solicitud_registro → oferta_servicio → profesor → usuario. Solo viaja su nombre.
 * Como la oferta es opcional en el esquema, puede ser null; la pantalla lo resuelve sin romperse.
 *
 * `fechaInicio` es el inicio del periodo elegido en Registro
 * (solicitud_registro → periodo_registro → evento_calendario.fecha_inicio).
 */
const vistaAlumno = (solicitud, cartaPorBoleta) => {
  const { alumno, oferta } = solicitud;
  const carta = cartaPorBoleta.get(alumno.boleta) ?? null;
  const profesor = oferta?.profesor ?? null;

  return {
    boleta: alumno.boleta,
    nombreCompleto: nombreCompleto(alumno.usuario),
    carrera: alumno.carrera,
    oferta: oferta?.nombre_proyecto ?? null,
    profesor: profesor ? nombreCompleto(profesor.usuario) : null,
    fechaInicio: solicitud.periodo_registro?.evento_calendario?.fecha_inicio?.toISOString() ?? null,
    carta: carta
      ? { enviada: true, documentoId: carta.id, fechaEnvio: carta.fecha_creacion.toISOString() }
      : { enviada: false, documentoId: null, fechaEnvio: null },
  };
};

/**
 * Lista para la pantalla de coordinación: todos los alumnos asignados y, por cada uno, si ya tiene
 * carta firmada. Dos consultas, sin N+1.
 */
async function listarAlumnos() {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: ESTADO_ASIGNADO },
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
    orderBy: { alumno_id: 'asc' },
  });

  const boletas = solicitudes.map((s) => s.alumno_id);
  const cartas = boletas.length
    ? await prisma.documento.findMany({
        where: { alumno_id: { in: boletas }, tipo_documento: TIPO_CARTA_FIRMADA },
        select: { id: true, alumno_id: true, fecha_creacion: true },
      })
    : [];

  const cartaPorBoleta = new Map(cartas.map((c) => [c.alumno_id, c]));
  const alumnos = solicitudes.map((s) => vistaAlumno(s, cartaPorBoleta));

  return {
    alumnos,
    resumen: {
      total: alumnos.length,
      enviadas: alumnos.filter((a) => a.carta.enviada).length,
      pendientes: alumnos.filter((a) => !a.carta.enviada).length,
    },
  };
}

/**
 * Registra o SUSTITUYE la carta firmada de un alumno.
 *
 * Orden de operaciones, copiado del que ya usan GR y Bajas: el archivo nuevo se escribe ANTES de
 * tocar la base, y si la escritura en BD falla se borra para no dejar huérfanos. El archivo
 * ANTERIOR solo se borra DESPUÉS de que la BD confirmó: si se borrara antes y la transacción
 * fallara, la fila seguiría apuntando a un archivo inexistente.
 */
async function registrarCarta({ usuarioId, boleta, archivoPdf }) {
  const boletaLimpia = validarBoleta(boleta);

  if (!archivoPdf || !archivoPdf.buffer?.length) {
    throw crearError('El archivo PDF de la carta es obligatorio.', 400, 'ARCHIVO_REQUERIDO');
  }

  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: usuarioId }, select: { id: true } });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404, 'SIN_PERFIL_COORDINADOR');

  // El alumno debe existir y estar asignado: la carta firmada solo aplica a un servicio en curso.
  const solicitud = await prisma.solicitud_registro.findFirst({
    where: { alumno_id: boletaLimpia, estado_solicitud: ESTADO_ASIGNADO },
    select: { id: true },
  });
  if (!solicitud) throw crearError('No se encontró un alumno asignado con esa boleta.', 404, 'ALUMNO_NO_ASIGNADO');

  const carpeta = path.join(RUTA_BASE_DOCUMENTOS, boletaLimpia, SUBCARPETA);
  fs.mkdirSync(carpeta, { recursive: true });

  const rutaRelativa = path.join(boletaLimpia, SUBCARPETA, generarNombreSeguro());
  const rutaAbsoluta = path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa);
  fs.writeFileSync(rutaAbsoluta, cifrarBuffer(archivoPdf.buffer));

  const ahora = new Date();
  let documento;
  let rutaAnterior = null;

  try {
    documento = await prisma.$transaction(async (tx) => {
      // Serializa los envíos del MISMO alumno: sin esto, dos envíos cruzados leían "sin carta" y
      // creaban dos filas. Va ANTES de leer la carta existente (mismo criterio que bloquearProfesor
      // en lib/cupos.js): el segundo espera aquí y, al continuar, ve la carta del primero y la
      // sustituye en vez de dar otra alta. Alumnos distintos no se bloquean entre sí.
      await tx.$queryRaw`SELECT boleta FROM alumno WHERE boleta = ${boletaLimpia} FOR UPDATE`;

      const existente = await tx.documento.findFirst({
        where: { alumno_id: boletaLimpia, tipo_documento: TIPO_CARTA_FIRMADA },
      });

      if (existente) {
        rutaAnterior = existente.ruta_archivo;
        // SUSTITUCIÓN: la misma fila, sin crear una nueva.
        return tx.documento.update({
          where: { id: existente.id },
          data: {
            ruta_archivo: rutaRelativa,
            fecha_creacion: ahora,
            estado_documento: ESTADO_APROBADO,
            creador_id: usuarioId,
          },
        });
      }

      return tx.documento.create({
        data: {
          alumno_id: boletaLimpia,
          creador_id: usuarioId,
          tipo_documento: TIPO_CARTA_FIRMADA,
          fecha_creacion: ahora,
          estado_documento: ESTADO_APROBADO,
          ruta_archivo: rutaRelativa,
        },
      });
    });
  } catch (err) {
    // La BD no quedó modificada: se retira el archivo nuevo para no dejar basura en disco.
    try { fs.unlinkSync(rutaAbsoluta); } catch { /* el archivo pudo no llegar a escribirse */ }
    console.error('Error al registrar la carta compromiso firmada:', err);
    throw crearError('No se pudo registrar la carta. Intenta de nuevo.', 500, 'ERROR_AL_REGISTRAR');
  }

  // Ya confirmado en BD: ahora sí se puede retirar el archivo sustituido.
  if (rutaAnterior && rutaAnterior !== rutaRelativa) {
    try {
      fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, rutaAnterior));
    } catch (err) {
      // No es motivo para fallar la operación: la carta nueva ya quedó registrada.
      console.error('No se pudo borrar el archivo anterior de la carta firmada:', err.message);
    }
  }

  return {
    documentoId: documento.id,
    boleta: boletaLimpia,
    sustituida: rutaAnterior !== null,
    carta: { enviada: true, documentoId: documento.id, fechaEnvio: documento.fecha_creacion.toISOString() },
  };
}

module.exports = { listarAlumnos, registrarCarta, TIPO_CARTA_FIRMADA, SUBCARPETA };
