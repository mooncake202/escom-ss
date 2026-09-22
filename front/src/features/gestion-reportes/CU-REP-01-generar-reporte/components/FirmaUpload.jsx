import { RADIUS } from "@/themes/colors";

export function FirmaUpload({ firma, firmaUrl, error, onChange, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        Firma digital
      </p>
      <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
        Sube una imagen de tu firma en formato PNG o JPG. Esta firma se guardará
        y se usará automáticamente en tus reportes futuros.
      </p>

      {/* Preview de firma */}
      {firmaUrl && (
        <div style={{
          marginBottom: "1rem", padding: "1rem",
          background: "#fff", borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 80,
        }}>
          <img
            src={firmaUrl}
            alt="Vista previa de firma"
            style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Input de archivo */}
      <label style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "10px 14px", borderRadius: RADIUS.md, cursor: "pointer",
        background: C.bgInput,
        border: `1px solid ${error ? C.danger : firma ? C.success : C.borderDefault}`,
        transition: "border-color 0.15s",
      }}>
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={onChange}
          style={{ display: "none" }}
        />
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={firma ? C.success : C.textDisabled} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: 13, color: firma ? C.success : C.textDisabled, flex: 1 }}>
          {firma ? firma.name : "Seleccionar imagen de firma (PNG o JPG)..."}
        </span>
        {firma && (
          <span style={{ fontSize: 11, color: C.textDisabled }}>
            {(firma.size / 1024).toFixed(0)} KB
          </span>
        )}
      </label>

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
      {!error && firma && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.success }}>
          Firma cargada correctamente.
        </p>
      )}
    </div>
  );
}