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

        {/* Resumen de horas — RN-AH-47 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Horas realizadas",  valor: alumno.horasAcumuladas, total: alumno.horasTotales, color: C.accentText,  bg: C.accentSoft },
            { label: "Horas deuda",       valor: alumno.horasDeuda,      total: null,                color: alumno.horasDeuda > 0 ? "#F59E0B" : C.success, bg: alumno.horasDeuda > 0 ? "rgba(245,158,11,0.1)" : C.successSoft },
            { label: "Horas restantes",   valor: alumno.horasTotales - alumno.horasAcumuladas, total: null, color: C.textPrimary, bg: C.bgCard },
          ].map(({ label, valor, total, color, bg }) => (
            <div key={label} style={{ padding: "0.875rem 1rem", borderRadius: RADIUS.lg, background: bg, border: `1px solid ${C.borderSubtle}` }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color }}>
                {valor}h {total && <span style={{ fontSize: 12, fontWeight: 400, color: C.textDisabled }}>/ {total}h</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Aviso deuda — RN-AH-15 y RN-AH-16 */}
        {alumno.horasDeuda > 0 && (
          <div style={{ padding: "12px 16px", borderRadius: RADIUS.md, background: "rgba(245,158,11,0.08)", border: `1px solid ${C.warning ?? "#F59E0B"}`, marginBottom: "1.5rem", display: "flex", gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
              Tienes <strong style={{ color: C.warning ?? "#F59E0B" }}>{alumno.horasDeuda} horas de deuda</strong>. Hoy puedes registrar hasta <strong>{limiteHoras} horas</strong> — las horas extra se descontarán de tu deuda.
            </p>
          </div>
        )}

        {/* ── FASE: inicio ── */}
        {fase === "inicio" && (
          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "2.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 1rem" }}>📝</p>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              ¿Listo para iniciar tu jornada?
            </h2>
            <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Límite de hoy: <strong style={{ color: C.textPrimary }}>{limiteHoras} horas</strong>
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