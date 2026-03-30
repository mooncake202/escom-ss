import { useTheme, RADIUS }       from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { AnuncioCard }             from "./components/AnuncioCard";
import { AnuncioDetalle }          from "./components/AnuncioDetalle";
import { useAnunciosSistema, formatFecha } from "./hooks/useAnunciosSistema";

export default function AnunciosSistema() {
  const { C } = useTheme();
  const { alumno, anuncios, seleccionado, setSeleccionado } = useAnunciosSistema();

  return (
    <DashboardLayout
      titulo="Anuncios del sistema"
      subtitulo="CU-ADM-02 · Alumno"
      rol="alumno"
      usuario={alumno.nombre}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>

        {anuncios.length === 0 ? (
          /* Estado vacío */
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "4rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📢</p>
            <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
              Sin anuncios disponibles
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              No hay anuncios publicados para ti en este momento.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: seleccionado ? "340px 1fr" : "1fr",
            gap: "1.25rem",
            alignItems: "start",
          }}>
            {/* Columna izquierda — lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {anuncios.map(a => (
                <AnuncioCard
                  key={a.id}
                  anuncio={a}
                  seleccionado={seleccionado?.id === a.id}
                  onSeleccionar={setSeleccionado}
                  formatFecha={formatFecha}
                  C={C}
                />
              ))}
            </div>

            {/* Columna derecha — detalle */}
            {seleccionado && (
              <AnuncioDetalle
                anuncio={seleccionado}
                onCerrar={() => setSeleccionado(null)}
                formatFecha={formatFecha}
                C={C}
              />
            )}
          </div>
        )}

        {/* Contador */}
        {anuncios.length > 0 && (
          <p style={{ margin: "1rem 0 0", fontSize: 12, color: C.textDisabled }}>
            {anuncios.length} anuncio{anuncios.length !== 1 ? "s" : ""} disponible{anuncios.length !== 1 ? "s" : ""}
          </p>
        )}

      </div>
    </DashboardLayout>
  );
}
