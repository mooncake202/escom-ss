import { useTheme, RADIUS } from "@/themes/colors";
import { useGestionarEstado, puedesCerrarManual } from "../hooks/useGestionarEstado";

export function CerrarOfertaPanel({ oferta, onCerrar }) {
  const { C } = useTheme();
  const { confirmandoCierre, iniciarCierre, cancelarCierre, confirmarCierre } = useGestionarEstado();

  const esFinal = oferta.estatus === "concluido" || oferta.estatus === "cerrado";

  // RN-PRO-05: oferta concluida o cerrada → solo consulta
  if (esFinal) {
    return (
      <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
        Esta oferta está en modo consulta y no puede modificarse.
      </p>
    );
  }

  // RN-PRO-04: proyecto activo con alumnos activos → no se puede cerrar aún
  if (oferta.tipo === "proyecto" && oferta.estatus === "activo" && oferta.alumnosActivos > 0) {
    return (
      <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
        Hay {oferta.alumnosActivos} alumno{oferta.alumnosActivos !== 1 ? "s" : ""} con servicio activo.
        La oferta no puede cerrarse hasta que concluyan.
      </p>
    );
  }

  // RN-PRO-04: condiciones de cierre manual cumplidas
  if (puedesCerrarManual(oferta)) {
    if (confirmandoCierre) {
      return (
        <div style={{
          padding: "1rem", borderRadius: RADIUS.md,
          background: C.dangerSoft, border: `1px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, fontWeight: 600, color: C.danger }}>
            ¿Confirmas el cierre manual de esta oferta?
          </p>
          <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
            Quedará con estado <strong>Cerrada</strong> y no podrá recibir nuevas solicitudes.
            Esta acción no puede deshacerse.
          </p>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button onClick={cancelarCierre} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={() => confirmarCierre(oferta, onCerrar)} style={{
              flex: 2, padding: "8px", borderRadius: RADIUS.md,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Confirmar cierre</button>
          </div>
        </div>
      );
    }

    return (
      <button onClick={iniciarCierre} style={{
        width: "100%", padding: "9px", borderRadius: RADIUS.md,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        background: "transparent", border: `1px solid ${C.danger}`,
        color: C.danger, fontFamily: "inherit",
      }}>
        Cerrar oferta
      </button>
    );
  }

  return null;
}