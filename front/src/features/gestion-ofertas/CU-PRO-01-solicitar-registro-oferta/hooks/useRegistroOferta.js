import { useState } from "react";
import { addOferta } from "../../ofertasStore";

const FORM_VACIO = {
  nombre: "",
  tituloSISS: "",
  descripcion: "",
  actividades: "",
  cuposTotal: "",
  carreras: [],
};

export function useRegistroOferta() {
  const [form, setForm]       = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function handleCarreraToggle(key) {
    setForm(prev => {
      const next = prev.carreras.includes(key)
        ? prev.carreras.filter(c => c !== key)
        : [...prev.carreras, key];
      return { ...prev, carreras: next };
    });
    if (errores.carreras) setErrores(prev => ({ ...prev, carreras: null }));
  }

  function validar() {
    const e = {};
    if (!form.nombre.trim())      e.nombre      = "El nombre del proyecto es obligatorio.";
    if (!form.tituloSISS.trim())  e.tituloSISS  = "El título para plataforma SISS es obligatorio.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!form.actividades.trim()) e.actividades = "Las actividades a realizar son obligatorias.";
    const total = parseInt(form.cuposTotal, 10);
    if (!form.cuposTotal || isNaN(total) || total <= 0) e.cuposTotal = "Indica un número de cupos mayor a cero.";
    else if (total > 5) e.cuposTotal = "El máximo permitido es 5 cupos.";
    if (form.carreras.length === 0) e.carreras = "Selecciona al menos una carrera.";
    return e;
  }

  function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    // Future: await api.registrarOferta({ tipo: "proyecto", ... })
    addOferta({
      tipo: "proyecto",
      titulo: form.nombre,
      tituloSISS: form.tituloSISS,
      descripcion: form.descripcion,
      cupos: parseInt(form.cuposTotal, 10),
      carreras: form.carreras,
    });
    setEnviado(true);
  }

  return { form, errores, enviado, handleChange, handleCarreraToggle, handleSubmit };
}