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
//                                 (GR y ADM-14 aprueban sobre la propia fila de `documento`)
//   REPORTE_MENSUAL_APROBADO    → reporte_mensual.estado_reporte = 'aprobado_coordinador'
//   REPORTE_GLOBAL_APROBADO     → reporte_global.estado_reporte  = 'aprobado_coordinador'
//
// Los reportes NO pueden usar la primera regla: su `documento` nace y permanece en 'vigente', que
// —según el propio catálogo de estados del proyecto— "no significa que el reporte haya sido
// aprobado". Tampoco se consultan `revision_reporte_*`: son historial append-only y la revisión más
// reciente da falsos positivos justo después de que un alumno corrige y reenvía un rechazado.
//
// PARA AGREGAR UN DOCUMENTO basta con añadir una entrada con su regla: servicio, controlador y
// frontend lo recogen solos. No hay ningún número de documentos cableado en el sistema.
//
// PENDIENTE DE INTEGRAR LSS (rama feature/LSS-CU-01, todavía no fusionada). Cuando exista, se
// añaden dos entradas a TÉRMINO y nada más:
//   - `expediente_lss`       → regla DOCUMENTO_APROBADO
//   - `evaluacion_desempeno` → regla nueva: documento.estado_documento='aprobado'
//                              Y evaluacion_desempeno.estado='aprobado_coordinador'
// Hoy NO se declaran: sus flujos no existen en esta rama y consultarlos daría siempre vacío.

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
});

// Estado con el que GR y ADM-14 marcan un documento como definitivo.
const ESTADO_DOCUMENTO_APROBADO = 'aprobado';
// Estado con el que Coordinación cierra un reporte. Se importa de Reportes para que no se
// desincronice si allá cambia.
const ESTADO_REPORTE_APROBADO = ESTADO_REPORTE_APROBACION_FINAL;

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
]);

// Mientras falten los dos documentos de LSS, el expediente NUNCA está completo: HEAD no puede
// saberlo. La pantalla usa esto para no declarar "Completado" un expediente que sí podría faltarle
// algo. Se pondrá en true cuando el catálogo incluya `expediente_lss` y `evaluacion_desempeno`.
const CATALOGO_COMPLETO = false;

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
    // Mientras el catálogo no incluya LSS, la pantalla no debe hablar de expediente "completo".
    catalogoCompleto: CATALOGO_COMPLETO,
  };
}

/**
 * Etapa más avanzada que el alumno ya alcanzó, derivada de lo que REALMENTE tiene aprobado. Mismo
 * espíritu que el mock original (`getEtapaActual`), con una diferencia deliberada: el mock devolvía
 * "Completado" al tener el último documento del catálogo, y hoy eso mentiría — faltan los dos de
 * LSS. Mientras `CATALOGO_COMPLETO` sea false nunca se devuelve "Completado".
 */
function etapaActual(documentos) {
  if (documentos.length === 0) return ETAPAS.INICIO;

  const alcanzadas = new Set(documentos.map((d) => d.etapa));
  const ultima = [...ORDEN_ETAPAS].reverse().find((e) => alcanzadas.has(e)) ?? ETAPAS.INICIO;

  if (!CATALOGO_COMPLETO) return ultima;

  const tiposPresentes = new Set(documentos.map((d) => d.tipo));
  return tiposPresentes.size === CATALOGO.length ? 'Completado' : ultima;
}

module.exports = {
  ETAPAS,
  ORDEN_ETAPAS,
  RESPONSABLES,
  REGLAS,
  ESTADO_DOCUMENTO_APROBADO,
  ESTADO_REPORTE_APROBADO,
  CATALOGO,
  CATALOGO_COMPLETO,
  TIPOS_CATALOGADOS,
  TIPOS_POR_REGLA,
  metadataDe,
  estaEnCatalogo,
  nombreDocumento,
  agruparPorEtapa,
  calcularProgreso,
  etapaActual,
};
