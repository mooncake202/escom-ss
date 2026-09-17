// gr.shared.js — constantes compartidas entre archivos del módulo GR que,
// de vivir en gr.service.js, generarían dependencia circular con cupos.js
// (gr.service.js necesita a cupos.js para validarOfertaDisponibleYConCupo,
// y cupos.js necesita este array — ninguno de los dos puede importar del otro).

// Estados en los que el profesor YA aceptó al alumno (por lo tanto ya se
// había decrementado cupos_disponibles en CU-GR-02) — si cualquiera de
// los 2 relojes vence estando en cualquiera de estos, hay que liberar
// ese cupo de vuelta.
//
// Incluye 'aceptada_por_profesor' (agregado en esta revisión): antes, si
// el Reloj 1 vencía con la solicitud todavía en este estado exacto (posible,
// ya que periodo_registro_id se asigna desde CU-GR-01, antes de la
// aceptación), ejecutarBorradoParcial calculaba cupoConsumido=false y el
// cupo de la OFERTA nunca se liberaba — bug preexistente, corregido aquí.
const ESTADOS_CON_CUPO_CONSUMIDO = [
  'aceptada_por_profesor',
  'registro_SISS',
  'adjuntar_documentacion_inicial',
  'SISS_y_documentacion_pendiente',
  'SISS_docs_aprobados',
  'corregir_docsini',
  'corregir_SISS',
  'descargar_carta_compromiso',
  'espera_confirmacion_carta_compromiso',
  'carta_compromiso_confirmada',
  'adjuntar_expediente',
  'expediente_pendiente_revision',
  'expediente_con_correcciones',
];

// Superset para el límite de cupos del PROFESOR: a diferencia de
// ESTADOS_CON_CUPO_CONSUMIDO (que solo importa mientras un reloj de
// vencimiento puede aplicar todavía), aquí también deben contar los 2
// estados terminales de éxito, donde el cupo del profesor queda ocupado
// PARA SIEMPRE y ningún reloj los toca ya: expediente_aprobado y
// alumno_asignado.
const ESTADOS_QUE_OCUPAN_CUPO_PROFESOR = [
  ...ESTADOS_CON_CUPO_CONSUMIDO,
  'expediente_aprobado',
  'alumno_asignado',
];

module.exports = { ESTADOS_CON_CUPO_CONSUMIDO, ESTADOS_QUE_OCUPAN_CUPO_PROFESOR };
