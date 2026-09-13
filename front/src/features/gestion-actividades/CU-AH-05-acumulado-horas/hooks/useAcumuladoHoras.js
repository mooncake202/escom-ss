import { useCallback, useEffect, useState } from "react";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";
import { getAcumuladoPropio } from "@/services/ahAlumnoService";
import { getAcumuladoAlumnos } from "@/services/ahProfesorService";
import { getAcumuladoProfesores } from "@/services/ahCoordinadorService";

// El backend ya manda horasRealizadas/horasRestantes/porcentajeAvance
// calculados (calcularHorasNetas/LIMITE_HORAS_SERVICIO, ah.shared.js) — no
// se vuelve a calcular aquí, solo se renombra a los nombres que
// ProgresoHoras.jsx ya consume (porcentaje, faltasSeguidas, faltasTotal).
function normalizarAlumno(raw) {
  return {
    ...raw,
    id: raw.boleta,
    porcentaje: raw.porcentajeAvance,
    faltasSeguidas: raw.faltasConsecutivas,
    faltasTotal: raw.faltasAcumuladas,
  };
}

export function useAcumuladoHoras(rolInterno) {
  const [propio, setPropio] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      if (rolInterno === "alumno") {
        const raw = await getAcumuladoPropio();
        setPropio(normalizarAlumno(raw));
      } else if (rolInterno === "profesor") {
        const raw = await getAcumuladoAlumnos();
        setAlumnos(raw.map(normalizarAlumno));
      } else if (rolInterno === "coordinacion") {
        const raw = await getAcumuladoProfesores();
        setProfesores(raw.map((p) => ({ ...p, alumnos: p.alumnos.map(normalizarAlumno) })));
      }
    } catch (err) {
      console.error("Error al cargar acumulado de horas:", err);
    } finally {
      setCargando(false);
    }
  }, [rolInterno]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Socket — mismo patrón ya usado en dashboards.jsx (EVENTOS_POR_ROL).
  // Coordinador no tiene hoy ninguna emisión de resumen:actualizado (ningún
  // flujo del proyecto lo dispara para ese rol) — no se agrega ningún
  // evento nuevo, la vista de coordinación solo refresca al entrar/recargar.
  useEffect(() => {
    if (!socket || rolInterno === "coordinacion") return;
    socket.on("resumen:actualizado", cargar);
    return () => socket.off("resumen:actualizado", cargar);
  }, [socket, rolInterno, cargar]);

  useSocketReconectado(rolInterno === "coordinacion" ? () => {} : cargar);

  return { propio, alumnos, profesores, cargando };
}
