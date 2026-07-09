import { RADIUS } from "@/themes/colors";

export function CargaExpediente({ archivo, error, onChange, C }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
      }}>
        Expediente en PDF <span style={{ color: C.danger }}>*</span>
      </label>

      <label style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "10px 14px", borderRadius: RADIUS.md, cursor: "pointer",
        background: C.bgInput,
        border: `1px solid ${error ? C.danger : archivo ? C.success : C.borderDefault}`,
        transition: "border-color 0.15s",
      }}>
        <input
          type="file"
          accept=".pdf"
          onChange={onChange}
          style={{ display: "none" }}
        />
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={archivo ? C.success : C.textDisabled} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span style={{ fontSize: 13, color: archivo ? C.success : C.textDisabled, flex: 1 }}>
          {archivo ? archivo.name : "Seleccionar archivo PDF..."}
        </span>
        {archivo && (
          <span style={{ fontSize: 11, color: C.textDisabled }}>
            {(archivo.size / 1024).toFixed(0)} KB
          </span>
        )}
      </label>

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
      {!error && !archivo && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textDisabled }}>
          Solo se aceptan archivos en formato PDF.
        </p>
      )}
      {!error && archivo && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.success }}>
          Archivo cargado correctamente.
        </p>
      )}
    </div>
  );
}