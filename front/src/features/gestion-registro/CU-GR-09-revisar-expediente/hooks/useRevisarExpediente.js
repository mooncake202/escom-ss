import { useState, useEffect } from "react";
import { getExpedientesPendientes, decidirExpediente, verDocumentoPDF } from "@/services/coordinadorExpedienteService";

const INTERVALO_MS = 120000;

export function useRevisarExpediente() {
  const [expedientes, setExpedientes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [modoRechazo, setModoRechazo] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState("");

  const cargar = () => {
    getExpedientesPendientes()
      .then(setExpedientes)
      .catch((err) => console.error("No se pudieron cargar los expedientes:", err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const verDetalle = (exp) => {
    setSeleccionado(exp);
    setResultado(null);
    setComentario("");
    setModoRechazo(false);
    setErrorDescarga("");
  };

  const cerrar = () => {
    setSeleccionado(null);
    setModoRechazo(false);
    setComentario("");
  };

  const verPdf = async (documentoId) => {
    if (!documentoId) return;
    setErrorDescarga("");
    try {
      await verDocumentoPDF(documentoId);
    } catch (err) {
      setErrorDescarga(err.message);
    }
  };

  // RN-GR-71
  const decidir = async (id, decision) => {
    if (decision === "rechazar" && !comentario.trim()) return;
    setLoading(true);
    try {
      await decidirExpediente(id, decision, decision === "aprobar" ? undefined : comentario.trim());
      const nombre = expedientes.find((e) => e.id === id)?.alumno.nombre ?? "";
      setResultado({ tipo: decision, nombre });
      setSeleccionado(null);
      setModoRechazo(false);
      setComentario("");
      cargar(); // esa solicitud ya no debe seguir en la lista de pendientes
    } catch (err) {
      setErrorDescarga(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendientes: expedientes, cargandoLista, seleccionado, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, verPdf, errorDescarga,
  };
}