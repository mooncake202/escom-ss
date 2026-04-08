import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Validación-requisitos-previos/components/ProcesoLSSLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useCartaTermino } from "./hooks/useCartaTermino";
import { useState } from "react";

const MOCK = {
  usuario: "García López Juan Carlos",
  
};

// ——— Sub-componentes ————————————————————————————
function VistaAlumnoRecogerSimple({ onConfirmar, C }) {
  const [checked, setChecked] = useState(false);

  

  return (
    <div style={{
      background: C.bgCard,
      padding: "1.5rem",
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
    }}>
      <p style={{ fontWeight: 600 }}>
        Ya puedes pasar por tu carta a gestión escolar
      </p>

      <label style={{ display: "flex", gap: 10, marginTop: "1rem" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        Ya recogí mi carta
      </label>

      <button
        disabled={!checked}
        onClick={onConfirmar}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "12px",
          borderRadius: 10,
          background: checked ? "#2563eb" : "#ccc",
          color: "#fff",
          border: "none",
          cursor: checked ? "pointer" : "not-allowed"
        }}
      >
        Continuar →
      </button>
    </div>
  );
}

function EstadoBadge({ estado, C }) {
  const map = {
  solicitada: { label: "En espera", color: C.textMuted, bg: C.bgInput },
  lista_para_recoger: { label: "Lista para recoger", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  recibida: { label: "Recibida", color: C.success, bg: C.successSoft },
};
  const { label, color, bg } = map[estado] || map.carta_termino_proceso;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
    }}>
      {label}
    </span>
  );
}

// Vista alumno esperando que coordinación genere carta
function VistaAlumnoEsperando({ C }) {
  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "2rem 1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 44, marginBottom: "1rem" }}>⏳</div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
        Coordinación está elaborando tu carta
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
        Recibirás una notificación cuando tu carta de término esté lista para recoger.
        Este proceso puede tardar algunos días hábiles.
      </p>
    </div>
  );
}

// Vista alumno: carta lista para recoger y subir
function VistaAlumnoRecoger({ archivoEscaneado, error, loading, onSubir, onConfirmar, C }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Aviso: lista */}
      <div style={{
        padding: "14px 16px",
        borderRadius: RADIUS.md,
        background: "rgba(15, 245, 11, 0.08)",
        border: "1px solid rgba(35, 213, 59, 0.3)",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "#3cd12e", fontWeight: 600 }}>
          📬 Tu carta de término está lista
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          Acude a la coordinación para recoger tu carta, fírmala con aval externo, escanéala y súbela aquí para continuar.
        </p>
      </div>

      <label style={{ display: "flex", gap: 10, marginTop: "1rem" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        Ya recogí mi carta
      </label>

      <button
        disabled={!checked}
        onClick={onConfirmar}
        style={{
          width: "80%",
          padding: "12px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: !checked ? "not-allowed" : "pointer",
          background: !checked ? C.borderDefault : GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: !checked ? "none" : SHADOWS.accent,
          opacity: !checked ? 0.5 : 1,
        }}
      >
        Continuar con crear mi expediente →
      </button>

    </div>
  );
}

// Vista coordinación: marcar carta como lista
function VistaCoordinacion({ estado, loading, onMarcarLista, C }) {
  if (estado !== "solicitada") {
    return (
      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        padding: "1.5rem",
        textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: C.success, fontWeight: 600 }}>
          ✔ Carta marcada como lista. Esperando que el alumno la recoja y confirme entrega.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        padding: "1.5rem",
      }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
          Elaborar carta de término
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
          Una vez que hayas elaborado la carta de término para el alumno, marca el estado para notificarle que puede pasar a recogerla.
        </p>
      </div>

      <button
        onClick={onMarcarLista}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          background: loading ? C.borderDefault : GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: loading ? "none" : SHADOWS.accent,
        }}
      >
        {loading ? "Guardando..." : "Marcar carta como lista →"}
      </button>
    </div>
  );
}

// ——— Página principal ——————————————————————————————

export default function CartaTermino({rol}) {
  const { C } = useTheme();
  const {
    estado,
    
    marcarCartaLista,
    
    confirmarEntrega,
  } = useCartaTermino();

  
const Layout = rol === "alumno"
  ? ProcesoLSSLayout
  : DashboardLayout;
  
  
    return (
  <Layout
    {...(rol === "alumno"
      ? {
          pasoActual: 3,
          titulo: "Carta de término",
          subtitulo: "CU-LSS-03 - ALUMNO",
          rol: "alumno",
          usuario: MOCK.usuario,
        }
      : {
          titulo: "Carta de término",
          subtitulo: "CU-LSS-03 - COORDINACIÓN",
          rol: rol,
          usuario: MOCK.usuario,
        })}
  >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Título */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Carta de término
          </h2>
          <EstadoBadge estado={estado} C={C} />
        </div>

        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {rol === "coordinacion"
            ? "Elabora la carta de término para el alumno y notifícalo cuando esté lista para recoger."
            : "Sigue los pasos para obtener y entregar tu carta de término firmada."}
        </p>

        {/* Contenido por rol */}
        {/* ALUMNO */}
        {rol === "alumno" && (
          <>
            {estado === "solicitada" && (
              <VistaAlumnoEsperando C={C} />
            )}

            {estado === "lista_para_recoger" && (
              <VistaAlumnoRecoger
                onConfirmar={confirmarEntrega}
                C={C}
              />
            )}

            {estado === "recibida" && (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <h3 style={{ color: C.success }}>
                  ✔ Ya puedes continuar con tu expediente
                </h3>
              </div>
            )}
          </>
        )}

{/* COORDINACION */}
{rol === "coordinacion" && (
  <>
    {estado === "solicitada" && (
      <div style={{
        background: C.bgCard,
        padding: "1.5rem",
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
      }}>
        <p style={{ fontWeight: 600 }}>
          El alumno solicitó su carta de término
        </p>

        <button
          onClick={marcarCartaLista}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            background: GRADIENTS.primary,
            color: "#fff",
            border: "none"
          }}
        >
          Ya puede recoger su carta →
        </button>
      </div>
    )}

    {estado !== "solicitada" && (
      <div style={{ textAlign: "center" }}>
        ✔ Ya notificaste al alumno
      </div>
    )}
  </>
)}

      </div>
    </Layout>
  );
}
