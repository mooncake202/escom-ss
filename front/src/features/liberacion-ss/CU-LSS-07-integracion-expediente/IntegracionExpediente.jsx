import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

import { useIntegracionExpediente } from "./hooks/useIntegracionExpediente";

// ——— Banner informativo fijo de SISS (texto confirmado, sin verificación de backend) ———
function BannerSiss({ C }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRadius: RADIUS.md,
      marginBottom: "1.5rem",
      background: "rgba(234,179,8,0.08)",
      border: "1px solid rgba(234,179,8,0.3)",
    }}>
      <p style={{ margin: 0, fontSize: 12, color: "#b45309", lineHeight: 1.5 }}>
        📌 Debes subir al SISS tu carta de término, reportes mensuales, reporte global, reporte de desempeño
        y todos los documentos que te pida el sistema, hasta que tu estatus cambie a <strong>DOCUMENTOS COMPLETOS</strong>.
      </p>
    </div>
  );
}

// ——— Sub-componentes ————————————————————————————

function DocumentoUpload({ doc, archivo, error, onSubir, onQuitar, C }) {
  const tieneArchivo = !!archivo;

  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${tieneArchivo ? C.success : error ? C.danger : C.borderSubtle}`,
      padding: "1.25rem",
      transition: "border-color 0.2s",
    }}>
      {/* Header doc */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
            {doc.label}
            {doc.requerido && (
              <span style={{ color: C.danger, marginLeft: 4 }}>*</span>
            )}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
            {doc.descripcion}
          </p>
        </div>
      </div>

      {/* Zona upload */}
      {tieneArchivo ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          background: C.successSoft,
          border: `1px solid ${C.success}`,
        }}>
          <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>
            ✅ {archivo.name}
          </span>
          <button
            onClick={onQuitar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: C.textMuted,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          border: `2px dashed ${error ? C.danger : C.borderDefault}`,
          background: C.bgInput,
          cursor: "pointer",
        }}>
          <input
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={e => onSubir(e.target.files?.[0])}
          />
          <span style={{ fontSize: 20 }}>📎</span>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            Seleccionar archivo · Solo PDF
          </span>
        </label>
      )}

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
    </div>
  );
}

// ——— Página principal ——————————————————————————————
// CU-LSS-07 SOLO integra/envía el expediente — nunca muestra estado de
// revisión/resolución (corrección de alcance: esa responsabilidad es de
// CU-LSS-08, /alumno/estado-resolucion, a donde se navega tras el envío
// exitoso). Esta pantalla solo puede mostrar el formulario, para el envío
// inicial o el reenvío tras un rechazo (RN-LSS-23).

export default function IntegracionExpediente() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const nombreAlumno = nombreCompletoSesion(sesion);
  const {
    cargando,
    info,
    documentosConfig,
    archivos,
    errores,
    error,
    loading,
    subirArchivo,
    quitarArchivo,
    requeridosCompletos,
    hayErrores,
    enviarExpediente,
  } = useIntegracionExpediente();

  if (cargando) {
    return (
      <ProcesoLSSLayout pasoActual={4} titulo="Integración de expediente" rol="alumno" usuario={nombreAlumno}>
        <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: "3rem" }}>Cargando...</p>
      </ProcesoLSSLayout>
    );
  }

  // estado === 'sin_enviar' (Flujo Principal) o 'rechazado' (Flujo Alterno
  // 1.1, RN-LSS-23) — mismo formulario en ambos casos, reemplaza TODOS los
  // documentos siempre. ('en_revision'/'aprobado' nunca se ven aquí: el
  // guardia de ruta ya redirige a /alumno/estado-resolucion antes de que
  // esta pantalla monte, y enviarExpediente navega para allá explícito
  // justo después de un envío exitoso.)
  return (
    <ProcesoLSSLayout pasoActual={4} titulo="Integración de expediente"  rol="alumno" usuario={nombreAlumno}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        <BannerSiss C={C} />

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Integración de expediente
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Sube los documentos requeridos para integrar tu expediente de liberación.
          El sistema validará el formato de cada archivo y el tamaño del expediente combinado.
        </p>

        {/* RF-LSS-38: observaciones de rechazo de coordinación (Flujo Alterno 1.1) */}
        {info?.estado === "rechazado" && (
          <div style={{
            padding: "14px 16px",
            borderRadius: RADIUS.md,
            marginBottom: "1.5rem",
            background: "rgba(220,38,38,0.07)",
            border: `1px solid ${C.danger}`,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.danger, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Expediente rechazado
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
              {info.observacionesRechazo || "Coordinación rechazó tu expediente. Corrige y vuelve a enviar todos los documentos."}
            </p>
          </div>
        )}

        {/* Lista documentos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {documentosConfig.map(doc => (
            <DocumentoUpload
              key={doc.id}
              doc={doc}
              archivo={archivos[doc.id]}
              error={errores[doc.id]}
              onSubir={(archivo) => subirArchivo(doc.id, archivo)}
              onQuitar={() => quitarArchivo(doc.id)}
              C={C}
            />
          ))}
        </div>

        {/* Aviso */}
        <div style={{
          padding: "12px 14px",
          borderRadius: RADIUS.md,
          marginBottom: "1.5rem",
          background: "rgba(59,130,246,0.08)",
          border: `1px solid ${C.borderSubtle}`,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Los campos marcados con <span style={{ color: C.danger }}>*</span> son obligatorios.
            Una vez enviado el expediente, coordinación lo revisará en los próximos días hábiles.
          </p>
        </div>

        {error && (
          <p style={{ marginBottom: "1rem", fontSize: 12, color: C.danger }}>{error}</p>
        )}

        {/* Botón */}
        <button
          onClick={enviarExpediente}
          disabled={!requeridosCompletos || hayErrores || loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: (!requeridosCompletos || hayErrores || loading) ? "not-allowed" : "pointer",
            background: (!requeridosCompletos || hayErrores || loading) ? C.borderDefault : GRADIENTS.primary,
            border: "none",
            color: "#fff",
            fontFamily: "inherit",
            boxShadow: (!requeridosCompletos || hayErrores) ? "none" : SHADOWS.accent,
            opacity: !requeridosCompletos ? 0.5 : 1,
          }}
        >
          {loading ? "Enviando expediente..." : "Enviar expediente →"}
        </button>

      </div>
    </ProcesoLSSLayout>
  );
}
