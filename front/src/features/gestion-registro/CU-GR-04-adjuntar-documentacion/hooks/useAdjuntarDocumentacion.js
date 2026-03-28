import { useState } from "react";

const DOCUMENTOS_INICIAL = {
  cartaCreditos:  null, // obligatorio
  seguroSocial:   null, // obligatorio
  dictamen:       null, // opcional — RN-GR-47
};

export function useAdjuntarDocumentacion() {
  const [docs, setDocs]         = useState(DOCUMENTOS_INICIAL);
  const [errores, setErrores]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);

  const agregarDoc = (campo, archivo) => {
    // RN-GR-25: solo PDF
    if (archivo && archivo.type !== "application/pdf") {
      setErrores(prev => ({ ...prev, [campo]: "Solo se permiten archivos PDF" }));
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
    if (!docs.cartaCreditos) nuevosErrores.cartaCreditos = "Este documento es obligatorio";
    if (!docs.seguroSocial)  nuevosErrores.seguroSocial  = "Este documento es obligatorio";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // RN-GR-23: registra fecha y hora de envío
  const enviar = async () => {
    if (!validar()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setEnviado(true);
    setLoading(false);
  };

  const todosObligatorios = docs.cartaCreditos && docs.seguroSocial;

  return { docs, errores, loading, enviado, todosObligatorios, agregarDoc, quitarDoc, enviar };
}
