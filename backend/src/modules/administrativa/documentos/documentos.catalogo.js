// Catálogo de metadata por `tipo_documento` (CU-ADM-13 y CU-ADM-14).
//
// ES LA ÚNICA FUENTE DE VERDAD de qué documentos forman el expediente histórico, en qué etapa van,
// cómo se llaman y —lo más importante— QUÉ CONDICIÓN los vuelve consultables. La etapa y el nombre
// salen de AQUÍ, nunca de la ruta física del archivo: mover un archivo no cambia su clasificación.
//
// NO HAY UN FILTRO UNIVERSAL. Cada entrada declara su REGLA de consultabilidad porque los módulos
// productores no marcan la aprobación en el mismo sitio:
//
//   DOCUMENTO_APROBADO          → documento.estado_documento = 'aprobado'
//                                 (GR, ADM-14 y LSS-09 aprueban sobre la propia fila de `documento`)
//   REPORTE_MENSUAL_APROBADO    → reporte_mensual.estado_reporte = 'aprobado_coordinador'
//   REPORTE_GLOBAL_APROBADO     → reporte_global.estado_reporte  = 'aprobado_coordinador'
//   EVALUACION_DESEMPENO_APROBADA → documento.estado_documento = 'aprobado'
//                                 Y evaluacion_desempeno.estado = 'aprobado_coordinador'
//
// Los reportes NO pueden usar la primera regla: su `documento` nace y permanece en 'vigente', que
// —según el propio catálogo de estados del proyecto— "no significa que el reporte haya sido
// aprobado". Tampoco se consultan `revision_reporte_*` ni `revision_desempeno`: son historial
// append-only y la revisión más reciente da falsos positivos justo después de que un alumno corrige
// y reenvía un rechazado.
//
// PARA AGREGAR UN DOCUMENTO basta con añadir una entrada con su regla: servicio, controlador y
// frontend lo recogen solos. No hay ningún número de documentos cableado en el sistema.
//
// LSS YA ESTÁ INTEGRADO: `expediente_lss` y `evaluacion_desempeno` son los dos documentos que
// produce y forman parte de TÉRMINO. ADM solo los CONSULTA: no los crea, no los modifica y no los
// aprueba — eso vive en el módulo LSS, que es de otra integrante del equipo.

const { ESTADO_REPORTE_APROBACION_FINAL } = require('../../reportes/reportes.shared');

const ETAPAS = Object.freeze({
  INICIO: 'Inicio',
  DESARROLLO: 'Desarrollo',
  TERMINO: 'Término',
});

// Orden en que se presentan las etapas, independiente del orden de las entradas del catálogo.
const ORDEN_ETAPAS = Object.freeze([ETAPAS.INICIO, ETAPAS.DESARROLLO, ETAPAS.TERMINO]);

const RESPONSABLES = Object.freeze({
  ALUMNO: 'alumno',
  COORDINACION: 'coordinacion',
});

// Reglas de consultabilidad. El catálogo solo las NOMBRA; quien sabe traducirlas a una consulta es
// documentos.service.js, para que aquí no entre ningún detalle de Prisma.
const REGLAS = Object.freeze({
  DOCUMENTO_APROBADO: 'documento_aprobado',
  REPORTE_MENSUAL_APROBADO: 'reporte_mensual_aprobado',
  REPORTE_GLOBAL_APROBADO: 'reporte_global_aprobado',
  EVALUACION_DESEMPENO_APROBADA: 'evaluacion_desempeno_aprobada',
});

// Estado con el que GR, ADM-14 y LSS-09 marcan un documento como definitivo.
const ESTADO_DOCUMENTO_APROBADO = 'aprobado';
// Estado con el que Coordinación cierra un reporte. Se importa de Reportes para que no se
// desincronice si allá cambia.
const ESTADO_REPORTE_APROBADO = ESTADO_REPORTE_APROBACION_FINAL;
// Estado con el que Coordinación cierra la evaluación de desempeño (LSS-04), en la tabla satélite
// `evaluacion_desempeno`. Se declara aquí, y NO se importa de lss.shared.js, a propósito: el módulo
// LSS pertenece a otra integrante y ADM no debe acoplarse a sus internos. Es el contrato de datos
// que ADM consulta, y las pruebas de ADM lo fijan de forma explícita para que un cambio silencioso
// allá se detecte aquí.
const ESTADO_EVALUACION_DESEMPENO_APROBADA = 'aprobado_coordinador';

// `orden` ordena dentro de su etapa. `tipo` es el valor exacto de documento.tipo_documento.
// `multiple: true` marca los tipos de los que un alumno puede tener VARIOS documentos.
const CATALOGO = Object.freeze([
  // ── INICIO ────────────────────────────────────────────────────────────────
  {
    tipo: 'carta_creditos',
    nombre: 'Carta de créditos',
    descripcion: 'Constancia de créditos para el trámite de servicio social, vigente al semestre correspondiente.',
    etapa: ETAPAS.INICIO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.DOCUMENTO_APROBADO,
    multiple: false,
    orden: 1,
  },
  {
    tipo: 'constancia_seguro_social',
    nombre: 'Constancia de seguro social',
    descripcion: 'Documento que acredita el seguro social vigente durante la prestación del servicio.',
    etapa: ETAPAS.INICIO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.DOCUMENTO_APROBADO,
    multiple: false,
    orden: 2,
  },
  {
    tipo: 'expediente',
    nombre: 'Expediente de registro',
    descripcion: 'Documentación inicial que formaliza el inicio del servicio social.',
    etapa: ETAPAS.INICIO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.DOCUMENTO_APROBADO,
    multiple: false,
    orden: 3,
  },

  // ── DESARROLLO ────────────────────────────────────────────────────────────
  {
    tipo: 'reporte_mensual',
    nombre: 'Reporte mensual',
    // El alumno entrega uno por periodo: se numeran con reporte_mensual.num_reporte.
    nombreDe: ({ numero }) => (numero ? `Reporte mensual No. ${numero}` : 'Reporte mensual'),
    descripcion: 'Reporte mensual de actividades, aprobado por tu profesor y validado por Coordinación.',
    etapa: ETAPAS.DESARROLLO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.REPORTE_MENSUAL_APROBADO,
    multiple: true,
    orden: 1,
  },
  {
    tipo: 'reporte_global',
    nombre: 'Reporte global',
    descripcion: 'Reporte global del servicio social, aprobado por tu profesor y validado por Coordinación.',
    etapa: ETAPAS.DESARROLLO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.REPORTE_GLOBAL_APROBADO,
    multiple: false,
    orden: 2,
  },

  // ── TÉRMINO ───────────────────────────────────────────────────────────────
  {
    tipo: 'carta_compromiso_firmada',
    nombre: 'Carta compromiso firmada',
    descripcion: 'Carta compromiso con firma y sello de Coordinación, devuelta al alumno.',
    etapa: ETAPAS.TERMINO,
    responsable: RESPONSABLES.COORDINACION,
    regla: REGLAS.DOCUMENTO_APROBADO,
    multiple: false,
    orden: 1,
  },
  {
    tipo: 'expediente_lss',
    nombre: 'Expediente de liberación',
    // Es un PDF combinado: carta compromiso + carta de término + dictamen (este último solo si se
    // declaró al registrarse). El alumno lo integra y Coordinación lo dictamina.
    descripcion: 'Expediente de liberación del servicio social, dictaminado por Coordinación.',
    etapa: ETAPAS.TERMINO,
    responsable: RESPONSABLES.ALUMNO,
    regla: REGLAS.DOCUMENTO_APROBADO,
    // Se reemplaza sobre la MISMA fila en cada reenvío: nunca hay dos.
    multiple: false,
    orden: 2,
  },
  {
    tipo: 'evaluacion_desempeno',
    nombre: 'Evaluación de desempeño',
    descripcion: 'Evaluación de tu desempeño firmada por tu profesor y dictaminada por Coordinación.',
    etapa: ETAPAS.TERMINO,
    responsable: RESPONSABLES.COORDINACION,
    // La única entrada con condición compuesta: ver REGLAS.EVALUACION_DESEMPENO_APROBADA.
    regla: REGLAS.EVALUACION_DESEMPENO_APROBADA,
    // Solo puede existir una: `evaluacion_desempeno.liberacion_proceso_id` es UNIQUE, y una
    // corrección borra y recrea la fila en vez de acumular versiones.
    multiple: false,
    orden: 3,
  },
]);

const POR_TIPO = new Map(CATALOGO.map((d) => [d.tipo, d]));

/** Los tipos que ADM-13 consulta. */
const TIPOS_CATALOGADOS = Object.freeze(CATALOGO.map((d) => d.tipo));

/** Tipos agrupados por regla — lo que el servicio necesita para armar la consulta. */
const TIPOS_POR_REGLA = Object.freeze(
  Object.fromEntries(
    Object.values(REGLAS).map((regla) => [regla, CATALOGO.filter((d) => d.regla === regla).map((d) => d.tipo)]),
  ),
);

const metadataDe = (tipo) => POR_TIPO.get(tipo) ?? null;
const estaEnCatalogo = (tipo) => POR_TIPO.has(tipo);

/** Nombre visible de una instancia concreta. `extra` trae lo que la regla haya podido derivar. */
function nombreDocumento(tipo, extra = {}) {
  const meta = POR_TIPO.get(tipo);
  if (!meta) return tipo;
  return typeof meta.nombreDe === 'function' ? meta.nombreDe(extra) : meta.nombre;
}

/**
 * Agrupa documentos ya proyectados por su etapa, en el orden del catálogo. Devuelve SIEMPRE las
 * tres etapas, aunque estén vacías, para que la pantalla no tenga que conocerlas.
 *
 * Dentro de una etapa: primero por `orden` del tipo y, para los tipos múltiples, por su número
 * ascendente — así los reportes mensuales salen 1, 2, 3… y el global después de todos ellos.
 */
function agruparPorEtapa(documentos) {
  const porOrden = (a, b) => (
    a.orden - b.orden
    || (a.numero ?? 0) - (b.numero ?? 0)
    || a.fechaCreacion.localeCompare(b.fechaCreacion)
  );

  return ORDEN_ETAPAS.map((etapa) => ({
    etapa,
    documentos: documentos.filter((d) => d.etapa === etapa).sort(porOrden),
  }));
}

/**
 * Progreso DERIVADO, medido en TIPOS del catálogo, no en documentos sueltos.
 *
 * Por qué por tipo y no "documentos disponibles / esperados": el número de reportes mensuales que
 * un alumno debe entregar depende de la duración de su servicio y ADM-13 no puede conocerlo sin
 * invadir reglas de Reportes. Un denominador así sería inventado. En cambio "cuántos de los N
 * tipos del expediente ya tiene" sí se sostiene con los datos reales y no depende de cardinalidad.
 *
 * `totalDocumentos` viaja aparte para que la pantalla pueda decir cuántos archivos hay realmente.
 */
function calcularProgreso(documentos) {
  const tiposPresentes = new Set(documentos.map((d) => d.tipo));
  return {
    disponibles: tiposPresentes.size,
    total: CATALOGO.length,
    totalDocumentos: documentos.length,
  };
}

/**
 * Etapa más avanzada que el alumno ya alcanzó, derivada de lo que REALMENTE tiene aprobado.
 *
 * SOLO puede devolver una de las tres etapas de `ETAPAS`, por construcción: se elige la última de
 * `ORDEN_ETAPAS` que el alumno haya alcanzado. No existe una cuarta etapa "Completado" — un alumno
 * con el 100% de su expediente sigue estando documentalmente en Término. El progreso (que sí puede
 * llegar al 100%) se informa aparte, en `calcularProgreso`.
 */
function etapaActual(documentos) {
  if (documentos.length === 0) return ETAPAS.INICIO;

  const alcanzadas = new Set(documentos.map((d) => d.etapa));
  return [...ORDEN_ETAPAS].reverse().find((e) => alcanzadas.has(e)) ?? ETAPAS.INICIO;
}

module.exports = {
  ETAPAS,
  ORDEN_ETAPAS,
  RESPONSABLES,
  REGLAS,
  ESTADO_DOCUMENTO_APROBADO,
  ESTADO_REPORTE_APROBADO,
  ESTADO_EVALUACION_DESEMPENO_APROBADA,
  CATALOGO,
  TIPOS_CATALOGADOS,
  TIPOS_POR_REGLA,
  metadataDe,
  estaEnCatalogo,
  nombreDocumento,
  agruparPorEtapa,
  calcularProgreso,
  etapaActual,
};
