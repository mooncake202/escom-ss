import { useLocation } from "react-router-dom";

const ALUMNO = {
  nombre:    "García López Ana",
  matricula: "2022630001",
};

// ── Mock: cambia MOCK_ESTADO para probar cada escenario ──────
// Opciones: "pendiente_firma" | "pendiente_envio" | "pendiente_revision"
//           | "rechazado_profesor" | "rechazado_coordinacion"
//           | "aprobado" | "sin_reportes"
const MOCK_ESTADO = "rechazado_profesor";

const MOCK_REPORTES_POR_ESTADO = {
  pendiente_firma: {
    periodo: "Junio 2025", diasLaborados: 20, horas: 80,
    ultimaActualizacion: "30 jun 2025, 08:45",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: null,
    timestamps: {
      pendiente_firma:         "30 jun 2025, 08:45",
      pendiente_envio:         null,
      pendiente_revision:      null,
      resolucion_profesor:     null,
      envio_coordinacion:      null,
      resolucion_coordinacion: null,
    },
  },
  pendiente_envio: {
    periodo: "Junio 2025", diasLaborados: 20, horas: 80,
    ultimaActualizacion: "30 jun 2025, 09:10",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: null,
    timestamps: {
      pendiente_firma:         "30 jun 2025, 08:45",
      pendiente_envio:         "30 jun 2025, 09:10",
      pendiente_revision:      null,
      resolucion_profesor:     null,
      envio_coordinacion:      null,
      resolucion_coordinacion: null,
    },
  },
  pendiente_revision: {
    periodo: "Mayo 2025", diasLaborados: 20, horas: 80,
    ultimaActualizacion: "30 may 2025, 09:31",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: null,
    timestamps: {
      pendiente_firma:         "30 may 2025, 09:00",
      pendiente_envio:         "30 may 2025, 09:20",
      pendiente_revision:      "30 may 2025, 09:31",
      resolucion_profesor:     null,
      envio_coordinacion:      null,
      resolucion_coordinacion: null,
    },
  },
  rechazado_profesor: {
    periodo: "Mayo 2025", diasLaborados: 14, horas: 56,
    ultimaActualizacion: "01 jun 2025, 16:20",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: "El reporte incluye días que corresponden a un periodo vacacional o inhábil. Por favor, revisa el calendario y vuelve a generar el reporte considerando únicamente los días laborables del periodo.",
    timestamps: {
      pendiente_firma:         "30 may 2025, 09:00",
      pendiente_envio:         "30 may 2025, 09:20",
      pendiente_revision:      "30 may 2025, 09:31",
      resolucion_profesor:     "01 jun 2025, 16:20",
      envio_coordinacion:      null,
      resolucion_coordinacion: null,
    },
  },
  envio_coordinacion: {
    periodo: "Abril 2025", diasLaborados: 18, horas: 72,
    ultimaActualizacion: "02 may 2025, 10:15",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: null,
    timestamps: {
      pendiente_firma:         "30 abr 2025, 09:00",
      pendiente_envio:         "30 abr 2025, 09:20",
      pendiente_revision:      "30 abr 2025, 09:31",
      resolucion_profesor:     "02 may 2025, 10:10",
      envio_coordinacion:      "02 may 2025, 10:15",
      resolucion_coordinacion: null,
    },
  },
  rechazado_coordinacion: {
    periodo: "Marzo 2025", diasLaborados: 18, horas: 72,
    ultimaActualizacion: "03 abr 2025, 14:30",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: "El reporte no cumple con el formato requerido por la coordinación. Verifica que todos los campos estén completos y que las actividades descritas sean coherentes con el proyecto asignado.",
    timestamps: {
      pendiente_firma:         "31 mar 2025, 09:00",
      pendiente_envio:         "31 mar 2025, 09:20",
      pendiente_revision:      "31 mar 2025, 09:31",
      resolucion_profesor:     "02 abr 2025, 11:00",
      envio_coordinacion:      "02 abr 2025, 11:10",
      resolucion_coordinacion: "03 abr 2025, 14:30",
    },
  },
  aprobado: {
    periodo: "Febrero 2025", diasLaborados: 16, horas: 64,
    ultimaActualizacion: "04 mar 2025, 11:00",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: null,
    timestamps: {
      pendiente_firma:         "28 feb 2025, 09:00",
      pendiente_envio:         "28 feb 2025, 09:20",
      pendiente_revision:      "28 feb 2025, 09:31",
      resolucion_profesor:     "02 mar 2025, 14:30",
      envio_coordinacion:      "02 mar 2025, 14:40",
      resolucion_coordinacion: "04 mar 2025, 11:00",
    },
  },
};

const MOCK_REPORTES_POR_ID = {
  1: {
    periodo: "Febrero 2025", diasLaborados: 16, horas: 64,
    ultimaActualizacion: "04 mar 2025, 11:00",
    profesor: "Dr. Torres Vega", comentarioRechazo: null, estado: "aprobado",
    timestamps: {
      pendiente_firma: "28 feb 2025, 09:00", pendiente_envio: "28 feb 2025, 09:20",
      pendiente_revision: "28 feb 2025, 09:31", resolucion_profesor: "02 mar 2025, 14:30",
      envio_coordinacion: "02 mar 2025, 14:40", resolucion_coordinacion: "04 mar 2025, 11:00",
    },
  },
  2: {
    periodo: "Marzo 2025", diasLaborados: 18, horas: 72,
    ultimaActualizacion: "04 abr 2025, 11:00",
    profesor: "Dr. Torres Vega", comentarioRechazo: null, estado: "aprobado",
    timestamps: {
      pendiente_firma: "31 mar 2025, 09:00", pendiente_envio: "31 mar 2025, 09:20",
      pendiente_revision: "31 mar 2025, 09:31", resolucion_profesor: "02 abr 2025, 14:30",
      envio_coordinacion: "02 abr 2025, 14:40", resolucion_coordinacion: "04 abr 2025, 11:00",
    },
  },
  3: {
    periodo: "Abril 2025", diasLaborados: 18, horas: 72,
    ultimaActualizacion: "04 may 2025, 11:00",
    profesor: "Dr. Torres Vega", comentarioRechazo: null, estado: "aprobado",
    timestamps: {
      pendiente_firma: "30 abr 2025, 09:00", pendiente_envio: "30 abr 2025, 09:20",
      pendiente_revision: "30 abr 2025, 09:31", resolucion_profesor: "02 may 2025, 14:30",
      envio_coordinacion: "02 may 2025, 14:40", resolucion_coordinacion: "04 may 2025, 11:00",
    },
  },
  4: {
    periodo: "Mayo 2025", diasLaborados: 14, horas: 56,
    ultimaActualizacion: "01 jun 2025, 16:20",
    profesor: "Dr. Torres Vega",
    comentarioRechazo: "El reporte incluye días que corresponden a un periodo vacacional o inhábil. Por favor, revisa el calendario y vuelve a generar el reporte considerando únicamente los días laborables del periodo.",
    estado: "rechazado_profesor",
    timestamps: {
      pendiente_firma: "30 may 2025, 09:00", pendiente_envio: "30 may 2025, 09:20",
      pendiente_revision: "30 may 2025, 09:31", resolucion_profesor: "01 jun 2025, 16:20",
      envio_coordinacion: null, resolucion_coordinacion: null,
    },
  },
};

export const PASOS = [
  { key: "pendiente_firma",         label: "Firma del alumno",           fechaKey: "pendiente_firma" },
  { key: "pendiente_envio",         label: "Envío al profesor",          fechaKey: "pendiente_envio" },
  { key: "pendiente_revision",      label: "Revisión del profesor",      fechaKey: "pendiente_revision" },
  { key: "resolucion_profesor",     label: "Resolución del profesor",    fechaKey: "resolucion_profesor" },
  { key: "envio_coordinacion",      label: "Envío a coordinación",       fechaKey: "envio_coordinacion" },
  { key: "resolucion_coordinacion", label: "Validación de coordinación", fechaKey: "resolucion_coordinacion" },
];

export function getPasoActivo(estado) {
  if (estado === "pendiente_firma")         return 0;
  if (estado === "pendiente_envio")         return 1;
  if (estado === "pendiente_revision")      return 2;
  if (estado === "rechazado_profesor")      return 3;
  if (estado === "envio_coordinacion")      return 4;
  if (estado === "rechazado_coordinacion")  return 5;
  if (estado === "aprobado")                return 6;
  return -1;
}

export function getBadge(estado, C) {
  const map = {
    pendiente_firma:         { bg: C.warningSoft,           color: C.warning,    label: "Pendiente de firma" },
    pendiente_envio:         { bg: C.accentSoft,            color: C.accentText, label: "Pendiente de envío" },
    pendiente_revision:      { bg: C.warningSoft,           color: C.warning,    label: "Pendiente de revisión" },
    rechazado_profesor:      { bg: "rgba(239,68,68,0.1)",   color: C.danger,     label: "Rechazado por profesor" },
    envio_coordinacion:      { bg: C.accentSoft,            color: C.accentText, label: "En revisión por coordinación" },
    rechazado_coordinacion:  { bg: "rgba(239,68,68,0.1)",   color: C.danger,     label: "Rechazado por coordinación" },
    aprobado:                { bg: C.successSoft,           color: C.success,    label: "Aprobado por coordinación" },
  };
  return map[estado] || { bg: C.bgInput, color: C.textMuted, label: estado };
}

export function useConsultarEstatusReporte() {
  const location = useLocation();

  const estadoActivo = location.state?.estado ?? MOCK_ESTADO;
  const reporte =
    MOCK_REPORTES_POR_ID[location.state?.reporteId] ??
    MOCK_REPORTES_POR_ESTADO[estadoActivo] ??
    MOCK_REPORTES_POR_ESTADO.pendiente_revision;

  const pasoActivo  = getPasoActivo(estadoActivo);
  const esRechazado = estadoActivo === "rechazado_profesor" || estadoActivo === "rechazado_coordinacion";

  return {
    alumno: ALUMNO,
    estadoActivo,
    reporte,
    pasoActivo,
    esRechazado,
  };
}
