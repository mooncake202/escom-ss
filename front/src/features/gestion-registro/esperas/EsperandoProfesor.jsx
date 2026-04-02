import { useState, useEffect } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { ProcesoLayout }            from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";

export default function EsperandoProfesor() {
  const { C } = useTheme();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
    fetch(`http://localhost:3000/alumno/solicitud/${usuario.id}`)
      .then(r => r.json())
      .then(setDatos)
      .catch(console.error);
  }, []);

  const nombre = datos ? `${datos.nombres} ${datos.apellidos}` : "Cargando...";

  return (
    <ProcesoLayout pasoActual={1} usuario={nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⏳</div>

        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Esperando respuesta del profesor
        </h2>

        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu solicitud fue enviada correctamente. El profesor revisará tu perfil y motivación antes de aceptarla o rechazarla.
        </p>

        {datos && (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderSubtle}`,
            padding: "1.25rem 1.5rem", textAlign: "left",
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Tu solicitud
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textSecondary }}>
              <span style={{ fontWeight: 600, color: C.textPrimary }}>Oferta:</span> {datos.vacante}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>
              <span style={{ fontWeight: 600, color: C.textPrimary }}>Profesor:</span> {datos.profesor}
            </p>
          </div>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: 12, color: C.textDisabled }}>
          Recibirás una notificación cuando el profesor responda. Puedes cerrar esta página y volver más tarde.
        </p>

      </div>
    </ProcesoLayout>
  );
}