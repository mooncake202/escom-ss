import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { useMiExpediente } from "./hooks/useExpediente";
import { FichaAlumno, BarraProgreso, ListaPorEtapas, VisorDocumento } from "./components/ExpedientePanel";

// CU-ADM-13 — El alumno consulta SU expediente documental. Solo lectura.
// No manda su boleta: el backend la deriva del token.

function Marco({ usuario, children }) {
  return (
    <DashboardLayout
      titulo="Mi expediente"
      subtitulo="Documentos de tu servicio social"
      rol="alumno_asignado"
      usuario={usuario}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

export default function ExpedienteAlumno() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const {
    carga, recargar, alumno, etapas, progreso, etapaActual,
    pdf, documentoEnPdf, verDocumento, cerrarVisor, descargarDocumento, descarga,
  } = useMiExpediente();

  const nombre = nombreCompletoSesion(usuario);

  if (carga.estado !== "listo") {
    return (
      <Marco usuario={nombre}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem", textAlign: "center",
        }}>
          {carga.estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tu expediente...</p>
          ) : (
            <>
              <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
              <button onClick={recargar} style={{
                padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </Marco>
    );
  }

  return (
    <Marco usuario={nombre}>
      {/* Misma ficha que ve Coordinación, con su oferta y su profesor. */}
      <FichaAlumno alumno={alumno} C={C} />

      <BarraProgreso progreso={progreso} etapaActual={etapaActual} C={C} />

      <ListaPorEtapas
        etapas={etapas}
        onVer={verDocumento}
        onDescargar={descargarDocumento}
        descarga={descarga}
        cargandoPdf={pdf.estado === "cargando"}
        C={C}
      />

      <p style={{ margin: "0.5rem 0 0", fontSize: 11, color: C.textDisabled }}>
        Solo se muestran los documentos ya aprobados de tu servicio social.
      </p>

      <VisorDocumento pdf={pdf} documento={documentoEnPdf} onCerrar={cerrarVisor} />
    </Marco>
  );
}
