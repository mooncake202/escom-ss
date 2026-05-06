import { useState } from "react";

// Estados posibles: en_revision | aprobado | rechazado
// Si rechazado → alumno puede corregir → regresa a CU-04

export function useEstadoResolucionAlumno() {
  const [estado, setEstado] = useState("aprobado"); // 👈 CAMBIA AQUÍ PARA PROBAR
  const [observacionesGuardadas, setObservacionesGuardadas] = useState("");

  // Simulación: en un caso real estos datos vendrían del backend
  const recibirResolucion = ({ resolucion, observaciones }) => {
    if (resolucion === "aprobado") {
      setEstado("aprobado");
    } else if (resolucion === "rechazado") {
      setObservacionesGuardadas(observaciones || "");
      setEstado("rechazado");
    }
  };

  return {
    estado,
    observacionesGuardadas,
    recibirResolucion,
  };
}
