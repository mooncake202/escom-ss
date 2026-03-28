import { useTheme, GRADIENTS, BRAND } from "@/themes/colors";

const PASOS = [
  { id: 1, label: "Enviar solicitud" },
  { id: 2, label: "Registro en SISS" },
  { id: 3, label: "Adjuntar documentación" },
  { id: 4, label: "Carta compromiso"   },
  { id: 5, label: "Subir expediente" },
];

const EstadoIcon = ({ estado, C }) => {
  if (estado === "completado") return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
  if (estado === "activo") return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 4px rgba(0,58,143,0.2)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
    </div>
  );
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.borderDefault}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.borderDefault }} />
    </div>
  );
};

export function ProcesoSidebar({ pasoActual = 2 }) {
  const { C } = useTheme();

  return (
    <aside style={{
      width: 260, minWidth: 260, height: "100%",
      background: C.navBg, borderRight: `1px solid ${C.navBorder}`,
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 1.25rem", borderBottom: `1px solid ${C.navBorder}`, gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}></span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>ESCOM — IPN</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>Servicio Social</p>
        </div>
      </div>

      {/* Título sección */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Proceso de registro
        </p>
      </div>

      {/* Pasos */}
      <nav style={{ flex: 1, padding: "0 1rem", display: "flex", flexDirection: "column", gap: 2 }}>
        {PASOS.map((paso, idx) => {
          const estado = paso.id < pasoActual ? "completado" : paso.id === pasoActual ? "activo" : "pendiente";
          const isLast = idx === PASOS.length - 1;

          return (
            <div key={paso.id} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 8px", borderRadius: 8,
                background: estado === "activo" ? C.navItemActive : "transparent",
              }}>
                <EstadoIcon estado={estado} C={C} />
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13,
                    fontWeight: estado === "activo" ? 600 : 400,
                    color: estado === "activo" ? C.textPrimary : estado === "completado" ? C.textSecondary : C.textDisabled,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {paso.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>{paso.sub}</p>
                </div>
              </div>

              {/* Línea conectora */}
              {!isLast && (
                <div style={{ marginLeft: 21, width: 2, height: 8, background: paso.id < pasoActual ? C.success : C.borderSubtle, borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "1rem 1.25rem", borderTop: `1px solid ${C.navBorder}`, flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textAlign: "center" }}>
          ESCOM — Sistema de Servicio Social Interno
        </p>
      </div>
    </aside>
  );
}
