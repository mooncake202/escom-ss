import { useState } from "react";

const DOCUMENTOS_CONFIG = [
  {
    id: "carta_compromiso",
    label: "Carta compromiso",
    descripcion: "Documento firmado al inicio del servicio social",
    requerido: true,
  },
  {
    id: "carta_termino",
    label: "Carta de término (escaneada)",
    descripcion: "Carta firmada con aval externo, escaneada",
    requerido: true,
  },
  {
    id: "dictamen",
    label: "Dictamen",
    descripcion: "Documento de dictamen (si aplica)",
    requerido: false,
  },
];

const MAX_MB = 5;
const FORMATOS_PERMITIDOS = ["pdf", "jpg", "jpeg", "png"];

function validarArchivo(archivo) {
  if (archivo.size > MAX_MB * 1024 * 1024) {
    return `El archivo no debe superar ${MAX_MB} MB`;
  }
  const ext = archivo.name.split(".").pop().toLowerCase();
  if (!FORMATOS_PERMITIDOS.includes(ext)) {
    return "Solo se permiten archivos PDF, JPG o PNG";
  }
  return null;
}

export function useIntegracionExpediente() {
  const [archivos, setArchivos] = useState({});
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const subirArchivo = (docId, archivo) => {
    if (!archivo) return;
    const errorMsg = validarArchivo(archivo);
    if (errorMsg) {
      setErrores(prev => ({ ...prev, [docId]: errorMsg }));
      return;
    }
    setErrores(prev => ({ ...prev, [docId]: null }));
    setArchivos(prev => ({ ...prev, [docId]: archivo }));
  };

  const quitarArchivo = (docId) => {
    setArchivos(prev => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setErrores(prev => ({ ...prev, [docId]: null }));
  };

  // Completo = todos los requeridos tienen archivo y sin errores
  const requeridosCompletos = DOCUMENTOS_CONFIG
    .filter(d => d.requerido)
    .every(d => archivos[d.id]);

  const hayErrores = Object.values(errores).some(Boolean);

  const enviarExpediente = async () => {
    if (!requeridosCompletos || hayErrores) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setEnviado(true);
    setLoading(false);
  };

  return {
    documentosConfig: DOCUMENTOS_CONFIG,
    archivos,
    errores,
    loading,
    enviado,
    subirArchivo,
    quitarArchivo,
    requeridosCompletos,
    hayErrores,
    enviarExpediente,
  };
}
