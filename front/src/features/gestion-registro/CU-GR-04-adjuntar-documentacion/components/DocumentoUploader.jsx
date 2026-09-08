import { useRef } from "react";
import { RADIUS } from "@/themes/colors";

export function DocumentoUploader({ label, descripcion, obligatorio = true, archivo, error, onAgregar, onQuitar, C }) {
  const inputRef = useRef(null);

  const fmtSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>

      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
          {label}
        </p>
        {obligatorio
          ? <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: C.accentSoft, color: C.accentText, fontWeight: 600 }}>Obligatorio</span>
          : <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: C.bgInput, color: C.textDisabled, fontWeight: 600 }}>Opcional</span>
        }
      </div>

      {descripcion && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{descripcion}</p>
      )}

      {/* Zona de carga o archivo cargado */}
      {!archivo ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${error ? C.danger : C.borderDefault}`,
            borderRadius: RADIUS.lg, padding: "1.5rem",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, cursor: "pointer", background: C.bgInput,
            transition: "border-color 0.2s, background 0.2s",
            minHeight: 100,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderFocus; e.currentTarget.style.background = C.bgInputHover; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = error ? C.danger : C.borderDefault; e.currentTarget.style.background = C.bgInput; }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M12 12v6M9 15l3-3 3 3" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            Haz clic para seleccionar un archivo
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>Solo PDF · Máx. 1.5 MB</p>
        </div>
      ) : (
        /* Archivo cargado */
        <div style={{
          border: `1px solid ${C.success}`,
          borderRadius: RADIUS.lg, padding: "1rem 1.25rem",
          background: C.successSoft,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.success, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {archivo.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{fmtSize(archivo.size)}</p>
          </div>
          <button
            onClick={onQuitar}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 18, padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={e => onAgregar(e.target.files?.[0] ?? null)}
      />

      {/* Error */}
      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
    </div>
  );
}