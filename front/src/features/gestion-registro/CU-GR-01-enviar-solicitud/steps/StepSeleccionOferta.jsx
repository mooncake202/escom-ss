import { useState, useEffect } from "react";
import { OfertaCard } from "../components/OfertaCard";

export function StepSeleccionOferta({ form, errors, ofertas, ofertasCargando, onSelect, handleChange, C }) {
  const [perfiles, setPerfiles] = useState([]);
  const [perfilesFiltro, setPerfilesFiltro] = useState([]);

  useEffect(() => {
    fetch("/api/ofertas/perfiles")
      .then(r => r.json())
      .then(data => setPerfiles(data))
      .catch(() => {});
  }, []);

  const togglePerfil = (nombre) => {
    setPerfilesFiltro(prev =>
      prev.includes(nombre) ? prev.filter(p => p !== nombre) : [...prev, nombre]
    );
  };

  const ofertasFiltradas = perfilesFiltro.length === 0
    ? ofertas
    : ofertas.filter(o => {
        const perfilesOferta = o.perfiles ? o.perfiles.split(",") : [];
        return perfilesFiltro.every(p => perfilesOferta.includes(p));
      });

  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Seleccionar oferta
      </h2>
      <p style={{ margin: "0 0 1rem", color: C.textMuted, fontSize: 13 }}>
        Elige el proyecto en el que deseas colaborar
      </p>

      {/* FILTRO DE PERFILES */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {perfiles.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => togglePerfil(p.nombre)}
            style={{
              padding: "4px 14px",
              borderRadius: "999px",
              border: `1px solid ${perfilesFiltro.includes(p.nombre) ? C.accentText : C.borderDefault}`,
              background: perfilesFiltro.includes(p.nombre) ? C.accentText : "transparent",
              color: perfilesFiltro.includes(p.nombre) ? "#fff" : C.textMuted,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {errors.oferta && (
        <p style={{ color: C.danger, fontSize: 12, marginBottom: "1rem" }}>{errors.oferta}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {ofertasCargando
          ? <p style={{ color: C.textDisabled, textAlign: "center", padding: "2rem" }}>Cargando ofertas...</p>
          : ofertas.length === 0
            // Flujo Alterno 7.1: distinto de "cargando" — ya se sabe con
            // certeza que no hay ninguna oferta con cupos disponibles.
            ? <p style={{ color: C.textDisabled, textAlign: "center", padding: "2rem" }}>
                No hay ofertas de servicio social disponibles en este momento. Intenta más tarde.
              </p>
            : ofertasFiltradas.length === 0
              ? <p style={{ color: C.textDisabled, textAlign: "center", padding: "2rem" }}>No hay ofertas del perfil que buscas</p>
              : ofertasFiltradas.map(o => (
                <OfertaCard
                  key={o.id} oferta={o} C={C}
                  selected={form.oferta === o.id}
                  onSelect={onSelect}
                />
              ))
        }
      </div>

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
            <p style={{ color: C.danger, fontSize: 12 }}>{errors.motivacion}</p>
          )}
        </div>
      )}
    </div>
  );
}