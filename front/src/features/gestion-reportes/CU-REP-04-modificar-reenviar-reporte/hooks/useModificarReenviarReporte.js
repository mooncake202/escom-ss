import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { obtenerSeguimientoReporte, obtenerVistaPreviaCorreccion, reenviarReporteCorregido } from "@/services/reportesService";
import { describirError } from "../../CU-REP-01-generar-reporte/reportesGeneracion";
import { usePdfAlmacenado } from "../../compartido/usePdfAlmacenado";
import { idsDestacados, tipoDeUrl } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { hayCambioReal } from "../correccionReportes";

const primerId = (valor) => [...idsDestacados(valor)][0] ?? null;

// Corrección de UN reporte propio rechazado, mensual o global (?reporte=<id>, con &tipo=global para el global). Solo se editan las actividades: número, periodo, días y horas
// son el snapshot del envío original y aquí solo se muestran. El backend valida propietario y estado, y firma con la rúbrica
// ya registrada; nada de eso se pide ni se decide aquí.
export function useModificarReenviarReporte() {
  const [params] = useSearchParams();
  const id = primerId(params.get("reporte"));
  const tipo = tipoDeUrl(params.get("tipo"));

  const [intento, setIntento] = useState(0);
  const clave = `${id === null ? "sin-id" : `${tipo}:${id}`}|${intento}`;
  const [resultadoCarga, setResultadoCarga] = useState({ clave: null, estado: "cargando", datos: null, error: null });
  const { pdf: vistaPrevia, abrirPdf, cerrarPdf } = usePdfAlmacenado();

  const [paso, setPaso]               = useState(1); // 1 editar · 2 vista previa y reenvío
  const [edicion, setEdicion]         = useState(null); // texto editado; null = sin tocar (se muestra el actual)
  const [errores, setErrores]         = useState({});
  const [enviando, setEnviando]       = useState(false);
  const [errorEnvio, setErrorEnvio]   = useState(null);
  const [resultado, setResultado]     = useState(null);
  const enviandoRef = useRef(false); // evita el doble envío (el estado tarda un render en reflejarse)

  useEffect(() => {
    let vigente = true; // una respuesta de una consulta anterior no pisa a la actual
    const consulta = id === null ? Promise.resolve(null) : obtenerSeguimientoReporte(tipo, id);
    consulta.then(
      (datos) => { if (vigente) setResultadoCarga({ clave, estado: datos === null ? "sin_reporte" : "listo", datos, error: null }); },
      (err) => { if (vigente) setResultadoCarga({ clave, estado: "error", datos: null, error: err.message }); },
    );
    return () => { vigente = false; };
  }, [id, tipo, clave]);

  const carga = resultadoCarga.clave === clave ? resultadoCarga : { estado: "cargando", datos: null, error: null };
  const reporte = carga.datos;
  // Solo los rechazados por el profesor o por coordinación se corrigen (el backend lo vuelve a exigir).
  const estado = carga.estado === "listo" && !reporte.puedeCorregir ? "no_corregible" : carga.estado;

  const original = reporte?.actividades ?? "";
  const actividades = edicion ?? original;
  const cambioReal = hayCambioReal(original, actividades);

  function handleChange(e) {
    setEdicion(e.target.value);
    if (errores.actividades) setErrores({});
  }

  function pedirVistaPrevia() {
    abrirPdf(() => obtenerVistaPreviaCorreccion(reporte.tipoReporte, reporte.id, actividades));
  }

  function irAVistaPrevia() {
    if (!actividades.trim()) {
      setErrores({ actividades: "Las actividades realizadas son obligatorias." });
      return;
    }
    if (!cambioReal) {
      setErrores({ actividades: "Modifica las actividades antes de continuar." });
      return;
    }
    setErrores({});
    setPaso(2);
    pedirVistaPrevia();
  }

  function volverAEditar() {
    cerrarPdf();
    setErrorEnvio(null);
    setPaso(1);
  }

  async function confirmarReenvio() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const respuesta = await reenviarReporteCorregido(reporte.tipoReporte, reporte.id, actividades);
      cerrarPdf();
      setResultado(respuesta);
    } catch (err) {
      setErrorEnvio(describirError(err));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return {
    estado, error: carga.error, reporte,
    recargar: () => setIntento((n) => n + 1),
    paso, actividades, handleChange, errores, cambioReal,
    irAVistaPrevia, volverAEditar, vistaPrevia, pedirVistaPrevia,
    enviando, errorEnvio, confirmarReenvio, resultado,
  };
}
