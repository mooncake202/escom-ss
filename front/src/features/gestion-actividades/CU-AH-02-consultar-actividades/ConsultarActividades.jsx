import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { ActividadCard }           from "./components/ActividadCard";
import { useConsultarActividades } from "./hooks/useConsultarActividades";

const FILTROS = [
  { key: "todas",        label: "Todas"        },
  { key: "En progreso",  label: "En progreso"  },
  { key: "Sin comenzar", label: "Sin comenzar" },
  { key: "Completada",   label: "Completada"   },
];

export default function ConsultarActividades() {
  const { C } = useTheme();
  const { filtradas, seleccionada, setSelec, filtro, setFiltro, totales } = useConsultarActividades();

  return (
    <DashboardLayout
      titulo="Mis actividades"
      subtitulo="CU-AH-02-consultar-actividades"
      rol="alumno"
      usuario="García López Juan Carlos"
    >
      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total",        valor: totales.todas,          color: C.accentText,   bg: C.accentSoft },
          { label: "En progreso",  valor: totales["En progreso"], color: "#2E86DE",      bg: "rgba(10,102,194,0.1)" },
          { label: "Sin comenzar", valor: totales["Sin comenzar"],color: "#9A9A9A",      bg: "rgba(85,85,85,0.1)" },
          { label: "Completadas",  valor: totales["Completada"],  color: "#22C55E",      bg: "rgba(34,197,94,0.1)" },
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
              : `No tienes actividades con estado "${filtro}"`
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
              C={C}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
