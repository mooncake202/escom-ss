import { useTheme, RADIUS }       from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { AnuncioCard }             from "./components/AnuncioCard";
import { useAnunciosSistema, formatFecha, formatFechaHora } from "./hooks/useAnunciosSistema";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// CU-ADM-02 — historial COMPLETO de anuncios del alumno. El resumen de los 3 más recientes vive en
// el dashboard y consume el mismo endpoint con ?limite=3.
//
// El backend decide qué se ve (Coordinación + su profesor actual). Aquí no se filtra nada.

function Marco({ usuario, children }) {
  return (
    <DashboardLayout
      titulo="Anuncios del sistema"
      subtitulo="Comunicados de Coordinación y de tu profesor"
      rol="alumno_asignado"
      usuario={usuario}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

function Aviso({ C, children }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "3.5rem 2rem", textAlign: "center",
    }}>
      {children}
    </div>
  );
}

export default function AnunciosSistema() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  // `abrir` alterna: contraer se resuelve con la misma acción, así que `cerrar` ya no se usa aquí.
  const { carga, recargar, anuncios, seleccionado, abrir, sinAsignacion } = useAnunciosSistema();

  const nombre = nombreCompletoSesion(usuario);

  if (carga.estado === "cargando") {
    return (
      <Marco usuario={nombre}>
        <Aviso C={C}>
          <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tus anuncios...</p>
        </Aviso>
      </Marco>
    );
  }

  // Sin asignación vigente no hay de quién recibir anuncios: es un estado legítimo, no un error.
  if (sinAsignacion) {
    return (
      <Marco usuario={nombre}>
        <Aviso C={C}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📢</p>
          <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Todavía no tienes una asignación activa
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Cuando tu registro de servicio social quede asignado, aquí verás los comunicados de
            Coordinación y de tu profesor.
          </p>
        </Aviso>
      </Marco>
    );
  }

  if (carga.estado === "error") {
    return (
      <Marco usuario={nombre}>
        <Aviso C={C}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
          <button onClick={recargar} style={{
            padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Reintentar
          </button>
        </Aviso>
      </Marco>
    );
  }

  if (anuncios.length === 0) {
    return (
      <Marco usuario={nombre}>
        <Aviso C={C}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📢</p>
          <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Sin anuncios disponibles
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            No hay anuncios publicados para ti en este momento.
          </p>
        </Aviso>
      </Marco>
    );
  }

  const sinLeer = anuncios.filter((a) => !a.visto).length;

  return (
    <Marco usuario={nombre}>
      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {anuncios.length} anuncio{anuncios.length !== 1 ? "s" : ""}
        {sinLeer > 0 && ` · ${sinLeer} sin leer`}
      </p>

      {/* Una sola columna de tarjetas acordeón: la seleccionada crece hacia abajo en su sitio, no
          se abre un panel aparte. Solo una abierta a la vez. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {anuncios.map((a) => (
          <AnuncioCard
            key={a.id}
            anuncio={a}
            expandido={seleccionado?.id === a.id}
            onAlternar={abrir}
            formatFecha={formatFecha}
            formatFechaHora={formatFechaHora}
            C={C}
          />
        ))}
      </div>
    </Marco>
  );
}
