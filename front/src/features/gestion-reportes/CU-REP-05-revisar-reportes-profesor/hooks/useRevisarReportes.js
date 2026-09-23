import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listarReportesProfesor, obtenerDetalleReporteProfesor, obtenerPdfReporteProfesor,
  obtenerEstadoRubricaProfesor, subirRubricaProfesor, rechazarReporteProfesor, aprobarReporteProfesor,
} from "@/services/reportesService";
import { validarArchivoFirma } from "../../CU-REP-01-generar-reporte/reportesGeneracion";
import { usePdfAlmacenado } from "../../compartido/usePdfAlmacenado";
import { claveReporte, filtrarPorAlumno, agruparPorAlumno, idsDestacados, esDestacado, tipoDeUrl, describirResultado } from "../revisionReportes";

// ── Modos del panel ──────────────────────────────────────────
export const MODO = {
  NORMAL:    "normal",
  APROBAR:   "aprobar",   // sube la rúbrica la primera vez (o usa la guardada) y confirma
  RECHAZAR:  "rechazar",  // pide el motivo
};

// Todo sale del backend: listado, detalle, PDF, rúbrica del profesor, rechazo y aprobación (que firma y envía a Coordinación).
export function useRevisarReportes() {
  const [carga, setCarga]               = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [lista, setLista]               = useState({ pendientes: [], procesados: [] });
  const [seleccionado, setSeleccionado] = useState(null); // clave "tipo:id"
  const [detalle, setDetalle]           = useState({ estado: "inactivo", datos: null, error: null });
  const [modo, setModo]                 = useState(MODO.NORMAL);
  const { pdf, abrirPdf, cerrarPdf }    = usePdfAlmacenado();

  // ── Estado de firma del profesor ─────────────────────────
  // El backend solo dice si ya existe su rúbrica (nunca la imagen): la primera vez se sube, después se reutiliza.
  const [rubrica, setRubrica]                 = useState({ estado: "inactivo", tiene: false, error: null }); // inactivo | cargando | listo | error
  const [firmaFile, setFirmaFile]             = useState(null);
  const [errorFirma, setErrorFirma]           = useState(null);

  // ── Estado de rechazo ────────────────────────────────────
  const [comentario, setComentario]           = useState("");
  const [errorComentario, setErrorComentario] = useState(false);

  const [resultado, setResultado]             = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [errorAccion, setErrorAccion]         = useState(null);
  const [busqueda, setBusqueda]               = useState("");

  // Reportes a resaltar por la notificación (?destacar=<id>); se apagan al abrirlos, como en Ofertas.
  const [searchParams] = useSearchParams();
  const destacarParam = searchParams.get("destacar") ?? "";
  const [vistos, setVistos] = useState({ param: destacarParam, ids: new Set() });
  const idsVistos = vistos.param === destacarParam ? vistos.ids : new Set();
  const destacados = idsDestacados(destacarParam);
  const tipoDestacado = tipoDeUrl(searchParams.get("tipo")); // los ids del mensual y del global se repiten
  const estaDestacado = (r) => esDestacado(r, destacados, tipoDestacado) && !idsVistos.has(r.id);

  const detalleRef = useRef(0); // descarta respuestas de un detalle que ya no es el seleccionado
  const rubricaRef = useRef(0);  // ídem para el estado de la rúbrica
  const accionRef = useRef(false); // evita el doble envío de aprobar/rechazar (el estado tarda un render en reflejarse)

  // `silencioso`: una actualización de fondo que falla no reemplaza la pantalla por el error.
  const cargarLista = useCallback((silencioso = false) => listarReportesProfesor().then(
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
      const datos = await obtenerDetalleReporteProfesor(item.tipoReporte, item.id);
      if (id === detalleRef.current) setDetalle({ estado: "listo", datos, error: null });
    } catch (err) {
      if (id === detalleRef.current) setDetalle({ estado: "error", datos: null, error: err.message });
    }
  }, []);

  const todos = [...lista.pendientes, ...lista.procesados];
  const reporte = seleccionado === null ? null : todos.find((r) => claveReporte(r) === seleccionado) ?? null;

  const pendientes = filtrarPorAlumno(lista.pendientes, busqueda);
  const procesados = filtrarPorAlumno(lista.procesados, busqueda);
  const pendientesAgrupados = agruparPorAlumno(pendientes);
  const procesadosAgrupados = agruparPorAlumno(procesados);

  function limpiarFormularios() {
    setComentario("");
    setErrorComentario(false);
    setFirmaFile(null);
    setErrorFirma(null);
    setErrorAccion(null);
  }

  function resetModo() {
    setModo(MODO.NORMAL);
    limpiarFormularios();
  }

  const cargarRubrica = useCallback(() => {
    const id = ++rubricaRef.current;
    setRubrica((r) => ({ ...r, estado: "cargando", error: null }));
    return obtenerEstadoRubricaProfesor().then(
      (estado) => { if (id === rubricaRef.current) setRubrica({ estado: "listo", tiene: estado.tieneRubrica === true, error: null }); },
      (err) => { if (id === rubricaRef.current) setRubrica({ estado: "error", tiene: false, error: err.message }); },
    );
  }, []);

  // PDF exacto almacenado del reporte seleccionado (el que firmó el alumno).
  function verPdf() {
    if (!reporte || pdf.estado === "cargando") return;
    abrirPdf(() => obtenerPdfReporteProfesor(reporte.tipoReporte, reporte.id));
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

  function irModo(m) {
    setModo(m);
    limpiarFormularios();
    if (m === MODO.APROBAR && !rubrica.tiene) cargarRubrica();
  }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errorComentario) setErrorComentario(false);
  }

  // Firma dibujada por el profesor (solo la primera vez): `archivo` viene de FirmaCanvas, un File PNG al terminar un
  // trazo o null en cuanto el canvas queda vacío. Validación previa; el servidor valida de verdad.
  function handleFirmaChange(archivo) {
    if (!archivo) {
      setFirmaFile(null);
      setErrorFirma(null);
      return;
    }
    const problema = validarArchivoFirma(archivo);
    if (problema) {
      setFirmaFile(null);
      setErrorFirma(problema);
      return;
    }
    setFirmaFile(archivo);
    setErrorFirma(null);
  }

  // Tras aprobar o rechazar: se actualiza la lista (el reporte pasa a "procesados"), se cierra el panel y se avisa.
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
      // Otra revisión se adelantó: se actualiza la lista para que deje de aparecer como pendiente.
      if (err.status === 409 && err.code === "REPORTE_NO_PENDIENTE") cargarLista(true);
    } finally {
      accionRef.current = false;
      setLoading(false);
    }
  }

  // Aprobar y firmar: la primera vez sube la rúbrica; luego el servidor agrega esa firma al PDF que envió el alumno,
  // lo sella y lo envía a Coordinación. No hay segunda vista previa.
  async function confirmarAprobacion() {
    if (rubrica.estado !== "listo") return;
    if (!rubrica.tiene) {
      const problema = validarArchivoFirma(firmaFile);
      if (problema) {
        setErrorFirma(problema);
        return;
      }
    }
    await ejecutarAccion(async () => {
      if (!rubrica.tiene) {
        try {
          await subirRubricaProfesor(firmaFile);
        } catch (err) {
          // Si ya estaba registrada (p. ej. otra pestaña), se reutiliza y se sigue.
          if (err.code !== "RUBRICA_YA_REGISTRADA") {
            setErrorFirma(err.message);
            return;
          }
        }
        setRubrica({ estado: "listo", tiene: true, error: null });
      }
      await aprobarReporteProfesor(reporte.tipoReporte, reporte.id);
      await terminarRevision("aprobado");
    });
  }

  async function confirmarRechazo() {
    if (!comentario.trim()) {
      setErrorComentario(true);
      return;
    }
    await ejecutarAccion(async () => {
      await rechazarReporteProfesor(reporte.tipoReporte, reporte.id, comentario.trim());
      await terminarRevision("rechazado");
    });
  }

  return {
    carga, recargar,
    tieneReportes: lista.pendientes.length + lista.procesados.length > 0,
    pendientes, procesados, reporte, detalle, reintentarDetalle,
    pendientesAgrupados, procesadosAgrupados, estaDestacado,
    busqueda, setBusqueda,
    seleccionado, seleccionar, cerrar,
    pdf, verPdf, cerrarPdf,
    modo, irModo, resetModo,
    // firma profesor
    rubricaGuardada: rubrica.tiene, rubrica, reintentarRubrica: cargarRubrica, firmaFile, errorFirma,
    handleFirmaChange,
    // rechazo
    comentario, handleComentarioChange, errorComentario,
    // resultado
    resultado, setResultado,
    loading, errorAccion,
    confirmarAprobacion, confirmarRechazo,
  };
}
