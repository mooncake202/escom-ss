import { useState, useEffect } from "react";
import { getSolicitudesPendientes, decidirSolicitud } from "@/services/profesorSolicitudesService";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

const RUTA_PANTALLA = "/profesor/solicitudes";

export function useSolicitudesPendientes() {
  const [solicitudes, setSolicitudes]     = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [seleccionada, setSeleccionada]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [resultado, setResultado]         = useState(null);
  const [alertasCupos, setAlertasCupos]   = useState([]);
  const { socket } = useSocket();

  const cargar = () => {
    getSolicitudesPendientes()
      .then(setSolicitudes)
      .catch((err) => console.error(err))
      .finally(() => setCargandoLista(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  // Excepción E3 (CU-GR-02): si el rechazo automático del resto de
  // solicitudes por cupos cubiertos falló incluso tras reintentar, el
  // backend persiste una notificación 'urgente' con
  // ruta_relacionada='/profesor/solicitudes' en vez de avisar por la
  // respuesta síncrona de aceptar (que ya se envió). Se trae al montar Y
  // después de cada aceptación (única decisión que puede disparar E3) — el
  // montaje solo no basta, porque E3 se genera mientras la pantalla ya está
  // abierta, como consecuencia directa de aceptar, no de recargarla.
  const cargarAlertasCupos = () => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter(
          (n) => n.tipo === "urgente" && n.ruta_relacionada?.startsWith(RUTA_PANTALLA)
        );
        setAlertasCupos(propias);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    cargarAlertasCupos();
  }, []);

  const descartarAlerta = (id) => {
    setAlertasCupos((prev) => prev.filter((a) => a.id !== id));
    marcarNotificacionLeida(id).catch((err) => console.error(err));
  };

  // Socket — reemplaza el polling de 120s. 'solicitud:aceptada'/'rechazada'/
  // 'rechazada_por_cupos' se emiten solo al ALUMNO (Parte 2), nunca al
  // profesor — las propias decisiones de este profesor ya refrescan local
  // (ver `decidir` más abajo). El único evento real dirigido al profesor
  // en esta pantalla es 'solicitud:nueva'.
  useEffect(() => {
    if (!socket) return;

    socket.on("solicitud:nueva", cargar);
    return () => socket.off("solicitud:nueva", cargar);
  }, [socket]);

  // Cierra el hueco de eventos perdidos durante una desconexión real.
  useSocketReconectado(cargar);

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
      const { estado_solicitud } = await decidirSolicitud(id, decision);
      const nombre = solicitudes.find(s => s.id === id)?.nombre ?? "";
      // El backend puede rechazar automáticamente una aceptación (cupo del
      // profesor agotado) sin que eso sea un error HTTP — el resultado real
      // se lee de estado_solicitud, nunca se asume a partir de `decision`.
      setResultado({ tipo: estado_solicitud, nombre });
      setSeleccionada(null);
      // RN-GR-11: si aceptar esta solicitud cubrió los cupos, el backend ya
      // rechazó automáticamente las demás pendientes de esa oferta — se
      // vuelve a pedir la lista completa (no solo quitar esta tarjeta) para
      // que esas otras también desaparezcan de la pantalla.
      cargar();
      // Excepción E3: solo aceptar puede haber disparado el rechazo automático
      // por cupos (y su posible notificación de fallo) — rechazar nunca toca
      // cupos_disponibles, así que no hace falta reconsultar en ese caso.
      if (estado_solicitud === 'aceptada_por_profesor') {
        cargarAlertasCupos();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendientes: solicitudes, cargandoLista, seleccionada, loading, resultado,
    verDetalle, cerrarDetalle, decidir,
    alertasCupos, descartarAlerta,
  };
}