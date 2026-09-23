import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultarMiSolicitudBaja, solicitarMiBaja } from "@/services/bajasService";

// Datos reales del backend. Mientras la solicitud está pendiente, el alumno SIGUE su servicio con
// normalidad (bitácoras, horas y reportes): la baja podría rechazarse, así que nada se congela.
//
// El oficio o resolución oficial del Instituto no se sube ni se almacena aquí: ese trámite lo lleva
// Coordinación por su vía institucional y puede tardar semanas.
export function useBajaServicioSocial() {
  const navigate = useNavigate();

  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [datos, setDatos] = useState(null);
  const [intento, setIntento] = useState(0);

  const [motivo, setMotivo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const recargar = () => setIntento((n) => n + 1);

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    consultarMiSolicitudBaja().then(
      (respuesta) => {
        if (!vigente) return;
        setDatos(respuesta);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function handleMotivoChange(e) {
    setMotivo(e.target.value);
    if (errores.motivo) setErrores((prev) => ({ ...prev, motivo: null }));
  }

  function handleArchivoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // El backend vuelve a validar el tipo: esto solo evita un viaje inútil.
    if (file.type !== "application/pdf") {
      setErrores((prev) => ({ ...prev, archivo: "Solo se aceptan archivos en formato PDF." }));
      setArchivo(null);
      return;
    }
    setArchivo(file);
    setErrores((prev) => ({ ...prev, archivo: null }));
  }

  async function handleSubmit() {
    if (enviando) return;
    const e = {};
    if (!motivo.trim()) e.motivo = "El motivo de la solicitud es obligatorio.";
    if (!archivo) e.archivo = "El expediente en PDF es obligatorio.";
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setEnviando(true);
    setErrores({});
    try {
      await solicitarMiBaja({ motivo: motivo.trim(), archivo });
      setEnviado(true);
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const handleCancelar = () => navigate("/dashboard");
  const handleIrInicio = () => navigate("/dashboard");

  const solicitudPendiente = datos?.solicitudPendiente ?? null;

  return {
    carga, recargar,
    alumno: datos?.alumno ?? null,
    solicitudActiva: Boolean(solicitudPendiente),
    solicitud: solicitudPendiente,
    historial: (datos?.historial ?? []).filter((h) => h.id !== solicitudPendiente?.id),
    motivo, archivo, errores, enviando, enviado,
    handleMotivoChange, handleArchivoChange,
    handleSubmit, handleCancelar, handleIrInicio,
  };
}
