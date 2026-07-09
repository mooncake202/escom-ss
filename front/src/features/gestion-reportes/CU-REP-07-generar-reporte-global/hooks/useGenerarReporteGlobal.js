import { useState, useMemo } from "react";

const ALUMNO = {
  nombre:   "García López Ana",
  boleta:   "2022630001",
  carrera:  "Ingeniería en Sistemas Computacionales (ISC)",
  semestre: "Octavo",
  telefono: "55 1234 5678",
  correo:   "agarcia0001@alumno.ipn.mx",
};

const PROFESOR_ASIGNADO        = "Dr. Torres Vega";
const FECHA_INICIO_SS          = "16 de mayo de 2025";
const TOTAL_HORAS_ACUMULADAS   = 480;
const YA_EXISTE_REPORTE_GLOBAL = false;

// La rúbrica fue registrada desde el primer reporte mensual (RN-REP-06)
const FIRMA_GUARDADA_URL = null; // null = sin vista previa (mock); en producción vendría del backend

const TITULO_AUTO = "Reporte Global de Actividades";

export function useGenerarReporteGlobal() {
  const tieneHorasSuficientes = TOTAL_HORAS_ACUMULADAS >= 480;
  const yaExisteReporteGlobal = YA_EXISTE_REPORTE_GLOBAL;

  const fechaGeneracion = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const periodoTexto = `del ${FECHA_INICIO_SS} al ${fechaGeneracion}`;

  const [paso, setPaso]               = useState(1);
  const [enviado, setEnviado]         = useState(false);
  const [actividades, setActividades] = useState("");
  const [errores, setErrores]         = useState({});

  function handleActividadesChange(e) {
    setActividades(e.target.value);
    if (errores.actividades) setErrores(prev => ({ ...prev, actividades: null }));
  }

  function irPaso2() {
    if (!actividades.trim()) {
      setErrores({ actividades: "El texto narrativo de actividades es obligatorio." });
      return;
    }
    setErrores({});
    setPaso(2);
  }

  function irPaso3() {
    setPaso(3);
  }

  function datosPDF() {
    return {
      titulo:        TITULO_AUTO,
      fechaGeneracion,
      periodoTexto,
      alumno:        ALUMNO,
      actividades,
      firmaUrl:      FIRMA_GUARDADA_URL,
      totalHoras:    TOTAL_HORAS_ACUMULADAS,
      profesorNombre: PROFESOR_ASIGNADO,
    };
  }

  function handleEnviar() {
    setEnviado(true);
  }

  return {
    alumno:        ALUMNO,
    profesorNombre: PROFESOR_ASIGNADO,
    tituloAuto:    TITULO_AUTO,
    periodoTexto,
    fechaInicioSS: FECHA_INICIO_SS,
    fechaGeneracion,
    totalHoras:    TOTAL_HORAS_ACUMULADAS,
    tieneHorasSuficientes,
    yaExisteReporteGlobal,
    firmaUrl:      FIRMA_GUARDADA_URL,
    paso, setPaso,
    enviado, handleEnviar,
    actividades, handleActividadesChange,
    errores, irPaso2, irPaso3, datosPDF,
  };
}
