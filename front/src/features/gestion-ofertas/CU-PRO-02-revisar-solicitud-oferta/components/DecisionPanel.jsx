import { useTheme, RADIUS } from "@/themes/colors";
import { useDecisionOferta } from "../hooks/useDecisionOferta";

export function DecisionPanel({ oferta, onAprobar, onRechazar }) {
  const { C } = useTheme();
  const {
    modo, motivos, setMotivos, errores,
    abrirAprobar, abrirRechazar, cancelar,
    confirmarAprobacion, confirmarRechazo,
  } = useDecisionOferta();

  const esIndividual = oferta.modalidad === "individual";

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  });

  return (
    <>
      <hr style={{ border: "none", borderTop: `1px solid ${C.borderDefault}`, margin: "1.25rem 0" }} />

      {/* Cupos disponibles del profesor (solo grupales) */}
      {!esIndividual && oferta.cuposDisponiblesProfesor != null && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            padding: "8px 14px", borderRadius: RADIUS.md, textAlign: "center",
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
            display: "inline-block", minWidth: 110,
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Disponibles del profesor
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#818cf8" }}>
              {oferta.cuposDisponiblesProfesor}
            </p>
          </div>
        </div>
      )}

      {/* Botones principales */}
      {modo === null && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={abrirRechazar} style={{
            flex: 1, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            color: C.danger, fontFamily: "inherit",
          }}>
            Rechazar
          </button>
          <button onClick={abrirAprobar} style={{
            flex: 2, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: C.success, border: "none", color: "#fff", fontFamily: "inherit",
          }}>
            Aprobar solicitud
          </button>
        </div>
      )}

      {/* Confirmación aprobación grupal */}
      {modo === "aprobar" && !esIndividual && (
        <div style={{
          padding: "1.25rem", background: C.successSoft,
          border: `1px solid ${C.success}`, borderRadius: RADIUS.lg,
        }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: 13, fontWeight: 700, color: C.success }}>
            Aprobar solicitud de proyecto
          </p>
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Al confirmar, se autorizarán los {oferta.cuposRegistrados} cupos solicitados y el profesor será notificado.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={cancelar} style={{
              flex: 1, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={() => confirmarAprobacion(oferta, onAprobar)} style={{
              flex: 2, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.success, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Confirmar aprobación</button>
          </div>
        </div>
      )}

      {/* Confirmación aprobación individual */}
      {modo === "aprobar" && esIndividual && (
        <div style={{
          padding: "1.25rem", background: C.successSoft,
          border: `1px solid ${C.success}`, borderRadius: RADIUS.lg,
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, fontWeight: 700, color: C.success }}>
            Aprobar oferta individual
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: RADIUS.full,
            background: "rgba(99,102,241,0.12)", color: "#818cf8",
            fontSize: 12, fontWeight: 700, marginBottom: "0.875rem",
          }}>
            Cupo fijo: 1 lugar
          </div>
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Las ofertas individuales tienen cupo fijo de 1. No es necesario ingresar ningún valor adicional.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={cancelar} style={{
              flex: 1, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={() => confirmarAprobacion(oferta, onAprobar)} style={{
              flex: 2, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.success, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Confirmar aprobación</button>
          </div>
        </div>
      )}

      {/* Rechazo */}
      {modo === "rechazar" && (
        <div style={{
          padding: "1.25rem", background: C.dangerSoft,
          border: `1px solid ${C.danger}`, borderRadius: RADIUS.lg,
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 700, color: C.danger }}>
            Rechazar solicitud — registra los motivos
          </p>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
          }}>
            Motivos del rechazo <span style={{ color: C.danger }}>*</span>
          </label>
          <textarea
            value={motivos}
            onChange={e => { setMotivos(e.target.value); }}
            placeholder="Describe los motivos por los que se rechaza esta solicitud..."
            rows={3}
            style={{ ...inputBase(!!errores.motivos), resize: "vertical", lineHeight: 1.55, marginBottom: 4 }}
          />
          {errores.motivos && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger }}>{errores.motivos}</p>
          )}
          <p style={{ margin: "4px 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Los motivos son obligatorios y se notificarán al profesor.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={cancelar} style={{
              flex: 1, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={() => confirmarRechazo(oferta, onRechazar)} style={{
              flex: 2, padding: "9px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Confirmar rechazo</button>
          </div>
        </div>
      )}
    </>
  );
}