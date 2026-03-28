import { useState } from "react";

const MOCK_ALUMNOS = [
  {
    id: 1,
    estado: "EsperandoCartaPresencial",
    alumno: {
      nombre:   "García López Juan Carlos",
      boleta:   "2021630412",
      carrera:  "ISC",
      correoInst: "jgarcia0412@alumno.ipn.mx",
    },
    profesor: "Dr. Torres Vega",
    vacante:  "Desarrollo de plataforma web institucional",
    periodoInicio: "2026-03-02",
    periodoFin:    "2026-10-02",
  },
  {
    id: 2,
    estado: "EsperandoCartaPresencial",
    alumno: {
      nombre:   "Ramírez Torres Ana Sofía",
      boleta:   "2022630187",
      carrera:  "IA",
      correoInst: "aramirez0187@alumno.ipn.mx",
    },
    profesor: "Mtra. López Hernández",
    vacante:  "Sistema de análisis de datos académicos",
    periodoInicio: "2026-03-02",
    periodoFin:    "2026-10-02",
  },
];

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useValidarEntregaPresencial() {
  const [alumnos, setAlumnos]         = useState(MOCK_ALUMNOS);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);

  const verDetalle = (alumno) => {
    setSeleccionado(alumno);
    setResultado(null);
  };

  const cerrar = () => setSeleccionado(null);

  // RN-GR-38, RN-GR-39, RN-GR-40: solo coordinación registra recepción
  const registrarRecepcion = async (id) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    setAlumnos(prev =>
      prev.map(a => a.id === id ? { ...a, estado: "CartaCompromisoRecibida" } : a)
    );

    const nombre = alumnos.find(a => a.id === id)?.alumno.nombre ?? "";
    setResultado({ nombre });
    setSeleccionado(null);
    setLoading(false);
  };

  const pendientes = alumnos.filter(a => a.estado === "EsperandoCartaPresencial");

  return { pendientes, seleccionado, loading, resultado, verDetalle, cerrar, registrarRecepcion, CARRERA_LABEL };
}
