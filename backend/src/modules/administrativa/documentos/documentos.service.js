// CU-ADM-13 — Consulta del expediente documental histórico.
//
// SOLO LECTURA. Este servicio no crea, no modifica, no aprueba y no elimina nada: la única
// escritura del bloque documental vive en carta-firmada.service.js (CU-ADM-14).
//
// QUÉ SE EXPONE
//   - Solo los tipos del catálogo (documentos.catalogo.js), nunca todo `documento`.
//   - Solo los que cumplen la REGLA DE CONSULTABILIDAD de su tipo. No hay un filtro universal: la
//     aprobación de un expediente de GR vive en `documento.estado_documento`, pero la de un reporte
//     vive en `reporte_mensual/global.estado_reporte`. Aquí se traducen esas reglas a UNA sola
//     consulta; el catálogo solo las declara y el frontend nunca decide si algo está aprobado.
//
// QUIÉN VE QUÉ
//   alumno_asignado → exclusivamente sus propios documentos, derivados de su boleta.
//   coordinador     → el expediente de cualquier alumno, eligiéndolo de una lista.
// Un alumno nunca recibe una boleta por parámetro: la suya sale del token.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { descifrarBuffer } = require('../../../lib/fileEncryption');
const { ESTADO_ASIGNADO, crearError, nombreCompleto } = require('../directorio/directorio.shared');
const catalogo = require('./documentos.catalogo');

const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../uploads/documentos');
const BOLETA_VALIDA = /^[0-9]{10}$/;

/**
 * Traduce cada REGLA del catálogo a un fragmento de `where`. Es el ÚNICO sitio del sistema que sabe
 * cómo se comprueba la aprobación de cada familia de documentos.
 *
 * Solo se emiten fragmentos para reglas que tengan tipos declarados: si mañana se retira un tipo,
 * su rama desaparece sola de la consulta.
 */
const FRAGMENTO_POR_REGLA = {
  // GR y ADM-14 aprueban sobre la propia fila de `documento`.
  [catalogo.REGLAS.DOCUMENTO_APROBADO]: (tipos) => ({
    tipo_documento: { in: tipos },
    estado_documento: catalogo.ESTADO_DOCUMENTO_APROBADO,
  }),
  // El `documento` de un reporte se queda en 'vigente' para siempre: la aprobación vive en su
  // propia tabla. Se filtra por la relación 1:1, nunca por `revision_reporte_*`.
  [catalogo.REGLAS.REPORTE_MENSUAL_APROBADO]: (tipos) => ({
    tipo_documento: { in: tipos },
    reporte_mensual: { is: { estado_reporte: catalogo.ESTADO_REPORTE_APROBADO } },
  }),
  [catalogo.REGLAS.REPORTE_GLOBAL_APROBADO]: (tipos) => ({
    tipo_documento: { in: tipos },
    reporte_global: { is: { estado_reporte: catalogo.ESTADO_REPORTE_APROBADO } },
  }),
};

/** `where` de consultabilidad: la unión (OR) de los fragmentos de todas las reglas con tipos. */
const WHERE_CONSULTABLE = {
  OR: Object.entries(catalogo.TIPOS_POR_REGLA)
    .filter(([, tipos]) => tipos.length > 0)
    .map(([regla, tipos]) => FRAGMENTO_POR_REGLA[regla](tipos)),
};

// Datos extra que hacen falta para nombrar una instancia concreta (p. ej. el número del reporte).
// No se exponen tal cual: solo alimentan `catalogo.nombreDocumento`.
const INCLUDE_CONSULTABLE = {
  reporte_mensual: { select: { num_reporte: true } },
};

function validarBoleta(boleta) {
  const limpia = String(boleta ?? '').trim();
  if (!BOLETA_VALIDA.test(limpia)) throw crearError('Boleta con formato inválido.', 400, 'BOLETA_INVALIDA');
  return limpia;
}

// La metadata de presentación sale del CATÁLOGO, nunca de la ruta del archivo en disco.
//
// NUNCA se expone `ruta_archivo` ni ningún dato de almacenamiento: el archivo solo se alcanza por
// el endpoint protegido usando el id del documento.
const vistaDocumento = (fila) => {
  const meta = catalogo.metadataDe(fila.tipo_documento);
  const numero = fila.reporte_mensual?.num_reporte ?? null;

  return {
    id: fila.id,
    tipo: fila.tipo_documento,
    nombre: catalogo.nombreDocumento(fila.tipo_documento, { numero }),
    descripcion: meta.descripcion,
    etapa: meta.etapa,
    responsable: meta.responsable,
    orden: meta.orden,
    // Solo para los tipos múltiples (hoy, el reporte mensual). Ordena dentro de su etapa.
    numero,
    fechaCreacion: fila.fecha_creacion.toISOString(),
    // Todo lo que llega aquí ya cumplió su regla: el expediente histórico solo muestra aprobados.
    estado: 'aprobado',
  };
};

/** Expediente de una boleta ya validada. Núcleo compartido por las dos vistas. */
async function expedienteDe(boleta) {
  const filas = await prisma.documento.findMany({
    where: { alumno_id: boleta, ...WHERE_CONSULTABLE },
    include: INCLUDE_CONSULTABLE,
    orderBy: { fecha_creacion: 'asc' },
  });

  const documentos = filas.map(vistaDocumento);

  return {
    documentos,
    etapas: catalogo.agruparPorEtapa(documentos),
    progreso: catalogo.calcularProgreso(documentos),
    // Etapa más avanzada que el alumno alcanzó. La deriva el backend, no la pantalla.
    etapaActual: catalogo.etapaActual(documentos),
  };
}

// Oferta del alumno con su profesor responsable. Una sola definición para que las tres consultas
// del CU pidan exactamente lo mismo.
const INCLUDE_OFERTA = { include: { profesor: { include: { usuario: true } } } };

// Ficha del alumno. La comparten las TRES entradas del CU (mi expediente, lista de coordinación y
// expediente de un alumno), así que el alumno y Coordinación ven forzosamente el mismo dato.
//
// El profesor se sigue por la relación real que ya usan ADM-01 y ADM-17:
//   alumno → solicitud_registro → oferta (oferta_servicio) → profesor → usuario
// Solo viaja su NOMBRE: la ficha no necesita su id, departamento, cubículo ni correo.
//
// `oferta_id` es opcional en el esquema (y `onDelete: SetNull`), así que la oferta —y con ella el
// profesor— puede faltar aunque el flujo normal de GR siempre asigne una. De ahí el `?? null`.
const vistaAlumno = (alumno, solicitud = null) => ({
  boleta: alumno.boleta,
  nombreCompleto: nombreCompleto(alumno.usuario),
  carrera: alumno.carrera,
  correoInstitucional: alumno.usuario.correo_institucional,
  oferta: solicitud?.oferta?.nombre_proyecto ?? null,
  profesor: solicitud?.oferta?.profesor
    ? nombreCompleto(solicitud.oferta.profesor.usuario)
    : null,
});

// ── Vista del alumno ────────────────────────────────────────────────────────

/** Sus propios documentos. No recibe boleta: sale del token. */
async function obtenerMiExpediente({ usuarioId }) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { usuario: true, solicitud_registro: { include: { oferta: INCLUDE_OFERTA } } },
  });
  if (!alumno) throw crearError('No se encontró tu perfil de alumno.', 404, 'SIN_PERFIL_ALUMNO');

  return {
    alumno: vistaAlumno(alumno, alumno.solicitud_registro),
    ...(await expedienteDe(alumno.boleta)),
  };
}

// ── Vista de coordinación ───────────────────────────────────────────────────

/**
 * Alumnos con expediente consultable. Se listan TODOS los asignados, incluidos los que aún no
 * tienen ningún documento aprobado: la pantalla necesita poder mostrarlos en cero.
 *
 * El conteo se resuelve en dos consultas y se agrupa en memoria, no con una consulta por alumno.
 */
async function listarAlumnosConDocumentos() {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: ESTADO_ASIGNADO },
    include: { alumno: { include: { usuario: true } }, oferta: INCLUDE_OFERTA },
    orderBy: { alumno_id: 'asc' },
  });

  const boletas = solicitudes.map((s) => s.alumno_id);
  // Se trae también el tipo para poder derivar la etapa y el progreso de cada alumno sin una
  // consulta por alumno. Los filtros de la pantalla se calculan aquí, no en el frontend.
  const filas = boletas.length
    ? await prisma.documento.findMany({
        where: { alumno_id: { in: boletas }, ...WHERE_CONSULTABLE },
        select: { alumno_id: true, tipo_documento: true },
      })
    : [];

  const porAlumno = new Map();
  for (const f of filas) {
    const meta = catalogo.metadataDe(f.tipo_documento);
    if (!meta) continue;
    const acumulado = porAlumno.get(f.alumno_id) ?? [];
    acumulado.push({ tipo: f.tipo_documento, etapa: meta.etapa });
    porAlumno.set(f.alumno_id, acumulado);
  }

  return {
    alumnos: solicitudes.map((s) => {
      const suyos = porAlumno.get(s.alumno_id) ?? [];
      const progreso = catalogo.calcularProgreso(suyos);
      return {
        ...vistaAlumno(s.alumno, s),
        totalDocumentos: progreso.totalDocumentos,
        tiposDisponibles: progreso.disponibles,
        totalCatalogo: progreso.total,
        etapaActual: catalogo.etapaActual(suyos),
      };
    }),
    // La pantalla no debe inventar un estado "Completado" mientras falten los documentos de LSS.
    catalogoCompleto: catalogo.CATALOGO_COMPLETO,
  };
}

/** Expediente de un alumno concreto. Solo coordinación llega aquí. */
async function obtenerExpedienteDeAlumno({ boleta }) {
  const boletaLimpia = validarBoleta(boleta);

  const alumno = await prisma.alumno.findUnique({
    where: { boleta: boletaLimpia },
    include: { usuario: true, solicitud_registro: { include: { oferta: INCLUDE_OFERTA } } },
  });
  if (!alumno) throw crearError('No se encontró ese alumno.', 404, 'ALUMNO_NO_ENCONTRADO');

  return {
    alumno: vistaAlumno(alumno, alumno.solicitud_registro),
    ...(await expedienteDe(alumno.boleta)),
  };
}

// ── Descarga / visualización ────────────────────────────────────────────────

/**
 * Devuelve el PDF descifrado de un documento del catálogo.
 *
 * SEGURIDAD — dos barreras, no una:
 *   1. El documento debe estar en el catálogo Y aprobado. Un expediente de baja o un reporte no se
 *      pueden sacar por aquí aunque se conozca su id.
 *   2. Un alumno solo alcanza los de SU boleta (derivada del token). Un id ajeno produce el mismo
 *      404 que un id inexistente: no se puede sondear qué documentos existen.
 */
async function obtenerArchivo({ usuarioId, rol, documentoId }) {
  const id = Number(documentoId);
  if (!Number.isInteger(id) || id <= 0) throw crearError('Documento inválido.', 400, 'DOCUMENTO_INVALIDO');

  const where = { id, ...WHERE_CONSULTABLE };

  if (rol !== 'coordinador') {
    const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioId }, select: { boleta: true } });
    if (!alumno) throw crearError('No se encontró tu perfil de alumno.', 404, 'SIN_PERFIL_ALUMNO');
    where.alumno_id = alumno.boleta;
  }

  const documento = await prisma.documento.findFirst({ where });
  if (!documento) throw crearError('No se encontró ese documento.', 404, 'DOCUMENTO_NO_DISPONIBLE');

  const rutaAbsoluta = path.resolve(RUTA_BASE_DOCUMENTOS, documento.ruta_archivo);
  // Defensa contra una ruta guardada fuera del árbol de documentos.
  if (!rutaAbsoluta.startsWith(RUTA_BASE_DOCUMENTOS + path.sep)) {
    throw crearError('No se pudo leer el archivo.', 500, 'RUTA_INVALIDA');
  }
  if (!fs.existsSync(rutaAbsoluta)) {
    throw crearError('El archivo ya no está disponible.', 404, 'ARCHIVO_NO_ENCONTRADO');
  }

  let pdf;
  try {
    pdf = descifrarBuffer(fs.readFileSync(rutaAbsoluta));
  } catch (err) {
    console.error(`No se pudo descifrar el documento ${documento.id}:`, err.message);
    throw crearError('No se pudo abrir el archivo.', 500, 'ARCHIVO_ILEGIBLE');
  }

  const meta = catalogo.metadataDe(documento.tipo_documento);
  return {
    pdf,
    boleta: documento.alumno_id,
    tipo: documento.tipo_documento,
    nombreSugerido: `${documento.tipo_documento}-${documento.alumno_id}.pdf`,
    nombreVisible: meta.nombre,
  };
}

module.exports = {
  obtenerMiExpediente,
  listarAlumnosConDocumentos,
  obtenerExpedienteDeAlumno,
  obtenerArchivo,
  RUTA_BASE_DOCUMENTOS,
};
