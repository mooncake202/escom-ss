import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";

const FACTORES = [
  {
    nombre: "Calidad del trabajo",
    opciones: [
      { valor: 100, label: "Realiza trabajos excelentes" },
      { valor: 95,  label: "Realiza trabajos buenos con un mínimo de errores" },
      { valor: 90,  label: "Comete errores frecuentemente" },
      { valor: 85,  label: "Comete alto grado de errores" },
    ],
  },
  {
    nombre: "Aplicación de conocimientos",
    opciones: [
      { valor: 100, label: "Ejecuta adecuadamente las acciones encomendadas" },
      { valor: 95,  label: "Requiere ocasionalmente asesoría" },
      { valor: 90,  label: "Requiere constante asesoría" },
      { valor: 85,  label: "No tiene noción para ejecutar lo asignado" },
    ],
  },
  {
    nombre: "Adquisición de conocimientos",
    opciones: [
      { valor: 100, label: "Entendimiento adecuado de las instrucciones" },
      { valor: 95,  label: "Entendimiento parcial con asesoría ocasional" },
      { valor: 90,  label: "Percepción inadecuada, requiere asesoría constante" },
      { valor: 85,  label: "Aplica acciones erróneas constantemente" },
    ],
  },
  {
    nombre: "Disciplina",
    opciones: [
      { valor: 100, label: "Se sujeta a las indicaciones establecidas" },
      { valor: 95,  label: "Ocasionalmente pone objeciones" },
      { valor: 90,  label: "Frecuentemente manifiesta inconformidad" },
      { valor: 85,  label: "No cumple o evade instrucciones" },
    ],
  },
  {
    nombre: "Presentación personal",
    opciones: [
      { valor: 100, label: "Higiene personal excelente" },
      { valor: 95,  label: "Ocasionalmente se presentó sucio" },
      { valor: 90,  label: "Frecuentemente se presentó sucio" },
      { valor: 85,  label: "Constantemente desaliñado" },
    ],
  },
  {
    nombre: "Iniciativa",
    opciones: [
      { valor: 100, label: "Realizó aportaciones importantes" },
      { valor: 95,  label: "Eventualmente hizo aportaciones" },
      { valor: 90,  label: "Se limita a reportar anomalías" },
      { valor: 85,  label: "Solo sigue rutinas establecidas" },
    ],
  },
  {
    nombre: "Relaciones interpersonales",
    opciones: [
      { valor: 100, label: "Mantiene acertadas relaciones" },
      { valor: 95,  label: "Ocasionalmente inadecuadas" },
      { valor: 90,  label: "Frecuentemente inconforme" },
      { valor: 85,  label: "No cumple o evade relaciones laborales" },
    ],
  },
];

const MAX_TOTAL = FACTORES.length * 100;

function colorPorTotal(total, max) {
  const pct = total / max;
  if (pct >= 0.97) return { color: "#15803d", bg: "rgba(21,128,61,0.08)", border: "rgba(21,128,61,0.25)" };
  if (pct >= 0.90) return { color: "#2563eb", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.25)" };
  if (pct >= 0.85) return { color: "#b45309", bg: "rgba(180,83,9,0.08)", border: "rgba(180,83,9,0.25)" };
  return { color: "#b91c1c", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.25)" };
}

export function FormEvaluacion({ onGuardar }) {
  const { C } = useTheme();
  const [valores, setValores] = useState({});
  const [observaciones, setObservaciones] = useState("");

  const seleccionar = (factor, valor) => {
    setValores(prev => ({ ...prev, [factor]: valor }));
  };

  const respondidos = Object.keys(valores).length;
  const total = Object.values(valores).reduce((acc, v) => acc + v, 0);
  const completo = respondidos === FACTORES.length;
  const colores = completo ? colorPorTotal(total, MAX_TOTAL) : null;

  const handleGuardar = () => {
    if (!completo) return;
    onGuardar?.({ valores, observaciones, total });
  };

  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "1.5rem",
      marginBottom: "1.5rem",
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <p style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: C.accentText,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          Evaluación del alumno
        </p>
        <span style={{
          fontSize: 11,
          color: C.textMuted,
          background: C.bgInput,
          padding: "3px 10px",
          borderRadius: 99,
          border: `1px solid ${C.borderDefault}`,
        }}>
          {respondidos}/{FACTORES.length} criterios
        </span>
      </div>

      {/* FACTORES */}
      {FACTORES.map((f, i) => {
        const seleccionado = valores[f.nombre];
        return (
          <div key={i} style={{
            marginBottom: "1.25rem",
            paddingBottom: "1.25rem",
            borderBottom: i < FACTORES.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
          }}>
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.textPrimary,
              marginBottom: 10,
            }}>
              {i + 1}. {f.nombre}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {f.opciones.map((op, j) => {
                const activo = seleccionado === op.valor;
                return (
                  <label
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: RADIUS.md,
                      border: `1px solid ${activo ? C.accentText : C.borderDefault}`,
                      background: activo ? "rgba(59,130,246,0.06)" : C.bgInput,
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name={f.nombre}
                      value={op.valor}
                      checked={activo}
                      onChange={() => seleccionar(f.nombre, op.valor)}
                      style={{ marginTop: 1, flexShrink: 0, accentColor: C.accentText }}
                    />
                    <span style={{ fontSize: 13, color: activo ? C.accentText : C.textMuted, lineHeight: 1.4 }}>
                      <strong style={{ color: activo ? C.accentText : C.textPrimary, fontWeight: 600 }}>
                        {op.valor}
                      </strong>
                      {" — "}{op.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* TOTAL */}
      <div style={{
        padding: "12px 14px",
        borderRadius: RADIUS.md,
        marginBottom: "1.5rem",
        background: completo ? colores.bg : C.bgInput,
        border: `1px solid ${completo ? colores.border : C.borderDefault}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Suma total de puntos</span>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: completo ? colores.color : C.textPrimary,
        }}>
          {total}
          <span style={{ fontSize: 12, fontWeight: 400, color: C.textMuted, marginLeft: 4 }}>
            / {MAX_TOTAL}
          </span>
        </span>
      </div>

      {/* OBSERVACIONES */}
      <p style={{
        margin: "0 0 0.5rem",
        fontSize: 12,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Observaciones
      </p>
      <textarea
        value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Describe el desempeño del alumno, aspectos a mejorar o cualquier comentario relevante..."
        style={{
          width: "100%",
          height: 110,
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          background: C.bgInput,
          color: C.textPrimary,
          fontSize: 13,
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
          outline: "none",
          lineHeight: 1.5,
        }}
      />

    </div>
  );
}