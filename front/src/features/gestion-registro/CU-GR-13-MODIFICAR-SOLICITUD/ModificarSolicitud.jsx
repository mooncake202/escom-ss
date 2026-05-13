import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { useModificarForm }         from "./hooks/useModificarForm";
import { STEPS_MODIFICAR }          from "./utils/constants";
import { StepProgressBar }          from "@/components/ui/StepProgressBar";
import { RejectionScreen }          from "./screens/RejectionScreen";
import { StepModDatosPersonales }   from "./steps/StepModDatosPersonales";
import { StepDatosAcademicos }      from "./steps/StepDatosAcademicos";   // reutilizado del CU-GR-01
import { StepSeleccionOferta }      from "./steps/StepSeleccionOferta";   // reutilizado del CU-GR-01
import { StepModCredenciales }      from "./steps/StepModCredenciales";

// ── Pantalla de éxito ─────────────────────────────────────────
function SuccessScreen({ C }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bgPage,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: 56, marginBottom: "1rem" }}>🎓</div>

        <h2 style={{ color: C.success, fontSize: 24, margin: "0 0 0.75rem", fontWeight: 700 }}>
          ¡Solicitud reenviada exitosamente!
        </h2>

        <p style={{ color: C.textMuted, maxWidth: 380, margin: "0 auto 1.25rem", fontSize: 14, lineHeight: 1.6 }}>
          Tu solicitud ha sido actualizada. El profesor de la oferta seleccionada
          recibirá una notificación. Puedes dar seguimiento a tu proceso desde tu
          cuenta.
        </p>

        {/* Estado resultante */}
        <div
          style={{
            display: "inline-block",
            padding: "6px 18px",
            background: C.successSoft,
            border: `1px solid ${C.success}30`,
            borderRadius: RADIUS.md,
            fontSize: 13,
            color: C.success,
            fontWeight: 600,
            marginBottom: "1.5rem",
          }}
        >
          Estado: Pendiente de respuesta del profesor
        </div>
      </div>
    </div>
  );
}

// ── Botones de navegación ─────────────────────────────────────
function NavButtons({ step, totalSteps, loading, onBack, onNext, onSubmit, C }) {
  const isLast = step === totalSteps - 1;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: `1px solid ${C.borderSubtle}`,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        style={{
          padding: "10px 20px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 500,
          cursor: step === 0 ? "default" : "pointer",
          background: "transparent",
          border: `1px solid ${step === 0 ? C.borderSubtle : C.borderDefault}`,
          color: step === 0 ? C.textDisabled : C.textSecondary,
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
      >
        ← Anterior
      </button>

      <button
        type="button"
        onClick={isLast ? onSubmit : onNext}
        disabled={loading}
        style={{
          padding: "10px 28px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
          background: loading ? C.borderDefault : GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: loading ? "none" : SHADOWS.accent,
        }}
      >
        {isLast
          ? loading ? "Reenviando..." : "Reenviar solicitud ✓"
          : "Siguiente →"}
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ModificarSolicitud() {
  const { C } = useTheme();
  const {
    screen, step, form, errors,
    ofertas, periodos,
    acepta, submitted, loading, totalSteps,
    motivoRechazo,
    handleChange, seleccionarOferta,
    setAcepta,
    iniciarModificacion,
    next, back, submit,
  } = useModificarForm();

  // 1. Solicitud enviada con éxito
  if (submitted) return <SuccessScreen C={C} />;

  // 2. Pantalla inicial de rechazo
  if (screen === "reject") {
    return (
      <RejectionScreen
        motivoRechazo={motivoRechazo}
        alumno={form}
        onIniciar={iniciarModificacion}
        C={C}
      />
    );
  }

  // 3. Formulario de modificación (4 pasos)
  const stepProps = { form, errors, handleChange, C };

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
        <div style={{ textAlign: "left" }}>
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
            Modificar solicitud de registro
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
        <StepProgressBar step={step} steps={STEPS_MODIFICAR} C={C} />

        {step === 0 && (
          <StepModDatosPersonales {...stepProps} />
        )}
        {step === 1 && (
          <StepDatosAcademicos {...stepProps} periodos={periodos} />
        )}
        {step === 2 && (
          <StepSeleccionOferta
            {...stepProps}
            ofertas={ofertas}
            onSelect={seleccionarOferta}
            handleChange={handleChange}
          />
        )}
        {step === 3 && (
          <StepModCredenciales
            {...stepProps}
            aceptaCreditos={acepta}
            setAcepta={setAcepta}
            ofertas={ofertas}
            periodos={periodos}
          />
        )}

        <NavButtons
          step={step}
          totalSteps={totalSteps}
          loading={loading}
          onBack={back}
          onNext={next}
          onSubmit={submit}
          C={C}
        />
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
