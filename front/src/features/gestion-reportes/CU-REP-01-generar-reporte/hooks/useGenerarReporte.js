import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  obtenerSiguienteReporte, subirRubrica, obtenerVistaPrevia, enviarReporteMensual,
} from "@/services/reportesService";
import { agruparDiasPorMes, validarArchivoFirma, describirError } from "../reportesGeneracion";

// Toda la información sale de GET /reportes/mensual/siguiente; aquí no se calculan periodos ni horas.
export function useGenerarReporte() {
  const [estadoCarga, setEstadoCarga] = useState("cargando"); // cargando | listo | error
  const [datos, setDatos]             = useState(null);
  const [errorCarga, setErrorCarga]   = useState(null);

  const [indice, setIndice]           = useState(0);
  const [mesActivo, setMesActivo]     = useState(0);
  const [actividades, setActividades] = useState("");
  const [errores, setErrores]         = useState({});

  const [firma, setFirma]               = useState(null);
  const [firmaUrl, setFirmaUrl]         = useState(null);
  const [firmaSubida, setFirmaSubida]   = useState(false);
  const [subiendoFirma, setSubiendoFirma] = useState(false);

  const [vistaPrevia, setVistaPrevia] = useState({ estado: "inactiva", url: null, error: null });
  const [enviando, setEnviando]       = useState(false);
  const [errorEnvio, setErrorEnvio]   = useState(null);
  const [resultado, setResultado]     = useState(null);

  // La vista previa es un Blob del servidor: se libera su URL al reemplazarla, al salir del paso y al desmontar.
  const vistaRef = useRef({ url: null, id: 0 });
  const firmaUrlRef = useRef(null);

  const liberarVista = useCallback(() => {
    if (vistaRef.current.url) URL.revokeObjectURL(vistaRef.current.url);
    vistaRef.current.url = null;
  }, []);

  const cargar = useCallback(async () => {
    setEstadoCarga("cargando");
    try {
      const respuesta = await obtenerSiguienteReporte();
      setDatos(respuesta);
      setMesActivo(0);
      setErrorCarga(null);
      setEstadoCarga("listo");
    } catch (err) {
      setErrorCarga(err.message);
      setEstadoCarga("error");
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => () => {
    vistaRef.current.id += 1;
    liberarVista();
    if (firmaUrlRef.current) URL.revokeObjectURL(firmaUrlRef.current);
  }, [liberarVista]);

  // ── Datos ya calculados por el backend ──────────────────────
  const meses = useMemo(() => agruparDiasPorMes(datos?.calendario?.dias), [datos]);
  const avances = useMemo(
    () => (datos?.actividades ?? []).map((a) => ({ titulo: a.titulo, porcentaje: a.avance.alCierre })),
    [datos],
  );

  // La firma solo se pide si el backend no la tiene; una vez subida en esta sesión el paso sigue existiendo.
  const incluyeFirma = Boolean(datos?.firma?.requiereSubirRubrica) || firmaSubida;
  const pasos = incluyeFirma ? ["calendario", "actividades", "firma", "vista"] : ["calendario", "actividades", "vista"];
  const pasoActual = pasos[Math.min(indice, pasos.length - 1)];

  const cargarVistaPrevia = useCallback(async (texto) => {
    const id = ++vistaRef.current.id;
    liberarVista();
    setVistaPrevia({ estado: "cargando", url: null, error: null });
    try {
      const pdf = await obtenerVistaPrevia(texto);
      if (id !== vistaRef.current.id) return;
      const url = URL.createObjectURL(pdf);
      vistaRef.current.url = url;
      setVistaPrevia({ estado: "listo", url, error: null });
    } catch (err) {
      if (id !== vistaRef.current.id) return;
      setVistaPrevia({ estado: "error", url: null, error: describirError(err) });
    }
  }, [liberarVista]);

  const irAVista = useCallback((texto) => {
    setIndice(pasos.length - 1);
    cargarVistaPrevia(texto);
  }, [pasos.length, cargarVistaPrevia]);

  function salirDeVista() {
    vistaRef.current.id += 1;
    liberarVista();
    setVistaPrevia({ estado: "inactiva", url: null, error: null });
    setErrorEnvio(null);
  }

  // ── Navegación ──────────────────────────────────────────────
  function continuarDesdeCalendario() {
    if (datos?.puedeGenerar !== true) return;
    setIndice(1);
  }

  function handleActividadesChange(e) {
    setActividades(e.target.value);
    if (errores.actividades) setErrores((prev) => ({ ...prev, actividades: null }));
  }

  function continuarDesdeActividades() {
    if (!actividades.trim()) {
      setErrores({ actividades: "Las actividades realizadas son obligatorias." });
      return;
    }
    setErrores({});
    if (incluyeFirma && !firmaSubida) setIndice(2);
    else irAVista(actividades);
  }

  function handleFirmaChange(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const problema = validarArchivoFirma(archivo);
    if (problema) {
      setErrores((prev) => ({ ...prev, firma: problema }));
      return;
    }
    if (firmaUrlRef.current) URL.revokeObjectURL(firmaUrlRef.current);
    firmaUrlRef.current = URL.createObjectURL(archivo);
    setFirma(archivo);
    setFirmaUrl(firmaUrlRef.current);
    setErrores((prev) => ({ ...prev, firma: null }));
  }

  async function continuarDesdeFirma() {
    if (subiendoFirma) return;
    if (firmaSubida) {
      irAVista(actividades);
      return;
    }
    const problema = validarArchivoFirma(firma);
    if (problema) {
      setErrores({ firma: problema });
      return;
    }
    setSubiendoFirma(true);
    try {
      await subirRubrica(firma);
    } catch (err) {
      // Si ya estaba registrada (p. ej. otra pestaña), se reutiliza y se sigue.
      if (err.code !== "RUBRICA_YA_REGISTRADA") {
        setErrores({ firma: describirError(err).mensaje });
        setSubiendoFirma(false);
        return;
      }
    }
    setFirmaSubida(true);
    setErrores({});
    setSubiendoFirma(false);
    irAVista(actividades);
  }

  function atras() {
    if (pasoActual === "vista") salirDeVista();
    setErrores({});
    setIndice((i) => Math.max(i - 1, 0));
  }

  function irAActividades() {
    if (pasoActual === "vista") salirDeVista();
    setErrores({});
    setIndice(1);
  }

  async function recargar() {
    if (pasoActual === "vista") salirDeVista();
    setIndice(0);
    await cargar();
  }

  function reintentarVistaPrevia() {
    cargarVistaPrevia(actividades);
  }

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const respuesta = await enviarReporteMensual(actividades);
      liberarVista();
      setResultado(respuesta);
    } catch (err) {
      setErrorEnvio(describirError(err));
    } finally {
      setEnviando(false);
    }
  }

  return {
    estadoCarga, errorCarga, recargar,
    reporte: datos?.reporte ?? null,
    alumno: datos?.alumno ?? null,
    profesor: datos?.profesor ?? null,
    resumen: datos?.resumen ?? { diasLaborados: 0, horas: 0, bitacorasAprobadas: 0 },
    puedeGenerar: datos?.puedeGenerar === true,
    motivosBloqueo: datos?.motivosBloqueo ?? [],
    meses, mesActivo, setMesActivo, avances,
    pasoActual, numeroPaso: Math.min(indice, pasos.length - 1) + 1, totalPasos: pasos.length,
    actividades, handleActividadesChange, errores,
    firma, firmaUrl, firmaSubida, subiendoFirma, handleFirmaChange,
    continuarDesdeCalendario, continuarDesdeActividades, continuarDesdeFirma,
    atras, irAActividades,
    vistaPrevia, reintentarVistaPrevia,
    enviando, errorEnvio, enviar, resultado,
  };
}
