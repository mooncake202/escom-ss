import { useEffect, useMemo, useState } from "react";
import { obtenerAlumnosCartaFirmada, subirCartaFirmada } from "@/services/documentosService";

// CU-ADM-14 — Coordinación registra la carta compromiso firmada de un alumno.
//
// El estado "Pendiente / Enviada" lo DERIVA el backend de la existencia del documento; aquí solo se
// pinta. Sustituir actualiza la misma fila, así que tras subir basta con refrescar ese alumno.

export const MAX_MB = 5; // mismo límite que el expediente de baja; el backend lo revalida

export function useCartaCompromisoFirmada() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [alumnos, setAlumnos] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, enviadas: 0, pendientes: 0 });
  const [intento, setIntento] = useState(0);

  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | pendiente | enviada

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    let vigente = true;

    obtenerAlumnosCartaFirmada().then(
      (r) => {
        if (!vigente) return;
        setAlumnos(r.alumnos);
        setResumen(r.resumen);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );

    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return alumnos.filter((a) => {
      const coincideTexto = !texto
        || a.nombreCompleto.toLowerCase().includes(texto)
        || a.boleta.includes(texto);
      const coincideEstado = filtroEstado === "todos"
        || (filtroEstado === "enviada" && a.carta.enviada)
        || (filtroEstado === "pendiente" && !a.carta.enviada);
      return coincideTexto && coincideEstado;
    });
  }, [alumnos, busqueda, filtroEstado]);

  // Se busca por boleta en la lista viva para que el detalle refleje siempre el último estado.
  const alumnoSeleccionado = alumnos.find((a) => a.boleta === boletaSeleccionada) ?? null;

  function seleccionar(alumno) {
    setBoletaSeleccionada(alumno?.boleta ?? null);
    setErrorEnvio(null);
    setExito(false);
  }

  // Validación de cortesía: el backend vuelve a comprobar tipo y tamaño.
  function validarArchivo(archivo) {
    if (!archivo) return "Selecciona un archivo.";
    if (archivo.type !== "application/pdf") return "Solo se aceptan archivos PDF.";
    if (archivo.size > MAX_MB * 1024 * 1024) return `El archivo no debe superar ${MAX_MB} MB.`;
    return null;
  }

  async function enviarCarta(archivo) {
    if (enviando || !alumnoSeleccionado) return false;

    const problema = validarArchivo(archivo);
    if (problema) { setErrorEnvio(problema); return false; }

    setEnviando(true);
    setErrorEnvio(null);
    try {
      const r = await subirCartaFirmada(alumnoSeleccionado.boleta, archivo);
      // El backend devuelve el estado ya derivado: se refleja sin volver a pedir toda la lista.
      setAlumnos((prev) => prev.map((a) => (a.boleta === r.boleta ? { ...a, carta: r.carta } : a)));
      setResumen((prev) => (r.sustituida
        ? prev
        : { ...prev, enviadas: prev.enviadas + 1, pendientes: prev.pendientes - 1 }));
      setExito(true);
      return true;
    } catch (err) {
      setErrorEnvio(err.message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return {
    carga, recargar,
    alumnos: alumnosFiltrados,
    resumen,
    alumnoSeleccionado, seleccionar,
    busqueda, setBusqueda,
    filtroEstado, setFiltroEstado,
    enviando, errorEnvio, exito, setExito,
    validarArchivo, enviarCarta,
  };
}
