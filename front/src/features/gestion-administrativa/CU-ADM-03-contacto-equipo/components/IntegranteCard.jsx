import { RADIUS } from "@/themes/colors";
import { etiquetaCarrera } from "@/features/gestion-administrativa/utils/carreraLabel";

// El celular NO se muestra: es un dato personal de un tercero y el backend ni siquiera lo envía.
//
// Esta tarjeta solo pinta COMPAÑEROS: el alumno autenticado no aparece en la pantalla, así que ya
// no existe el caso "este eres tú" ni su marca "(tú)".
export function IntegranteCard({ integrante, C }) {
  const iniciales = integrante.nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
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
          background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          color: C.accentText,
          flexShrink: 0,
        }}>
          {iniciales}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {integrante.nombreCompleto}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
            {etiquetaCarrera(integrante.carrera)} · {integrante.boleta}
          </p>
        </div>
      </div>

      {/* Datos de contacto */}
      <div style={{ padding: "0.5rem 0" }}>
        {[
          { label: "Correo institucional", valor: integrante.correoInstitucional },
          { label: "Correo personal",      valor: integrante.correoPersonal },
        ].map(({ label, valor }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "1rem", padding: "7px 16px",
            borderBottom: `1px solid ${C.borderSubtle}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0 }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: valor ? C.textPrimary : C.textDisabled, textAlign: "right", fontFamily: valor ? "monospace" : "inherit" }}>
              {valor ?? "No registrado"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
