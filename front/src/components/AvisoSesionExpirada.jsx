import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  overlay: "rgba(0,0,0,0.6)",
  bg: "#111111",
  border: "#2E2E2E",
  text: "#FFFFFF",
  muted: "#a1a0a0",
  accent: "#0A66C2",
};

/**
 * Móntalo UNA sola vez, dentro del <BrowserRouter> pero fuera de <Routes>,
 * para que escuche el evento sin importar en qué pantalla esté el usuario.
 *
 * Uso en App.jsx:
 * <BrowserRouter>
 *   <AvisoSesionExpirada />
 *   <Routes>...</Routes>
 * </BrowserRouter>
 */
export function AvisoSesionExpirada() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mostrar = () => setVisible(true);
    window.addEventListener("sesion-expirada", mostrar);
    return () => window.removeEventListener("sesion-expirada", mostrar);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: C.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "1.75rem", maxWidth: 360, width: "90%", textAlign: "center",
      }}>
        <h3 style={{ margin: "0 0 8px", color: C.text, fontSize: 17, fontWeight: 700 }}>
          Tu sesión expiró
        </h3>
        <p style={{ margin: "0 0 1.25rem", color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          Por seguridad, cierra sesión después de un tiempo de inactividad. Vuelve a iniciar sesión para continuar.
        </p>
        <button
          onClick={() => { setVisible(false); navigate("/"); }}
          style={{
            width: "100%", padding: "10px", borderRadius: 8,
            border: "none", background: C.accent, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Ir al inicio de sesión →
        </button>
      </div>
    </div>
  );
}
