import { useState } from "react";

const MOCK_SOLICITUDES = [
  {
    id: 1,
    estado: "DocumentacionPendiente",
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
    registroSISS:  true, // alumno confirmó registro en SISS
    fechaEnvio:    "2026-03-14T10:22:00",
    documentos: {
      cartaCreditos: { nombre: "carta_creditos_garcia.pdf", tamaño: "245 KB" },
      seguroSocial:  { nombre: "seguro_social_garcia.pdf",  tamaño: "189 KB" },
      dictamen:      null,
    },
  },
  {
    id: 2,
    estado: "DocumentacionPendiente",
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
    registroSISS:  true,
    fechaEnvio:    "2026-03-14T15:45:00",
    documentos: {
      cartaCreditos: { nombre: "carta_creditos_ramirez.pdf", tamaño: "312 KB" },
      seguroSocial:  { nombre: "seguro_ramirez.pdf",         tamaño: "201 KB" },
      dictamen:      { nombre: "dictamen_ramirez.pdf",        tamaño: "98 KB" },
    },
  },
  {
    id: 3,
    estado: "DocumentacionPendiente",
    alumno: {
      nombre:        "Ramírez Torres Ana Pau",
      boleta:        "2022630187",
      carrera:       "IA",
      correoInst:    "aramirez0187@alumno.ipn.mx",
      correoPersonal:"ana.ramirez@hotmail.com",
      telefono:      "5598765432",
      creditos:      85,
    },
    profesor:      "Mtra. López Hernández",
    vacante:       "Sistema de análisis de datos académicos",
    registroSISS:  true,
    fechaEnvio:    "2026-03-14T15:45:00",
    documentos: {
      cartaCreditos: { nombre: "carta_creditos_ramirez.pdf", tamaño: "312 KB" },
      seguroSocial:  { nombre: "seguro_ramirez.pdf",         tamaño: "201 KB" },
      dictamen:      { nombre: "dictamen_ramirez.pdf",        tamaño: "98 KB" },
    },
  },
];

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useRevisarDocumentacion() {
  const [solicitudes, setSolicitudes] = useState(MOCK_SOLICITUDES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [comentario, setComentario]     = useState("");
  const [modoRechazo, setModoRechazo]   = useState(false);

  const verDetalle = (s) => {
    setSeleccionada(s);
    setResultado(null);
    setComentario("");
    setModoRechazo(false);
  };

  const cerrar = () => {
    setSeleccionada(null);
    setModoRechazo(false);
    setComentario("");
  };

  // RN-GR-30: registrar decisión de coordinación
  const decidir = async (id, decision) => {
    if (decision === "rechazar" && !comentario.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const nuevoEstado = decision === "aceptar"
      ? "DocumentacionValidada"
      : "DocumentacionRechazada";

    setSolicitudes(prev =>
      prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s)
    );

    const nombre = solicitudes.find(s => s.id === id)?.alumno.nombre ?? "";
    setResultado({ tipo: decision, nombre });
    setSeleccionada(null);
    setModoRechazo(false);
    setComentario("");
    setLoading(false);
  };

  const pendientes = solicitudes.filter(s => s.estado === "DocumentacionPendiente");

  return {
    pendientes, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, CARRERA_LABEL,
  };
}
