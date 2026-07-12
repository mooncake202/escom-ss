import { useTheme } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";

import { useSeguimientoEvaluacionAlumno } from "./hooks/useSeguimientoEvaluacionAlumno";
import { VistaAlumno } from "./components/VistaAlumno";

const MOCK = {
  usuario: "Juan Pérez"
};

export default function SeguimientoEvaluacionAlumno() {
  const { C } = useTheme();

  const {
    estado,
    confirmadoSISS,
    setConfirmadoSISS,
    puedeContinuar
  } = useSeguimientoEvaluacionAlumno();

  return (
    <ProcesoLSSLayout
      pasoActual={2}
      titulo="Evaluación de desempeño"
      subtitulo="CU-02-Seguimiento de evaluación"
      rol="alumno"
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        <VistaAlumno
          estado={estado}
          confirmadoSISS={confirmadoSISS}
          setConfirmadoSISS={setConfirmadoSISS}
        />

      </div>
    </ProcesoLSSLayout>
  );
}