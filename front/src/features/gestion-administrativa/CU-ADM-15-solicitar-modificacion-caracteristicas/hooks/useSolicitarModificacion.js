import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PROFESOR = { nombre: "Dr. Torres Vega", id: "PTC-2024-0187" };

export const CATALOGO = [
  {
    id:     1,
    nombre: "Presidente de academia",
    cupos:  "+2",
    cuposDesc: "cupos adicionales",
  },
  {
    id:     2,
    nombre: "Coordinador",
    cupos:  "+2",
    cuposDesc: "cupos adicionales",
  },
  {
    id:     3,
    nombre: "Jefe de departamento",
    cupos:  "+3",
    cuposDesc: "cupos adicionales",
  },
  {
    id:     4,
    nombre: "Investigador",
    cupos:  "+N",
    cuposDesc: "cupos adicionales solo en proyectos",
  },
];

// Características ya aprobadas del profesor (RN-ADM-03: no puede solicitar la misma dos veces)
// El profesor de base no aparece en el catálogo, así que ninguna está aprobada aún
const CARACTERISTICAS_APROBADAS_IDS = new Set([]);

// Características activas actuales — el profesor de base siempre tiene 3 cupos de base
const CARACTERISTICAS_ACTUALES = [
  { id: 0, nombre: "Profesor de base", cuposInfo: "3 cupos de base" },
];

// Cambiar a true para probar el bloqueo por solicitud pendiente (RN-ADM-01)
const TIENE_SOLICITUD_PENDIENTE = false;

export function useSolicitarModificacion() {
  const navigate = useNavigate();

  const [caracteristicaId, setCaracteristicaId] = useState(null);
  const [justificacion, setJustificacion]       = useState("");
  const [errores, setErrores]                   = useState({});
  const [enviado, setEnviado]                   = useState(false);

  function handleSeleccionar(id) {
    setCaracteristicaId(id);
    if (errores.caracteristica) setErrores(prev => ({ ...prev, caracteristica: null }));
  }

  function handleJustificacionChange(e) {
    setJustificacion(e.target.value);
    if (errores.justificacion) setErrores(prev => ({ ...prev, justificacion: null }));
  }

  function validar() {
    const e = {};
    if (!caracteristicaId)      e.caracteristica = "Debes seleccionar una característica del catálogo.";
    if (!justificacion.trim())  e.justificacion  = "La justificación es obligatoria.";
    return e;
  }

  function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setEnviado(true);
  }

  function handleCancelar() {
    navigate("/dashboard");
  }

  const caracteristicaSeleccionada = CATALOGO.find(c => c.id === caracteristicaId) ?? null;

  return {
    profesor:                 PROFESOR,
    catalogo:                 CATALOGO,
    caracteristicasActuales:  CARACTERISTICAS_ACTUALES,
    caracteristicasAprobadas: CARACTERISTICAS_APROBADAS_IDS,
    tieneSolicitudPendiente:  TIENE_SOLICITUD_PENDIENTE,
    caracteristicaId,
    caracteristicaSeleccionada,
    justificacion, errores, enviado,
    handleSeleccionar, handleJustificacionChange,
    handleSubmit, handleCancelar,
  };
}
