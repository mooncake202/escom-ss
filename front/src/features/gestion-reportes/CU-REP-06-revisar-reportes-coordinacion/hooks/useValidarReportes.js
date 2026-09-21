import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listarReportesCoordinacion, obtenerDetalleReporteCoordinacion, obtenerPdfReporteCoordinacion,
  rechazarReporteCoordinacion, aprobarReporteCoordinacion,
} from "@/services/reportesService";
import { usePdfAlmacenado } from "../../compartido/usePdfAlmacenado";
import { claveReporte, idsDestacados, esDestacado, tipoDeUrl, describirResultado } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { CRITERIO, filtrarReportes } from "../validacionReportes";

export { CRITERIO };

// ── Modos del panel ──────────────────────────────────────────
export const MODO = {
  NORMAL:   "normal",
  APROBAR:  "aprobar",   // confirma la validación (el servidor agrega el sello del prototipo)
  RECHAZAR: "rechazar",  // pide el motivo
};

// ── Filtros de estado ────────────────────────────────────────
export const FILTRO_ESTADO = {
  PENDIENTES: "pendientes",
  PROCESADOS: "procesados", // validados o rechazados por Coordinación
};

// Todo sale del backend: bandeja, detalle, PDF almacenado, rechazo y validación (que agrega el sello y aprueba).
// Coordinación no sube rúbrica: el sello es fijo y lo agrega el servidor.
export function useValidarReportes() {
  const [carga, setCarga]               = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [lista, setLista]               = useState({ pendientes: [], procesados: [] });
  const [seleccionado, setSeleccionado] = useState(null); // clave "tipo:id"
  const [detalle, setDetalle]           = useState({ estado: "inactivo", datos: null, error: null });
  const [modo, setModo]                 = useState(MODO.NORMAL);
  const { pdf, abrirPdf, cerrarPdf }    = usePdfAlmacenado();

  // ── Filtros ──────────────────────────────────────────────
  const [filtroEstado, setFiltroEstado]   = useState(FILTRO_ESTADO.PENDIENTES);
  const [criterio, setCriterio]           = useState(CRITERIO.TODOS);
  const [busqueda, setBusqueda]           = useState("");

  // ── Rechazo ──────────────────────────────────────────────
  const [comentario, setComentario]           = useState("");
  const [errorComentario, setErrorComentario] = useState(false);

  // ── Resultado y loading ──────────────────────────────────
  const [resultado, setResultado]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);

  // Reportes a resaltar por la notificación (?destacar=<id>); se apagan al abrirlos, como en Ofertas y CU-REP-05.
  const [searchParams] = useSearchParams();
  const destacarParam = searchParams.get("destacar") ?? "";
  const [vistos, setVistos] = useState({ param: destacarParam, ids: new Set() });
  const idsVistos = vistos.param === destacarParam ? vistos.ids : new Set();
  const destacados = idsDestacados(destacarParam);
  const tipoDestacado = tipoDeUrl(searchParams.get("tipo")); // los ids del mensual y del global se repiten
  const estaDestacado = (r) => esDestacado(r, destacados, tipoDestacado) && !idsVistos.has(r.id);

  const detalleRef = useRef(0);    // descarta respuestas de un detalle que ya no es el seleccionado
  const accionRef = useRef(false); // evita el doble envío de aprobar/rechazar (el estado tarda un render en reflejarse)

  // `silencioso`: una actualización de fondo que falla no reemplaza la pantalla por el error.
  const cargarLista = useCallback((silencioso = false) => listarReportesCoordinacion().then(
    (respuesta) => {
      setLista({ pendientes: respuesta.pendientes, procesados: respuesta.procesados });
      setCarga({ estado: "listo", error: null });
    },
    (err) => { if (!silencioso) setCarga({ estado: "error", error: err.message }); },
  ), []);

  useEffect(() => { cargarLista(); }, [cargarLista]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    return cargarLista();
  }

  const cargarDetalle = useCallback(async (item) => {
    const id = ++detalleRef.current;
    setDetalle({ estado: "cargando", datos: null, error: null });
    try {
      const datos = await obtenerDetalleReporteCoordinacion(item.tipoReporte, item.id);
      if (id === detalleRef.current) setDetalle({ estado: "listo", datos, error: null });
    } catch (err) {
      if (id === detalleRef.current) setDetalle({ estado: "error", datos: null, error: err.message });
    }
  }, []);

  const todos = [...lista.pendientes, ...lista.procesados];
  const reporte = seleccionado === null ? null : todos.find((r) => claveReporte(r) === seleccionado) ?? null;

  const porEstado = filtroEstado === FILTRO_ESTADO.PENDIENTES ? lista.pendientes : lista.procesados;
  const reportesFiltrados = filtrarReportes(porEstado, criterio, busqueda);

  function resetModo() {
    setModo(MODO.NORMAL);
    setComentario("");
    setErrorComentario(false);
    setErrorAccion(null);
  }

  function irModo(m) {
    setModo(m);
    setComentario("");
    setErrorComentario(false);
    setErrorAccion(null);
  }

  // PDF exacto almacenado del reporte seleccionado (alumno + profesor, y el sello si ya se validó).
  function verPdf() {
    if (!reporte || pdf.estado === "cargando") return;
    abrirPdf(() => obtenerPdfReporteCoordinacion(reporte.tipoReporte, reporte.id));
  }

  function seleccionar(clave) {
    resetModo();
    setResultado(null);
    cerrarPdf();
    if (clave === null) {
      detalleRef.current += 1;
      setSeleccionado(null);
      setDetalle({ estado: "inactivo", datos: null, error: null });
      return;
    }
    const item = todos.find((r) => claveReporte(r) === clave);
    if (!item) return;
    setSeleccionado(clave);
    if (esDestacado(item, destacados, tipoDestacado)) setVistos({ param: destacarParam, ids: new Set(idsVistos).add(item.id) });
    cargarDetalle(item);
  }

  function cerrar() {
    seleccionar(null);
  }

  function reintentarDetalle() {
    if (reporte) cargarDetalle(reporte);
  }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errorComentario) setErrorComentario(false);
  }

  // Tras validar o rechazar: se actualiza la lista (el reporte pasa a "procesados"), se cierra el panel y se avisa.
  async function terminarRevision(tipo) {
    const aviso = describirResultado(reporte, tipo);
    await cargarLista(true);
    cerrar();
    setResultado(aviso);
  }

  // Ejecuta una acción del servidor una sola vez a la vez; un fallo se muestra y el reporte no cambia de estado.
  async function ejecutarAccion(accion) {
    if (!reporte || accionRef.current) return;
    accionRef.current = true;
    setLoading(true);
    setErrorAccion(null);
    try {
      await accion();
    } catch (err) {
      setErrorAccion(err.message);
      // Otro coordinador se adelantó: se actualiza la lista para que deje de aparecer como pendiente.
      if (err.status === 409 && err.code === "REPORTE_NO_PENDIENTE") cargarLista(true);
    } finally {
      accionRef.current = false;
      setLoading(false);
    }
  }

  // CU-REP-06 — Aprobar: el servidor agrega el sello de validación del prototipo al PDF vigente, lo sella en el tiempo y
  // avisa al alumno y al profesor.
  async function confirmarAprobacion() {
    await ejecutarAccion(async () => {
      await aprobarReporteCoordinacion(reporte.tipoReporte, reporte.id);
      await terminarRevision("aprobado");
    });
  }

  // CU-REP-06 — Rechazar con motivo obligatorio.
  async function confirmarRechazo() {
    if (!comentario.trim()) {
      setErrorComentario(true);
      return;
    }
    await ejecutarAccion(async () => {
      await rechazarReporteCoordinacion(reporte.tipoReporte, reporte.id, comentario.trim());
      await terminarRevision("rechazado");
    });
  }

  return {
    carga, recargar,
    tieneReportes: todos.length > 0,
    reportesFiltrados, reporte, detalle, reintentarDetalle, estaDestacado,
    seleccionado, seleccionar, cerrar,
    pdf, verPdf, cerrarPdf,
    modo, irModo, resetModo,
    filtroEstado, setFiltroEstado,
    criterio, setCriterio,
    busqueda, setBusqueda,
    comentario, handleComentarioChange, errorComentario,
    resultado, setResultado,
    loading, errorAccion,
    confirmarAprobacion, confirmarRechazo,
  };
}
