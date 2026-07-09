import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ALUMNO = { nombre: "Ana García López", boleta: "2022630001" };

// Cambia para probar estados:
// MOCK_SOLICITUD_ACTIVA: true  → muestra seguimiento de estado
const MOCK_SOLICITUD_ACTIVA = false;

const MOCK_SOLICITUD = {
  estado:      "Pendiente de revisión", // "Pendiente de revisión" | "En revisión" | "Aprobada"
  fechaEnvio:  "1 de abril de 2026, 10:15",
};

export function useBajaServicioSocial() {
  const navigate = useNavigate();

  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function handleArchivoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrores(prev => ({ ...prev, archivo: "Solo se aceptan archivos en formato PDF." }));
      setArchivo(null);
      return;
    }
    setArchivo(file);
    setErrores(prev => ({ ...prev, archivo: null }));
  }

  function validar() {
    const e = {};
    if (!archivo) e.archivo = "El expediente en PDF es obligatorio.";
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
    solicitud:       MOCK_SOLICITUD,
    archivo, errores, enviado,
    handleArchivoChange,
    handleSubmit, handleCancelar, handleIrInicio,
  };
}
