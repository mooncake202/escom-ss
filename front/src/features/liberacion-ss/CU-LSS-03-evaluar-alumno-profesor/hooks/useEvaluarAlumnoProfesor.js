import { useCallback, useEffect, useState } from "react";
import {
  getAlumnosConEvaluacionPendiente,
  registrarEvaluacion,
  rechazarPorSiss,
  corregirYReenviar,
} from "@/services/lssProfesorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados de evaluacion_desempeno (ver backend/src/modules/lss/lss.shared.js)
// que significan "ya enviada, en modo lectura" para el profesor.
const ESTADOS_YA_ENVIADA = ["pendiente_dictamen", "aprobado_coordinador"];

function mapearAlumno(a) {
  return {
    // `id` = boleta: es el identificador real que usan los endpoints, y
    // ListaAlumnos/FirmaPanel solo lo usan para seleccionar/comparar, nunca
    // como boleta "de mentiras" como en el mock original.
    id: a.boleta,
    boleta: a.boleta,
    nombre: a.nombreCompleto,
    proyecto: a.oferta,
    fechaEnvío: a.fechaInicio
      ? new Date(a.fechaInicio).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
      : "",
    requiereValidacion: !a.reportesValidadosSiss,
    // Elección original del alumno en CU-LSS-01 — se muestra tal cual al
    // profesor como texto informativo, no solo se usa para calcular
    // requiereValidacion.
    reportesValidadosSissAlumno: !!a.reportesValidadosSiss,
    estadoEvaluacion: a.estadoEvaluacion,
    // CU-LSS-04: motivo por el que coordinación devolvió la evaluación —
    // solo tiene valor cuando estadoEvaluacion === 'devuelta_para_correccion'.
    // Distinto del motivo de rechazo por SISS (ese nunca llega aquí: un
    // alumno rechazado por SISS desaparece de esta lista hasta que él
    // mismo reenvíe, CU-LSS-02).
    motivoRechazoCoordinacion: a.motivoRechazoCoordinacion,
  };
}

export function useEvaluarAlumnoProfesor() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const { socket } = useSocket();

  const [estado, setEstado] = useState({
    evaluacion: null,
    firmadoProfesor: false,
    requiereValidacion: false,
    // Confirmación del PROFESOR de que los reportes del alumno están
    // validados en SISS (RN-LSS-09) — control SIEMPRE visible en el
    // formulario, independiente de si el alumno pidió o no que el
    // profesor los valide (eso solo decide si además se muestra el aviso
    // con el link a la plataforma SISS).
    reportesSissConfirmados: false,
  });

  const cargar = useCallback(async () => {
    try {
      const data = await getAlumnosConEvaluacionPendiente();
      const mapeados = data.map(mapearAlumno);
      setAlumnos(mapeados);
      setError(null);
      // Si el alumno seleccionado sigue en la lista, refresca su estado
      // (ej. tras firmar, para que "Firmada" se refleje sin reseleccionar).
      setAlumnoSeleccionado((prev) => {
        if (!prev) return prev;
        return mapeados.find((a) => a.id === prev.id) || prev;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de alumnos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mismo patrón ya usado en CU-LSS-02: 'resumen:actualizado' es genérico
  // (fail-open en el backend), aquí dispara un refetch completo de la lista.
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
      evaluacion: null,
      firmadoProfesor: ESTADOS_YA_ENVIADA.includes(alumno.estadoEvaluacion),
      requiereValidacion: alumno.requiereValidacion,
      reportesSissConfirmados: false,
    });
  };

  const marcarReportesSissConfirmados = () => {
    setEstado((prev) => ({ ...prev, reportesSissConfirmados: !prev.reportesSissConfirmados }));
  };

  // Solo guarda en memoria (borrador) — el envío real ocurre al firmar.
  const guardar = (data) => {
    setEstado((prev) => ({ ...prev, evaluacion: data }));
  };

  const firmar = async () => {
    if (!estado.reportesSissConfirmados) return;
    if (!estado.evaluacion) {
      setError("Completa los 7 factores de la evaluación antes de firmar.");
      return;
    }
    if (!alumnoSeleccionado) return;

    setAccionEnCurso(true);
    setError(null);
    try {
      const payload = {
        observacionesProfesor: estado.evaluacion.observaciones,
        reportesSissConfirmados: true,
        valores: estado.evaluacion.valores,
      };
      if (alumnoSeleccionado.estadoEvaluacion === "devuelta_para_correccion") {
        await corregirYReenviar(alumnoSeleccionado.boleta, payload);
      } else {
        await registrarEvaluacion(alumnoSeleccionado.boleta, payload);
      }
      await cargar();
      setEstado((prev) => ({ ...prev, firmadoProfesor: true }));
    } catch (err) {
      setError(err.message || "No se pudo registrar la evaluación.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  // Alterno 3.1: `motivo` viene de FirmaPanel (su propio cuadro "Motivo del
  // rechazo", separado del "Observaciones" de FormEvaluacion — mismo campo
  // de BD, observaciones_profesor, pero interfaz distinta).
  const rechazar = async (motivo) => {
    if (!alumnoSeleccionado) return;
    const motivoLimpio = motivo?.trim();
    if (!motivoLimpio) {
      setError('Escribe el motivo del rechazo antes de rechazar.');
      return;
    }

    setAccionEnCurso(true);
    setError(null);
    try {
      await rechazarPorSiss(alumnoSeleccionado.boleta, motivoLimpio);
      await cargar();
      setAlumnoSeleccionado(null);
    } catch (err) {
      setError(err.message || "No se pudo rechazar la evaluación.");
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
    estado,
    guardar,
    firmar,
    rechazar,
    marcarReportesSissConfirmados,
  };
}
