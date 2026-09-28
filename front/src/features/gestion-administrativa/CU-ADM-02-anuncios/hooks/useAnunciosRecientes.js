import { useEffect, useState } from "react";
import { obtenerAnuncios } from "@/services/anunciosService";

// Resumen de anuncios para el dashboard del alumno. Vive en la carpeta de CU-ADM-02 porque es el
// MISMO caso de uso: el dashboard solo muestra los más recientes y la pantalla completa el
// historial. La regla de visibilidad es una sola y la aplica el backend — aquí no se duplica nada.
//
// Es secundario dentro del dashboard: si falla, la lista se queda vacía y no rompe la pantalla.

export const MAX_RECIENTES = 3;

export function useAnunciosRecientes() {
  const [anuncios, setAnuncios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    obtenerAnuncios(MAX_RECIENTES).then(
      (r) => {
        if (!vigente) return;
        setAnuncios(r.anuncios);
        setCargando(false);
      },
      (err) => {
        if (!vigente) return;
        // Un alumno sin asignación vigente sencillamente no tiene anuncios: no es un fallo.
        if (err.code !== "SIN_ASIGNACION") {
          console.error("No se pudieron cargar los anuncios recientes:", err);
        }
        setCargando(false);
      },
    );

    return () => { vigente = false; };
  }, []);

  return { anuncios, cargando };
}

// Aviso de anuncios nuevos para el bloque de alertas de ARRIBA del dashboard. Función PURA: entra
// la lista que devuelve este hook y sale lo que el slot calculado necesita.
//
// Es un aviso CALCULADO, no persistido: se deriva del `visto` que ya trae cada anuncio, así que
// desaparece solo en cuanto el alumno abre el anuncio (ADM-02 lo marca visto al expandirlo) y en la
// siguiente carga del dashboard el `visto` llega en true. No hay estado propio que mantener ni nada
// que descartar a mano.
//
// El mensaje del caso plural NO lleva número a propósito: este hook solo pide los MAX_RECIENTES más
// recientes, así que un conteo aquí sería "N de los 3 más recientes" y mentiría si hubiera más.
export function avisoAnunciosNuevos(anuncios) {
  const sinVer = Array.isArray(anuncios) ? anuncios.filter((a) => a && !a.visto) : [];

  if (sinVer.length === 0) return { mostrar: false, mensaje: null, ruta: null };

  // Con uno solo se puede ir directo a ese anuncio; ADM-02 valida el id contra los realmente
  // visibles antes de abrirlo, así que un id que no le corresponda se ignora en silencio.
  if (sinVer.length === 1) {
    return { mostrar: true, mensaje: "Tienes un anuncio nuevo", ruta: `/alumno/anuncios?anuncio=${sinVer[0].id}` };
  }

  return { mostrar: true, mensaje: "Tienes anuncios nuevos", ruta: "/alumno/anuncios" };
}

// "Hace 2 horas" / "Ayer" / fecha corta. Solo presentación del resumen.
export function tiempoRelativo(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";

  const minutos = Math.floor((Date.now() - f.getTime()) / 60000);
  if (minutos < 1) return "Hace un momento";
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;

  return f.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
