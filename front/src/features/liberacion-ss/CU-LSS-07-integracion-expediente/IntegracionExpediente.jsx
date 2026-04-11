import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";

import { useIntegracionExpediente } from "./hooks/useIntegracionExpediente";

const MOCK = {
  usuario: "García López Juan Carlos",
  rol: "alumno",
};

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
        {!doc.requerido && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.textDisabled,
            background: C.bgInput,
            padding: "2px 8px",
            borderRadius: 999,
          }}>
            Opcional
          </span>
        )}
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
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={e => onSubir(e.target.files?.[0])}
          />
          <span style={{ fontSize: 20 }}>📎</span>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            Seleccionar archivo · PDF máx. 5 MB
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

export default function IntegracionExpediente() {
  const { C } = useTheme();
  const {
    documentosConfig,
    archivos,
    errores,
    loading,
    enviado,
    subirArchivo,
    quitarArchivo,
    requeridosCompletos,
    hayErrores,
    enviarExpediente,
  } = useIntegracionExpediente();

  // Cuántos documentos requeridos están completos
  const requeridos = documentosConfig.filter(d => d.requerido);
  const requeridosCargados = requeridos.filter(d => archivos[d.id]).length;

  if (enviado) {
    return (
      <ProcesoLSSLayout
        pasoActual={4}
        titulo="Integración de expediente"
        subtitulo="CU-LSS-04"
        rol={MOCK.rol}
        usuario={MOCK.usuario}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>📁</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Expediente enviado
          </h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Tu expediente fue enviado correctamente. Coordinación lo revisará y recibirás una notificación con el resultado.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled }}>
            Puedes consultar el estado desde tu panel principal.
          </p>
          <button
            style={{
              padding: "12px 32px",
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: GRADIENTS.primary,
              border: "none",
              color: "#fff",
              fontFamily: "inherit",
              boxShadow: SHADOWS.accent,
            }}
          >
            Ver estado de mi solicitud
          </button>
        </div>
      </ProcesoLSSLayout>
    );
  }

  return (
    <ProcesoLSSLayout
      pasoActual={4}
      titulo="Integración de expediente"
      subtitulo="CU-LSS-04 - Alumno"
      rol={MOCK.rol}
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Integración de expediente
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Sube los documentos requeridos para integrar tu expediente de liberación.
          El sistema validará el formato y tamaño de cada archivo.
        </p>

        {/* Progreso */}
        

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
