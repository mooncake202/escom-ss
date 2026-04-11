import { useState } from "react";

// ——— ESTADOS POSIBLES ———————————————————————————————
// "solicitada"        → Coordinación aún no ha elaborado la carta
// "lista_para_recoger"→ Coordinación marcó la carta como lista
// "recibida"          → Alumno confirmó que ya la recogió
// ————————————————————————————————————————————————————

export function useCartaTerminoAlumno() {
  const [estado, setEstado] = useState("lista_para_recoger"); // 👈 CAMBIA AQUÍ PARA PROBAR

  const confirmarEntrega = () => {
    setEstado("recibida");
  };

  return {
    estado,
    setEstado,       // 🔧 para pruebas manuales
    confirmarEntrega,
  };
}
