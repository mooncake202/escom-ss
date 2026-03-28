import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }    from "@/components/layout/DashboardLayout";
import { BitacoraCard }       from "./components/BitacoraCard";
import { DetalleBitacora }    from "./components/DetalleBitacora";
import { useRevisarAvances }  from "./hooks/useRevisarAvances";

export default function RevisarAvances() {
  const { C } = useTheme();
  const {
    pendientes, alumnos, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    filtroAlumno, setFiltroAlumno,
    verDetalle, cerrar, decidir,
  } = useRevisarAvances();

  

  return (
    <DashboardLayout
      titulo="Revisar avances y horas"
      subtitulo="CU-AH-04 · Profesor"
      rol="profesor"
      usuario="Dr. Torres Vega"
    >
      {/* Toast resultado — RN-AH-37 */}
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: resultado.tipo === "aprobar" ? C.successSoft : C.dangerSoft,
          border: `1px solid ${resultado.tipo === "aprobar" ? C.success : C.danger}`,
          color: resultado.tipo === "aprobar" ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {resultado.tipo === "aprobar"
            ? `✓ Bitácora de ${resultado.alumno} aprobada. Las horas quedan confirmadas en su acumulado.`
            
            : resultado.tipo === "aprobar-adicional"
            ? `✓ Bitácora de ${resultado.alumno} aprobada. Se asignó la actividad "${resultado.actividadAdicional?.titulo}" para continuar el trabajo.`
            : `✕ Bitácora de ${resultado.alumno} rechazada. Las horas fueron descontadas de su acumulado y sumadas a su deuda.`
          }
        </div>
      )}

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
            Bitácoras pendientes de revisión
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            {pendientes.length} bitácora{pendientes.length !== 1 ? "s" : ""} esperando tu revisión
          </p>
        </div>

        {/* Filtro por alumno */}
        <select
          value={filtroAlumno}
          onChange={e => setFiltroAlumno(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: RADIUS.md, background: C.bgInput, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontSize: 13, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
        >
          <option value="todos">Todos los alumnos</option>
          {alumnos.map(a => (
            <option key={a.boleta} value={a.boleta}>{a.nombre.split(" ").slice(0, 2).join(" ")}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>
            {filtroAlumno === "todos"
              ? "No hay bitácoras pendientes de revisión"
              : "Este alumno no tiene bitácoras pendientes"
            }
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 760 }}>
          {pendientes.map(b => (
            <BitacoraCard key={b.id} bitacora={b} onVer={verDetalle} C={C} />
          ))}
        </div>
      )}

      {/* Panel detalle */}
      <DetalleBitacora
        bitacora={seleccionada}
        loading={loading}
        comentario={comentario}
        setComentario={setComentario}
        modoRechazo={modoRechazo}
        setModoRechazo={setModoRechazo}
        onDecidir={decidir}
        onCerrar={cerrar}
        C={C}
      />
    </DashboardLayout>
  );
}