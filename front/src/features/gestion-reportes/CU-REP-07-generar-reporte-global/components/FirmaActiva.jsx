import { RADIUS } from "@/themes/colors";

export function FirmaActiva({ firmaUrl, C }) {
  return (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.lg,
      border: `1px solid ${C.success}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "0.75rem",
      }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
          Firma digital
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: RADIUS.full,
          background: C.successSoft, border: `1px solid ${C.success}`,
          fontSize: 11, fontWeight: 700, color: C.success,
        }}>
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Registrada
        </span>
      </div>

      

      <div style={{
        padding: "1.25rem 1.5rem",
        background: "#fff", borderRadius: RADIUS.md,
        border: `1px solid ${C.borderDefault}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: 90, gap: "0.25rem",
      }}>
        {firmaUrl ? (
          <img
            src={firmaUrl}
            alt="Firma registrada"
            style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain" }}
          />
        ) : (
          <>
            {/* Rúbrica simulada de García López Ana */}
            <svg width="200" height="56" viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8,44 C14,26 22,20 34,32 C42,41 45,22 58,26 C68,29 71,18 84,22 C93,26 96,16 110,19 C120,22 124,34 136,27 C145,22 150,26 156,32 C161,37 163,35 165,32"
                stroke="#1a1a1a"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8,49 C50,54 110,53 165,49"
                stroke="#1a1a1a"
                strokeWidth="0.9"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: 11, color: "#888", letterSpacing: "0.03em" }}>
              García López Ana
            </span>
          </>
        )}
      </div>
    </div>
  );
}
