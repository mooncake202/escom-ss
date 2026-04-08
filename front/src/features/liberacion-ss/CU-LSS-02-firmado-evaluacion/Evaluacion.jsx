import { useTheme } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Validación-requisitos-previos/components/ProcesoLSSLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useEvaluacion } from "./hooks/useEvaluacion";
import { FormEvaluacion } from "./components/FormEvaluacion";
import { VistaAlumno } from "./components/VistaAlumno";
import { FirmaPanel } from "./components/FirmaPanel";



const MOCK = {
  usuario: "Juan Pérez"
};



export default function Evaluacion({rol= "profesor"}) {
  const { C } = useTheme();
  const { estado, guardar, firmarProfesor, firmarCoordinacion } = useEvaluacion();
  const Layout = rol === "alumno"
  ? ProcesoLSSLayout
  : DashboardLayout;

  const titulosPorRol = {
    
    profesor: "Evaluación de desempeño",
    coordinacion: "Revisión y firma de evaluación",
  };

  const subtitulosPorRol = {
    
    profesor: "Los puntos a que fue acreedor el prestador por cada factor.",
    coordinacion: "Revisa la evaluación del profesor y firma para continuar el proceso.",
  };


  

  return (
    <Layout
    {...(rol === "alumno"
        ? {
            pasoActual: 2,
            titulo: "Evaluación de desempeño",
            subtitulo: "CU-LSS-02 - ALUMNO",
            rol: "alumno",
            usuario: MOCK.usuario,
        }
        : {
            titulo: "Evaluación de desempeño",
            subtitulo: "CU-LSS-02 - PROFESOR/COORDINACIÓN",
            rol: rol,
            usuario: MOCK.usuario,
        })}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          {titulosPorRol[rol]}
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {subtitulosPorRol[rol]}
        </p>

        {rol === "alumno" && (
          <VistaAlumno estado={estado} />
        )}

        {rol === "profesor" && (
        <>
            {/* 🔥 ALERTA DE VALIDACIÓN */}
            {estado.requiereValidacion && (
            <div style={{
                marginBottom: "1.5rem",
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(245,158,11,0.08)",
                border: `1px solid ${C.warning ?? "#F59E0B"}`,
            }}>
                <p style={{
                margin: 0,
                fontSize: 13,
                color: C.warning ?? "#F59E0B",
                lineHeight: 1.5
                }}>
                Este alumno ha solicitado la validación de sus reportes en el SISS. 
                Debes validarlos antes de poder continuar con la evaluación.
                </p>

                <a
                href="https://serviciosocial.ipn.mx"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.accentText,
                    textDecoration: "none"
                }}
                >
                Ir a SISS →
                </a>
            </div>
            )}

            <FormEvaluacion estado={estado} onGuardar={guardar} />

            <FirmaPanel
            tipo="profesor"
            estado={estado}
            onFirmar={firmarProfesor}
            />
        </>
        )}

        {rol === "coordinacion" && (
          <>
            {/* Coordinación puede ver la evaluación pero no editarla */}
            <div style={{
              background: C.bgCard,
              borderRadius: 12,
              border: `1px solid ${C.borderSubtle}`,
              padding: "1.25rem 1.5rem",
              marginBottom: "1.25rem",
            }}>
              <p style={{
                margin: "0 0 0.75rem",
                fontSize: 12,
                fontWeight: 700,
                color: C.accentText,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                Evaluación del profesor
              </p>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: estado.evaluacion ? C.textPrimary : C.textDisabled,
                lineHeight: 1.6,
                fontStyle: estado.evaluacion ? "normal" : "italic",
              }}>
                {estado.evaluacion || "El profesor aún no ha completado la evaluación."}
              </p>
            </div>

            <FirmaPanel tipo="coordinacion" estado={estado} onFirmar={firmarCoordinacion} />
          </>
        )}

      </div>
    </Layout>
  );
}