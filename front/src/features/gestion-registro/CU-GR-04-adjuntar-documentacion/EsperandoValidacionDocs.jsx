import { useState, useEffect } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";

export default function EsperandoValidacionDocs() {
  const { C } = useTheme();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
    fetch(`http://localhost:3000/alumno/solicitud/${usuario.id}`)
      .then(r => r.json())
      .then(setDatos)
      .catch(console.error);
  }, []);

  const nombre = datos ? `${datos.nombres} ${datos.apellidos}` : "";

  if (!datos) return null;

  // Posibles estados de documentación:
  // "docs_pendientes"   → Coordinación aún no ha revisado
  // "docs_con_correccion" → Coordinación pidió correcciones
  // "docs_aprobados"    → Coordinación aprobó, puede continuar

  const estatus = datos?.estatusDocumentacion ?? "docs_pendientes";

  return (
    <ProcesoLayout pasoActual={2} usuario={nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        {/* ── PENDIENTE DE REVISIÓN ── */}
        {estatus === "docs_pendientes" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>📄</div>

            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              Documentación enviada
            </h2>

            <p style={{ color: C.textMuted, marginTop: "0.75rem" }}>
              Tu documentación fue recibida correctamente y está siendo revisada
              por Coordinación. Por favor regresa más tarde para conocer el resultado.
            </p>

            <div style={{
              marginTop: "1.5rem",
              background: C.bgCard,
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: RADIUS.md,
              padding: "1rem",
              textAlign: "left"
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: "0.5rem" }}>
                Documentos enviados
              </p>
              <DocItem label="Carta de créditos" />
              <DocItem label="Constancia de vigencia del seguro social" />
              {datos.tieneDictamen && (
                <DocItem label={`Dictamen (${datos.tipoDictamen})`} />
              )}
            </div>
          </>
        )}

        {/* ── CON CORRECCIONES ── */}
        {estatus === "docs_con_correccion" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⚠️</div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.warning }}>
              Se requieren correcciones
            </h2>

            <p style={{ color: C.textMuted, marginTop: "0.75rem", marginBottom: "1rem" }}>
              Coordinación revisó tu documentación y encontró observaciones.
              Por favor corrígelas y vuelve a adjuntar los documentos indicados.
            </p>

            <div style={{
              background: C.bgCard,
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: RADIUS.md,
              padding: "1rem",
              textAlign: "left",
              marginBottom: "1.5rem"
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: "0.5rem" }}>
                Observaciones de Coordinación
              </p>
              <p style={{ fontSize: 13, color: C.textMuted }}>
                {datos.observacionesDocumentacion}
              </p>
            </div>

            <button
              onClick={() => window.location.href = "/adjuntar-documentacion"}
              style={{
                padding: "10px 20px",
                borderRadius: RADIUS.md,
                background: C.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Corregir y reenviar documentación
            </button>
          </>
        )}

        {/* ── APROBADOS ── */}
        {estatus === "docs_aprobados" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>✅</div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.success }}>
              Documentación aprobada
            </h2>

            <p style={{ color: C.textMuted, marginTop: "0.75rem", marginBottom: "1.5rem" }}>
              Coordinación validó tu documentación correctamente.
              Ya puedes continuar con el siguiente paso de tu proceso de servicio social.
            </p>

            <button
              onClick={() => window.location.href = "/siguiente-paso"}
              style={{
                padding: "10px 20px",
                borderRadius: RADIUS.md,
                background: C.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Continuar
            </button>
          </>
        )}

      </div>
    </ProcesoLayout>
  );
}

function DocItem({ label }) {
  const { C } = useTheme();
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      borderBottom: `1px solid ${C.borderSubtle}`,
      fontSize: 13
    }}>
      <span style={{ color: C.success, fontSize: 16 }}>✔</span>
      <span>{label}</span>
    </div>
  );
}
