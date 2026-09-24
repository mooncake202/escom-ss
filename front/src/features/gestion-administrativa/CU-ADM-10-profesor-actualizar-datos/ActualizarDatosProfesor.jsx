import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { CampoEditable }                 from "./components/CampoEditable";
import { CampoLocked }                   from "./components/CampoLocked";
import { useActualizarDatosProfesor }    from "./hooks/useActualizarDatosProfesor";

export default function ActualizarDatosProfesor() {
  const { C } = useTheme();
  const {
    carga, recargar,
    institucionales, form, errores, guardando, guardado, hayCambios,
    handleChange, handleCancelar, handleGuardar,
  } = useActualizarDatosProfesor();

  // ── Carga y error ──
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Mis datos personales" subtitulo="Tus datos de contacto" rol="profesor" usuario="">
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {carga.estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tus datos...</p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
                <button onClick={recargar} style={{
                  padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Reintentar</button>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      titulo="Mis datos"
      subtitulo="Tus datos de contacto"
      rol="profesor"
      usuario={institucionales.nombreCompleto}
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
            Datos actualizados correctamente.
          </div>
        )}

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Datos institucionales
          </h3>

          {/* Solo lectura: los administra Coordinación desde CU-CRED-03. Sin ID de empleado: no existe en el schema. */}
          <CampoLocked label="Nombre completo"      valor={institucionales.nombreCompleto}      C={C} />
          <CampoLocked label="Correo institucional" valor={institucionales.correoInstitucional} C={C} />
          <CampoLocked label="Departamento"         valor={institucionales.departamento}        C={C} />
          <CampoLocked label="Cubículo"             valor={institucionales.cubiculo}            C={C} />

          <div style={{ height: 1, background: C.borderDefault, margin: "1.25rem 0" }} />

          <h3 style={{ margin: "0 0 1.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Datos de contacto
          </h3>

          <CampoEditable
            label="Horario de atención"
            name="horario_atencion"
            value={form.horario_atencion}
            onChange={handleChange}
            placeholder="Ej. Lunes y miércoles, 10:00–12:00 h"
            error={errores.horario_atencion}
            requerido
            C={C}
          />
          <CampoEditable
            label="Teléfono personal"
            name="telefono_personal"
            value={form.telefono_personal}
            onChange={handleChange}
            placeholder="Ej. 55 1234 5678"
            error={errores.telefono_personal}
            C={C}
          />

          {/* El backend revalida: su mensaje manda sobre el del formulario. */}
          {errores.envio && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
              {errores.envio}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              onClick={handleCancelar}
              disabled={!hayCambios || guardando}
              style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500,
                cursor: !hayCambios || guardando ? "default" : "pointer",
                opacity: !hayCambios || guardando ? 0.5 : 1,
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={!hayCambios || guardando}
              style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700,
                cursor: !hayCambios || guardando ? "default" : "pointer",
                opacity: !hayCambios || guardando ? 0.5 : 1,
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Sin "última actualización" ni ID de empleado: ninguno existe en el schema. */}

      </div>
    </DashboardLayout>
  );
}
