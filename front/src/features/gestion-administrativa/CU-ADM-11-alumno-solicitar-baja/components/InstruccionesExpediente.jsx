import { RADIUS } from "@/themes/colors";

const URL_SISS = "https://www.siss.ipn.mx";

export function InstruccionesExpediente({ C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 1rem", fontSize: 13, fontWeight: 700, color: C.textPrimary,
      }}>
        Instrucciones para armar tu expediente
      </p>

      {/* Paso 1 */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1rem" }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.accentText, flexShrink: 0,
        }}>1</div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Obtén tu carta compromiso desde SISS
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Accede a la plataforma SISS y descarga tu carta compromiso por ambos lados. Sin firmas ni sellos.
          </p>
          <a
            href={URL_SISS}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: RADIUS.md,
              background: C.accentSoft, color: C.accentText,
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              border: `1px solid ${C.accent}`,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
            Ir a SISS
          </a>
        </div>
      </div>

      {/* Paso 2 */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1rem" }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.accentText, flexShrink: 0,
        }}>2</div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Elabora tu escrito simple
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Redacta un escrito dirigido a la Comisión de Servicio Social explicando
            brevemente por qué solicitas la baja. Debe incluir tu nombre completo,
            firma y correo electrónico. No hay formato específico.
          </p>
        </div>
      </div>

      {/* Paso 3 */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1rem" }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.accentText, flexShrink: 0,
        }}>3</div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Arma tu expediente en un solo PDF
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Junta la carta compromiso y el escrito simple en un solo archivo PDF
            con el siguiente nombre:
          </p>
          <code style={{
            display: "block", padding: "6px 10px", borderRadius: RADIUS.sm,
            background: C.bgPage, border: `1px solid ${C.borderDefault}`,
            fontSize: 11, color: C.accentText, letterSpacing: "0.03em",
          }}>
            BAJA_ESCOM_APELLIDOPATERNO_APELLIDOMATERNO_NOMBRE_BOLETA
          </code>
        </div>
      </div>

      {/* Nota de tiempo */}
      <div style={{
        marginTop: "0.75rem", padding: "10px 14px", borderRadius: RADIUS.md,
        background: C.warningSoft, border: `1px solid ${C.warning}`,
        fontSize: 12, color: C.warning, lineHeight: 1.5,
      }}>
        <strong>Tiempo estimado de resolución:</strong> Una vez enviada tu solicitud,
        el tiempo de espera para recibir tu oficio de baja es aproximadamente
        de 1 a 3 meses hábiles.
      </div>
    </div>
  );
}