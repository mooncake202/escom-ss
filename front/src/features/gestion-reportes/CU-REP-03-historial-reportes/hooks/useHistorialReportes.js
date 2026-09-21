import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listarReportesAlumno, obtenerPdfReporteAlumno } from "@/services/reportesService";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";
import { usePdfAlmacenado } from "../../compartido/usePdfAlmacenado";
import { claveReporte } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { destacadoDeConsulta, esNotificacionDeReporte } from "../../CU-REP-02-consultar-estatus-reporte/seguimientoReportes";

// Solo los reportes del alumno: el backend los saca del token. El PDF que se ve o descarga es el almacenado (no se regenera).
//
// ?destacar=<id> (con &tipo=global para el global): el alumno llega desde una notificación. Al cargar la lista se ABRE la tarjeta
// de ese reporte (la misma que abre el clic manual, con su borde completo del color del estado), se marcan como leídas SUS
// notificaciones con el mecanismo existente y el parámetro se retira de la URL: al refrescar ya no se vuelve a abrir.
export function useHistorialReportes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [destacado] = useState(() => destacadoDeConsulta(searchParams.get("destacar"), searchParams.get("tipo")));
  const atendido = useRef(false);
  const [carga, setCarga]               = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [reportes, setReportes]         = useState([]);
  const [expandido, setExpandido]       = useState(null);
  const [reporteEnPdf, setReporteEnPdf] = useState(null); // reporte cuyo PDF está abierto en el visor
  const [descarga, setDescarga]         = useState({ id: null, estado: "inactivo", error: null });
  const { pdf, abrirPdf, cerrarPdf }    = usePdfAlmacenado();

  const [intento, setIntento]         = useState(0);

  // Se atiende UNA sola vez (aunque la lista se recargue): abre la tarjeta, marca sus avisos como leídos y consume el parámetro.
  const atenderDestacado = useEffectEvent((lista) => {
    if (!destacado || atendido.current) return;
    atendido.current = true;
    navigate("/alumno/reportes", { replace: true });
    const reporte = lista.find((r) => r.tipoReporte === destacado.tipo && r.id === destacado.id);
    if (!reporte) return;
    setExpandido(claveReporte(reporte));
    listarNotificacionesPendientes()
      .then((pendientes) => Promise.all(
        pendientes.filter((n) => esNotificacionDeReporte(n.ruta_relacionada, reporte)).map((n) => marcarNotificacionLeida(n.id)),
      ))
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones del reporte:", err));
  });

  useEffect(() => {
    let vigente = true; // una respuesta de una consulta anterior no pisa a la actual
    listarReportesAlumno().then(
      (respuesta) => {
        if (!vigente) return;
        setReportes(respuesta.reportes);
        setCarga({ estado: "listo", error: null });
        atenderDestacado(respuesta.reportes);
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  function toggleExpandir(id) {
    setExpandido((prev) => (prev === id ? null : id));
  }

  function verPdf(reporte) {
    if (pdf.estado === "cargando") return;
    setReporteEnPdf(reporte);
    abrirPdf(() => obtenerPdfReporteAlumno(reporte.tipoReporte, reporte.id));
  }

  function cerrarVisor() {
    cerrarPdf();
    setReporteEnPdf(null);
  }

  async function descargarPdf(reporte) {
    if (descarga.estado === "cargando") return;
    setDescarga({ id: reporte.id, estado: "cargando", error: null });
    try {
      const archivo = await obtenerPdfReporteAlumno(reporte.tipoReporte, reporte.id);
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = reporte.tipoReporte === "global" ? "reporte-global.pdf" : `reporte-mensual-${reporte.numeroReporte}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDescarga({ id: null, estado: "inactivo", error: null });
    } catch (err) {
      setDescarga({ id: reporte.id, estado: "error", error: err.message });
    }
  }

  // Estado del PDF de un reporte para su tarjeta (cargando y error de "ver" o de "descargar").
  const estadoPdfDe = (reporte) => ({
    viendo: pdf.estado === "cargando" && reporteEnPdf?.id === reporte.id,
    descargando: descarga.estado === "cargando" && descarga.id === reporte.id,
    error: (pdf.estado === "error" && reporteEnPdf?.id === reporte.id ? pdf.error : null)
      ?? (descarga.estado === "error" && descarga.id === reporte.id ? descarga.error : null),
  });

  return {
    carga, recargar,
    tieneHistorial: reportes.length > 0,
    reportes, expandido, toggleExpandir,
    pdf, reporteEnPdf, verPdf, cerrarVisor, descargarPdf, estadoPdfDe,
  };
}
