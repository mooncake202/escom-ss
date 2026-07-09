import { useState } from "react";

export const ALUMNO = { nombre: "García López Ana", matricula: "2022630001" };

// ── Cambiar a false para probar estado vacío ─────────────────
export const MOCK_TIENE_HISTORIAL = true;

// Ordenados del más reciente al más antiguo.
// Solo el primero (más reciente) puede tener estado no-aprobado.
export const MOCK_REPORTES = [
  {
    id: 4,
    titulo: "Reporte Mensual de Actividades No. 4",
    periodo: "Mayo 2025",
    diasLaborados: 14,
    horas: 56,
    fechaEnvio: "30 de mayo de 2025",   // último día de mayo
    estado: "rechazado_profesor",
    profesor: "Dr. Torres Vega",
    comentario: "El reporte incluye días de Semana Santa que corresponden a un período vacacional. Corrige el calendario y vuelve a generar el reporte con los días laborables del período.",
  },
  {
    id: 3,
    titulo: "Reporte Mensual de Actividades No. 3",
    periodo: "Abril 2025",
    diasLaborados: 18,
    horas: 72,
    fechaEnvio: "30 de abril de 2025",  // último día de abril
    estado: "aprobado",
    profesor: "Dr. Torres Vega",
    comentario: "Continúa con el mismo ritmo. Se nota progreso en las actividades de desarrollo.",
  },
  {
    id: 2,
    titulo: "Reporte Mensual de Actividades No. 2",
    periodo: "Marzo 2025",
    diasLaborados: 18,
    horas: 72,
    fechaEnvio: "31 de marzo de 2025",  // último día de marzo
    estado: "aprobado",
    profesor: "Dr. Torres Vega",
    comentario: "Continúa con el mismo ritmo.",
  },
  {
    id: 1,
    titulo: "Reporte Mensual de Actividades No. 1",
    periodo: "Febrero 2025",
    diasLaborados: 16,
    horas: 64,
    fechaEnvio: "28 de febrero de 2025", // último día de febrero
    estado: "aprobado",
    profesor: "Dr. Torres Vega",
    comentario: "Buen avance. Las actividades descritas son coherentes con el proyecto asignado.",
  },
];

export function useHistorialReportes() {
  const [expandido, setExpandido] = useState(null);

  function toggleExpandir(id) {
    setExpandido(prev => prev === id ? null : id);
  }

  return {
    alumno: ALUMNO,
    tieneHistorial: MOCK_TIENE_HISTORIAL,
    reportes: MOCK_REPORTES,
    expandido,
    toggleExpandir,
  };
}