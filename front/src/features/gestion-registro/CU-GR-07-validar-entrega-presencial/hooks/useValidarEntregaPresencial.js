import { useState, useEffect } from "react";
import { getSolicitudesCartaCompromiso, registrarRecepcionCarta } from "@/services/coordinadorCartaCompromisoService";

const INTERVALO_MS = 120000;

export function useValidarEntregaPresencial() {
  const [pendientes, setPendientes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => {
    getSolicitudesCartaCompromiso()
      .then(setPendientes)
      .catch((err) => console.error("No se pudo cargar la lista:", err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const verDetalle = (item) => {
    setSeleccionado(item);
    setResultado(null);
    setError("");
  };

  const cerrar = () => setSeleccionado(null);

  // RN-GR-50 a RN-GR-52: solo Coordinador, tras verificar la carta físicamente.
  const registrarRecepcion = async (id) => {
    setLoading(true);
    setError("");
    try {
      await registrarRecepcionCarta(id);
      const nombre = pendientes.find((a) => a.id === id)?.alumno.nombre ?? "";
      setResultado({ nombre });
      setSeleccionado(null);
      cargar(); // esa solicitud ya no debe seguir en la lista de pendientes
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { pendientes, cargandoLista, seleccionado, loading, resultado, error, verDetalle, cerrar, registrarRecepcion };
}