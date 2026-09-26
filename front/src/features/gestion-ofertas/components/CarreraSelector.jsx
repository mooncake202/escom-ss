import { useEffect, useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { apiFetch } from "@/services/apiClient";

// SOLO presentación. Qué carreras existen lo decide el backend (GET /ofertas/perfiles, que lee la
// tabla `carrera`); este mapa jamás añade ni quita opciones. La columna es VARCHAR(3), así que el
// nombre largo no existe en BD y vive aquí. Un código que no esté en el mapa se muestra tal cual:
// se prefiere una etiqueta pobre a ocultarle una opción al profesor.
const NOMBRE_LARGO = Object.freeze({
  ISC: "Ingeniería en Sistemas Computacionales",
  LCD: "Licenciatura en Ciencia de Datos",
  IIA: "Ingeniería en Inteligencia Artificial",
});

// El código corto se conserva dentro de la etiqueta: es el valor que se envía al backend.
const etiquetaDe = (codigo) => (NOMBRE_LARGO[codigo] ? `${codigo} — ${NOMBRE_LARGO[codigo]}` : codigo);

export function CarreraSelector({ value = [], onToggle, error }) {
  const { C } = useTheme();
  const [carreras, setCarreras]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  useEffect(() => {
    // `cancelado` evita escribir estado si el componente se desmonta antes de que llegue la
    // respuesta — necesario porque StrictMode monta y desmonta dos veces en desarrollo.
    let cancelado = false;
    apiFetch("/ofertas/perfiles")
      .then((perfiles) => { if (!cancelado) setCarreras(Array.isArray(perfiles) ? perfiles : []); })
      .catch((err) => { if (!cancelado) setErrorCarga(err.message || "No se pudieron cargar las carreras."); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, []);

  const mensajeStyle = (color) => ({ margin: 0, fontSize: 12, color });

  return (
    <div>
      {error && (
        <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger }}>{error}</p>
      )}

      {cargando && <p style={mensajeStyle(C.textMuted)}>Cargando carreras…</p>}
      {!cargando && errorCarga && <p style={mensajeStyle(C.danger)}>{errorCarga}</p>}
      {!cargando && !errorCarga && carreras.length === 0 && (
        <p style={mensajeStyle(C.textMuted)}>No hay carreras disponibles.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {carreras.map(({ id, nombre }) => {
          const checked = value.includes(nombre);
          return (
            <label key={id ?? nombre} style={{
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              padding: "7px 10px", borderRadius: RADIUS.md,
              background: checked ? C.accentSoft : "transparent",
              border: `1px solid ${checked ? C.accent : "transparent"}`,
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => onToggle(nombre)}
                style={{ accentColor: C.accent, width: 15, height: 15, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: checked ? C.textPrimary : C.textMuted }}>{etiquetaDe(nombre)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
