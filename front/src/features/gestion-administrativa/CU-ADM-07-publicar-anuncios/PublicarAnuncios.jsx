import { useTheme, RADIUS }  from "@/themes/colors";
import { DashboardLayout }    from "@/components/layout/DashboardLayout";
import { AnuncioForm }        from "./components/AnuncioForm";
import { AnuncioItem }        from "./components/AnuncioItem";
import { DestinatariosBar, AlcanceGlobalBar } from "./components/DestinatariosBar";
import { usePublicarAnuncios } from "./hooks/usePublicarAnuncios";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// CU-ADM-07 — misma pantalla para profesor y coordinación; cambia el alcance, no el flujo.
// Publicar y consultar el historial propio. Ni editar ni eliminar: lo publicado es histórico.

const CONFIG = {
  coordinacion: {
    titulo: "Publicar anuncios institucionales",
    subtitulo: "Comunicados para todos los alumnos asignados",
  },
  profesor: {
    titulo: "Anuncios a mis alumnos",
    subtitulo: "Comunicados para tus alumnos asignados",
  },
};

function formatFechaHora(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  const fecha = f.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const hora = f.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha}, ${hora}`;
}

// A nivel de módulo: dentro del componente sería un tipo nuevo en cada render y React remontaría
// el layout y el sidebar.
function Marco({ titulo, subtitulo, rol, usuario, children }) {
  return (
    <DashboardLayout titulo={titulo} subtitulo={subtitulo} rol={rol} usuario={usuario}>
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

export default function PublicarAnuncios({ rol }) {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const {
    esProfesor,
    carga, recargar,
    anuncios, alcance, alumnos, puedePublicar,
    modo, form, errores, enviando, toast,
    abrirNuevo, cancelar, handleChange, handleGuardar,
  } = usePublicarAnuncios(rol);

  const { titulo, subtitulo } = CONFIG[rol] ?? CONFIG.profesor;
  const marco = { titulo, subtitulo, rol, usuario: nombreCompletoSesion(usuario) };

  if (carga.estado === "cargando") {
    return (
      <Marco {...marco}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem", textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tus anuncios...</p>
        </div>
      </Marco>
    );
  }

  if (carga.estado === "error") {
    return (
      <Marco {...marco}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
          <button onClick={recargar} style={{
            padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Reintentar
          </button>
        </div>
      </Marco>
    );
  }

  // Un profesor sin alumnos asignados no tiene a quién publicar. El backend también lo rechaza.
  if (esProfesor && !puedePublicar) {
    return (
      <Marco {...marco}>
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
            No tienes alumnos asignados en este momento. Podrás publicar anuncios cuando cuentes con
            alumnos asignados a tus ofertas.
          </p>
        </div>
      </Marco>
    );
  }

  return (
    <Marco {...marco}>
      {/* Alcance real, no un selector: los destinatarios no se eligen. */}
      {esProfesor
        ? <DestinatariosBar alumnos={alumnos} total={alcance} C={C} />
        : <AlcanceGlobalBar C={C} />}

      {toast && (
        <div style={{
          marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
          background: "rgba(16,185,129,0.1)", border: "1px solid #10b981",
          color: "#10b981", fontSize: 13, fontWeight: 500,
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
            style={{
              padding: "8px 18px", borderRadius: RADIUS.md,
              background: C.accent, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            + Nuevo anuncio
          </button>
        )}
      </div>

      {modo === "nuevo" && (
        <AnuncioForm
          form={form}
          errores={errores}
          enviando={enviando}
          onChange={handleChange}
          onGuardar={handleGuardar}
          onCancelar={cancelar}
          C={C}
        />
      )}

      {/* Historial propio */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`, overflow: "hidden",
      }}>
        {anuncios.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 0.375rem", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
              Sin anuncios publicados
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              Usa "Nuevo anuncio" para publicar el primer comunicado.
            </p>
          </div>
        ) : (
          anuncios.map((a, i) => (
            <AnuncioItem
              key={a.id}
              anuncio={a}
              index={i}
              total={anuncios.length}
              formatFechaHora={formatFechaHora}
              C={C}
            />
          ))
        )}
      </div>

      <p style={{ margin: "1rem 0 0", fontSize: 11, color: C.textDisabled }}>
        Los anuncios publicados no se editan ni se eliminan: quedan como registro histórico.
      </p>
    </Marco>
  );
}
