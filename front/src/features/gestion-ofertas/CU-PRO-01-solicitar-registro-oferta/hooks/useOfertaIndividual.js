import { useState } from "react";
import { apiFetch } from "@/services/apiClient";

const FORM_VACIO = {
  nombre: "",
  tituloSISS: "",
  programaSISS: "",
  descripcion: "",
};

export function useOfertaIndividual() {
  const [form, setForm]                 = useState(FORM_VACIO);
  const [perfilesDeseados, setPerfiles] = useState([]);
  const [errores, setErrores]           = useState({});
  const [enviado, setEnviado]           = useState(false);
  const [enviando, setEnviando]         = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function toggleCarrera(key) {
    setPerfiles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    if (errores.carreras) setErrores(prev => ({ ...prev, carreras: null }));
  }

  function validar() {
    const e = {};
    if (!form.nombre.trim())      e.nombre      = "El nombre de la oferta es obligatorio.";
    if (!form.tituloSISS.trim())  e.tituloSISS  = "La Actividad SISS es obligatorio.";
    if (!form.programaSISS.trim()) e.programaSISS = "El programa SISS es obligatorio.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (perfilesDeseados.length === 0) e.carreras = "Selecciona al menos una carrera.";
    return e;
  }

  async function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setEnviando(true);
    try {
      await apiFetch("/ofertas", {
        method: "POST",
        body: JSON.stringify({
          nombre_proyecto: form.nombre,
          nombre_SISS: form.tituloSISS,
          programa_SISS: form.programaSISS,
          descripcion_actividades: form.descripcion,
          tipo_oferta: "individual",
          carreras: perfilesDeseados,
        }),
      });
      setEnviado(true);
    } catch (err) {
      setErrores({ general: err.message || "No se pudo registrar la oferta. Intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  return { form, perfilesDeseados, errores, enviado, enviando, handleChange, toggleCarrera, handleSubmit };
}