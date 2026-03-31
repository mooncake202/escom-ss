import { RADIUS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function IntegranteCard({ integrante, esTuPerfil, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${esTuPerfil ? C.accent : C.borderDefault}`,
      overflow: "hidden",
    }}>
      {/* Encabezado */}
      <div style={{
        padding: "12px 16px", background: C.bgInput,
        borderBottom: `1px solid ${C.borderDefault}`,
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: esTuPerfil ? C.accent : C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          color: esTuPerfil ? "#fff" : C.accentText,
          flexShrink: 0,
        }}>
          {integrante.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {integrante.nombre} {esTuPerfil && <span style={{ fontSize: 11, color: C.accentText, fontWeight: 500 }}>(tú)</span>}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
            {CARRERA_LABEL[integrante.carrera] ?? integrante.carrera} · {integrante.boleta}
          </p>
        </div>
      </div>

      {/* Datos de contacto */}
      <div style={{ padding: "0.5rem 0" }}>
        {[
          { label: "Correo institucional", valor: integrante.correoInst },
          { label: "Correo personal",      valor: integrante.correoPersonal },
          { label: "Teléfono",             valor: integrante.telefono },
        ].map(({ label, valor }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "1rem", padding: "7px 16px",
            borderBottom: `1px solid ${C.borderSubtle}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0 }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: valor ? C.textPrimary : C.textDisabled, textAlign: "right", fontFamily: valor?.includes("@") ? "monospace" : "inherit" }}>
              {valor ?? "No registrado"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
