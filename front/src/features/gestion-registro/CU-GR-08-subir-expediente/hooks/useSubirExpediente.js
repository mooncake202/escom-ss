import { useState, useEffect } from "react";
import { getInfoExpediente, subirExpediente } from "@/services/estadoSolicitudService";

// Debe coincidir EXACTO con LIMITE_EXPEDIENTE_ARCHIVO_BYTES en gr.controller.js
const LIMITE_ARCHIVO_BYTES = 1 * 1024 * 1024; // 1 MB por documento individual

const DOCS_INICIAL = {
  cartaCompromiso: null,
  curp: null,
  constanciaCreditos: null,
  dictamen: null,
};

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export function useSubirExpediente() {
  const [docs, setDocs] = useState(DOCS_INICIAL);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const [info, setInfo] = useState(null);
  const [cargandoInfo, setCargandoInfo] = useState(true);

  useEffect(() => {
    getInfoExpediente()
      .then(setInfo)
      .catch((err) => setErrorEnvio(err.message))
      .finally(() => setCargandoInfo(false));
  }, []);

  const agregarDoc = (campo, archivo) => {
    if (!archivo) return;
    if (archivo.type !== "application/pdf") {
      setErrores(prev => ({ ...prev, [campo]: "Solo se permiten archivos PDF" }));
      return;
    }
    if (archivo.size > LIMITE_ARCHIVO_BYTES) {
      setErrores(prev => ({ ...prev, [campo]: "El archivo excede el tamaño máximo permitido (1 MB)" }));
      return;
    }
    setDocs(prev => ({ ...prev, [campo]: archivo }));
    setErrores(prev => ({ ...prev, [campo]: null }));
  };

  const quitarDoc = (campo) => setDocs(prev => ({ ...prev, [campo]: null }));

  const validar = () => {
    const errs = {};
    if (!docs.cartaCompromiso) errs.cartaCompromiso = "Este documento es obligatorio";
    if (!docs.curp) errs.curp = "Este documento es obligatorio";
    if (!docs.constanciaCreditos) errs.constanciaCreditos = "Este documento es obligatorio";
    if (info?.requiereDictamen && !docs.dictamen) errs.dictamen = "Este documento es obligatorio";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const enviar = async () => {
    if (!validar()) return;
    setLoading(true);
    setErrorEnvio("");
    try {
      const resultado = await subirExpediente(docs);
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "adjuntar_expediente" });
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setLoading(false);
    }
  };

  const obligatoriosCompletos = !!(
    docs.cartaCompromiso && docs.curp && docs.constanciaCreditos &&
    (!info?.requiereDictamen || docs.dictamen)
  );

  return {
    docs, errores, loading, enviado, errorEnvio, obligatoriosCompletos,
    info, cargandoInfo,
    agregarDoc, quitarDoc, enviar,
  };
}