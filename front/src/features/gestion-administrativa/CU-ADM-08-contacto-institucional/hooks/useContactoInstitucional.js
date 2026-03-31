const ALUMNO = { nombre: "García López Ana" };

// Cambiar a false para probar estado vacío
const MOCK_TIENE_INFO = true;

const MOCK_CONTACTO = {
  departamento: "Coordinación de Servicio Social — ESCOM",
  correos: [
    { label: "Coordinación general",   valor: "servicio.social@escom.ipn.mx" },
    { label: "Seguimiento y reportes", valor: "reportes.ss@escom.ipn.mx" },
  ],
  telefonos: [
    { label: "Oficina principal",   valor: "55 5729 6000 ext. 52011" },
    { label: "Atención a alumnos", valor: "55 5729 6000 ext. 52015" },
  ],
  ubicacion: {
    edificio: "Edificio de Gobierno, Planta Baja",
    campus:   "ESCOM — Unidad Profesional Adolfo López Mateos",
    ciudad:   "Ciudad de México, CDMX",
  },
  horarios: [
    { dias: "Lunes a viernes", horario: "9:00 – 14:00 y 15:00 – 18:00" },
    { dias: "Sábados",         horario: "9:00 – 13:00 (solo trámites urgentes)" },
    { dias: "Días inhábiles",  horario: "Cerrado" },
  ],
  nota: "Para trámites documentales, se recomienda acudir en persona con identificación oficial y comprobante de inscripción vigente.",
};

export function useContactoInstitucional() {
  return {
    alumno:     ALUMNO,
    tieneInfo:  MOCK_TIENE_INFO,
    contacto:   MOCK_CONTACTO,
  };
}
