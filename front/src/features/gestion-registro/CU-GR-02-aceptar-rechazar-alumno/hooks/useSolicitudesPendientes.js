import { useState } from "react";

// ── Datos mock según CU-GR-02 ─────────────────────────────────
// Estado inicial: todas en "PendienteProfesor" (RN-GR-11)
const MOCK_SOLICITUDES = [
  {
    id: 1,
    estado: "PendienteProfesor",
    // Datos del alumno
    nombre:          "García López Juan Carlos",
    boleta:          "2021630412",
    carrera:         "ISC",
    correoInst:      "jgarcia0412@alumno.ipn.mx",
    correoPersonal:  "juan.garcia@gmail.com",
    telefono:        "5512345678",
    creditos:        78,
    // Datos del periodo seleccionado
    periodoInicio:   "2026-03-02",
    periodoFin:      "2026-10-02",
    tituloOferta: "Desarrollo de plataforma web institucional",
    // Fecha en que envió la solicitud
    fechaEnvio:      "2026-03-10T09:15:00",
    motivacion: "me gusta mucho y puedo hacer..........."

  },
  {
    id: 2,
    estado: "PendienteProfesor",
    nombre:          "Ramírez Torres Ana Sofía",
    boleta:          "2022630187",
    carrera:         "IA",
    correoInst:      "aramirez0187@alumno.ipn.mx",
    correoPersonal:  "ana.ramirez@hotmail.com",
    telefono:        "5598765432",
    creditos:        85,
    periodoInicio:   "2026-03-02",
    periodoFin:      "2026-10-02",
    tituloOferta: "Sistema de análisis de datos académicos",


    fechaEnvio:      "2026-03-11T14:30:00",
    motivacion: "me gusta mucho y puedo hacer..........."

  },
  {
    id: 3,
    estado: "PendienteProfesor",
    nombre:          "Mendoza Vega Luis Alberto",
    boleta:          "2020630055",
    carrera:         "LCD",
    correoInst:      "lmendoza0055@alumno.ipn.mx",
    correoPersonal:  "luis.mendoza@gmail.com",
    telefono:        "5534567890",
    creditos:        92,
    periodoInicio:   "2026-05-04",
    periodoFin:      "2026-12-04",
    tituloOferta: "Aplicación móvil de consulta de horarios", 

    fechaEnvio:      "2026-03-12T11:00:00",
    motivacion: "me gusta mucho y puedo hacer.. bababasbbsabsbdbadba adsjndss uh adudsha........."
  },
  {
    id: 4,
    estado: "PendienteProfesor",
    nombre:          "Mendoza Vega Luis Alberto",
    boleta:          "2020630055",
    carrera:         "LCD",
    correoInst:      "lmendoza0055@alumno.ipn.mx",
    correoPersonal:  "luis.mendoza@gmail.com",
    telefono:        "5534567890",
    creditos:        92,
    periodoInicio:   "2026-05-04",
    periodoFin:      "2026-12-04",
    tituloOferta: "Aplicación móvil de consulta de horarios", 

    fechaEnvio:      "2026-03-12T11:00:00",
    motivacion: "me gusta mucho y puedo hacer.. bababasbbsabsbdbadba adsjndss uh adudsha........."
  },
  {
    id: 5,
    estado: "PendienteProfesor",
    nombre:          "Mendoza Vega Luis Alberto",
    boleta:          "2020630055",
    carrera:         "LCD",
    correoInst:      "lmendoza0055@alumno.ipn.mx",
    correoPersonal:  "luis.mendoza@gmail.com",
    telefono:        "5534567890",
    creditos:        92,
    periodoInicio:   "2026-05-04",
    periodoFin:      "2026-12-04",
    tituloOferta: "Aplicación móvil de consulta de horarios", 

    fechaEnvio:      "2026-03-12T11:00:00",
    motivacion: "me gusta mucho y puedo hacer.. bababasbbsabsbdbadba adsjndss uh adudsha........."
  },
  {
    id: 6,
    estado: "PendienteProfesor",
    nombre:          "Mendoza Vega Luis Alberto",
    boleta:          "2020630055",
    carrera:         "LCD",
    correoInst:      "lmendoza0055@alumno.ipn.mx",
    correoPersonal:  "luis.mendoza@gmail.com",
    telefono:        "5534567890",
    creditos:        92,
    periodoInicio:   "2026-05-04",
    periodoFin:      "2026-12-04",
    tituloOferta: "Aplicación móvil de consulta de horarios", 

    fechaEnvio:      "2026-03-12T11:00:00",
    motivacion: "me gusta mucho y puedo hacer.. bababasbbsabsbdbadba adsjndss uh adudsha........."
  },
  {
    id: 7,
    estado: "PendienteProfesor",
    nombre:          "Mendoza Vega Luis Alberto",
    boleta:          "2020630055",
    carrera:         "LCD",
    correoInst:      "lmendoza0055@alumno.ipn.mx",
    correoPersonal:  "luis.mendoza@gmail.com",
    telefono:        "5534567890",
    creditos:        92,
    periodoInicio:   "2026-05-04",
    periodoFin:      "2026-12-04",
    tituloOferta: "Aplicación móvil de consulta de horarios", 

    fechaEnvio:      "2026-03-02T11:00:00",
    motivacion: "me gusta mucho y puedo hacer.. bababasbbsabsbdbadba adsjndss uh adudsha........."
  },
];

export function useSolicitudesPendientes() {
  const [solicitudes, setSolicitudes] = useState(MOCK_SOLICITUDES);
  const [seleccionada, setSeleccionada]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [resultado, setResultado]         = useState(null); // { tipo, nombre }

  const verDetalle = (solicitud) => {
    setSeleccionada(solicitud);
    setResultado(null);
  };

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setResultado(null);
  };

  // RN-GR-12 y RN-GR-13: registrar decisión del profesor
  const decidir = async (id, decision) => {
    setLoading(true);

    // Simula latencia de red
    await new Promise(r => setTimeout(r, 700));

    const nuevoEstado = decision === "aceptar"
      ? "AceptadaProfesor"
      : "RechazadaProfesor";

    setSolicitudes(prev =>
      prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s)
    );

    const nombre = solicitudes.find(s => s.id === id)?.nombre ?? "";
    setResultado({ tipo: decision, nombre });
    setSeleccionada(null);
    setLoading(false);
  };

  // Solo muestra las pendientes en la lista (RN-GR-11)
  const pendientes = solicitudes.filter(s => s.estado === "PendienteProfesor");

  return { pendientes, seleccionada, loading, resultado, verDetalle, cerrarDetalle, decidir };
}
