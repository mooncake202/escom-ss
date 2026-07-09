import { useState } from "react";
import { addOferta } from "../../ofertasStore";

const FORM_VACIO = {
  nombre: "",
  tituloSISS: "",
  descripcion: "",
};

export function useOfertaIndividual() {
  const [form, setForm]                 = useState(FORM_VACIO);
  const [perfilesDeseados, setPerfiles] = useState([]);
  const [errores, setErrores]           = useState({});
  const [enviado, setEnviado]           = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function toggleCarrera(key) {
    setPerfiles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function validar() {
    const e = {};
    if (!form.nombre.trim())      e.nombre      = "El nombre de la oferta es obligatorio.";
    if (!form.tituloSISS.trim())  e.tituloSISS  = "El título para plataforma SISS es obligatorio.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    return e;
  }

  function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    // Future: await api.registrarOferta({ tipo: "individual", ... })
    addOferta({
      tipo: "individual",
      titulo: form.nombre,
      tituloSISS: form.tituloSISS,
      descripcion: form.descripcion,
      cupos: 1,
      carreras: perfilesDeseados,
    });
    setEnviado(true);
  }

  return { form, perfilesDeseados, errores, enviado, handleChange, toggleCarrera, handleSubmit };
}