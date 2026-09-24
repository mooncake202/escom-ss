import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  consultarMiSolicitudBaja,
  solicitarMiBaja,
  completarExpedienteDeMiBaja,
} from "@/services/bajasService";

// Datos reales del backend. Mientras la solicitud está pendiente o en revisión, el alumno SIGUE su
// servicio con normalidad (bitácoras, horas y reportes): la baja podría rechazarse, así que nada se
// congela.
//
// Esta pantalla atiende DOS casos con la misma interfaz, según lo que diga el backend:
//   1. El alumno abre su propia solicitud: captura motivo + expediente.
//   2. Su profesor ya la abrió (`requiereExpedienteDelAlumno`): el motivo ya existe y solo falta que
//      él adjunte el expediente a ESA solicitud. No se crea una segunda.
//
// El oficio o resolución oficial del Instituto no se sube ni se almacena aquí: ese trámite lo lleva
// Coordinación por su vía institucional y puede tardar semanas. Este proceso no manda correos: las
// actualizaciones llegan como notificaciones dentro del sistema.
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

  const solicitudPendiente = datos?.solicitudPendiente ?? null;
  // Lo decide el BACKEND, no la pantalla: baja pendiente, abierta por el profesor y sin expediente.
  const modoCompletar = Boolean(solicitudPendiente?.requiereExpedienteDelAlumno);

  async function handleSubmit() {
    if (enviando) return;
    const e = {};
    // Al completar la baja del profesor el motivo ya está guardado: solo falta el expediente.
    if (!modoCompletar && !motivo.trim()) e.motivo = "El motivo de la solicitud es obligatorio.";
    if (!archivo) e.archivo = "El expediente en PDF es obligatorio.";
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setEnviando(true);
    setErrores({});
    try {
      if (modoCompletar) {
        await completarExpedienteDeMiBaja({ archivo });
      } else {
        await solicitarMiBaja({ motivo: motivo.trim(), archivo });
      }
      setEnviado(true);
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const handleCancelar = () => navigate("/dashboard");
  const handleIrInicio = () => navigate("/dashboard");

  return {
    carga, recargar,
    alumno: datos?.alumno ?? null,
    // "Activa" bloquea el formulario. Si lo que falta es SU expediente, no bloquea: lo habilita.
    solicitudActiva: Boolean(solicitudPendiente) && !modoCompletar,
    solicitud: solicitudPendiente,
    modoCompletar,
    motivoProfesor: modoCompletar ? solicitudPendiente.motivo : null,
    historial: (datos?.historial ?? []).filter((h) => h.id !== solicitudPendiente?.id),
    motivo, archivo, errores, enviando, enviado,
    handleMotivoChange, handleArchivoChange,
    handleSubmit, handleCancelar, handleIrInicio,
  };
}
