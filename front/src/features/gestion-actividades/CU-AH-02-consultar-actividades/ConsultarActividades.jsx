import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { ActividadCard }           from "./components/ActividadCard";
import { useConsultarActividades } from "./hooks/useConsultarActividades";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

const ESTADO_LABEL = {
  sin_comenzar: "Sin comenzar",
  en_progreso: "En progreso",
  vencida: "Vencida",
  completadas: "Completadas",
};

const FILTROS = [
  { key: "todas",         label: "Todas"         },
  { key: "en_progreso",   label: "En progreso"   },
  { key: "sin_comenzar",  label: "Sin comenzar"  },
  { key: "vencida",       label: "Vencida"       },
  { key: "completadas",   label: "Completadas"   },
];

export default function ConsultarActividades() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const {
    filtradas, seleccionada, setSelec, filtro, setFiltro, totales,
    fechaInicio, servicioIniciado,
  } = useConsultarActividades();

  const fechaInicioLabel = fechaInicio
    ? new Date(fechaInicio).toLocaleDateString("es-MX", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <DashboardLayout
      titulo="Mis actividades"
      
      rol={sesion?.rol ?? "alumno_asignado"}
      usuario={nombreCompletoSesion(sesion)}
    >
      {/* RN-AH-08: mientras el servicio social no ha iniciado, las actividades
          son de solo lectura. */}
      {!servicioIniciado && (
        <div style={{
          marginBottom: "1.25rem", padding: "0.875rem 1.125rem", borderRadius: RADIUS.lg,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
            Podrás registrar horas en tus actividades hasta que inicie tu servicio social el {fechaInicioLabel}
          </p>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total",        valor: totales.todas,        color: C.accentText, bg: C.accentSoft },
          { label: "En progreso",  valor: totales.en_progreso,  color: "#2E86DE",     bg: "rgba(10,102,194,0.1)" },
          { label: "Sin comenzar", valor: totales.sin_comenzar, color: "#9A9A9A",     bg: "rgba(85,85,85,0.1)" },
          { label: "Vencida",      valor: totales.vencida,      color: "#EF4444",     bg: "rgba(239,68,68,0.1)" },
          { label: "Completadas",  valor: totales.completadas,  color: "#22C55E",     bg: "rgba(34,197,94,0.1)" },
        ].map(({ label, valor, color, bg }) => (
          <div key={label} style={{ padding: "0.875rem 1rem", borderRadius: RADIUS.lg, background: bg, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color }}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros — RN-AH-10 */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{
              padding: "6px 14px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: filtro === f.key ? C.accent : C.bgInput,
              border: `1px solid ${filtro === f.key ? C.accent : C.borderDefault}`,
              color: filtro === f.key ? "#fff" : C.textMuted,
            }}
          >
            {f.label} {totales[f.key] !== undefined ? `(${totales[f.key]})` : ""}
          </button>
        ))}
      </div>

      {/* Lista de actividades */}
      {filtradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📋</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>
            {filtro === "todas"
              ? "Tu profesor aún no te ha asignado actividades"
              : `No tienes actividades con estado "${ESTADO_LABEL[filtro] ?? filtro}"`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 720 }}>
          {filtradas.map(act => (
            <ActividadCard
              key={act.id}
              actividad={act}
              expandida={seleccionada === act.id}
              onToggle={() => setSelec(seleccionada === act.id ? null : act.id)}
              servicioIniciado={servicioIniciado}
              C={C}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
