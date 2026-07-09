import { useState, useMemo } from "react";

const COORDINACION = { nombre: "Lic. Morales Vega" };

const MOCK_SOLICITUDES = [
  {
    id: 1,
    tipo:        "Baja del servicio social",
    alumno:      "García López Ana",
    boleta:      "2022630001",
    correo:      "agarcia0001@alumno.ipn.mx",
    solicitante: "Alumno",

    expediente:  "/mock/expediente-garcia.pdf",
    estado:      "Pendiente de revisión",
    fechaEnvio:  "1 de abril de 2026",
  },
  {
    id: 2,
    tipo:        "Baja del servicio social",
    alumno:      "Hernández Ruiz Carlos",
    boleta:      "2021630042",
    correo:      "chernandez0042@alumno.ipn.mx",
    solicitante: "Alumno",

    expediente:  "/mock/expediente-hernandez.pdf",
    estado:      "Pendiente de revisión",
    fechaEnvio:  "28 de marzo de 2026",
  },
  {
    id: 3,
    tipo:        "Baja del servicio social",
    alumno:      "Martínez Soto Diana",
    boleta:      "2022630078",
    correo:      "dmartinez0078@alumno.ipn.mx",
    solicitante: "Profesor",

    expediente:  "/mock/expediente-martinez.pdf",
    estado:      "En revisión",
    fechaEnvio:  "20 de marzo de 2026",
  },
  {
    id: 4,
    tipo:        "Baja del servicio social",
    alumno:      "Ramírez Torres Ana Sofía",
    boleta:      "2022630187",
    correo:      "aramirez0187@alumno.ipn.mx",
    solicitante: "Alumno",

    expediente:  "/mock/expediente-ramirez.pdf",
    estado:      "Aprobada",
    fechaEnvio:  "15 de marzo de 2026",
  },
];

export function useGestionarBajas() {
  const [solicitudes, setSolicitudes]   = useState(MOCK_SOLICITUDES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [busqueda, setBusqueda]         = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [toast, setToast]               = useState(null);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  function seleccionarSolicitud(s) {
    setSeleccionada(s);
  }

  function actualizarEstado(id, nuevoEstado) {
    setSolicitudes(prev => prev.map(s =>
      s.id === id ? { ...s, estado: nuevoEstado } : s
    ));
    setSeleccionada(prev => prev?.id === id ? { ...prev, estado: nuevoEstado } : prev);
    mostrarToast(
      nuevoEstado === "Rechazada"
        ? "Solicitud rechazada. El alumno fue notificado."
        : `Solicitud marcada como "${nuevoEstado}" correctamente.`,
      nuevoEstado === "Rechazada" ? "danger" : "success"
    );
  }

  const solicitudesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return solicitudes.filter(s => {
      if (filtroEstado !== "Todos" && s.estado !== filtroEstado) return false;
      if (texto && !s.alumno.toLowerCase().includes(texto) && !s.boleta.includes(texto)) return false;
      return true;
    });
  }, [solicitudes, busqueda, filtroEstado]);

  const hayFiltroActivo = busqueda.trim() !== "" || filtroEstado !== "Todos";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("Todos");
  }

  return {
    coordinacion: COORDINACION,
    solicitudesFiltradas, seleccionada, toast,
    busqueda, setBusqueda,
    filtroEstado, setFiltroEstado,
    hayFiltroActivo, limpiarFiltros,
    seleccionarSolicitud, actualizarEstado,
  };
}