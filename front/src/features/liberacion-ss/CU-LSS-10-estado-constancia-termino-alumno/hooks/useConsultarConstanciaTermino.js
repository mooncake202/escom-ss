import { useState } from "react";

// Estados: pendiente → disponible
// pendiente:   coordinación aún no ha subido la constancia
// disponible:  constancia lista para descargar

export function useConsultarConstanciaTermino() {
  const [estado, setEstado] = useState("disponible");
  const [archivoConstancia, setArchivoConstancia] = useState(null);

  // En producción esto vendría del backend via polling o websocket
  const recibirConstancia = ({ archivo }) => {
    setArchivoConstancia(archivo);
    setEstado("disponible");
  };

  const descargar = () => {
    // En producción abriría la URL del archivo
    if (archivoConstancia) {
      window.open(archivoConstancia.url, "_blank");
    }
  };

  return {
    estado,
    archivoConstancia,
    recibirConstancia,
    descargar,
  };
}
