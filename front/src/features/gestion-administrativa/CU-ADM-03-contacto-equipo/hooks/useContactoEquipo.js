import { useEffect, useState } from "react";
import { obtenerMiEquipo } from "@/services/directorioService";

// Compañeros de la MISMA oferta, con el propio alumno ya excluido por el backend. En una oferta
// individual `esProyecto` es false y `companeros` viene vacío.
// Ningún integrante expone celular: es un dato personal de un tercero.
export function useContactoEquipo() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null, code: null });
  const [datos, setDatos] = useState(null);
  const [intento, setIntento] = useState(0);

  // El estado inicial ya es "cargando" y `recargar` lo repone antes de pedir de nuevo, así que el
  // efecto no necesita (ni debe) llamar a setState de forma síncrona en su cuerpo.
  useEffect(() => {
    let vigente = true;
    obtenerMiEquipo().then(
      (r) => {
        if (!vigente) return;
        setDatos(r);
        setCarga({ estado: "listo", error: null, code: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message, code: err.code ?? null }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const recargar = () => {
    setCarga({ estado: "cargando", error: null, code: null });
    setIntento((n) => n + 1);
  };

  return {
    carga, recargar,
    oferta: datos?.oferta ?? null,
    yo: datos?.yo ?? null,
    companeros: datos?.companeros ?? [],
    esProyecto: datos?.oferta?.esProyecto ?? false,
    sinAsignacion: carga.code === "SIN_ASIGNACION",
  };
}
