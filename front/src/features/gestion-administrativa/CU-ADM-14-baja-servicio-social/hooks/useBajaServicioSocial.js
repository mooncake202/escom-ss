import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ALUMNO = { nombre: "Ana García López", boleta: "2022630001" };

// Cambia estos valores para probar estados alternos:
// MOCK_SOLICITUD_ACTIVA: true  → muestra "Ya existe solicitud activa"
const MOCK_SOLICITUD_ACTIVA = false;

export function useBajaServicioSocial() {
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
    if (!motivo.trim()) e.motivo = "El motivo de la solicitud es obligatorio.";
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

  function handleIrInicio() {
    navigate("/dashboard");
  }

  return {
    alumno:          ALUMNO,
    solicitudActiva: MOCK_SOLICITUD_ACTIVA,
    motivo, errores, enviado,
    handleMotivoChange, handleSubmit, handleCancelar, handleIrInicio,
  };
}
