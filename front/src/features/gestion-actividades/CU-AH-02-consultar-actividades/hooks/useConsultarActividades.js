import { useCallback, useEffect, useState } from "react";
import { getActividadesAlumno } from "@/services/ahAlumnoService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Los 5 eventos que Parte 2 emite al alumno dueño de la actividad — ante
// cualquiera de ellos, refetch completo (payloads chicos, prioriza
// simplicidad/confiabilidad sobre merge local — mismo criterio para AH02).
const EVENTOS_ACTIVIDAD = [
  "actividad:creada",
  "actividad:editada",
  "actividad:fecha_extendida",
  "actividad:eliminada",
  "actividad:vencida",
];

// RN-AH-10: activas primero, luego las que ya no requieren acción del
// alumno (vencida y ambas variantes de completada van al final, sin
// desempate secundario entre ellas).
const ESTADO_ORDEN = {
  en_progreso: 0,
  sin_comenzar: 1,
  vencida: 2,
  completada_a_tiempo: 2,
  completada_tarde: 2,
};

const ESTADOS_COMPLETADA = ["completada_a_tiempo", "completada_tarde"];

export function useConsultarActividades() {
  const [actividades, setActividades]   = useState([]);
  const [fechaInicio, setFechaInicio]   = useState(null);
  const [servicioIniciado, setServicioIniciado] = useState(true);
  const [cargando, setCargando]         = useState(true);
  const [seleccionada, setSelec]        = useState(null);
  const [filtro, setFiltro]             = useState("todas");
  const { socket } = useSocket();

  const cargar = useCallback(() => {
    return getActividadesAlumno()
      .then((data) => {
        setActividades(data.actividades ?? []);
        setFechaInicio(data.fechaInicio ?? null);
        setServicioIniciado(!!data.servicioIniciado);
      })
      .catch((err) => console.error("No se pudieron cargar las actividades:", err));
  }, []);

  // Carga única al montar — esta sí debe mostrar "Cargando...".
  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  // Socket — reemplaza el polling de 120s. Ante cualquiera de los 5
  // eventos de actividad emitidos a este alumno, refetch completo. NUNCA
  // toca `cargando`: no debe ocultar la lista ya pintada.
  useEffect(() => {
    if (!socket) return;

    const handler = () => cargar();
    EVENTOS_ACTIVIDAD.forEach((evento) => socket.on(evento, handler));
    return () => {
      EVENTOS_ACTIVIDAD.forEach((evento) => socket.off(evento, handler));
    };
  }, [socket, cargar]);

  // Cierra el hueco de eventos perdidos durante una desconexión real.
  useSocketReconectado(cargar);

  const filtradas = actividades
    .filter(a => {
      if (filtro === "todas") return true;
      if (filtro === "completadas") return ESTADOS_COMPLETADA.includes(a.estado);
      return a.estado === filtro;
    })
    .sort((a, b) => (ESTADO_ORDEN[a.estado] ?? 9) - (ESTADO_ORDEN[b.estado] ?? 9));

  const totales = {
    todas: actividades.length,
    sin_comenzar: actividades.filter(a => a.estado === "sin_comenzar").length,
    en_progreso: actividades.filter(a => a.estado === "en_progreso").length,
    vencida: actividades.filter(a => a.estado === "vencida").length,
    completadas: actividades.filter(a => ESTADOS_COMPLETADA.includes(a.estado)).length,
  };

  return {
    filtradas, seleccionada, setSelec, filtro, setFiltro, totales,
    cargando, fechaInicio, servicioIniciado,
  };
}
