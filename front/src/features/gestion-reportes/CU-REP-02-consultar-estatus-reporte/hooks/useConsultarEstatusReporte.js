import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarReportesAlumno, obtenerSeguimientoReporte } from "@/services/reportesService";
import { idsDestacados, tipoDeUrl } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";

// Primer id válido de un parámetro de la URL ("5" → 5); lo que no es un id → null.
const primerId = (valor) => [...idsDestacados(valor)][0] ?? null;

// Seguimiento de UN reporte propio (mensual o global), con su historial real. El reporte sale de la URL: ?reporte=<id> (desde
// "Mis reportes") o ?destacar=<id> (desde una notificación), con &tipo=global para el global (sin tipo, mensual); sin id se
// muestra el más reciente. El backend solo entrega reportes del alumno.
export function useConsultarEstatusReporte() {
  const [params] = useSearchParams();
  const idPedido = primerId(params.get("reporte")) ?? primerId(params.get("destacar"));
  const idDestacado = primerId(params.get("destacar"));
  const tipoPedido = tipoDeUrl(params.get("tipo"));

  const [intento, setIntento] = useState(0);
  const clave = `${idPedido === null ? "ultimo" : `${tipoPedido}:${idPedido}`}|${intento}`;
  const [resultado, setResultado] = useState({ clave: null, estado: "cargando", datos: null, error: null });

  useEffect(() => {
    let vigente = true; // una respuesta de una consulta anterior no pisa a la actual
    const consulta = idPedido !== null
      ? obtenerSeguimientoReporte(tipoPedido, idPedido)
      : listarReportesAlumno().then(({ reportes }) => (reportes.length ? obtenerSeguimientoReporte(reportes[0].tipoReporte, reportes[0].id) : null));
    consulta.then(
      (datos) => { if (vigente) setResultado({ clave, estado: datos ? "listo" : "vacio", datos, error: null }); },
      (err) => { if (vigente) setResultado({ clave, estado: "error", datos: null, error: err.message }); },
    );
    return () => { vigente = false; };
  }, [idPedido, tipoPedido, clave]);

  // Mientras la consulta de esta clave no responde, se muestra "cargando" (aunque haya un resultado de otra).
  const actual = resultado.clave === clave ? resultado : { estado: "cargando", datos: null, error: null };
  const reporte = actual.datos;

  return {
    estado: actual.estado, error: actual.error, reporte,
    // Se resalta el último evento cuando se llega desde la notificación de ESTE reporte.
    destacarUltimo: reporte !== null && idDestacado === reporte.id && tipoPedido === reporte.tipoReporte,
    recargar: () => setIntento((n) => n + 1),
  };
}
