import { useState } from "react";

// Mock — RN-AH-08: solo actividades del profesor supervisor
const MOCK_ACTIVIDADES = [
  {
    id: 1,
    titulo:          "Análisis de requerimientos",
    descripcion:     "Levantar requerimientos del sistema con el cliente mediante entrevistas y talleres de trabajo.",
    entregable:      "Documento de requerimientos en formato IEEE 830",
    estado:          "En progreso",
    progreso:        60,
    fechaAsignacion: "2026-03-15T09:00:00",
    fechaLimite:     "2026-03-25T17:00:00",

  },
  {
    id: 2,
    titulo:          "Diseño de base de datos",
    descripcion:     "Modelar el esquema de la base de datos del sistema usando notación ER.",
    entregable:      "Diagrama ER y script SQL de creación de tablas",
    estado:          "Sin comenzar",
    progreso:        0,
    fechaAsignacion: "2026-03-18T10:00:00",
    fechaLimite:     "2026-03-28T17:00:00",

  },
  {
    id: 3,
    titulo:          "Investigación de frameworks frontend",
    descripcion:     "Comparar al menos tres frameworks frontend para seleccionar el más adecuado para el proyecto.",
    entregable:      "Documento comparativo con conclusión justificada",
    estado:          "Completada",
    progreso:        100,
    fechaAsignacion: "2026-03-10T08:00:00",
    fechaLimite:     "2026-03-20T17:00:00",
  },
];

const ESTADO_ORDEN = { "En progreso": 0, "Sin comenzar": 1, "Completada": 2 };

export function useConsultarActividades() {
  const [actividades]           = useState(MOCK_ACTIVIDADES);
  const [seleccionada, setSelec] = useState(null);
  const [filtro, setFiltro]      = useState("todas");

  const filtradas = actividades
    .filter(a => filtro === "todas" || a.estado === filtro)
    .sort((a, b) => (ESTADO_ORDEN[a.estado] ?? 9) - (ESTADO_ORDEN[b.estado] ?? 9));

  const totales = {
    todas:         actividades.length,
    "Sin comenzar": actividades.filter(a => a.estado === "Sin comenzar").length,
    "En progreso":  actividades.filter(a => a.estado === "En progreso").length,
    "Completada":   actividades.filter(a => a.estado === "Completada").length,
  };

  return { filtradas, seleccionada, setSelec, filtro, setFiltro, totales };
}
