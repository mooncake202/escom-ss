import { useState } from "react";

const MOCK_EXPEDIENTES = [
  {
    id: 1,
    estado: "ExpedienteEnviado",
    fechaEnvio: "2026-03-20T10:30:00",
    alumno: {
      nombre:        "García López Juan Carlos",
      boleta:        "2021630412",
      carrera:       "ISC",
      correoInst:    "jgarcia0412@alumno.ipn.mx",
      correoPersonal:"juan.garcia@gmail.com",
      telefono:      "5512345678",
      creditos:      78,
    },
    profesor:      "Dr. Torres Vega",
    vacante:       "Desarrollo de plataforma web institucional",
    periodoInicio: "2026-03-02",
    periodoFin:    "2026-10-02",
    expediente: {
      nombre:         "GARCIA_LOPEZ_JUAN_CARLOS_2021630412.pdf",
      tamaño:         "1.8 MB",
      cartaCompromiso:  true,
      curp:             true,
      constanciaCreditos: true,
      dictamen:         false,
    },
  },
  {
    id: 2,
    estado: "ExpedienteEnviado",
    fechaEnvio: "2026-03-20T14:15:00",
    alumno: {
      nombre:        "Ramírez Torres Ana Sofía",
      boleta:        "2022630187",
      carrera:       "IA",
      correoInst:    "aramirez0187@alumno.ipn.mx",
      correoPersonal:"ana.ramirez@hotmail.com",
      telefono:      "5598765432",
      creditos:      85,
    },
    profesor:      "Mtra. López Hernández",
    vacante:       "Sistema de análisis de datos académicos",
    periodoInicio: "2026-03-02",
    periodoFin:    "2026-10-02",
    expediente: {
      nombre:           "RAMIREZ_TORRES_ANA_SOFIA_2022630187.pdf",
      tamaño:           "1.4 MB",
      cartaCompromiso:  true,
      curp:             true,
      constanciaCreditos: true,
      dictamen:         true,
    },
  },
];

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useRevisarExpediente() {
  const [expedientes, setExpedientes]   = useState(MOCK_EXPEDIENTES);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [comentario, setComentario]     = useState("");
  const [modoRechazo, setModoRechazo]   = useState(false);

  const verDetalle = (exp) => {
    setSeleccionado(exp);
    setResultado(null);
    setComentario("");
    setModoRechazo(false);
  };

  const cerrar = () => {
    setSeleccionado(null);
    setModoRechazo(false);
    setComentario("");
  };

  // RN-GR-52 al RN-GR-55
  const decidir = async (id, decision) => {
    if (decision === "rechazar" && !comentario.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const nuevoEstado = decision === "aprobar" ? "RegistroAprobado" : "ExpedienteRechazado";

    setExpedientes(prev =>
      prev.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e)
    );

    const nombre = expedientes.find(e => e.id === id)?.alumno.nombre ?? "";
    setResultado({ tipo: decision, nombre });
    setSeleccionado(null);
    setModoRechazo(false);
    setComentario("");
    setLoading(false);
  };

  const pendientes = expedientes.filter(e => e.estado === "ExpedienteEnviado");

  return {
    pendientes, seleccionado, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, CARRERA_LABEL,
  };
}
