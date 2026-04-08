import { useState, useEffect, useRef } from "react";

const MOCK_ALUMNO = {
  horasAcumuladas: 124,
  horasDeuda:       0,
  horasTotales:   480,
  jornada: null,
};

const MOCK_ACTIVIDADES = [
  { id: 1, titulo: "Análisis de requerimientos",  estado: "En progreso" },
  { id: 2, titulo: "Diseño de base de datos",      estado: "En progreso" },
  { id: 3, titulo: "Investigación de frameworks",  estado: "En progreso" },
];

const ACTIVIDADES_VALIDAS = MOCK_ACTIVIDADES.filter(
  a => a.estado === "Asignada" || a.estado === "En progreso" || a.estado === "Sin comenzar"
);

function calcularLimite(horasDeuda) {
  return horasDeuda > 0 ? 4 : 4;
}

function segundosAHHMM(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useRegistrarBitacora() {
  const [alumno]              = useState(MOCK_ALUMNO);
  const [jornada, setJornada]   = useState(null);
  const [segundos, setSegundos] = useState(0);
  const [fase, setFase]         = useState("inicio");
  const [loading, setLoading]   = useState(false);

  // Campos generales de la bitácora
  const [form, setForm] = useState({ descripcion: "", evidencia: "" });

  // Lista de actividades trabajadas con su avance individual — RN-AH-13
  const [avances, setAvances] = useState([{ actividadId: "", progreso: 0 }]);

  const [errores, setErrores] = useState({});
  const intervalRef = useRef(null);

  const limiteHoras = calcularLimite(alumno.horasDeuda);
  const limiteSeg   = limiteHoras * 3600;

  useEffect(() => {
    if (fase === "activa") {
      intervalRef.current = setInterval(() => {
        setSegundos(prev => {
          const siguiente = prev + 1;
          if (siguiente >= limiteSeg) {
            clearInterval(intervalRef.current);
            setFase("formulario");
            return limiteSeg;
          }
          return siguiente;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [fase, limiteSeg]);

  const iniciarJornada = () => {
    setJornada({ horaInicio: new Date(), limiteSeg });
    setSegundos(0);
    setFase("activa");
  };

  const finalizarJornada = () => {
    clearInterval(intervalRef.current);
    setFase("formulario");
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrores(prev => ({ ...prev, [e.target.name]: null }));
  };

  // Manejo de la lista de avances
  const agregarAvance = () => {
    setAvances(prev => [...prev, { actividadId: "", progreso: 0 }]);
  };

  const quitarAvance = (idx) => {
    setAvances(prev => prev.filter((_, i) => i !== idx));
    setErrores(prev => { const e = { ...prev }; delete e[`avance_${idx}`]; return e; });
  };

  const cambiarAvance = (idx, campo, valor) => {
    setAvances(prev => prev.map((av, i) => i === idx ? { ...av, [campo]: valor } : av));
    setErrores(prev => ({ ...prev, [`avance_${idx}`]: null, avances: null }));
  };

  // RN-AH-13: validar lista de avances + descripción + evidencia
  const validar = () => {
    const errs = {};

    // Al menos una actividad seleccionada
    if (avances.length === 0) {
      errs.avances = "Agrega al menos una actividad";
    }

    avances.forEach((av, idx) => {
      if (!av.actividadId) errs[`avance_${idx}`] = "Selecciona una actividad";
    });

    if (!form.descripcion.trim()) errs.descripcion = "Describe el trabajo realizado";
    if (!form.evidencia.trim())   errs.evidencia   = "Agrega un enlace o descripción de entrega";

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const horasTrabajadas = Math.floor(segundos / 3600);

  const registrarBitacora = async () => {
    if (!validar()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setFase("enviado");
    setLoading(false);
  };

  const porcentajeJornada = Math.min((segundos / limiteSeg) * 100, 100);
  const tiempoRestante    = Math.max(limiteSeg - segundos, 0);

  return {
    alumno, jornada, fase, segundos, form, avances, errores, loading,
    limiteHoras, horasTrabajadas, porcentajeJornada, tiempoRestante,
    actividades: ACTIVIDADES_VALIDAS,
    iniciarJornada, finalizarJornada,
    handleChange, agregarAvance, quitarAvance, cambiarAvance,
    registrarBitacora, segundosAHHMM,
  };
}