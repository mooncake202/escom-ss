import { GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";

export function RejectionScreen({ motivoRechazo, alumno, onIniciar, C }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bgPage,
        padding: "2rem 1rem",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          maxWidth: 660,
          margin: "0 auto 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: RADIUS.md,
            background: GRADIENTS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 20 }}>🎓</span>
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: C.textDisabled,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            ESCOM — IPN
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              color: C.textPrimary,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Sistema de Servicio Social
          </h1>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          maxWidth: 660,
          margin: "0 auto",
          background: C.bgCard,
          borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderSubtle}`,
          padding: "2rem",
          boxShadow: SHADOWS.xl,
        }}
      >
        {/* Badge estado */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "4px 14px",
            background: C.dangerSoft,
            border: `1px solid ${C.dangerBorder ?? "#F7C1C1"}`,
            borderRadius: "999px",
            fontSize: 12,
            fontWeight: 600,
            color: C.danger,
            marginBottom: "1.25rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          ⚠ Solicitud rechazada definitivamente
        </div>

        <h2
          style={{
            margin: "0 0 0.5rem",
            color: C.textPrimary,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Tu solicitud fue rechazada
        </h2>

        <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textMuted }}>
          Hola, <strong>{alumno.nombres} {alumno.apellidos}</strong>. A continuación
          se muestra el motivo de rechazo de tu solicitud.
        </p>

        {/* Motivo de rechazo */}
        <div
          style={{
            background: C.dangerSoft,
            border: `1px solid ${C.dangerBorder ?? "#F7C1C1"}`,
            borderRadius: RADIUS.md,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: 12,
              fontWeight: 600,
              color: C.danger,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Motivo de rechazo
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.danger,
              lineHeight: 1.6,
              opacity: 0.85,
            }}
          >
            {motivoRechazo}
          </p>
        </div>

        {/* Aviso informativo */}
        <div
          style={{
            background: C.warningSoft ?? "#FAEEDA",
            border: `1px solid #FAC775`,
            borderRadius: RADIUS.md,
            padding: "0.875rem 1rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.warning ?? "#854F0B",
              lineHeight: 1.6,
            }}
          >
            <strong>Importante:</strong> Puedes corregir y reenviar tu solicitud sin
            crear una cuenta nueva. Tu <strong>correo institucional</strong> y{" "}
            <strong>contraseña</strong> no son modificables en este flujo. Asegúrate
            de contar con documentos actualizados antes de continuar.
          </p>
        </div>

        <button
          type="button"
          onClick={onIniciar}
          style={{
            padding: "11px 28px",
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
          Modificar y reenviar solicitud →
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: 12,
          color: C.textDisabled,
        }}
      >
        ESCOM — Sistema de Servicio Social Interno · IPN
      </p>
    </div>
  );
}
