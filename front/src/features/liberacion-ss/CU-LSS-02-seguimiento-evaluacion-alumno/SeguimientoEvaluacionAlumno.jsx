import { useTheme } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { calcularPasoActual } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/utils/pasoLSS";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

import { useSeguimientoEvaluacionAlumno } from "./hooks/useSeguimientoEvaluacionAlumno";
import { VistaAlumno } from "./components/VistaAlumno";

export default function SeguimientoEvaluacionAlumno() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const nombreAlumno = nombreCompletoSesion(sesion);

  const {
    cargando, estado, error, accionEnCurso,
    reenviarSolicitud, descargarEval, confirmarSiss, pedirCartaTermino,
  } = useSeguimientoEvaluacionAlumno();

  return (
    <ProcesoLSSLayout
      pasoActual={calcularPasoActual("evaluacion_solicitada")}
      titulo="Evaluación de desempeño"
      
      rol="alumno"
      usuario={nombreAlumno}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {cargando ? (
          <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: "3rem" }}>Cargando...</p>
        ) : (
          <VistaAlumno
            estado={estado}
            error={error}
            accionEnCurso={accionEnCurso}
            onReenviar={reenviarSolicitud}
            onDescargar={descargarEval}
            onConfirmarSiss={confirmarSiss}
            onSolicitarCartaTermino={pedirCartaTermino}
          />
        )}
      </div>
    </ProcesoLSSLayout>
  );
}
