import { useCallback, useEffect, useState } from "react";
import {
  getEvaluacionesPendientesDictamen,
  dictaminarAprobado,
  dictaminarRechazado,
  descargarParaRevision,
} from "@/services/lssCoordinadorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

function mapearAlumno(ev) {
  return {
    id: ev.evaluacionId,
    nombre: ev.nombreCompleto,
    profesor: ev.profesorNombre,
    proyecto: ev.oferta,
    fechaEnvío: ev.fechaEnvio
      ? new Date(ev.fechaEnvio).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
      : "",
    // Todo lo que llega de listarEvaluacionesPendientesDictamen ya está en
    // pendiente_dictamen — el profesor SIEMPRE firmó para llegar aquí.
    firmadoProfesor: true,
    // Punto 6: elección original del alumno en CU-LSS-01 — recordatorio
    // informativo para que coordinación verifique manualmente en SISS
    // antes de aprobar (no bloquea nada, solo contexto).
    reportesValidadosSiss: !!ev.reportesValidadosSiss,
  };
}

export function useFirmarEvaluacionCoordinacion() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const { socket } = useSocket();

  const [estado, setEstado] = useState({
    firmadoProfesor: false,
    firmadoCoordinacion: false,
    rechazado: false,
  });

  const cargar = useCallback(async () => {
    try {
      const data = await getEvaluacionesPendientesDictamen();
      const mapeados = data.map(mapearAlumno);
      setAlumnos(mapeados);
      setError(null);
      // Si el alumno ya fue dictaminado (aprobado o rechazado), sale de la
      // lista — se refleja como "ya no hay nada pendiente de él" cerrando
      // la selección, en vez de dejar una vista obsoleta abierta.
      setAlumnoSeleccionado((prev) => {
        if (!prev) return prev;
        return mapeados.find((a) => a.id === prev.id) || null;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de evaluaciones.");
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

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setEstado({
      firmadoProfesor: alumno.firmadoProfesor,
      firmadoCoordinacion: false,
      rechazado: false,
      reportesValidadosSiss: alumno.reportesValidadosSiss,
    });
  };

  const firmar = async () => {
    if (!estado.firmadoProfesor || !alumnoSeleccionado) return;

    setAccionEnCurso(true);
    setError(null);
    try {
      await dictaminarAprobado(alumnoSeleccionado.id);
      setEstado((prev) => ({ ...prev, firmadoCoordinacion: true }));
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo aprobar la evaluación.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  // Bug corregido: el hook original no exportaba esta función pese a que
  // los componentes ya la destructuraban (VistaCoordinacion la llama como
  // onRechazar(motivo)).
  const rechazar = async (motivo) => {
    if (!alumnoSeleccionado) return;
    const motivoLimpio = motivo?.trim();
    if (!motivoLimpio) {
      setError("Escribe el motivo del rechazo antes de confirmar.");
      return;
    }

    setAccionEnCurso(true);
    setError(null);
    try {
      await dictaminarRechazado(alumnoSeleccionado.id, motivoLimpio);
      setEstado((prev) => ({ ...prev, rechazado: true }));
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo rechazar la evaluación.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  const descargarPdf = async () => {
    if (!alumnoSeleccionado) return;
    setError(null);
    try {
      await descargarParaRevision(alumnoSeleccionado.id);
    } catch (err) {
      setError(err.message || "No se pudo descargar la evaluación.");
    }
  };

  return {
    alumnos,
    cargando,
    error,
    accionEnCurso,
    alumnoSeleccionado,
    seleccionarAlumno,
    estado,
    firmar,
    rechazar,
    descargarPdf,
    // Puntos 1+2: expuesto para el botón "Reintentar" de la pantalla de
    // listado — antes, un fallo en la carga inicial dejaba `alumnos` vacío
    // sin ningún indicio visible (el `error` solo se mostraba dentro del
    // panel de detalle, que no existe si no hay nada que seleccionar).
    reintentar: cargar,
  };
}
