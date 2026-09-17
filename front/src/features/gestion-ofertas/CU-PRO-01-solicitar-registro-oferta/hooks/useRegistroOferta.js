import { useState } from "react";
import { apiFetch } from "@/services/apiClient";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  cuposTotal: "",
  carreras: [],
};

export function useRegistroOferta() {
  const [form, setForm]       = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

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
    if (!form.descripcion.trim()) e.descripcion = "La descripción y actividades son obligatorias.";
    const total = parseInt(form.cuposTotal, 10);
    if (!form.cuposTotal || isNaN(total) || total < 2) e.cuposTotal = "Indica un número de cupos mayor o igual a 2.";
    if (form.carreras.length === 0) e.carreras = "Selecciona al menos una carrera.";
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
          descripcion_actividades: form.descripcion,
          tipo_oferta: "proyecto",
          cupos_ofertados: parseInt(form.cuposTotal, 10),
          carreras: form.carreras,
        }),
      });
      setEnviado(true);
    } catch (err) {
      setErrores({ general: err.message || "No se pudo registrar la oferta. Intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  return { form, errores, enviado, enviando, handleChange, handleCarreraToggle, handleSubmit };
}