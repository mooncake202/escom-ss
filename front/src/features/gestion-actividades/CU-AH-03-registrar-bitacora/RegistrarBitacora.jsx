import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout }       from "@/components/layout/DashboardLayout";
import { JornadaTimer }          from "./components/JornadaTimer";
import { FormularioBitacora }    from "./components/FormularioBitacora";
import { useRegistrarBitacora }  from "./hooks/useRegistrarBitacora";

export default function RegistrarBitacora() {
  const { C } = useTheme();
  const {
    alumno, fase, segundos, form, avances, errores, loading,
    limiteHoras, horasTrabajadas, porcentajeJornada, tiempoRestante,
    actividades, iniciarJornada, finalizarJornada,
    handleChange, agregarAvance, quitarAvance, cambiarAvance,
    registrarBitacora, segundosAHHMM,
  } = useRegistrarBitacora();

  return (
    <DashboardLayout
      titulo="Registrar bitácora"
      subtitulo="CU-AH-03 · Alumno"
      rol="alumno"
      usuario="García López Juan Carlos"
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        

        

        {/* ── FASE: inicio ── */}
        {fase === "inicio" && (
          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "2.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 1rem" }}>📝</p>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              ¿Listo para iniciar tu jornada?
            </h2>
            <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Límite por día: <strong style={{ color: C.textPrimary }}>{limiteHoras} horas</strong>
            </p>
            <p style={{ margin: "0 0 2rem", fontSize: 12, color: C.textDisabled }}>
              Al iniciar se registrará automáticamente la hora de inicio de tu jornada.
            </p>
            <button
              onClick={iniciarJornada}
              style={{ padding: "12px 40px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: "pointer", background: GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent }}
            >
              Iniciar jornada →
            </button>
          </div>
        )}

        {/* ── FASE: activa (timer) ── */}
        {fase === "activa" && (
          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.5rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>
              Jornada en curso
            </p>
            <p style={{ margin: "0 0 0", fontSize: 12, color: C.textDisabled, textAlign: "center" }}>
              Cuando termines tu trabajo del día, presiona Finalizar jornada
            </p>
            <JornadaTimer
              segundos={segundos}
              limiteSeg={limiteHoras * 3600}
              limiteHoras={limiteHoras}
              porcentaje={porcentajeJornada}
              onFinalizar={finalizarJornada}
              C={C}
            />
          </div>
        )}

        {/* ── FASE: formulario ── */}
        {fase === "formulario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Resumen jornada */}
            <div style={{ padding: "12px 16px", borderRadius: RADIUS.md, background: C.successSoft, border: `1px solid ${C.success}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>⏱</span>
              <p style={{ margin: 0, fontSize: 13, color: C.success, fontWeight: 500 }}>
                Jornada finalizada — <strong>{horasTrabajadas} hora{horasTrabajadas !== 1 ? "s" : ""} registradas</strong> ({segundosAHHMM(segundos)} exactas). Ahora completa tu bitácora.
              </p>
            </div>
            <FormularioBitacora
              form={form} errores={errores} actividades={actividades}
              avances={avances}
              horasTrabajadas={horasTrabajadas}
              handleChange={handleChange}
              onAgregarAvance={agregarAvance}
              onQuitarAvance={quitarAvance}
              onCambiarAvance={cambiarAvance}
              onRegistrar={registrarBitacora}
              loading={loading} C={C}
            />
          </div>
        )}

        {/* ── FASE: enviado ── */}
        {fase === "enviado" && (
          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "2.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 1rem" }}>✅</p>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.success }}>
              Bitácora registrada
            </h2>
            <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Tu jornada de <strong>{horasTrabajadas} hora{horasTrabajadas !== 1 ? "s" : ""}</strong> fue registrada correctamente. Está pendiente de revisión por tu profesor.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
              Ya registraste tu bitácora de hoy. Vuelve mañana para registrar tu siguiente jornada.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}