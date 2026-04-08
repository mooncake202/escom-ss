import { useTheme, GRADIENTS } from "@/themes/colors";

const PASOS = [
  { id: 1, label: "Requisitos" },
  { id: 2, label: "Evaluación" },
  { id: 3, label: "Carta término" },
  { id: 4, label: "Expediente" },
  { id: 5, label: "Revisión" },
];

const EstadoIcon = ({ estado, C }) => {
  if (estado === "completado") {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: C.success,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        ✔
      </div>
    );
  }

  if (estado === "activo") {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: GRADIENTS.primary,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
      </div>
    );
  }

  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      border: `2px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.borderDefault }} />
    </div>
  );
};

export function ProcesoSidebarLSS({ pasoActual = 1 }) {
  const { C } = useTheme();

  return (
    <aside style={{
      width: 260,
      minWidth: 260,
      background: C.navBg,
      borderRight: `1px solid ${C.navBorder}`,
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* Header */}
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 1.25rem",
        borderBottom: `1px solid ${C.navBorder}`
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>
          Liberación SS
        </p>
      </div>

      {/* Pasos */}
      <nav style={{ padding: "1rem" }}>
        {PASOS.map((paso, idx) => {
          const estado =
            paso.id < pasoActual
              ? "completado"
              : paso.id === pasoActual
              ? "activo"
              : "pendiente";

          return (
            <div key={paso.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "1rem"
            }}>
              <EstadoIcon estado={estado} C={C} />
              <span style={{
                fontSize: 13,
                color: estado === "activo" ? C.textPrimary : C.textMuted
              }}>
                {paso.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}