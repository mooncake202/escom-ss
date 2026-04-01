import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ALUMNO = { nombre: "Ana García López" };

// Cambia estos valores para probar estados alternos:
// tieneProyectoAsignado: false → muestra "Sin proyecto asignado"
// yaTieneSolicitudActiva: true → muestra "Ya existe solicitud activa"
const MOCK_TIENE_PROYECTO       = true;
const MOCK_SOLICITUD_ACTIVA     = false;

const MOCK_PROYECTO = {
  nombre:          "Sistema de gestión de inventario con IA",
  profesor:        "Dr. Torres Vega",
  estado:          "Activo",
  fechaAsignacion: "2025-02-10",
  actividades: [
    "Análisis de requerimientos",
    "Diseño de base de datos",
    "Desarrollo backend",
    "Pruebas unitarias",
  ],
};

export function useSolicitarBajaProyecto() {
  const navigate = useNavigate();

  const [motivo, setMotivo]   = useState("");
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function handleMotivoChange(e) {
    setMotivo(e.target.value);
    if (errores.motivo) setErrores(prev => ({ ...prev, motivo: null }));
  }

  function validar() {
    const e = {};
    if (!motivo.trim()) e.motivo = "El motivo de la solicitud de baja es obligatorio.";
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

  function handleIrProyectos() {
    navigate("/dashboard");
  }

  return {
    alumno:              ALUMNO,
    tieneProyecto:       MOCK_TIENE_PROYECTO,
    solicitudActiva:     MOCK_SOLICITUD_ACTIVA,
    proyecto:            MOCK_PROYECTO,
    motivo, errores, enviado,
    handleMotivoChange, handleSubmit, handleCancelar, handleIrProyectos,
  };
}
