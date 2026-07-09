import { useState, useRef } from "react";

export const COORDINACION = { nombre: "Lic. Morales Vega" };

export const MOCK_TIENE_REPORTES = true;

const MOCK_REPORTES = [
  {
    id: 1,
    numeroReporte:    2,
    alumno:           "García López Ana",
    matricula:        "2022630001",
    carrera:          "Ingeniería en Sistemas Computacionales (ISC)",
    profesor:         "Dr. Torres Vega",
    periodo:          "Febrero 2026",
    diasLaborados:    16,
    horas:            64,
    fechaAprobacion:  "02 de marzo de 2026",
    estado:           "pendiente_validacion",
    actividades:      "Durante el mes de febrero se realizaron las siguientes actividades: análisis de requerimientos del módulo de inventario, diseño de la base de datos relacional, implementación de endpoints REST con FastAPI y documentación técnica del sistema.",
    comentarioProfesor: "Buen avance. Las actividades son coherentes con el proyecto asignado.",
    firmaAlumno:   { firmante: "García López Ana", matricula: "2022630001", fecha: "28 de febrero de 2026", hora: "09:41:03" },
    firmaProfesor: { firmante: "Dr. Torres Vega",  id: "PTC-2024-0187",    fecha: "02 de marzo de 2026",   hora: "11:05:22" },
  },
  {
    id: 2,
    numeroReporte:    7,
    alumno:           "Martínez Ruiz Luis",
    matricula:        "2022630002",
    carrera:          "Ingeniería en Sistemas Computacionales (ISC)",
    profesor:         "Dr. Torres Vega",
    periodo:          "Febrero 2026",
    diasLaborados:    16,
    horas:            64,
    fechaAprobacion:  "03 de marzo de 2026",
    estado:           "pendiente_validacion",
    actividades:      "Implementación de los módulos de autenticación y autorización con JWT. Se realizaron pruebas de integración y se corrigieron errores identificados durante la revisión de código.",
    comentarioProfesor: "Continúa con el mismo ritmo. Se nota progreso en las actividades de desarrollo.",
    firmaAlumno:   { firmante: "Martínez Ruiz Luis", matricula: "2022630002", fecha: "28 de febrero de 2026", hora: "14:22:51" },
    firmaProfesor: { firmante: "Dr. Torres Vega",    id: "PTC-2024-0187",    fecha: "03 de marzo de 2026",   hora: "10:47:09" },
  },
  {
    id: 3,
    numeroReporte:    11,
    alumno:           "Valdez Cruz Pedro",
    matricula:        "2022630008",
    carrera:          "Inteligencia Artificial (IA)",
    profesor:         "Dra. Ramírez Gutiérrez",
    periodo:          "Enero 2026",
    diasLaborados:    20,
    horas:            80,
    fechaAprobacion:  "02 de febrero de 2026",
    estado:           "validado",
    actividades:      "Elaboración del documento de especificación funcional del sistema y participación en reuniones de seguimiento con el equipo de desarrollo.",
    comentarioProfesor: "Cumplió con todos los objetivos del periodo.",
    firmaAlumno:   { firmante: "Valdez Cruz Pedro",        matricula: "2022630008", fecha: "31 de enero de 2026",   hora: "08:15:44" },
    firmaProfesor: { firmante: "Dra. Ramírez Gutiérrez",  id: "PTC-2024-0092",     fecha: "02 de febrero de 2026", hora: "09:33:17" },
  },
];

// ── Modos del panel ──────────────────────────────────────────
export const MODO = {
  NORMAL:   "normal",
  APROBAR:  "aprobar",
  RECHAZAR: "rechazar",
};

// ── Filtros de estado ────────────────────────────────────────
export const FILTRO_ESTADO = {
  PENDIENTES: "pendientes",
  APROBADOS:  "aprobados",
};

// ── Criterios de búsqueda ────────────────────────────────────
export const CRITERIO = {
  TODOS:    "todos",
  ALUMNO:   "alumno",
  PROFESOR: "profesor",
  CARRERA:  "carrera",
};

function generarHashMock() {
  const chars = "0123456789abcdef";
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

function formatFechaHora(date) {
  return {
    fecha: date.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }),
    hora:  date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}

export function useValidarReportes() {
  const [reportes, setReportes]           = useState(MOCK_REPORTES);
  const [seleccionado, setSeleccionado]   = useState(null);
  const [modo, setModo]                   = useState(MODO.NORMAL);

  // ── Filtros ──────────────────────────────────────────────
  const [filtroEstado, setFiltroEstado]   = useState(FILTRO_ESTADO.PENDIENTES);
  const [criterio, setCriterio]           = useState(CRITERIO.TODOS);
  const [busqueda, setBusqueda]           = useState("");

  // ── Rechazo ──────────────────────────────────────────────
  const [comentario, setComentario]       = useState("");
  const [errorComentario, setErrorComentario] = useState(false);

  // ── Resultado y loading ──────────────────────────────────
  const [resultado, setResultado]         = useState(null);
  const [loading, setLoading]             = useState(false);

  const blobRef = useRef(null);

  // ── Reporte seleccionado ─────────────────────────────────
  const reporte = seleccionado !== null
    ? reportes.find(r => r.id === seleccionado) ?? null
    : null;

  // ── Filtrado por estado ──────────────────────────────────
  const porEstado = reportes.filter(r =>
    filtroEstado === FILTRO_ESTADO.PENDIENTES
      ? r.estado === "pendiente_validacion"
      : r.estado === "validado"
  );

  // ── Filtrado por criterio + búsqueda ─────────────────────
  const reportesFiltrados = porEstado.filter(r => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    if (criterio === CRITERIO.ALUMNO)   return r.alumno.toLowerCase().includes(q);
    if (criterio === CRITERIO.PROFESOR) return r.profesor.toLowerCase().includes(q);
    if (criterio === CRITERIO.CARRERA)  return r.carrera.toLowerCase().includes(q);
    // TODOS — busca en los tres campos
    return (
      r.alumno.toLowerCase().includes(q) ||
      r.profesor.toLowerCase().includes(q) ||
      r.carrera.toLowerCase().includes(q)
    );
  });

  function seleccionar(id) {
    setSeleccionado(id);
    resetModo();
    setResultado(null);
  }

  function cerrar() {
    setSeleccionado(null);
    resetModo();
  }

  function resetModo() {
    setModo(MODO.NORMAL);
    setComentario("");
    setErrorComentario(false);
  }

  function irModo(m) {
    setModo(m);
    setComentario("");
    setErrorComentario(false);
  }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errorComentario) setErrorComentario(false);
  }

  // CU-REP-06 — Aprobar con sello institucional
  async function confirmarAprobacion() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const { fecha, hora } = formatFechaHora(new Date());
    const hash = generarHashMock();

    setReportes(prev => prev.map(r =>
      r.id === seleccionado ? { ...r, estado: "validado" } : r
    ));
    setResultado({
      tipo:    "aprobado",
      alumno:  reporte.alumno,
      periodo: reporte.periodo,
      sello:   { coordinacion: COORDINACION.nombre, fecha, hora },
      hash,
    });
    setLoading(false);
    cerrar();
  }

  // CU-REP-06 — Rechazar con comentarios
  async function confirmarRechazo() {
    if (!comentario.trim()) { setErrorComentario(true); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    setReportes(prev => prev.map(r =>
      r.id === seleccionado
        ? { ...r, estado: "rechazado_coordinacion", comentario: comentario.trim() }
        : r
    ));
    setResultado({
      tipo:      "rechazado",
      alumno:    reporte.alumno,
      periodo:   reporte.periodo,
      comentario: comentario.trim(),
    });
    setLoading(false);
    cerrar();
  }

  // Shape para ReportePDF
  function datosPDF(r) {
    if (!r) return null;
    return {
      numeroReporte:   r.numeroReporte,
      fechaGeneracion: r.fechaAprobacion,
      periodoTexto:    r.periodoTexto ?? `del periodo ${r.periodo}`,
      alumno: {
        nombre:   r.alumno,
        boleta:   r.matricula,
        carrera:  r.carrera,
        semestre: "Octavo",
        telefono: "—",
        correo:   "—",
      },
      actividades:      r.actividades,
      firmaUrl:         null, // en producción: rúbrica del alumno desde BD
      firmaProfesorUrl: null, // en producción: rúbrica del profesor desde BD
      // selloUrl se agrega solo cuando coordinación aprueba
      selloUrl: r.estado === "validado" ? "SELLO_INSTITUCIONAL_MOCK" : null,
    };
  }

  return {
    tieneReportes: MOCK_TIENE_REPORTES,
    reportesFiltrados, reporte,
    seleccionado, seleccionar, cerrar,
    modo, irModo, resetModo,
    filtroEstado, setFiltroEstado,
    criterio, setCriterio,
    busqueda, setBusqueda,
    comentario, handleComentarioChange, errorComentario,
    resultado, setResultado,
    loading,
    confirmarAprobacion, confirmarRechazo,
    blobRef, datosPDF,
  };
}