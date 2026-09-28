import { RADIUS } from "@/themes/colors";

// CU-ADM-09 — seguimiento de una baja en curso, en SOLO LECTURA.
//
// El profesor consulta en qué punto va el trámite y nada más. Aquí no hay ninguna acción: subir o
// sustituir el expediente es del alumno, y turnar, aprobar o rechazar es de Coordinación. El backend
// tampoco le expone rutas, ids de documento ni al coordinador que la atendió.
//
// `etapa` la deriva el backend (`etapaDeBaja`): la pantalla no interpreta estados.

const ETAPAS = {
  pendiente_expediente: {
    titulo: "Pendiente del expediente del alumno",
    detalle: "El alumno debe adjuntar su expediente de baja en PDF. Hasta entonces, Coordinación no "
      + "puede turnar la solicitud a las autoridades.",
    color: "warning",
  },
  pendiente_coordinacion: {
    titulo: "Pendiente de revisión por Coordinación",
    detalle: "El expediente ya está adjunto. Coordinación lo revisará y decidirá si lo turna a las "
      + "autoridades o rechaza la solicitud.",
    color: "accent",
  },
  en_revision_autoridades: {
    titulo: "En revisión por las autoridades",
    detalle: "Coordinación turnó el expediente a las autoridades correspondientes. La resolución "
      + "puede tardar entre 1 y 3 meses hábiles.",
    color: "accent",
  },
  aprobada: {
    titulo: "Baja aprobada",
    detalle: "El servicio social del alumno quedó cancelado y se liberó un cupo del profesor.",
    color: "success",
  },
  rechazada: {
    titulo: "Baja rechazada",
    detalle: "La solicitud no procedió. El alumno continúa con su servicio social.",
    color: "danger",
  },
};

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : "—");

function Dato({ etiqueta, children, C }) {
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <p style={{
        margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {etiqueta}
      </p>
      <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function SeguimientoBaja({ alumno, onCerrar, C }) {
  const baja = alumno.baja;
  if (!baja) return null;

  const etapa = ETAPAS[baja.etapa] ?? ETAPAS.pendiente_coordinacion;
  const paleta = {
    warning: { color: C.warning, bg: C.warningSoft, border: C.warning },
    accent: { color: C.accentText, bg: C.accentSoft, border: C.accent },
    success: { color: C.success, bg: C.successSoft, border: C.success },
    danger: { color: C.danger, bg: "rgba(239,68,68,0.08)", border: C.danger },
  }[etapa.color];

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            {alumno.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
            Boleta: {alumno.boleta}{alumno.oferta ? ` · ${alumno.oferta}` : ""}
          </p>
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar seguimiento"
          style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}
        >✕</button>
      </div>

      {/* Etapa actual del trámite */}
      <div style={{
        padding: "1rem", borderRadius: RADIUS.md, marginBottom: "1.25rem",
        background: paleta.bg, border: `1px solid ${paleta.border}`,
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: paleta.color }}>
          {etapa.titulo}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
          {etapa.detalle}
        </p>
      </div>

      <Dato etiqueta="Solicitada por" C={C}>
        {baja.laSolicitasteTu ? "Ti mismo" : "El propio alumno"}
      </Dato>

      {/* Solo su propio texto: si la baja la pidió el alumno, su motivo es información suya. */}
      {baja.motivo && (
        <Dato etiqueta="Motivo que registraste" C={C}>
          <span style={{ color: C.textPrimary }}>{baja.motivo}</span>
        </Dato>
      )}

      <Dato etiqueta="Fecha de solicitud" C={C}>{fechaLegible(baja.fecha)}</Dato>

      <Dato etiqueta="Expediente" C={C}>
        {baja.tieneExpediente
          ? "Adjunto por el alumno"
          : "Todavía no adjunto"}
      </Dato>

      {baja.fechaRespuesta && (
        <Dato etiqueta="Fecha de resolución" C={C}>{fechaLegible(baja.fechaRespuesta)}</Dato>
      )}

      {baja.comentario && (
        <Dato etiqueta="Comentario de Coordinación" C={C}>
          <span style={{ color: C.textPrimary }}>{baja.comentario}</span>
        </Dato>
      )}

      <p style={{
        margin: "1.25rem 0 0", padding: "10px 14px", borderRadius: RADIUS.md,
        background: C.bgInput, border: `1px solid ${C.borderDefault}`,
        fontSize: 12, color: C.textMuted, lineHeight: 1.55,
      }}>
        Esta vista es de consulta. El expediente lo adjunta el alumno, y turnar, aprobar o rechazar la
        solicitud le corresponde a Coordinación.
      </p>
    </div>
  );
}
