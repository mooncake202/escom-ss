import { useState } from "react";

const USUARIOS = {
  alumno:       "García López Ana",
  profesor:     "Dr. Torres Vega",
  coordinacion: "Lic. Morales Vega",
};

const MOCK_TIENE_INFO = true;

const MOCK_CONTACTO = {
  departamento: "Departamento de Extensión y Apoyos Educativos - Servicio Social",
  correos: [
    { label: "Coordinación general", valor: "ext_ae_escom@ipn.mx" },
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
  const [correos,   setCorreos]   = useState(MOCK_CONTACTO.correos);
  const [telefonos, setTelefonos] = useState(MOCK_CONTACTO.telefonos);
  const [horarios,  setHorarios]  = useState(MOCK_CONTACTO.horarios);
  const [guardado,  setGuardado]  = useState(false);

  function handleCorreoChange(i, field, value) {
    setCorreos(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
    setGuardado(false);
  }
  function handleAgregarCorreo() {
    setCorreos(prev => [...prev, { label: "", valor: "" }]);
    setGuardado(false);
  }
  function handleEliminarCorreo(i) {
    setCorreos(prev => prev.filter((_, idx) => idx !== i));
    setGuardado(false);
  }

  function handleTelefonoChange(i, field, value) {
    setTelefonos(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
    setGuardado(false);
  }
  function handleAgregarTelefono() {
    setTelefonos(prev => [...prev, { label: "", valor: "" }]);
    setGuardado(false);
  }
  function handleEliminarTelefono(i) {
    setTelefonos(prev => prev.filter((_, idx) => idx !== i));
    setGuardado(false);
  }

  function handleHorarioChange(i, field, value) {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
    setGuardado(false);
  }
  function handleAgregarHorario() {
    setHorarios(prev => [...prev, { dias: "", horario: "" }]);
    setGuardado(false);
  }
  function handleEliminarHorario(i) {
    setHorarios(prev => prev.filter((_, idx) => idx !== i));
    setGuardado(false);
  }

  function handleGuardar() {
    // TODO: llamar al endpoint de actualización
    setGuardado(true);
  }

  return {
    usuarios:  USUARIOS,
    tieneInfo: MOCK_TIENE_INFO,
    contacto:  { ...MOCK_CONTACTO, correos, telefonos, horarios },
    guardado,
    handleCorreoChange,   handleAgregarCorreo,   handleEliminarCorreo,
    handleTelefonoChange, handleAgregarTelefono, handleEliminarTelefono,
    handleHorarioChange,  handleAgregarHorario,  handleEliminarHorario,
    handleGuardar,
  };
}
