import { useState, useRef } from "react";

export const PROFESOR = {
  nombre: "Dr. Torres Vega",
  id:     "PTC-2024-0187",
};

export const MOCK_TIENE_REPORTES = true;

// Simula si el profesor ya tiene rúbrica registrada
// null = primera vez, string = ya tiene (URL de la imagen)
export const RUBRICA_PROFESOR_GUARDADA = null;

const MOCK_REPORTES = [
  {
    id: 1,
    numeroReporte: 2,
    alumno:        "García López Ana",
    matricula:     "2022630001",
    periodo:       "Febrero 2026",
    diasLaborados: 16,
    horas:         64,
    fechaEnvio:    "28 de febrero de 2026",
    estado:        "pendiente_revision",
    actividades:   "Durante el mes de febrero se realizaron las siguientes actividades: análisis de requerimientos del módulo de inventario, diseño de la base de datos relacional, implementación de endpoints REST con FastAPI y documentación técnica del sistema.",
    firma: { firmante: "García López Ana", matricula: "2022630001", fecha: "28 de febrero de 2026", hora: "09:41:03" },
    comentario: "",
  },
  {
    id: 2,
    numeroReporte: 7,
    alumno:        "Martínez Ruiz Luis",
    matricula:     "2022630002",
    periodo:       "Febrero 2026",
    diasLaborados: 14,
    horas:         56,
    fechaEnvio:    "28 de febrero de 2026",
    estado:        "rechazado_profesor",
    actividades:   "Implementación de los módulos de autenticación y autorización con JWT.",
    firma: { firmante: "Martínez Ruiz Luis", matricula: "2022630002", fecha: "28 de febrero de 2026", hora: "14:22:51" },
    comentario: "El reporte incluye días que corresponden a un periodo vacacional o inhábil.",
  },
  {
    id: 3,
    numeroReporte: 1,
    alumno:        "García López Ana",
    matricula:     "2022630001",
    periodo:       "Enero 2026",
    diasLaborados: 20,
    horas:         80,
    fechaEnvio:    "31 de enero de 2026",
    estado:        "aprobado",
    actividades:   "Levantamiento de requerimientos y elaboración del documento de especificación funcional.",
    firma: { firmante: "García López Ana", matricula: "2022630001", fecha: "31 de enero de 2026", hora: "08:15:44" },
    comentario: "Buen arranque. Las actividades son coherentes con el proyecto asignado.",
  },
  {
    id: 4,
    numeroReporte: 6,
    alumno:        "Martínez Ruiz Luis",
    matricula:     "2022630002",
    periodo:       "Enero 2026",
    diasLaborados: 20,
    horas:         80,
    fechaEnvio:    "31 de enero de 2026",
    estado:        "aprobado",
    actividades:   "Actividades de desarrollo backend, revisión de código y documentación técnica.",
    firma: { firmante: "Martínez Ruiz Luis", matricula: "2022630002", fecha: "31 de enero de 2026", hora: "11:03:27" },
    comentario: "Continúa con el mismo ritmo.",
  },
  {
    id: 5,
    numeroReporte: 11,
    alumno:        "Hernández Díaz Sofía",
    matricula:     "2022630003",
    periodo:       "Enero 2026",
    diasLaborados: 20,
    horas:         80,
    fechaEnvio:    "31 de enero de 2026",
    estado:        "aprobado",
    actividades:   "Elaboración del plan de pruebas y ejecución de casos de prueba funcionales.",
    firma: { firmante: "Hernández Díaz Sofía", matricula: "2022630003", fecha: "31 de enero de 2026", hora: "10:05:18" },
    comentario: "Cumplió con todos los objetivos del periodo.",
  },
];

// ── Modos del panel ──────────────────────────────────────────
export const MODO = {
  NORMAL:    "normal",
  APROBAR:   "aprobar",   // muestra subida de rúbrica o confirmación
  RECHAZAR:  "rechazar",  // muestra textarea de comentarios
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

export function useRevisarReportes() {
  const [reportes, setReportes]               = useState(MOCK_REPORTES);
  const [seleccionado, setSeleccionado]       = useState(null);
  const [modo, setModo]                       = useState(MODO.NORMAL);

  // ── Estado de firma del profesor ─────────────────────────
  const [rubricaGuardada, setRubricaGuardada] = useState(RUBRICA_PROFESOR_GUARDADA);
  const [firmaFile, setFirmaFile]             = useState(null);
  const [firmaUrl, setFirmaUrl]               = useState(RUBRICA_PROFESOR_GUARDADA);
  const [errorFirma, setErrorFirma]           = useState(null);
  const [firmaConfirmada, setFirmaConfirmada] = useState(false);

  // ── Estado de rechazo ────────────────────────────────────
  const [comentario, setComentario]           = useState("");
  const [errorComentario, setErrorComentario] = useState(false);

  // ── Resultado y loading ──────────────────────────────────
  const [resultado, setResultado]             = useState(null);
  const [loading, setLoading]                 = useState(false);

  // ── Búsqueda por nombre de alumno ────────────────────────
  const [busqueda, setBusqueda]               = useState("");

  // Ref para el blob del PDF
  const blobRef = useRef(null);

  const reporte = seleccionado !== null ? reportes.find(r => r.id === seleccionado) ?? null : null;

  // Filtra por búsqueda (nombre de alumno, insensible a mayúsculas)
  const reportesFiltrados = reportes.filter(r =>
    r.alumno.toLowerCase().includes(busqueda.toLowerCase().trim())
  );

  const pendientes = reportesFiltrados.filter(r => r.estado === "pendiente_revision");
  const procesados = reportesFiltrados.filter(r => r.estado !== "pendiente_revision");

  // Agrupa reportes por alumno — mantiene el orden de aparición
  function agruparPorAlumno(lista) {
    const mapa = new Map();
    lista.forEach(r => {
      if (!mapa.has(r.alumno)) mapa.set(r.alumno, { alumno: r.alumno, matricula: r.matricula, reportes: [] });
      mapa.get(r.alumno).reportes.push(r);
    });
    return Array.from(mapa.values());
  }

  const pendientesAgrupados = agruparPorAlumno(pendientes);
  const procesadosAgrupados = agruparPorAlumno(procesados);

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
    setFirmaFile(null);
    setFirmaUrl(rubricaGuardada);
    setErrorFirma(null);
    setFirmaConfirmada(false);
  }

  function irModo(m) {
    setModo(m);
    setComentario("");
    setErrorComentario(false);
    setFirmaFile(null);
    setFirmaUrl(rubricaGuardada);
    setErrorFirma(null);
    setFirmaConfirmada(false);
  }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errorComentario) setErrorComentario(false);
  }

  // Manejo de subida de rúbrica del profesor
  function handleFirmaChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setErrorFirma("Solo se aceptan imágenes PNG o JPG.");
      return;
    }
    setFirmaFile(file);
    setFirmaUrl(URL.createObjectURL(file));
    setErrorFirma(null);
    setFirmaConfirmada(false);
  }

  // Confirmar firma — abre PDF en nueva pestaña con la firma aplicada
  function confirmarFirmaYVerPDF() {
    if (!firmaUrl) {
      setErrorFirma("La firma es obligatoria para aprobar el reporte.");
      return;
    }
    // Si es primera vez, guardamos la rúbrica
    if (!rubricaGuardada && firmaUrl) {
      setRubricaGuardada(firmaUrl);
    }
    setFirmaConfirmada(true);
    // Abrir PDF en nueva pestaña
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    window.open(url, "_blank");
  }

  // CU-REP-05 — Aprobar y firmar (tras ver PDF)
  async function confirmarAprobacion() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const { fecha, hora } = formatFechaHora(new Date());
    const hash = generarHashMock();

    setReportes(prev => prev.map(r =>
      r.id === seleccionado ? { ...r, estado: "aprobado" } : r
    ));
    setResultado({
      tipo:    "aprobado",
      alumno:  reporte.alumno,
      periodo: reporte.periodo,
      firma:   { profesor: PROFESOR.nombre, id: PROFESOR.id, fecha, hora },
      hash,
    });
    setLoading(false);
    cerrar();
  }

  // CU-REP-05 — Rechazar con comentarios
  async function confirmarRechazo() {
    if (!comentario.trim()) { setErrorComentario(true); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    setReportes(prev => prev.map(r =>
      r.id === seleccionado
        ? { ...r, estado: "rechazado_profesor", comentario: comentario.trim() }
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

  // Shape para ReportePDF — incluye firmaUrl del profesor si ya está confirmada
  function datosPDF(r) {
    if (!r) return null;
    return {
      numeroReporte:   r.numeroReporte,
      fechaGeneracion: r.fechaEnvio,
      periodoTexto:    `del periodo ${r.periodo}`,
      alumno: {
        nombre:   r.alumno,
        boleta:   r.matricula,
        carrera:  "Ingeniería en Sistemas Computacionales (ISC)",
        semestre: "Octavo",
        telefono: "—",
        correo:   "—",
      },
      actividades: r.actividades,
      firmaUrl:    r.firma ? firmaUrl : null,
    };
  }

  return {
    tieneReportes: MOCK_TIENE_REPORTES,
    pendientes, procesados, reporte,
    pendientesAgrupados, procesadosAgrupados,
    busqueda, setBusqueda,
    seleccionado, seleccionar, cerrar,
    modo, irModo, resetModo,
    // firma profesor
    rubricaGuardada, firmaFile, firmaUrl, errorFirma,
    firmaConfirmada, handleFirmaChange, confirmarFirmaYVerPDF,
    // rechazo
    comentario, handleComentarioChange, errorComentario,
    // resultado
    resultado, setResultado,
    loading,
    confirmarAprobacion, confirmarRechazo,
    blobRef, datosPDF,
  };
}