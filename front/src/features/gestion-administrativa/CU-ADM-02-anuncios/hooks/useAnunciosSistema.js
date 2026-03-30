import { useState } from "react";

const ALUMNO = { nombre: "García López Ana", matricula: "2022630001" };

const MOCK_ANUNCIOS = [
  {
    id: 1,
    titulo: "Recordatorio: entrega de reporte parcial",
    contenido: "Se les recuerda a todos los alumnos en servicio social que el reporte parcial del primer bimestre debe ser entregado a más tardar el viernes 30 de mayo de 2025. El reporte debe incluir las actividades realizadas, horas acumuladas y una breve descripción de los avances obtenidos. Cualquier duda puede consultarse directamente con su profesor responsable.",
    fecha: "2025-05-20",
    autor: "Lic. Morales Vega",
    origen: "coordinacion",
  },
  {
    id: 2,
    titulo: "Sesión de seguimiento — semana del 19 de mayo",
    contenido: "Les informo que tendremos una sesión de seguimiento el próximo miércoles 21 de mayo a las 11:00 h en el cubículo CB-03. Es importante que traigan su bitácora actualizada y tengan listo el avance de las actividades asignadas para revisión.",
    fecha: "2025-05-18",
    autor: "Dr. Torres Vega",
    origen: "profesor",
  },
  {
    id: 3,
    titulo: "Actualización de parámetros del sistema — periodo Ene–Jun 2025",
    contenido: "Se informa que a partir del 15 de mayo de 2025, el sistema ha sido actualizado con los parámetros del periodo escolar Ene–Jun 2025. Las horas requeridas para la conclusión del servicio social se mantienen en 480 horas. Cualquier inconsistencia en el registro de horas debe reportarse a coordinación.",
    fecha: "2025-05-15",
    autor: "Lic. Morales Vega",
    origen: "coordinacion",
  },
  {
    id: 4,
    titulo: "Cambio en el formato de bitácora semanal",
    contenido: "A partir de esta semana, las bitácoras deben incluir una sección adicional de 'dificultades encontradas' y 'soluciones aplicadas'. Esto permitirá llevar un mejor registro del proceso de aprendizaje. El nuevo formato ya está disponible en el sistema.",
    fecha: "2025-05-10",
    autor: "Dr. Torres Vega",
    origen: "profesor",
  },
  {
    id: 5,
    titulo: "Bienvenida al periodo de servicio social Ene–Jun 2025",
    contenido: "La Coordinación de Servicio Social da la bienvenida a todos los alumnos que inician su servicio social en este periodo. Les recordamos que deben registrar sus actividades semanalmente en el sistema y mantener contacto regular con su profesor responsable. Ante cualquier duda, pueden acudir a las oficinas de coordinación en horario de 9:00 a 14:00 h.",
    fecha: "2025-01-13",
    autor: "Lic. Morales Vega",
    origen: "coordinacion",
  },
];

const ANUNCIOS = [...MOCK_ANUNCIOS].sort((a, b) => b.fecha.localeCompare(a.fecha));

export function formatFecha(fechaStr) {
  const [y, m, d] = fechaStr.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}. ${y}`;
}

export function useAnunciosSistema() {
  const [seleccionado, setSeleccionado] = useState(null);

  return {
    alumno:      ALUMNO,
    anuncios:    ANUNCIOS,
    seleccionado,
    setSeleccionado,
  };
}
