import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";

export function ListaAlumnos({ alumnos, seleccionado, onSeleccionar }) {
  const { C } = useTheme();
  const [filtro, setFiltro] = useState("");

  const filtrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ width: 260, flexShrink: 0 }}>

      <p style={{
        margin: "0 0 0.75rem",
        fontSize: 11,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Alumnos asignados
      </p>

      <input
        placeholder="Buscar alumno..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "0.75rem",
          padding: "8px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          background: C.bgInput,
          color: C.textPrimary,
          fontSize: 13,
          fontFamily: "inherit",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        overflow: "hidden",
      }}>
        {filtrados.length === 0 && (
          <p style={{ padding: "1rem", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            Sin resultados
          </p>
        )}

        {filtrados.map((a, i) => {
          const esSeleccionado = seleccionado?.id === a.id;
          return (
            <div
              key={a.id}
              onClick={() => onSeleccionar(a)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < filtrados.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                background: esSeleccionado ? C.accentSoft ?? "rgba(59,130,246,0.08)" : "transparent",
                borderLeft: esSeleccionado ? `3px solid ${C.accentText}` : "3px solid transparent",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: esSeleccionado ? 600 : 400,
                  color: esSeleccionado ? C.accentText : C.textPrimary,
                }}>
                  {a.nombre}
                </p>
              </div>

              {a.requiereValidacion && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 99,
                  background: "rgba(234,179,8,0.12)",
                  color: "#b45309",
                  border: "1px solid rgba(234,179,8,0.3)",
                  whiteSpace: "nowrap",
                }}>
                  SISS
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "0.5rem", fontSize: 11, color: C.textDisabled, textAlign: "right" }}>
        {filtrados.length} alumno{filtrados.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}