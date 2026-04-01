import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { CampoEditable }                 from "./components/CampoEditable";
import { CampoLocked }                   from "./components/CampoLocked";
import { useActualizarDatosProfesor }    from "./hooks/useActualizarDatosProfesor";

export default function ActualizarDatosProfesor() {
  const { C } = useTheme();
  const {
    datosInstitucionales, form, errores, guardado, ultimaAct,
    handleChange, handleCancelar, handleGuardar,
  } = useActualizarDatosProfesor();

  return (
    <DashboardLayout
      titulo="Mis datos"
      subtitulo="CU-ADM-13 · Profesor"
      rol="profesor"
      usuario={datosInstitucionales.nombre}
    >
      <div style={{ maxWidth: 540, margin: "0 auto", width: "100%" }}>

        {/* Aviso de guardado */}
        {guardado && (
          <div style={{
            marginBottom: "1.25rem", padding: "12px 16px",
            borderRadius: RADIUS.md, background: "rgba(34,197,94,0.1)",
            border: "1px solid #22c55e", color: "#22c55e",
            fontSize: 13, display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Datos actualizados correctamente · {ultimaAct}
          </div>
        )}

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Datos institucionales
          </h3>

          <CampoLocked label="Nombre completo"    valor={datosInstitucionales.nombre}       C={C} />
          <CampoLocked label="Correo institucional" valor={datosInstitucionales.correo}     C={C} />
          <CampoLocked label="Departamento"        valor={datosInstitucionales.departamento} C={C} />
          <CampoLocked label="Cubículo"            valor={datosInstitucionales.cubiculo}     C={C} />

          <div style={{ height: 1, background: C.borderDefault, margin: "1.25rem 0" }} />

          <h3 style={{ margin: "0 0 1.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Datos de contacto
          </h3>

          <CampoEditable
            label="Horario de atención"
            name="horarioAtencion"
            value={form.horarioAtencion}
            onChange={handleChange}
            placeholder="Ej. Lunes y miércoles, 10:00–12:00 h"
            error={errores.horarioAtencion}
            requerido
            C={C}
          />
          <CampoEditable
            label="Teléfono personal"
            name="telefonoPersonal"
            value={form.telefonoPersonal}
            onChange={handleChange}
            placeholder="Ej. 55 1234 5678"
            error={errores.telefonoPersonal}
            C={C}
          />

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              onClick={handleCancelar}
              style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}
            >
              Guardar cambios
            </button>
          </div>
        </div>

        {ultimaAct && !guardado && (
          <p style={{ margin: "0.75rem 0 0", fontSize: 11, color: C.textDisabled, textAlign: "right" }}>
            Última actualización: {ultimaAct}
          </p>
        )}

      </div>
    </DashboardLayout>
  );
}
