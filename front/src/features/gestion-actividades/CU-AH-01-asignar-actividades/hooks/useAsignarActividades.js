import { useState } from "react";

// Mock de alumnos asignados al profesor — RN-AH-01
const MOCK_ALUMNOS = [
  {
    id: 1,
    nombre:   "García López Juan Carlos",
    boleta:   "2021630412",
    carrera:  "ISC",
    correoInst: "jgarcia0412@alumno.ipn.mx",
    actividades: [
      { id: 1, titulo: "Análisis de requerimientos", descripcion: "Levantar requerimientos del sistema con el cliente.", entregable: "Documento de requerimientos", estado: "En progreso", progreso: 60, fechaAsignacion: "2026-03-15T09:00:00" },
      { id: 2, titulo: "Diseño de base de datos", descripcion: "Modelar el esquema de la BD del sistema.", entregable: "Diagrama ER", estado: "Sin comenzar", progreso: 0, fechaAsignacion: "2026-03-18T10:00:00" },
    ],
  },
  {
    id: 2,
    nombre:   "Ramírez Torres Ana Sofía",
    boleta:   "2022630187",
    carrera:  "IA",
    correoInst: "aramirez0187@alumno.ipn.mx",
    actividades: [
      { id: 3, titulo: "Preparación del dataset", descripcion: "Limpiar y normalizar los datos para el modelo.", entregable: "Dataset limpio en CSV", estado: "Completada", progreso: 100, fechaAsignacion: "2026-03-10T08:00:00" },
    ],
  },
];

const FORM_INICIAL = { titulo: "", descripcion: "", entregable: "" };

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useAsignarActividades() {
  const [alumnos, setAlumnos]           = useState(MOCK_ALUMNOS);
  const [alumnoSeleccionado, setAlumno] = useState(null);
  const [form, setForm]                 = useState(FORM_INICIAL);
  const [errores, setErrores]           = useState({});
  const [loading, setLoading]           = useState(false);
  const [exitoso, setExitoso]           = useState(false);
  const [modoFormulario, setModoForm]   = useState(false);

  const seleccionarAlumno = (alumno) => {
    setAlumno(alumno);
    setModoForm(false);
    setExitoso(false);
    setForm(FORM_INICIAL);
    setErrores({});
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrores(prev => ({ ...prev, [e.target.name]: null }));
  };

  // RN-AH-03: título y descripción obligatorios, entregable opcional
  const validar = () => {
    const errs = {};
    if (!form.titulo.trim())      errs.titulo      = "El título es obligatorio";
    if (!form.descripcion.trim()) errs.descripcion = "La descripción es obligatoria";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // RN-AH-04: registra fecha y hora, RN-AH-07: estado inicial "Sin comenzar"
  const registrarActividad = async () => {
    if (!validar()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    const nueva = {
      id: Date.now(),
      titulo:          form.titulo.trim(),
      descripcion:     form.descripcion.trim(),
      entregable:      form.entregable.trim() || null,
      estado:          "Sin comenzar",
      progreso:        0,
      fechaAsignacion: new Date().toISOString(),
    };

    setAlumnos(prev => prev.map(a =>
      a.id === alumnoSeleccionado.id
        ? { ...a, actividades: [...a.actividades, nueva] }
        : a
    ));

    // Actualizar alumno seleccionado con la nueva actividad
    setAlumno(prev => ({ ...prev, actividades: [...prev.actividades, nueva] }));

    setForm(FORM_INICIAL);
    setModoForm(false);
    setExitoso(true);
    setLoading(false);

    setTimeout(() => setExitoso(false), 3000);
  };

  return {
    alumnos, alumnoSeleccionado, form, errores, loading, exitoso,
    modoFormulario, setModoForm,
    seleccionarAlumno, handleChange, registrarActividad, CARRERA_LABEL,
  };
}
