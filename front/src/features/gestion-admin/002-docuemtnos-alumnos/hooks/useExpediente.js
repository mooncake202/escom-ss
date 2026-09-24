import { useEffect, useMemo, useState } from "react";
import {
  obtenerMiExpediente,
  obtenerAlumnosConDocumentos,
  obtenerExpedienteDeAlumno,
  obtenerArchivoDocumento,
} from "@/services/documentosService";
import { usePdfAlmacenado } from "@/features/gestion-reportes/compartido/usePdfAlmacenado";

// CU-ADM-13 — Expediente documental histórico. SOLO CONSULTA: no sube, no edita, no aprueba.
//
// El backend decide qué documentos existen y en qué etapa van; aquí no se filtra ni se clasifica
// nada. Solo se muestran los que él devuelve, que son los del catálogo y en estado aprobado.

/** Visor/descarga compartido por las dos vistas. Reutiliza el hook de PDF que ya usa Reportes. */
function useVisorDocumento() {
  const { pdf, abrirPdf, cerrarPdf } = usePdfAlmacenado();
  const [documentoEnPdf, setDocumentoEnPdf] = useState(null);
  const [descarga, setDescarga] = useState({ id: null, estado: "inactivo", error: null });

  function verDocumento(documento) {
    if (pdf.estado === "cargando") return;
    setDocumentoEnPdf(documento);
    abrirPdf(() => obtenerArchivoDocumento(documento.id));
  }

  function cerrarVisor() {
    setDocumentoEnPdf(null);
    cerrarPdf();
  }

  async function descargarDocumento(documento) {
    if (descarga.estado === "cargando") return;
    setDescarga({ id: documento.id, estado: "cargando", error: null });
    try {
      const blob = await obtenerArchivoDocumento(documento.id, { descargar: true });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `${documento.tipo}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
      setDescarga({ id: null, estado: "inactivo", error: null });
    } catch (err) {
      setDescarga({ id: documento.id, estado: "error", error: err.message });
    }
  }

  return { pdf, documentoEnPdf, verDocumento, cerrarVisor, descargarDocumento, descarga };
}

// ── Vista del alumno ────────────────────────────────────────────────────────

export function useMiExpediente() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [datos, setDatos] = useState(null);
  const [intento, setIntento] = useState(0);
  const visor = useVisorDocumento();

  useEffect(() => {
    let vigente = true;
    obtenerMiExpediente().then(
      (r) => { if (vigente) { setDatos(r); setCarga({ estado: "listo", error: null }); } },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  return {
    carga, recargar,
    alumno: datos?.alumno ?? null,
    etapas: datos?.etapas ?? [],
    progreso: datos?.progreso ?? { disponibles: 0, total: 0, totalDocumentos: 0 },
    etapaActual: datos?.etapaActual ?? null,
    ...visor,
  };
}

// ── Vista de coordinación ───────────────────────────────────────────────────

export function useExpedienteCoordinacion() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [alumnos, setAlumnos] = useState([]);
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  // Se filtra por ETAPA documental, y las etapas del CU son solo tres. No existe "Completado": un
  // expediente al 100% sigue estando en Término, así que los tres filtros cubren a todos los alumnos.
  const [filtro, setFiltro] = useState("todos"); // todos | Inicio | Desarrollo | Término

  const [boleta, setBoleta] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [cargaExpediente, setCargaExpediente] = useState({ estado: "inactivo", error: null });

  const visor = useVisorDocumento();

  useEffect(() => {
    let vigente = true;
    obtenerAlumnosConDocumentos().then(
      (r) => {
        if (!vigente) return;
        setAlumnos(r.alumnos);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setBoleta(null);
    setExpediente(null);
    setCargaExpediente({ estado: "inactivo", error: null });
    setIntento((n) => n + 1);
  }

  // El filtro se aplica sobre `etapaActual`, que DERIVA el backend de los documentos reales del
  // alumno. El frontend no vuelve a decidir en qué etapa está nadie.
  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return alumnos.filter((a) => {
      const coincideTexto = !texto
        || a.nombreCompleto.toLowerCase().includes(texto)
        || a.boleta.includes(texto);
      const coincideFiltro = filtro === "todos"
        || a.etapaActual.toLowerCase() === filtro.toLowerCase();
      return coincideTexto && coincideFiltro;
    });
  }, [alumnos, busqueda, filtro]);

  // Indicadores del encabezado, con el mismo significado que el mock pero sobre datos reales.
  const metricas = useMemo(() => ({
    total: alumnos.length,
    enInicio: alumnos.filter((a) => a.etapaActual === "Inicio").length,
    enDesarrollo: alumnos.filter((a) => a.etapaActual === "Desarrollo").length,
    enTermino: alumnos.filter((a) => a.etapaActual === "Término").length,
  }), [alumnos]);

  // La carga del expediente se dispara desde el clic, no desde un efecto.
  async function seleccionar(alumno) {
    setBoleta(alumno.boleta);
    setExpediente(null);
    visor.cerrarVisor();
    setCargaExpediente({ estado: "cargando", error: null });
    try {
      const r = await obtenerExpedienteDeAlumno(alumno.boleta);
      setExpediente(r);
      setCargaExpediente({ estado: "listo", error: null });
    } catch (err) {
      setCargaExpediente({ estado: "error", error: err.message });
    }
  }

  const alumnoSeleccionado = alumnos.find((a) => a.boleta === boleta) ?? null;

  return {
    carga, recargar,
    alumnos: alumnosFiltrados,
    metricas,
    busqueda, setBusqueda,
    filtro, setFiltro,
    alumnoSeleccionado, seleccionar,
    expediente, cargaExpediente,
    ...visor,
  };
}
