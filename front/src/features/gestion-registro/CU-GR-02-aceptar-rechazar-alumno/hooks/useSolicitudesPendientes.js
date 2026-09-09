import { useState, useEffect } from "react";
import { getSolicitudesPendientes, decidirSolicitud } from "@/services/profesorSolicitudesService";

const INTERVALO_MS = 120000;

export function useSolicitudesPendientes() {
  const [solicitudes, setSolicitudes]     = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionada, setSeleccionada]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [resultado, setResultado]         = useState(null);

  const cargar = () => {
    getSolicitudesPendientes()
      .then(setSolicitudes)
      .catch((err) => console.error(err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const verDetalle = (solicitud) => {
    setSeleccionada(solicitud);
    setResultado(null);
  };

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setResultado(null);
  };

  const decidir = async (id, decision) => {
    setLoading(true);
    try {
      await decidirSolicitud(id, decision);
      const nombre = solicitudes.find(s => s.id === id)?.nombre ?? "";
      setResultado({ tipo: decision, nombre });
      setSeleccionada(null);
      // RN-GR-11: si aceptar esta solicitud cubrió los cupos, el backend ya
      // rechazó automáticamente las demás pendientes de esa oferta — se
      // vuelve a pedir la lista completa (no solo quitar esta tarjeta) para
      // que esas otras también desaparezcan de la pantalla.
      cargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendientes: solicitudes, cargandoLista, seleccionada, loading, resultado,
    verDetalle, cerrarDetalle, decidir,
  };
}