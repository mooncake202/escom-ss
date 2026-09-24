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
