import { useState, useEffect } from "react";
import { getSolicitudesDocumentacion, decidirDocumentacion, verDocumentoPDF } from "@/services/coordinadorDocumentacionService";

const INTERVALO_MS = 120000;

export function useRevisarDocumentacion() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [comentario, setComentario] = useState("");
  // null | "corregir_siss" | "corregir_documentos" | "rechazar_definitivo"
  const [modoRechazo, setModoRechazo] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState("");

  const cargar = () => {
    getSolicitudesDocumentacion()
      .then(setSolicitudes)
      .catch((err) => console.error("No se pudieron cargar las solicitudes:", err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const verDetalle = (s) => {
    setSeleccionada(s);
    setResultado(null);
    setComentario("");
    setModoRechazo(null);
    setErrorDescarga("");
  };

  const cerrar = () => {
    setSeleccionada(null);
    setModoRechazo(null);
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

  // RN-GR-40/42: motivo obligatorio en cualquier decisión que no sea "aceptar"
  const decidir = async (id, decision) => {
    if (decision !== "aceptar" && !comentario.trim()) return;
    setLoading(true);
    try {
      await decidirDocumentacion(id, decision, decision === "aceptar" ? undefined : comentario.trim());
      const nombre = solicitudes.find((s) => s.id === id)?.alumno.nombre ?? "";
      setResultado({ tipo: decision, nombre });
      setSeleccionada(null);
      setModoRechazo(null);
      setComentario("");
      cargar(); // la solicitud ya no debe seguir en la lista de pendientes
    } catch (err) {
      setErrorDescarga(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendientes: solicitudes, cargandoLista, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, verPdf, errorDescarga,
  };
}