import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";

const C = {
  overlay: "rgba(0,0,0,0.6)",
  bg: "#111111",
  border: "#2E2E2E",
  text: "#FFFFFF",
  muted: "#a1a0a0",
  accent: "#0A66C2",
};

/**
 * Cierre de sesión cuando a ESTE alumno se le aprueba su baja (CU-ADM-12).
 *
 * Por qué hace falta: su JWT quedó firmado con rol 'alumno_asignado' y `requireRole` valida el rol
 * del TOKEN, no la base de datos. Mientras no vuelva a iniciar sesión, el backend lo seguiría viendo
 * como alumno asignado y las rutas de CU-GR-13 (que exigen 'alumno_sin_asignar') lo rechazarían.
 *
 * Mecanismo: el backend emite `baja:aplicada` por el socket que el módulo de bajas ya usaba. Aquí se
 * limpia la sesión local y se pide iniciarla de nuevo. No se toca JWT, Redis ni el middleware de
 * autenticación.
 *
 * Se muestra un aviso propio en vez de reutilizar el evento `sesion-expirada`, porque ese dice que la
 * sesión venció por inactividad y aquí el motivo es otro.
 *
 * Móntalo UNA sola vez, dentro del <BrowserRouter> pero fuera de <Routes>, junto a
 * <AvisoSesionExpirada />.
 */
export function CierreSesionPorBaja() {
  const { socket, desconectar } = useSocket();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const alAplicarse = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      desconectar();
      setVisible(true);
    };

    socket.on("baja:aplicada", alAplicarse);
    return () => socket.off("baja:aplicada", alAplicarse);
  }, [socket, desconectar]);

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
        padding: "1.75rem", maxWidth: 380, width: "90%", textAlign: "center",
      }}>
        <h3 style={{ margin: "0 0 8px", color: C.text, fontSize: 17, fontWeight: 700 }}>
          Tu baja fue aprobada
        </h3>
        <p style={{ margin: "0 0 1.25rem", color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          Tu servicio social actual quedó cancelado. Conservas tu cuenta: vuelve a iniciar sesión para
          modificar tu solicitud y postularte a otra oferta.
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
