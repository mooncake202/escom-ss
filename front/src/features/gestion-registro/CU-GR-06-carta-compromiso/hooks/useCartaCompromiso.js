import { useState } from "react";

export function useCartaCompromiso() {
  const [accedioSISS, setAccedioSISS] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [completado, setCompletado]   = useState(false);

  // RN-GR-36: alumno confirma que descargó, imprimió y firmó
  const confirmar = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setCompletado(true);
    setLoading(false);
  };

  return { accedioSISS, setAccedioSISS, loading, completado, confirmar };
}
