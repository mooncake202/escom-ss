import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { useModificarForm }         from "./hooks/useModificarForm";
import { STEPS_MODIFICAR }          from "./utils/constants";
import { StepProgressBar }          from "@/components/ui/StepProgressBar";
import { StepModDatosPersonales }   from "./steps/StepModDatosPersonales";
import { StepDatosAcademicos }      from "../CU-GR-01-enviar-solicitud/steps/StepDatosAcademicos";
import { StepSeleccionOferta }      from "../CU-GR-01-enviar-solicitud/steps/StepSeleccionOferta";
import { StepModCredenciales }      from "./steps/StepModCredenciales";

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
  const navigate = useNavigate();
  const {
    step, form, errors,
    ofertas, ofertasCargando, periodos,
    acepta, loading, totalSteps,
    cargandoInicial, errorInicial,
    handleChange, seleccionarOferta, setAcepta,
    next, back, submit,
  } = useModificarForm();

  const handleSubmit = async () => {
    const { exito } = await submit();
    if (exito) navigate("/alumnoSinAsignar/esperando_profesor");
  };

  if (cargandoInicial) {
    return (
      <div style={{ minHeight: "100vh", background: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.textMuted, fontSize: 14 }}>Cargando tu solicitud…</p>
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div style={{ minHeight: "100vh", background: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.danger, fontSize: 14 }}>{errorInicial}</p>
      </div>
    );
  }

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
          <span style={{ fontSize: 20 }}></span>
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
            ofertasCargando={ofertasCargando}
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
          onSubmit={handleSubmit}
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
