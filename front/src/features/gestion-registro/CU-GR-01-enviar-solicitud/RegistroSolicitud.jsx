import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { useRegistroForm } from "./hooks/useRegistroForm";
import { STEPS } from "./utils/constants";
import { StepProgressBar }     from "@/components/ui/StepProgressBar";
import { StepDatosPersonales } from "./steps/StepDatosPersonales";
import { StepDatosAcademicos } from "./steps/StepDatosAcademicos";
import { StepSeleccionOferta } from "./steps/StepSeleccionOferta";
import { StepCredenciales }    from "./steps/StepCredenciales";

import { Link } from "react-router-dom";

// ── Pantalla de éxito ─────────────────────────────────────────
function SuccessScreen({ C }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: 56, marginBottom: "1rem" }}>🎓</div>
        <h2 style={{ color: C.success, fontSize: 24, margin: "0 0 0.75rem" }}>¡Solicitud enviada!</h2>
        <p style={{ color: C.textMuted, maxWidth: 360, margin: "0 auto" }}>
          Tu solicitud ha sido recibida. Recibirás confirmación en tu correo institucional.
        </p>

        {/* enlace a login */}
        <p style={{ fontSize: 13, color: C.textMuted }}>
          Ya puedes iniciar sesión{" "}
          <Link
            to="/"
            style={{
              color: C.accent,
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            aquí
          </Link>
        </p>

      </div>
    </div>
  );
}

// ── Botones de navegación ─────────────────────────────────────
function NavButtons({ step, totalSteps, loading, onBack, onNext, onSubmit, C }) {
  const isLast = step === totalSteps - 1;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${C.borderSubtle}` }}>
      <button
        type="button" onClick={onBack} disabled={step === 0}
        style={{
          padding: "10px 20px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 500,
          cursor: step === 0 ? "default" : "pointer", background: "transparent",
          border: `1px solid ${step === 0 ? C.borderSubtle : C.borderDefault}`,
          color: step === 0 ? C.textDisabled : C.textSecondary,
          transition: "all 0.2s", fontFamily: "inherit",
        }}
      >
        ← Anterior
      </button>

      <button
        type="button" onClick={isLast ? onSubmit : onNext} disabled={loading}
        style={{
          padding: "10px 28px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
          background: loading ? C.borderDefault : GRADIENTS.primary,
          border: "none", color: "#fff", fontFamily: "inherit",
          boxShadow: loading ? "none" : SHADOWS.accent,
        }}
      >
        {isLast ? (loading ? "Enviando..." : "Enviar solicitud ✓") : (loading ? "Verificando..." : "Siguiente →")}
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function RegistroSolicitud() {
  const { C } = useTheme();
  const {
    step, form, errors, ofertas, ofertasCargando, periodos, aceptaCreditos, submitted, loading, totalSteps,
    handleChange, seleccionarOferta, setAcepta, next, back, submit,
  } = useRegistroForm();

  if (submitted) return <SuccessScreen C={C} />;

  const stepProps = { form, errors, handleChange, C };

  return (
    <div style={{ minHeight: "100vh", background: C.bgPage, padding: "2rem 1rem", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 660, margin: "0 auto 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 42, height: 42, borderRadius: RADIUS.md, background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}></span>
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>ESCOM — IPN</p>
          <h1 style={{ margin: 0, fontSize: 18, color: C.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>Sistema de Servicio Social</h1>
        </div>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 660, margin: "0 auto", background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`, padding: "2rem", boxShadow: SHADOWS.xl }}>
        <StepProgressBar step={step} steps={STEPS} C={C} />

        {step === 0 && <StepDatosPersonales {...stepProps} />}
        {step === 1 && <StepDatosAcademicos {...stepProps} periodos={periodos} />}
        {step === 2 && <StepSeleccionOferta {...stepProps} ofertas={ofertas} ofertasCargando={ofertasCargando} onSelect={seleccionarOferta} handleChange={handleChange}/>}
        {step === 3 && <StepCredenciales   {...stepProps} aceptaCreditos={aceptaCreditos} setAcepta={setAcepta} ofertas={ofertas} periodos={periodos}/>}

        <NavButtons step={step} totalSteps={totalSteps} loading={loading} onBack={back} onNext={next} onSubmit={submit} C={C} />
      </div>

      <p style={{ fontSize: 13, color: C.textMuted, textAlign:"center" }}>
          ¿Ya tienes cuenta? Inicia sesión{" "}
          <Link
            to="/"
            style={{
              color: C.accent,
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            aquí
          </Link>
        </p>


      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 12, color: C.textDisabled }}>
        ESCOM — Sistema de Servicio Social Interno · IPN
      </p>
    </div>
  );
}