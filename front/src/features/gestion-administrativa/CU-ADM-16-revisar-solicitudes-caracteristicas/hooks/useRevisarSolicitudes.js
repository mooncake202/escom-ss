import { useState, useMemo } from "react";

const COORDINACION = { nombre: "Lic. Morales Vega" };

const MOCK_SOLICITUDES = [
  {
    id: 1,
    profesor: {
      nombre: "Dr. Torres Vega",
      id: "PTC-2024-0187",
      cuposActuales: 3,
      caracteristicasActuales: [
        { nombre: "Profesor de base", cuposInfo: "3 cupos de base" },
      ],
    },
    caracteristica: { id: 1, nombre: "Presidente de academia", cuposRef: "+2 cupos", cuposIncremento: 2 },
    justificacion: "Llevo 5 años coordinando la academia de matemáticas aplicadas. Actualmente dirijo a 8 profesores y requiero cupos adicionales para absorber a los alumnos que no encuentran lugar con otros profesores.",
    fechaEnvio: "10 de mayo de 2026",
    estado: "Pendiente",
    fechaRespuesta: null,
    cuposOtorgados: null,
    comentarioRechazo: null,
  },
  {
    id: 2,
    profesor: {
      nombre: "Dra. Ramírez Flores",
      id: "PTC-2024-0203",
      cuposActuales: 5,
      caracteristicasActuales: [
        { nombre: "Profesor de base", cuposInfo: "3 cupos de base" },
        { nombre: "Coordinador", cuposInfo: "+2 cupos" },
      ],
    },
    caracteristica: { id: 3, nombre: "Jefe de departamento", cuposRef: "+3 cupos", cuposIncremento: 3 },
    justificacion: "Actualmente estoy a cargo del departamento de sistemas como responsable interina. Necesito cupos adicionales para gestionar los proyectos de servicio social bajo mi supervisión directa.",
    fechaEnvio: "9 de mayo de 2026",
    estado: "Pendiente",
    fechaRespuesta: null,
    cuposOtorgados: null,
    comentarioRechazo: null,
  },
  {
    id: 3,
    profesor: {
      nombre: "M.C. Gutiérrez Peña",
      id: "PTC-2023-0156",
      cuposActuales: 3,
      caracteristicasActuales: [
        { nombre: "Profesor de base", cuposInfo: "3 cupos de base" },
      ],
    },
    caracteristica: { id: 4, nombre: "Investigador", cuposRef: "+N cupos (proyectos)", cuposIncremento: 2 },
    justificacion: "Tengo dos proyectos de investigación activos registrados ante COFAA con financiamiento vigente. Requiero cupos para asignar alumnos de servicio social a tareas directamente relacionadas con dichos proyectos.",
    fechaEnvio: "7 de mayo de 2026",
    estado: "Pendiente",
    fechaRespuesta: null,
    cuposOtorgados: null,
    comentarioRechazo: null,
  },
];

export function useRevisarSolicitudes() {
  const [solicitudes, setSolicitudes]   = useState(MOCK_SOLICITUDES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [panel, setPanel]               = useState("detalle");
  const [busqueda, setBusqueda]         = useState("");
  const [comentario, setComentario]     = useState("");
  const [errores, setErrores]           = useState({});
  const [toast, setToast]               = useState(null);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4500);
  }

  function handleSeleccionar(s) {
    setSeleccionada(s);
    setPanel("detalle");
    setErrores({});
  }

  function handleAprobar() {
    setErrores({});
    setPanel("aprobacion");
  }

  function handleRechazar() {
    setComentario("");
    setErrores({});
    setPanel("rechazo");
  }

  function handleCancelarAccion() {
    setPanel("detalle");
    setErrores({});
  }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errores.comentario) setErrores(prev => ({ ...prev, comentario: null }));
  }

  function handleConfirmarAprobacion() {
    const n = seleccionada.caracteristica.cuposIncremento;
    const fechaResp = new Date().toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });
    setSolicitudes(prev => prev.map(s =>
      s.id === seleccionada.id
        ? {
            ...s,
            estado: "Aprobada",
            fechaRespuesta: fechaResp,
            cuposOtorgados: n,
            profesor: { ...s.profesor, cuposActuales: s.profesor.cuposActuales + n },
          }
        : s
    ));
    mostrarToast(
      `Aprobada. Se otorgaron ${n} cupo${n !== 1 ? "s" : ""} adicional${n !== 1 ? "es" : ""} a ${seleccionada.profesor.nombre}.`
    );
    setSeleccionada(null);
  }

  function handleConfirmarRechazo() {
    if (!comentario.trim()) {
      setErrores({ comentario: "El comentario es obligatorio al rechazar (RN-ADM-03)." });
      return;
    }
    const fechaResp = new Date().toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });
    setSolicitudes(prev => prev.map(s =>
      s.id === seleccionada.id
        ? { ...s, estado: "Rechazada", fechaRespuesta: fechaResp, comentarioRechazo: comentario.trim() }
        : s
    ));
    mostrarToast(
      `Solicitud rechazada. ${seleccionada.profesor.nombre} fue notificado.`,
      "danger"
    );
    setSeleccionada(null);
  }

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter(s => s.estado === "Pendiente"),
    [solicitudes]
  );

  const solicitudesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return solicitudesPendientes;
    return solicitudesPendientes.filter(s =>
      s.profesor.nombre.toLowerCase().includes(texto)
    );
  }, [solicitudesPendientes, busqueda]);

  return {
    coordinacion: COORDINACION,
    solicitudesFiltradas,
    seleccionada, panel,
    busqueda, setBusqueda,
    comentario, errores, toast,
    handleSeleccionar,
    handleAprobar, handleRechazar, handleCancelarAccion,
    handleComentarioChange,
    handleConfirmarAprobacion, handleConfirmarRechazo,
  };
}
