import { useState, useEffect, useRef, useCallback } from "react";
import {
  getEstadoJornada,
  iniciarJornadaApi,
  finalizarJornadaApi,
  cancelarJornadaApi,
  confirmarBitacoraApi,
} from "@/services/ahAlumnoService";

function segundosAHHMM(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const AVANCE_VACIO = { actividadId: "", progreso: 0, descripcion: "", evidencia: "" };

const MENSAJES_BLOQUEO = {
  sinActividades: "No tienes actividades asignadas. Tu profesor debe asignarte al menos una antes de que puedas registrar bitácora.",
  limiteHorasAlcanzado: "Ya completaste las 480 horas de tu servicio social.",
  noEsDiaLaborable: "Hoy no es día laborable (fin de semana, día inhábil o periodo vacacional). No puedes iniciar una jornada.",
  yaRegistroHoy: "Ya registraste tu bitácora de hoy. Vuelve mañana para registrar tu siguiente jornada.",
};

export function useRegistrarBitacora() {
  const [cargando, setCargando]   = useState(true);
  const [fase, setFase]           = useState("cargando");
  const [estado, setEstado]       = useState(null);
  const [actividades, setActividades] = useState([]);
  const [segundos, setSegundos]   = useState(0);
  const [avances, setAvances]     = useState([{ ...AVANCE_VACIO }]);
  const [errores, setErrores]     = useState({});
  const [loading, setLoading]     = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const intervalRef = useRef(null);

  const limiteHoras = estado?.limiteHoras ?? 4;
  const limiteSeg = limiteHoras * 3600;

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoJornada();
      setEstado(data);
      setActividades(data.actividades ?? []);
      setFase(data.fase);
      if (data.fase === "activa" && data.horaInicio) {
        const transcurridos = Math.floor((Date.now() - new Date(data.horaInicio).getTime()) / 1000);
        setSegundos(Math.min(Math.max(transcurridos, 0), (data.limiteHoras ?? 4) * 3600));
      }
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo cargar tu jornada.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (fase === "activa") {
      intervalRef.current = setInterval(() => {
        setSegundos((prev) => {
          const siguiente = prev + 1;
          if (siguiente >= limiteSeg) {
            clearInterval(intervalRef.current);
            finalizarJornada();
            return limiteSeg;
          }
          return siguiente;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, limiteSeg]);

  const iniciarJornada = async () => {
    setErrorEnvio(null);
    try {
      const data = await iniciarJornadaApi();
      setSegundos(0);
      setFase("activa");
      setEstado((prev) => ({ ...prev, horaInicio: data.horaInicio, limiteHoras: data.limiteHoras }));
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo iniciar la jornada.");
      cargar();
    }
  };

  const finalizarJornada = async () => {
    clearInterval(intervalRef.current);
    setErrorEnvio(null);
    try {
      const data = await finalizarJornadaApi();
      setEstado((prev) => ({ ...prev, horasContabilizadas: data.horasContabilizadas }));
      setFase("formulario");
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo finalizar la jornada.");
      cargar();
    }
  };

  const cancelarJornada = async () => {
    setErrorEnvio(null);
    try {
      await cancelarJornadaApi();
      clearInterval(intervalRef.current);
      setSegundos(0);
      setFase("inicio");
      setEstado((prev) => ({ ...prev, bitacoraId: null, horaInicio: null, pendienteDatos: false }));
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo descartar la jornada.");
      cargar();
    }
  };

  const agregarAvance = () => {
    setAvances((prev) => [...prev, { ...AVANCE_VACIO }]);
  };

  const quitarAvance = (idx) => {
    setAvances((prev) => prev.filter((_, i) => i !== idx));
    setErrores((prev) => {
      const e = { ...prev };
      delete e[`avance_${idx}_actividad`];
      delete e[`avance_${idx}_descripcion`];
      delete e[`avance_${idx}_evidencia`];
      return e;
    });
  };

  const cambiarAvance = (idx, campo, valor) => {
    setAvances((prev) => prev.map((av, i) => (i === idx ? { ...av, [campo]: valor } : av)));
    setErrores((prev) => ({ ...prev, [`avance_${idx}_${campo === "actividadId" ? "actividad" : campo}`]: null, avances: null }));
  };

  const validar = () => {
    const errs = {};

    if (avances.length === 0) {
      errs.avances = "Agrega al menos una actividad";
    }

    avances.forEach((av, idx) => {
      if (!av.actividadId) errs[`avance_${idx}_actividad`] = "Selecciona una actividad";
      if (!av.descripcion.trim()) errs[`avance_${idx}_descripcion`] = "Describe el trabajo realizado en esta actividad";
      if (!av.evidencia.trim()) errs[`avance_${idx}_evidencia`] = "Agrega evidencia de esta actividad";
    });

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const horasContabilizadas = estado?.horasContabilizadas ?? limiteHoras;
  // horas_contabilizadas es siempre fija (HORAS_POR_JORNADA) una vez que la
  // jornada se finaliza (normal o por auto-cierre) — solo mientras el timer
  // sigue corriendo en fase "activa" tiene sentido derivarlo de `segundos`.
  const horasTrabajadas = fase === "activa" ? Math.floor(segundos / 3600) : horasContabilizadas;

  const registrarBitacora = async () => {
    if (!validar()) return;
    setLoading(true);
    setErrorEnvio(null);
    try {
      const payload = avances.map((av) => ({
        actividad_id: Number(av.actividadId),
        porcentaje_avance: Number(av.progreso),
        descripcion: av.descripcion.trim(),
        evidencia: av.evidencia.trim(),
      }));
      await confirmarBitacoraApi(payload);
      setFase("enviado");
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo registrar la bitácora.");
    } finally {
      setLoading(false);
    }
  };

  const porcentajeJornada = Math.min((segundos / limiteSeg) * 100, 100);
  const tiempoRestante = Math.max(limiteSeg - segundos, 0);

  const bloqueos = estado?.bloqueos ?? {};
  const mensajeBloqueo =
    (bloqueos.sinActividades && MENSAJES_BLOQUEO.sinActividades) ||
    (bloqueos.limiteHorasAlcanzado && MENSAJES_BLOQUEO.limiteHorasAlcanzado) ||
    (bloqueos.noEsDiaLaborable && MENSAJES_BLOQUEO.noEsDiaLaborable) ||
    (bloqueos.yaRegistroHoy && MENSAJES_BLOQUEO.yaRegistroHoy) ||
    null;

  return {
    cargando, fase, segundos, avances, errores, loading, errorEnvio,
    limiteHoras, horasTrabajadas, porcentajeJornada, tiempoRestante,
    actividades, bloqueos, mensajeBloqueo,
    pendienteDatos: !!estado?.pendienteDatos,
    horasContabilizadas,
    iniciarJornada, finalizarJornada, cancelarJornada,
    agregarAvance, quitarAvance, cambiarAvance,
    registrarBitacora, segundosAHHMM,
    recargar: cargar,
  };
}
