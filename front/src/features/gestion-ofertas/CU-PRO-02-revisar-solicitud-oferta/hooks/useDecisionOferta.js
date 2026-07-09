import { useState } from "react";

export function useDecisionOferta() {
  const [modo, setModo]       = useState(null); // null | "aprobar" | "rechazar"
  const [motivos, setMotivos] = useState("");
  const [errores, setErrores] = useState({});

  function abrirAprobar()  { setModo("aprobar"); setErrores({}); }
  function abrirRechazar() { setModo("rechazar"); setErrores({}); setMotivos(""); }
  function cancelar()      { setModo(null); setMotivos(""); setErrores({}); }

  // oferta: el objeto seleccionado
  // onAprobar / onRechazar: callbacks provistos por el padre (useOfertas)
  // Future: estas funciones llamarán await api.aprobar(oferta.id) / api.rechazar(oferta.id, motivos)
  function confirmarAprobacion(oferta, onAprobar) {
    onAprobar(oferta);
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

  return { modo, motivos, setMotivos, errores, abrirAprobar, abrirRechazar, cancelar, confirmarAprobacion, confirmarRechazo };
}