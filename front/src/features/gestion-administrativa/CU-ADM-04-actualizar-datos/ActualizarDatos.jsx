import { useTheme, RADIUS }      from "@/themes/colors";
import { DashboardLayout }        from "@/components/layout/DashboardLayout";
import { CampoLocked }            from "./components/CampoLocked";
import { CampoEditable }          from "./components/CampoEditable";
import { useActualizarDatos }     from "./hooks/useActualizarDatos";

export default function ActualizarDatos() {
  const { C } = useTheme();
  const {
    datosInstitucionales,
    form, errores, guardado, ultimaAct,
    handleChange, handleCancelar, handleGuardar,
  } = useActualizarDatos();

  return (
    <DashboardLayout
      titulo="Datos personales"
      subtitulo="CU-ADM-04 · Alumno"
      rol="alumno"
      usuario={datosInstitucionales.nombre}
    >
      <div style={{ maxWidth: 540, margin: "0 auto", width: "100%" }}>

        {/* Confirmación de guardado */}
        {guardado && (
          <div style={{
            marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
            background: C.successSoft, border: `1px solid ${C.success}`,
            display: "flex", alignItems: "center", gap: "0.625rem",
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke={C.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>
              Datos actualizados correctamente.
            </span>
          </div>
        )}

        {/* Datos institucionales (bloqueados) */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Datos institucionales
          </p>
          <CampoLocked label="Nombre completo"      valor={datosInstitucionales.nombre}        C={C} />
          <CampoLocked label="Boleta"               valor={datosInstitucionales.boleta}        C={C} />
          <CampoLocked label="Carrera"              valor={datosInstitucionales.carrera}       C={C} />
          <CampoLocked label="Correo institucional" valor={datosInstitucionales.correoInst}    C={C} />
          <CampoLocked label="Créditos acumulados"  valor={datosInstitucionales.creditos}      C={C} />
        </div>

        {/* Datos editables */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Datos de contacto
          </p>
          <CampoEditable
            label="Correo alternativo"
            name="correoAlternativo"
            value={form.correoAlternativo}
            onChange={handleChange}
            error={errores.correoAlternativo}
            placeholder="otro.correo@ejemplo.com (opcional)"
            tipo="email"
            C={C}
          />
          <CampoEditable
            label="Teléfono *"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            error={errores.telefono}
            placeholder="55 1234 5678"
            C={C}
          />
        </div>

        {/* Última actualización */}
        <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
          Última actualización: <strong style={{ color: C.textMuted }}>{ultimaAct}</strong>
        </p>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
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
    </DashboardLayout>
  );
}