import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }    from "@/components/layout/DashboardLayout";
import { AnuncioForm }        from "./components/AnuncioForm";
import { AnuncioItem }        from "./components/AnuncioItem";
import { DestinatariosBar }   from "./components/DestinatariosBar";
import { usePublicarAnuncios } from "./hooks/usePublicarAnuncios";

const CONFIG = {
  coordinacion: { titulo: "Publicar anuncios institucionales", subtitulo: "CU-ADM-07 · Coordinación" },
  profesor:      { titulo: "Anuncios a mis alumnos",           subtitulo: "CU-ADM-07 · Profesor" },
};

export default function PublicarAnuncios({ rol }) {
  const { C } = useTheme();
  const {
    usuario, tieneAlumnos, alumnosAsignados,
    anuncios, modo, anuncioActivo, form, errores, toast,
    abrirNuevo, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  } = usePublicarAnuncios(rol);

  const modoActivo = modo !== null;
  const { titulo, subtitulo } = CONFIG[rol];

  return (
    <DashboardLayout
      titulo={titulo}
      subtitulo={subtitulo}
      rol={rol}
      usuario={usuario.nombre}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>

        {/* Empty state: sin alumnos asignados (solo profesor) */}
        {rol === "profesor" && !tieneAlumnos ? (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "4rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📋</p>
            <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
              Sin alumnos asignados
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              No tienes alumnos asignados a tu proyecto en este momento.
              Los anuncios estarán disponibles cuando cuentes con alumnos registrados.
            </p>
          </div>
        ) : (
          <>
            {/* Destinatarios (solo profesor) */}
            {rol === "profesor" && (
              <DestinatariosBar alumnos={alumnosAsignados} C={C} />
            )}

            {/* Toast */}
            {toast && (
              <div style={{
                marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
                background: toast.tipo === "danger" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                border: `1px solid ${toast.tipo === "danger" ? C.danger : "#10b981"}`,
                color: toast.tipo === "danger" ? C.danger : "#10b981",
                fontSize: 13, fontWeight: 500,
              }}>
                {toast.msg}
              </div>
            )}

            {/* Cabecera + botón publicar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                {anuncios.length} anuncio{anuncios.length !== 1 ? "s" : ""} publicado{anuncios.length !== 1 ? "s" : ""}
              </p>
              {modo !== "nuevo" && (
                <button
                  onClick={abrirNuevo}
                  disabled={modoActivo}
                  style={{
                    padding: "8px 18px", borderRadius: RADIUS.md,
                    background: modoActivo ? C.bgInput : C.accent,
                    border: "none", color: modoActivo ? C.textDisabled : "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: modoActivo ? "default" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  + Nuevo anuncio
                </button>
              )}
            </div>

            {/* Formulario crear/editar */}
            {(modo === "nuevo" || modo === "editar") && (
              <AnuncioForm
                modo={modo}
                form={form}
                errores={errores}
                onChange={handleChange}
                onGuardar={handleGuardar}
                onCancelar={cancelar}
                C={C}
              />
            )}

            {/* Lista de anuncios */}
            <div style={{
              background: C.bgCard, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`, overflow: "hidden",
            }}>
              {anuncios.length === 0 && (
                <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                  <p style={{ margin: "0 0 0.375rem", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                    Sin anuncios publicados
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                    Usa "Nuevo anuncio" para publicar el primer comunicado.
                  </p>
                </div>
              )}

              {anuncios.map((a, i) => (
                <AnuncioItem
                  key={a.id}
                  anuncio={a}
                  index={i}
                  total={anuncios.length}
                  modo={modo}
                  anuncioActivoId={anuncioActivo?.id}
                  onEditar={abrirEditar}
                  onEliminar={abrirEliminar}
                  onCancelar={cancelar}
                  onConfirmarEliminar={handleEliminar}
                  C={C}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
