import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInfoExpediente, subirExpedienteLss } from "@/services/lssAlumnoService";
import { ESTADO_LSS_A_RUTA } from "@/features/liberacion-ss/utils/estadoRutasLSS";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

const DOCUMENTOS_CONFIG_BASE = [
  {
    id: "cartaCompromiso",
    label: "Carta compromiso",
    descripcion: "Documento firmado al inicio del servicio social",
    requerido: true,
  },
  {
    id: "cartaTermino",
    label: "Carta de término (escaneada)",
    descripcion: "Carta física que recogiste en el paso anterior, escaneada",
    requerido: true,
  },
  {
    id: "dictamen",
    label: "Dictamen",
    descripcion: "Documento de dictamen",
    requerido: true, // Solo aparece en absoluto si requiereDictamen — cuando aparece, es obligatorio (RN-LSS-22).
  },
];

// RN-LSS-20: solo PDF real (el backend valida magic bytes; esto es solo
// para no dejar que el alumno intente subir algo que de entrada se sabe
// que se va a rechazar).
function validarArchivo(archivo) {
  if (archivo.type !== "application/pdf") {
    return "Solo se permiten archivos en formato PDF.";
  }
  return null;
}

export function useIntegracionExpediente() {
  const [cargando, setCargando] = useState(true);
  const [info, setInfo] = useState(null); // { estado, requiereDictamen, nombreExpedienteSugerido, observacionesRechazo }
  const [archivos, setArchivos] = useState({});
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      const data = await getInfoExpediente();
      setInfo(data);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar la información de tu expediente.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  // RN-LSS-22: el campo de dictamen NO se muestra en absoluto si no aplica
  // (no solo "opcional", como tenía el mockup original).
  const documentosConfig = DOCUMENTOS_CONFIG_BASE.filter((d) => d.id !== "dictamen" || info?.requiereDictamen);

  const subirArchivo = (docId, archivo) => {
    if (!archivo) return;
    const errorMsg = validarArchivo(archivo);
    if (errorMsg) {
      setErrores((prev) => ({ ...prev, [docId]: errorMsg }));
      return;
    }
    setErrores((prev) => ({ ...prev, [docId]: null }));
    setArchivos((prev) => ({ ...prev, [docId]: archivo }));
  };

  const quitarArchivo = (docId) => {
    setArchivos((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setErrores((prev) => ({ ...prev, [docId]: null }));
  };

  const requeridosCompletos = documentosConfig.filter((d) => d.requerido).every((d) => archivos[d.id]);
  const hayErrores = Object.values(errores).some(Boolean);

  const enviarExpediente = async () => {
    if (!requeridosCompletos || hayErrores) return;
    setLoading(true);
    setError(null);
    try {
      await subirExpedienteLss({
        cartaCompromiso: archivos.cartaCompromiso,
        cartaTermino: archivos.cartaTermino,
        dictamen: archivos.dictamen,
      });
      // Corrección de alcance: CU-LSS-07 solo integra/envía — consultar el
      // estado de la revisión es responsabilidad de CU-LSS-08. Navigate
      // explícito, no refetch (misma lección ya aprendida en el bug de
      // LSS-02: un refetch de ESTA pantalla no sirve cuando lo que hace
      // falta es cambiar a otra).
      navigate(ESTADO_LSS_A_RUTA.expediente_en_revision);
    } catch (err) {
      setError(err.message || "No se pudo enviar tu expediente.");
    } finally {
      setLoading(false);
    }
  };

  return {
    cargando,
    info,
    documentosConfig,
    archivos,
    errores,
    error,
    loading,
    subirArchivo,
    quitarArchivo,
    requeridosCompletos,
    hayErrores,
    enviarExpediente,
  };
}
