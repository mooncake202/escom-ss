import { useState } from "react";

// Estados posibles del flujo
// carta_termino_proceso → carta_termino_lista → carta_firmada_alumno
export function useCartaTermino() {
  const [estado, setEstado] = useState("solicitada"); 
  // 👆 CAMBIA ESTE VALOR MANUALMENTE PARA PROBAR
//solicitada
  const marcarCartaLista = () => {
    setEstado("lista_para_recoger");
  };

  const confirmarEntrega = () => {
    setEstado("recibida");
  };

  return {
    estado,
    setEstado, // 🔥 para que tú lo cambies manualmente
    marcarCartaLista,
    confirmarEntrega,
  };
}