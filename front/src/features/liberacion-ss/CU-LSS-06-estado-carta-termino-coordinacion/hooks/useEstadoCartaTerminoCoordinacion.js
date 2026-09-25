import { useCallback, useEffect, useState } from "react";
import { listarSolicitudesCartaTermino, marcarCartaLista as marcarCartaListaApi } from "@/services/lssCoordinadorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// ——— ESTADOS POSIBLES POR ALUMNO (carta_termino.estado, valores reales) ———
// "solicitada"         → Alumno solicitó carta, coordinación aún no la elabora
// "lista_para_recoger" → Coordinación marcó la carta como lista
// "recogida"           → Alumno confirmó que ya la recogió
// ————————————————————————————————————————————————————

// Mismo criterio que mapearAlumno en useFirmarEvaluacionCoordinacion.js
// (LSS-04): traduce los nombres reales de la API a los que ya usa el JSX
// del mockup, sin tocar el componente. `id` = liberacionProcesoId (la
// clave real que necesita marcarCartaListaParaRecoger).
function mapearAlumno(c) {
  return {
    id: c.liberacionProcesoId,
    nombre: c.nombreCompleto,
    estado: c.estado,
    proyecto: c.oferta,
    profesor: c.profesorNombre,
    fechaSolicitud: c.fechaSolicitud ? new Date(c.fechaSolicitud).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "",
    fechaEnvio: c.fechaDisponible ? new Date(c.fechaDisponible).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : null,
    fechaRecibido: c.fechaRecogida ? new Date(c.fechaRecogida).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : null,
  };
}

export function useEstadoCartaTerminoCoordinacion() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await listarSolicitudesCartaTermino();
      const mapeados = data.map(mapearAlumno);
      setAlumnos(mapeados);
      setError(null);
      // Mismo criterio que LSS-04: si el alumno seleccionado sigue en la
      // lista, refleja su estado actualizado; si ya no existe (no debería
      // pasar aquí, las filas no desaparecen), deja la selección como está.
      setAlumnoSeleccionado((prev) => {
        if (!prev) return prev;
        return mapeados.find((a) => a.id === prev.id) || prev;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de solicitudes de carta de término.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  const estadoAlumno = alumnos.find((a) => a.id === alumnoSeleccionado?.id)?.estado ?? null;

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
  };

  // Sin navigate() aquí a propósito: a diferencia del bug de LSS-02, esta
  // acción no cambia de pantalla — el coordinador se queda viendo la MISMA
  // lista, solo cambia el estado de un alumno dentro de ella. Un refetch
  // es correcto y suficiente (ya lo confirmamos en el plan).
  const marcarCartaListaAccion = async () => {
    if (!alumnoSeleccionado) return;
    setAccionEnCurso(true);
    setError(null);
    try {
      await marcarCartaListaApi(alumnoSeleccionado.id);
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo marcar la carta como lista.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  return {
    alumnos,
    cargando,
    error,
    accionEnCurso,
    alumnoSeleccionado,
    seleccionarAlumno,
    estadoAlumno,
    marcarCartaLista: marcarCartaListaAccion,
  };
}
