import { useState, useEffect } from "react";
import { getSolicitudesCartaCompromiso, registrarRecepcionCarta } from "@/services/coordinadorCartaCompromisoService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

export function useValidarEntregaPresencial() {
  const [pendientes, setPendientes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const { socket } = useSocket();

  const cargar = () => {
    getSolicitudesCartaCompromiso()
      .then(setPendientes)
      .catch((err) => console.error("No se pudo cargar la lista:", err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  // Socket — reemplaza el polling de 120s. 'carta:recibida' cubre el caso
  // de que OTRO coordinador registre la recepción desde su propia sesión.
  useEffect(() => {
    if (!socket) return;

    socket.on("carta:pendiente_confirmacion", cargar);
    socket.on("carta:recibida", cargar);
    return () => {
      socket.off("carta:pendiente_confirmacion", cargar);
      socket.off("carta:recibida", cargar);
    };
  }, [socket]);

  // Cierra el hueco de eventos perdidos durante una desconexión real.
  useSocketReconectado(cargar);

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