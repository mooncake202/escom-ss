const USUARIOS = {
  alumno:       "García López Ana",
  profesor:     "Dr. Torres Vega",
  coordinacion: "Lic. Morales Vega",
};

// Cambiar a false para probar estado vacío
const MOCK_TIENE_INFO = true;

const MOCK_CONTACTO = {
  departamento: "Departamento de Extensión y Apoyos Educativos - Servicio Social",
  correos: [
    { label: "Coordinación general",   valor: "ext_ae_escom@ipn.mx" },
  ],
  telefonos: [
    { label: "Oficina principal",   valor: "55 5729 6000 ext. 52053" },
    { label: "Atención a alumnos", valor: "55 5729 6000 ext. 52056" },
  ],
  ubicacion: {
    edificio: "Edificio de Gobierno, Planta Alta",
    campus:   "ESCOM — Unidad Profesional Adolfo López Mateos",
    ciudad:   "Ciudad de México, CDMX",
  },
  horarios: [
    { dias: "Lunes a viernes", horario: "9:00 – 15:00 y 17:00 – 20:00" },
  ],
  nota: "Para trámites documentales, se recomienda acudir en persona con identificación institucional.",
};

export function useContactoInstitucional() {
  return {
    usuarios:  USUARIOS,
    tieneInfo: MOCK_TIENE_INFO,
    contacto:  MOCK_CONTACTO,
  };
}
