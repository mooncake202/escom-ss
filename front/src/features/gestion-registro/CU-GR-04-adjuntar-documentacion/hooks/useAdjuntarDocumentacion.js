import { useState } from "react";
import { adjuntarDocumentacionInicial } from "@/services/estadoSolicitudService";

// Debe coincidir EXACTO con LIMITE_TAMANO_BYTES en gr.controller.js —
// si no coinciden, el frontend deja pasar algo que el backend va a rechazar.
const LIMITE_TAMANO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

const DOCUMENTOS_INICIAL = {
  cartaCreditos: null,
  seguroSocial: null,
};

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export function useAdjuntarDocumentacion() {
  const [docs, setDocs] = useState(DOCUMENTOS_INICIAL);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const agregarDoc = (campo, archivo) => {
    if (!archivo) return;

    // RN-GR-30: solo PDF
    if (archivo.type !== "application/pdf") {
      setErrores(prev => ({ ...prev, [campo]: "Solo se permiten archivos PDF" }));
      return;
    }
    // RN-GR-33: tamaño máximo
    if (archivo.size > LIMITE_TAMANO_BYTES) {
      setErrores(prev => ({ ...prev, [campo]: "El archivo excede el tamaño máximo permitido (1.5 MB)" }));
      return;
    }

    setDocs(prev => ({ ...prev, [campo]: archivo }));
    setErrores(prev => ({ ...prev, [campo]: null }));
  };

  const quitarDoc = (campo) => {
    setDocs(prev => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const nuevosErrores = {};
    // RF-GR-54 / Flujo Alterno 5.1
    if (!docs.cartaCreditos) nuevosErrores.cartaCreditos = "Este documento es obligatorio";
    if (!docs.seguroSocial) nuevosErrores.seguroSocial = "Este documento es obligatorio";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * @returns {Promise<boolean>} true si se envió correctamente (el
   * componente decide qué hacer después, ej. navegar).
   */
  const enviar = async () => {
    if (!validar()) return false;
    setLoading(true);
    setErrorEnvio("");
    try {
      const resultado = await adjuntarDocumentacionInicial(docs.cartaCreditos, docs.seguroSocial);
      // Sin esto, RutaProtegida rebota de vuelta a esta misma pantalla.
      actualizarUsuarioLocal({
        estado_solicitud: resultado.estado_solicitud,
        estado_anterior: "adjuntar_documentacion_inicial",
      });
      return true;
    } catch (err) {
      setErrorEnvio(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const todosObligatorios = !!(docs.cartaCreditos && docs.seguroSocial);

  return { docs, errores, loading, errorEnvio, todosObligatorios, agregarDoc, quitarDoc, enviar };
}