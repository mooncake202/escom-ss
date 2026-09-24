import { useTheme, RADIUS }      from "@/themes/colors";
import { DashboardLayout }        from "@/components/layout/DashboardLayout";
import { CampoLocked }            from "./components/CampoLocked";
import { CampoEditable }          from "./components/CampoEditable";
import { useActualizarDatos }     from "./hooks/useActualizarDatos";

export default function ActualizarDatos() {
  const { C } = useTheme();
  const {
    carga, recargar,
    institucionales,
    form, errores, guardando, guardado, hayCambios,
    handleChange, handleCancelar, handleGuardar,
  } = useActualizarDatos();

  // ── Carga y error ──
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Datos personales" subtitulo="Tus datos de contacto" rol="alumno_asignado" usuario="">
        <div style={{ maxWidth: 540, margin: "0 auto", width: "100%" }}>
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
      titulo="Datos personales"
      subtitulo="Tus datos de contacto"
      rol="alumno_asignado"
      usuario={institucionales.nombreCompleto}
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
          <CampoLocked label="Nombre completo"      valor={institucionales.nombreCompleto}     C={C} />
          <CampoLocked label="Boleta"               valor={institucionales.boleta}             C={C} />
          <CampoLocked label="Carrera"              valor={institucionales.carrera}            C={C} />
          <CampoLocked label="Correo institucional" valor={institucionales.correoInstitucional} C={C} />
          <CampoLocked label="Créditos acumulados"  valor={`${institucionales.creditos}%`}     C={C} />
          <CampoLocked label="Semestre"             valor={institucionales.semestre}           C={C} />
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
          {/* Los dos únicos campos que el alumno puede modificar. Ambos obligatorios. */}
          <CampoEditable
            label="Correo personal *"
            name="correo_personal"
            value={form.correo_personal}
            onChange={handleChange}
            error={errores.correo_personal}
            placeholder="tu.correo@ejemplo.com"
            tipo="email"
            C={C}
          />
          <CampoEditable
            label="Celular *"
            name="celular"
            value={form.celular}
            onChange={handleChange}
            error={errores.celular}
            placeholder="10 dígitos, sin espacios"
            C={C}
          />

          {/* El backend revalida: su mensaje manda sobre el del formulario. */}
          {errores.envio && (
            <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
              {errores.envio}
            </p>
          )}
        </div>

        {/* Última actualización */}
        {/* Sin "última actualización": el schema no guarda esa marca para alumno ni profesor. */}
        {/* Acciones */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
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
    </DashboardLayout>
  );
}