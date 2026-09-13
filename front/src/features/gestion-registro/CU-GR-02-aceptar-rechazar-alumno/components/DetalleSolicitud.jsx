import { GRADIENTS, RADIUS, SHADOWS } from "../../../../themes/colors";
import { formatearFechaMexico } from "@/utils/fechas";

const CARRERA_LABEL = { ISC: "Ing. Sistemas Computacionales", IA: "Inteligencia Artificial", LCD: "Lic. Ciencia de Datos" };

function InfoRow({ label, value, C }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <span style={{ fontSize: 12, color: C.textDisabled, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

export function DetalleSolicitud({ solicitud, loading, onDecidir, onCerrar, C }) {
  if (!solicitud) return null;

  const fmtFecha = (iso) => iso ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "—";
  // fechaCreacion es un timestamp real (fecha_aplicacion, @db.DateTime), no
  // un día calendario puro como periodoInicio/periodoFin — necesita México
  // explícito, no UTC (fmtFecha arriba se queda igual para esos dos).
  const fmtFechaHora = (iso) => iso ? formatearFechaMexico(iso, { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }}
      />

      {/* Panel lateral derecho */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50,
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflowY: "auto",
      }}>

        {/* Header del panel */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              Revisar solicitud
            </h2>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>

          {/* Sección datos personales */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Datos personales
          </p>
          <InfoRow label="Nombre"           value={solicitud.nombre}         C={C} />
          <InfoRow label="Boleta"           value={solicitud.boleta}         C={C} />
          <InfoRow label="Correo inst."     value={solicitud.correoInst}     C={C} />
          <InfoRow label="Correo personal"  value={solicitud.correoPersonal || "—"} C={C} />
          <InfoRow label="Teléfono"         value={solicitud.telefono}       C={C} />

          {/* Sección datos académicos */}
          <p style={{ margin: "1.25rem 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Datos académicos
          </p>
          <InfoRow label="Carrera"          value={CARRERA_LABEL[solicitud.carrera] ?? solicitud.carrera} C={C} />
          <InfoRow label="Créditos declarados" value={`${solicitud.creditos}%`} C={C} />
          {/* RF-GR-17: dictamen activo (si aplica) */}
          <InfoRow label="Dictamen"         value={solicitud.dictamen || "Sin dictamen"} C={C} />
          <InfoRow label="Periodo inicio"   value={fmtFecha(solicitud.periodoInicio)} C={C} />
          <InfoRow label="Periodo término"  value={fmtFecha(solicitud.periodoFin)}    C={C} />
          <InfoRow label="Fecha de envío"   value={fmtFechaHora(solicitud.fechaCreacion)}    C={C} />
          <InfoRow label="Vacante" value={solicitud.tituloOferta} C={C} />
          <InfoRow label="Habilidades y motivación" value={solicitud.motivacion} C={C} />


          {/* Aviso RN-GR-04 */}
          <div style={{ marginTop: "1.25rem", padding: "10px 14px", background: C.warningSoft ?? "rgba(245,158,11,0.1)", borderRadius: RADIUS.md, border: `1px solid ${C.warning ?? "#F59E0B"}` }}>
            <p style={{ margin: 0, fontSize: 12, color: C.warning ?? "#F59E0B", lineHeight: 1.5 }}>
              El porcentaje de créditos declarado será validado posteriormente mediante la carta de créditos oficial.
            </p>
          </div>
        </div>

        {/* Botones de acción — RN-GR-07: solo aceptar o rechazar, sin comentarios */}
        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderSubtle}`, display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => onDecidir(solicitud.id, "rechazar")}
            disabled={loading}
            style={{
              flex: 1, padding: "11px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              background: "transparent",
              border: `1px solid ${C.danger}`,
              color: C.danger, fontFamily: "inherit",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Procesando..." : "Rechazar"}
          </button>

          <button
            onClick={() => onDecidir(solicitud.id, "aceptar")}
            disabled={loading}
            style={{
              flex: 1, padding: "11px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              background: loading ? C.borderDefault : GRADIENTS.primary,
              border: "none", color: "#fff", fontFamily: "inherit",
              boxShadow: loading ? "none" : SHADOWS.accent,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Procesando..." : "Aceptar solicitud"}
          </button>
        </div>
      </div>
    </>
  );
}