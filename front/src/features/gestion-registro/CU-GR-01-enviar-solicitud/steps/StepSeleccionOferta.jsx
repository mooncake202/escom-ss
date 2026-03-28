import { OfertaCard } from "../components/OfertaCard";

export function StepSeleccionOferta({ form, errors, ofertas, onSelect, handleChange, C }) {
  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Seleccionar oferta
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Elige el proyecto en el que deseas colaborar
      </p>

      {errors.oferta && (
        <p style={{ color: C.danger, fontSize: 12, marginBottom: "1rem" }}>{errors.oferta}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {ofertas.length === 0
          ? <p style={{ color: C.textDisabled, textAlign: "center", padding: "2rem" }}>Cargando ofertas...</p>
          : ofertas.map(o => (
            <OfertaCard
              key={o.id} oferta={o} C={C}
              selected={form.oferta === o.id}
              onSelect={onSelect}
            />
          ))
        }
      </div>

        {/* TEXTO DE MOTIVACIÓN */}
      {form.oferta && (
        <div style={{ marginTop: "1.5rem" }}>

          <label style={{ fontWeight: 600, color: C.textPrimary }}>
            ¿Por qué deseas participar en este programa y qué habilidades aportarías?
          </label>

          <textarea
            name="motivacion"
            value={form.motivacion || ""}
            onChange={handleChange}
            rows={4}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${C.borderDefault}`,
              fontFamily: "inherit"
            }}
          />

          {errors.motivacion && (
            <p style={{ color: C.danger, fontSize: 12 }}>
              {errors.motivacion}
            </p>
          )}

        </div>
      )}


    </div>
  );
}
