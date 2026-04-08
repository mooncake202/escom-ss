import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";

const FACTORES = [
  {
    nombre: "Calidad del trabajo",
    opciones: [
      { valor: 100, label: "Realiza trabajos excelentes" },
      { valor: 95, label: "Realiza trabajos buenos con un mínimo de errores" },
      { valor: 90, label: "Comete errores frecuentemente" },
      { valor: 85, label: "Comete alto grado de errores" },
    ],
  },
  {
    nombre: "Aplicación de conocimientos",
    opciones: [
      { valor: 100, label: "Ejecuta adecuadamente las acciones encomendadas" },
      { valor: 95, label: "Requiere ocasionalmente asesoría" },
      { valor: 90, label: "Requiere constante asesoría" },
      { valor: 85, label: "No tiene noción para ejecutar lo asignado" },
    ],
  },
  {
    nombre: "Adquisición de conocimientos",
    opciones: [
      { valor: 100, label: "Entendimiento adecuado de las instrucciones" },
      { valor: 95, label: "Entendimiento parcial con asesoría ocasional" },
      { valor: 90, label: "Percepción inadecuada, requiere asesoría constante" },
      { valor: 85, label: "Aplica acciones erróneas constantemente" },
    ],
  },
  {
    nombre: "Disciplina",
    opciones: [
      { valor: 100, label: "Se sujeta a las indicaciones establecidas" },
      { valor: 95, label: "Ocasionalmente pone objeciones" },
      { valor: 90, label: "Frecuentemente manifiesta inconformidad" },
      { valor: 85, label: "No cumple o evade instrucciones" },
    ],
  },
  {
    nombre: "Presentación personal",
    opciones: [
      { valor: 100, label: "Higiene personal excelente" },
      { valor: 95, label: "Ocasionalmente se presentó sucio" },
      { valor: 90, label: "Frecuentemente se presentó sucio" },
      { valor: 85, label: "Constantemente desaliñado" },
    ],
  },
  {
    nombre: "Iniciativa",
    opciones: [
      { valor: 100, label: "Realizó aportaciones importantes" },
      { valor: 95, label: "Eventualmente hizo aportaciones" },
      { valor: 90, label: "Se limita a reportar anomalías" },
      { valor: 85, label: "Solo sigue rutinas establecidas" },
    ],
  },
  {
    nombre: "Relaciones interpersonales",
    opciones: [
      { valor: 100, label: "Mantiene acertadas relaciones" },
      { valor: 95, label: "Ocasionalmente inadecuadas" },
      { valor: 90, label: "Frecuentemente inconforme" },
      { valor: 85, label: "No cumple o evade relaciones laborales" },
    ],
  },
];

export function FormEvaluacion() {
  const { C } = useTheme();
  const [valores, setValores] = useState({});
  const [observaciones, setObservaciones] = useState("");

  const seleccionar = (factor, valor) => {
    setValores(prev => ({
      ...prev,
      [factor]: valor,
    }));
  };

  const total = Object.values(valores).reduce((acc, v) => acc + v, 0);

  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "1.5rem",
      marginBottom: "1.5rem"
    }}>

      <p style={{
        margin: "0 0 1.25rem",
        fontSize: 12,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Evaluación del alumno
      </p>

      {/* FACTORES */}
      {FACTORES.map((f, i) => (
        <div key={i} style={{ marginBottom: "1.5rem" }}>

          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {f.nombre}
          </p>

          {f.opciones.map((op, j) => (
            <label key={j} style={{
              display: "flex",
              gap: 8,
              marginBottom: 6,
              cursor: "pointer",
              fontSize: 13,
              color: C.textMuted
            }}>
              <input
                type="radio"
                name={f.nombre}
                value={op.valor}
                checked={valores[f.nombre] === op.valor}
                onChange={() => seleccionar(f.nombre, op.valor)}
              />
              {op.valor} — {op.label}
            </label>
          ))}

        </div>
      ))}

      {/* TOTAL */}
      <div style={{
        padding: "10px",
        borderRadius: 8,
        background: C.bgInput,
        marginBottom: "1.5rem",
        fontSize: 13
      }}>
        <strong>Suma total de puntos:</strong> {total}
      </div>

      

      {/* Observaciones */}
      
        <p style={{
          margin: "0 0 0.75rem",
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
          placeholder="Describe las observaciones sobre el desempeño del alumno, aspectos a mejorar o cualquier comentario relevante."
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
          }}
        />
      

      

    </div>
  );
}