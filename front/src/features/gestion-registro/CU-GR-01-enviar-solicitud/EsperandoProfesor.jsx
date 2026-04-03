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

  const nombre = datos ? `${datos.nombres} ${datos.apellidos}` : "";

  if (!datos) return null;

  const esRechazada = datos?.estatus === "rechazada_definitiva";

  const handleNuevaSolicitud = async () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  await fetch(`http://localhost:3000/alumno/solicitud/${usuario.id}/reset`, {
    method: "POST"
  });

  window.location.href = "/"; // o donde creas solicitud
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
            Tu solicitud fue enviada correctamente. 
            Porfavor regresa más tarde.
          </p>
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

          <button
            onClick={handleNuevaSolicitud}
            style={{
              padding: "10px 20px",
              borderRadius: RADIUS.md,
              background: C.accent,
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Crear nueva solicitud
          </button>
        </>
      )}
                

      </div>
    </ProcesoLayout>
  );
}