import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { useCartaTerminoAlumno } from "./hooks/useCartaTerminoAlumno";
import { useState } from "react";

const MOCK = {
  usuario: "García López Juan Carlos",
};

// ——— Badge de estado ————————————————————————————————
function EstadoBadge({ estado, C }) {
  const map = {
    solicitada:         { label: "En espera",          color: C.textMuted,  bg: C.bgInput },
    lista_para_recoger: { label: "Lista para recoger", color: "#15803d",    bg: "rgba(21,128,61,0.10)" },
    recibida:           { label: "Recibida",            color: C.success,    bg: C.successSoft },
  };
  const { label, color, bg } = map[estado] ?? map.solicitada;
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

// ——— Caso 1: Esperando que coordinación elabore la carta ———
function VistaEsperando({ C }) {
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

// ——— Caso 2: Carta lista, alumno debe recogerla y confirmar ———
function VistaListaParaRecoger({ onConfirmar, C }) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Aviso */}
      <div style={{
        padding: "14px 16px",
        borderRadius: RADIUS.md,
        background: "rgba(21,128,61,0.07)",
        border: "1px solid rgba(21,128,61,0.25)",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
          📬 Tu carta de término está lista
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          Acude a la coordinación para recoger tu carta y fírmala. Una vez que la tengas, confirma aquí para continuar con tu expediente.
        </p>
      </div>

      {/* Checkbox */}
      <div style={{
        padding: "10px 12px",
        borderRadius: RADIUS.md,
        border: `1px solid ${checked ? "rgba(21,128,61,0.3)" : C.borderDefault}`,
        background: checked ? "rgba(21,128,61,0.06)" : C.bgInput,
        transition: "all 0.15s",
      }}>
        <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => setChecked(p => !p)}
            style={{ marginTop: 2, accentColor: "#15803d" }}
          />
          <span style={{ fontSize: 13, color: checked ? "#15803d" : C.textPrimary, lineHeight: 1.4 }}>
            Confirmo que ya recogí mi carta de término
          </span>
        </label>
      </div>

      {/* Botón continuar */}
      <button
        disabled={!checked}
        onClick={onConfirmar}
        style={{
          width: "100%",
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
          transition: "all 0.2s",
        }}
      >
        Continuar con mi expediente →
      </button>
    </div>
  );
}

// ——— Caso 3: Alumno ya confirmó recepción ———
function VistaRecibida({ C }) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      borderRadius: RADIUS.lg,
      border: "1px solid rgba(21,128,61,0.3)",
      background: "rgba(21,128,61,0.06)",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "rgba(21,128,61,0.12)",
        border: "1px solid rgba(21,128,61,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        ✔
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>
          Carta de término recibida
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
          Ya puedes continuar con la creación de tu expediente.
        </p>
      </div>
    </div>
  );
}

// ——— Página principal ————————————————————————————————
export default function SeguimientoCartaTerminoAlumno() {
  const { C } = useTheme();
  const { estado, confirmarEntrega } = useCartaTerminoAlumno();

  return (
    <ProcesoLSSLayout
      pasoActual={3}
      titulo="Carta de término"
      subtitulo="Seguimiento de carta de término"
      rol="alumno"
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Carta de término
          </h2>
          <EstadoBadge estado={estado} C={C} />
        </div>

        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Sigue los pasos para obtener tu carta de término y continuar con tu expediente de liberación.
        </p>

        {/* Contenido según estado */}
        {estado === "solicitada"         && <VistaEsperando C={C} />}
        {estado === "lista_para_recoger" && <VistaListaParaRecoger onConfirmar={confirmarEntrega} C={C} />}
        {estado === "recibida"           && <VistaRecibida C={C} />}

      </div>
    </ProcesoLSSLayout>
  );
}
