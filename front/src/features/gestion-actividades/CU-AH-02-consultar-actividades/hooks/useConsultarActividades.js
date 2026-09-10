import { useEffect, useState } from "react";
import { getActividadesAlumno } from "@/services/ahAlumnoService";

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

  // Carga única al montar — esta sí debe mostrar "Cargando...".
  useEffect(() => {
    getActividadesAlumno()
      .then((data) => {
        setActividades(data.actividades ?? []);
        setFechaInicio(data.fechaInicio ?? null);
        setServicioIniciado(!!data.servicioIniciado);
      })
      .catch((err) => console.error("No se pudieron cargar las actividades:", err))
      .finally(() => setCargando(false));
  }, []);

  // Polling de 120s (mismo intervalo/patrón que GR) — así el alumno ve
  // reflejado sin recargar cuando el cron marque una actividad 'vencida'.
  // NUNCA toca `cargando`: no debe ocultar la lista ya pintada.
  useEffect(() => {
    const intervalo = setInterval(() => {
      getActividadesAlumno()
        .then((data) => {
          setActividades(data.actividades ?? []);
          setFechaInicio(data.fechaInicio ?? null);
          setServicioIniciado(!!data.servicioIniciado);
        })
        .catch((err) => console.error("Error al refrescar las actividades:", err));
    }, 120000);
    return () => clearInterval(intervalo);
  }, []);

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
