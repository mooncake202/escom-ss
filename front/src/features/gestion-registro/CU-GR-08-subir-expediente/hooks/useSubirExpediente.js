import { useState } from "react";
 
// RN-GR-42 al RN-GR-47: documentos del expediente
const DOCS_INICIAL = {
  cartaCompromiso: null, // obligatorio — RN-GR-43
  curp:            null, // obligatorio — RN-GR-44
  constanciaCreditos: null, // obligatorio — RN-GR-45
  dictamen:        null, // opcional — RN-GR-47
};
 
export function useSubirExpediente() {
  const [docs, setDocs]       = useState(DOCS_INICIAL);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
 
  const agregarDoc = (campo, archivo) => {
    if (archivo && archivo.type !== "application/pdf") {
      setErrores(prev => ({ ...prev, [campo]: "Solo se permiten archivos PDF" }));
      return;
    }
    setDocs(prev => ({ ...prev, [campo]: archivo }));
    setErrores(prev => ({ ...prev, [campo]: null }));
  };
 
  const quitarDoc = (campo) => setDocs(prev => ({ ...prev, [campo]: null }));
 
  const validar = () => {
    const errs = {};
    if (!docs.cartaCompromiso)    errs.cartaCompromiso    = "Este documento es obligatorio";
    if (!docs.curp)               errs.curp               = "Este documento es obligatorio";
    if (!docs.constanciaCreditos) errs.constanciaCreditos = "Este documento es obligatorio";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };
 
  // RN-GR-46: registra fecha y hora de envío
  const enviar = async () => {
    if (!validar()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setEnviado(true);
    setLoading(false);
  };
 
  const obligatoriosCompletos = docs.cartaCompromiso && docs.curp && docs.constanciaCreditos;
 
  return { docs, errores, loading, enviado, obligatoriosCompletos, agregarDoc, quitarDoc, enviar };
}