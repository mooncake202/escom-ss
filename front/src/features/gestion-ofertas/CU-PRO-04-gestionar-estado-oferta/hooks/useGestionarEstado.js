import { useState } from "react";

// RN-PRO-04: solo proyectos activos sin alumnos activos y con cupos sin completar
export function puedesCerrarManual(oferta) {
  return (
    oferta.tipo === "proyecto" &&
    oferta.estatus === "activo" &&
    oferta.alumnosActivos === 0 &&
    oferta.cuposOcupados < oferta.cupos
  );
}

export function useGestionarEstado() {
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  function iniciarCierre()  { setConfirmandoCierre(true); }
  function cancelarCierre() { setConfirmandoCierre(false); }

  // onCerrar(id): callback del padre que actualiza el estado en el store/API
  // Future: await api.cerrarOferta(oferta.id) antes de llamar onCerrar
  function confirmarCierre(oferta, onCerrar) {
    onCerrar(oferta.id);
    setConfirmandoCierre(false);
  }

  return { confirmandoCierre, iniciarCierre, cancelarCierre, confirmarCierre };
}