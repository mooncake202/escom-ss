import { useEffect, useRef, useState } from "react";
import { obtenerSiguienteReporteGlobal, obtenerVistaPreviaGlobal, enviarReporteGlobal } from "@/services/reportesService";
import { describirError } from "../../CU-REP-01-generar-reporte/reportesGeneracion";
import { usePdfAlmacenado } from "../../compartido/usePdfAlmacenado";

// Reporte global: todo sale del backend (horas acumuladas, periodo completo del servicio, si ya existe uno, datos que faltan,
// rúbrica). Aquí no se calcula ni se valida nada de negocio: la regla de las 480 h la vuelve a exigir el servidor al enviar.
// Flujo de 2 pasos porque el alumno ya tiene su rúbrica: actividades → "Firmar y ver vista previa" → vista previa y envío.
export function useGenerarReporteGlobal() {
  const [intento, setIntento] = useState(0);
  const [carga, setCarga] = useState({ intento: -1, estado: "cargando", datos: null, error: null });
  const { pdf: vistaPrevia, abrirPdf, cerrarPdf } = usePdfAlmacenado();

  const [paso, setPaso]             = useState(1); // 1 actividades · 2 vista previa y envío
  const [actividades, setActividades] = useState("");
  const [errores, setErrores]       = useState({});
  const [enviando, setEnviando]     = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [resultado, setResultado]   = useState(null);
  const enviandoRef = useRef(false); // evita el doble envío (el estado tarda un render en reflejarse)

  useEffect(() => {
    let vigente = true;
    obtenerSiguienteReporteGlobal().then(
      (datos) => { if (vigente) setCarga({ intento, estado: "listo", datos, error: null }); },
      (err) => { if (vigente) setCarga({ intento, estado: "error", datos: null, error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const actual = carga.intento === intento ? carga : { estado: "cargando", datos: null, error: null };

  function pedirVistaPrevia() {
    abrirPdf(() => obtenerVistaPreviaGlobal(actividades));
  }

  function continuarDesdeActividades() {
    if (!actividades.trim()) {
      setErrores({ actividades: "El resumen de actividades es obligatorio." });
      return;
    }
    setErrores({});
    setPaso(2);
    pedirVistaPrevia();
  }

  function handleActividadesChange(e) {
    setActividades(e.target.value);
    if (errores.actividades) setErrores({});
  }

  function volverAEditar() {
    cerrarPdf();
    setErrorEnvio(null);
    setPaso(1);
  }

  async function enviar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const respuesta = await enviarReporteGlobal(actividades);
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
    estado: actual.estado, error: actual.error, datos: actual.datos,
    recargar: () => setIntento((n) => n + 1),
    paso, actividades, handleActividadesChange, errores,
    continuarDesdeActividades, volverAEditar, vistaPrevia, pedirVistaPrevia,
    enviando, errorEnvio, enviar, resultado,
  };
}
