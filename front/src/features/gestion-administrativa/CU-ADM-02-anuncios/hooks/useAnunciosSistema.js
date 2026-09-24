import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { obtenerAnuncios, marcarAnuncioVisto } from "@/services/anunciosService";

// Datos reales. El backend decide qué anuncios ve el alumno (Coordinación + su profesor actual);
// aquí no se filtra ni se ordena nada por nuestra cuenta: llegan ya en orden descendente.
//
// Al abrir el detalle se marca como visto automáticamente — no hay botón de "marcar como leído".

// Corto, para el encabezado de la tarjeta cerrada: "23 sep. 2026".
export function formatFecha(iso) {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  return `${f.getDate()} ${meses[f.getMonth()]}. ${f.getFullYear()}`;
}

// Completo con hora, para el pie de la tarjeta expandida: "23 de septiembre de 2026, 03:27".
// La fecha se muestra en UN solo formato a la vez: corto si está cerrada, largo si está abierta.
export function formatFechaHora(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  const fecha = f.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const hora = f.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha}, ${hora}`;
}

export function useAnunciosSistema() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null, code: null });
  const [anuncios, setAnuncios] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [intento, setIntento] = useState(0);
  const [params, setParams] = useSearchParams();

  // ?anuncio=<id> llega desde el resumen del dashboard.
  const pedido = params.get("anuncio");

  useEffect(() => {
    let vigente = true;

    obtenerAnuncios().then(
      (r) => {
        if (!vigente) return;
        setAnuncios(r.anuncios);
        setCarga({ estado: "listo", error: null, code: null });

        // El id de la URL NO se usa a ciegas: solo abre el anuncio si de verdad está entre los
        // visibles para este alumno. Si no, se ignora en silencio.
        if (pedido) {
          const encontrado = r.anuncios.find((a) => String(a.id) === String(pedido));
          if (encontrado) abrir(encontrado);
          setParams({}, { replace: true }); // se consume: al refrescar ya no se reabre
        }
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message, code: err.code ?? null }); },
    );

    return () => { vigente = false; };
    // `pedido` se lee una vez por carga y se consume enseguida; volver a ejecutar por él reabriría
    // el detalle en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null, code: null });
    setSeleccionado(null);
    setIntento((n) => n + 1);
  }

  // Alterna la tarjeta: si ya estaba abierta, se contrae. Solo una abierta a la vez, porque el
  // estado guarda un único anuncio.
  //
  // Expandir ES marcarlo como visto. La lista se actualiza de inmediato y el acuse viaja detrás: si
  // falla, no se le rompe la pantalla al alumno por un dato secundario.
  function abrir(anuncio) {
    if (seleccionado?.id === anuncio.id) {
      setSeleccionado(null);
      return;
    }
    setSeleccionado(anuncio);
    if (anuncio.visto) return;

    setAnuncios((prev) => prev.map((a) => (a.id === anuncio.id ? { ...a, visto: true } : a)));
    marcarAnuncioVisto(anuncio.id).catch((err) => {
      console.error("No se pudo marcar el anuncio como visto:", err);
    });
  }

  return {
    carga, recargar,
    anuncios,
    seleccionado,
    abrir,
    cerrar: () => setSeleccionado(null),
    sinAsignacion: carga.code === "SIN_ASIGNACION",
  };
}
