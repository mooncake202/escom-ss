import { useState, useEffect } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";

export default function EsperandoProfesor() {
  const { C } = useTheme();
  const [datos, setDatos] = useState(null);

  // 🔹 NUEVO
  const [mostrarOfertas, setMostrarOfertas] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [confirmado, setConfirmado] = useState(false);

  // 🔹 DATOS EN DURO
  const ofertas = [
    { id: 1, titulo: "Sistema web biblioteca", profesor: "Dr. Pérez" },
    { id: 2, titulo: "App móvil inventarios", profesor: "Dra. López" },
    { id: 3, titulo: "IA para análisis de datos", profesor: "Dr. Ramírez" }
  ];

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
    fetch(`http://localhost:3000/alumno/solicitud/${usuario.id}`)
      .then(r => r.json())
      .then(setDatos)
      .catch(console.error);
  }, []);

  const nombre = datos ? `${datos.nombres} ${datos.apellidos}` : "";

  if (!datos) return null;

  const esRechazada = datos?.estatus === "rechazada_definitiva";

  const handleNuevaSolicitud = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    await fetch(`http://localhost:3000/alumno/solicitud/${usuario.id}/reset`, {
      method: "POST"
    });

    window.location.href = "/";
  };

  return (
    <ProcesoLayout pasoActual={1} usuario={nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        {!esRechazada ? (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⏳</div>

            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              Esperando respuesta del profesor
            </h2>

            <p>
              Tu solicitud fue enviada correctamente al profesor Mario para la oferta "Sistema de gestión de biblioteca". 
              Porfavor regresa más tarde.
            </p>

            {/* 🔹 BOTÓN NUEVO */}
            <button
              onClick={() => setMostrarOfertas(prev => !prev)}
              style={{
                marginTop: "1rem",
                padding: "10px 16px",
                borderRadius: RADIUS.md,
                background: C.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
            >
              Cambiar oferta
            </button>

          </>
        ) : (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>❌</div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>
              Solicitud rechazada
            </h2>

            <p style={{ marginBottom: "1rem" }}>
              Lo sentimos, tu solicitud fue rechazada.
            </p>

            <div style={{
              background: C.bgCard,
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: RADIUS.md,
              padding: "1rem",
              marginBottom: "1rem"
            }}>
              <strong>Motivo:</strong>
              <p style={{ margin: "6px 0 0" }}>
                {datos.motivoRechazo}
              </p>
            </div>

           

            {/* 🔹 BOTÓN TAMBIÉN AQUÍ */}
            <button
              onClick={() => setMostrarOfertas(prev => !prev)}
              style={{
                marginTop: "1rem",
                padding: "10px 16px",
                borderRadius: RADIUS.md,
                background: C.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
            >
              Cambiar oferta
            </button>

          </>
        )}

        {/* 🔹 SECCIÓN DE OFERTAS (FUERA DEL IF) */}
        {mostrarOfertas && (
          <div style={{
            marginTop: "1rem",
            background: C.bgCard,
            border: `1px solid ${C.borderSubtle}`,
            borderRadius: RADIUS.md,
            padding: "1rem",
            textAlign: "left"
          }}>

            {ofertas.map(o => (
              <div
                key={o.id}
                onClick={() =>
                  setOfertaSeleccionada(prev => prev === o.id ? null : o.id)
                }
                style={{
                  padding: "10px",
                  borderRadius: RADIUS.md,
                  cursor: "pointer",
                  marginBottom: 6,
                  border: ofertaSeleccionada === o.id
                    ? `2px solid ${C.accent}`
                    : `1px solid ${C.borderSubtle}`,
                  background: ofertaSeleccionada === o.id
                    ? C.accentSoft
                    : "transparent"
                }}
              >
                <strong>{o.titulo}</strong>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {o.profesor}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                if (!ofertaSeleccionada) return;
                setConfirmado(true);
                setMostrarOfertas(false);
                setOfertaSeleccionada(null);
              }}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "10px",
                borderRadius: RADIUS.md,
                background: C.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
            >
              Confirmar cambio de oferta
            </button>

          </div>
        )}

        {/* 🔹 MENSAJE */}
        {confirmado && (
          <p style={{
            marginTop: "1rem",
            color: C.success,
            fontSize: 13
          }}>
            ✔ Oferta actualizada correctamente. Se envió al nuevo profesor.
          </p>
        )}

      </div>
    </ProcesoLayout>
  );
}