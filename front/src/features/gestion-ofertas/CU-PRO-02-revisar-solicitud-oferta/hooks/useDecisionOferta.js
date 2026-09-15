import { useState } from "react";

export function useDecisionOferta() {
  const [modo, setModo]       = useState(null); // null | "aprobar" | "rechazar"
  const [motivos, setMotivos] = useState("");
  const [programaSISS, setProgramaSISS]   = useState("");
  const [actividadSISS, setActividadSISS] = useState("");
  const [errores, setErrores] = useState({});

  function abrirAprobar(oferta) {
    setModo("aprobar");
    setErrores({});
    // Se precarga con lo que puso el profesor, pero el coordinador debe
    // confirmar o corregir explícitamente — vuelve a elegir aunque ya
    // estuviera correcto (obligatorio, no se hereda sin revisión).
    setProgramaSISS(oferta?.programaSISS || "");
    setActividadSISS(oferta?.tituloSISS || "");
  }

  function abrirRechazar() { setModo("rechazar"); setErrores({}); setMotivos(""); }

  function cancelar() {
    setModo(null); setMotivos(""); setErrores({});
    setProgramaSISS(""); setActividadSISS("");
  }

  function confirmarAprobacion(oferta, onAprobar) {
    const e = {};
    if (!programaSISS.trim())  e.programaSISS  = "Debes seleccionar el Programa SISS.";
    if (!actividadSISS.trim()) e.actividadSISS = "Debes seleccionar la Actividad SISS.";
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    onAprobar(oferta, { programaSISS, actividadSISS });
    cancelar();
  }

  function confirmarRechazo(oferta, onRechazar) {
    if (!motivos.trim()) {
      setErrores({ motivos: "Los motivos del rechazo son obligatorios." });
      return;
    }
    onRechazar(oferta, motivos.trim());
    cancelar();
  }

  return {
    modo, motivos, setMotivos, programaSISS, setProgramaSISS, actividadSISS, setActividadSISS, errores,
    abrirAprobar, abrirRechazar, cancelar, confirmarAprobacion, confirmarRechazo,
  };
}