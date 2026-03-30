import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }        from "@/components/layout/DashboardLayout";
import { RecursoRow }             from "./components/RecursoRow";
import { RecursoForm }            from "./components/RecursoForm";
import { useGestionarRecursos }   from "./hooks/useGestionarRecursos";

export default function GestionarRecursos() {
  const { C } = useTheme();
  const {
    coordinacion, recursos, modo, recursoActivo, form, errores, toast,
    abrirAgregar, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  } = useGestionarRecursos();

  return (
    <DashboardLayout
      titulo="Recursos del proceso de registro"
      subtitulo="CU-ADM-06 · Coordinación"
      rol="coordinacion"
      usuario={coordinacion.nombre}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? "rgba(239,68,68,0.1)" : C.successSoft,
            border: `1px solid ${toast.tipo === "danger" ? C.danger : C.success}`,
            color: toast.tipo === "danger" ? C.danger : C.success,
            fontSize: 13, fontWeight: 500,
          }}>
            {toast.msg}
          </div>
        )}

        {/* Cabecera + botón agregar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            {recursos.length} recurso{recursos.length !== 1 ? "s" : ""} registrado{recursos.length !== 1 ? "s" : ""}
          </p>
          {modo !== "agregar" && (
            <button
              onClick={abrirAgregar}
              style={{
                padding: "8px 18px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Agregar recurso
            </button>
          )}
        </div>

        {/* Formulario agregar/editar */}
        {(modo === "agregar" || modo === "editar") && (
          <RecursoForm
            modo={modo}
            form={form}
            errores={errores}
            onChange={handleChange}
            onGuardar={handleGuardar}
            onCancelar={cancelar}
            C={C}
          />
        )}

        {/* Lista de recursos */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, overflow: "hidden",
        }}>
          {/* Cabecera tabla */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 2fr 140px 148px",
            gap: "1rem", padding: "9px 1.25rem",
            background: C.bgInput, borderBottom: `1px solid ${C.borderDefault}`,
          }}>
            {["Título", "URL", "Última actualización", ""].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>

          {recursos.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>No hay recursos registrados.</p>
            </div>
          )}

          {recursos.map((r, i) => (
            <RecursoRow
              key={r.id}
              recurso={r}
              index={i}
              total={recursos.length}
              modo={modo}
              recursoActivoId={recursoActivo?.id}
              onEditar={abrirEditar}
              onEliminar={abrirEliminar}
              onCancelar={cancelar}
              onConfirmarEliminar={handleEliminar}
              C={C}
            />
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
