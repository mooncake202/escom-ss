// CU-PRO-04 — Gestionar estado de oferta (cierre manual)
//
// La lógica y la UI de este CU están implementadas como componente extraíble:
//   components/CerrarOfertaPanel.jsx  — UI del flujo de cierre
//   hooks/useGestionarEstado.js       — estado del diálogo + puedesCerrarManual()
//
// CerrarOfertaPanel es importado directamente por HistorialOfertas (CU-PRO-05).
// Este archivo sirve como punto de referencia para el CU; no tiene ruta propia en App.jsx.
//
// Props de CerrarOfertaPanel:
//   oferta   — objeto de la oferta seleccionada
//   onCerrar — callback(id) que actualiza el estado en el store/API

export { CerrarOfertaPanel } from "./components/CerrarOfertaPanel";
export { useGestionarEstado, puedesCerrarManual } from "./hooks/useGestionarEstado";