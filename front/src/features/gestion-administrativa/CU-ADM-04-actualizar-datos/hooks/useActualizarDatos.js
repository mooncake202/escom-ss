import { useState } from "react";

const DATOS_INSTITUCIONALES = {
  nombre:     "García López Ana",
  boleta:     "2022630001",
  carrera:    "Ingeniería en Sistemas Computacionales",
  correoInst: "agarcia0001@alumno.ipn.mx",
  creditos:   "78%",
};

const DATOS_INICIALES = {
  correoAlternativo: "ana.garcia22@outlook.com",
  telefono:          "55 1234 5678",
};

const ULTIMA_ACTUALIZACION_INICIAL = "20 de enero de 2026, 10:15";

function validarCampos(datos) {
  const e = {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telRe   = /^[\d\s\+\-\(\)]{7,20}$/;

  if (datos.correoAlternativo.trim() && !emailRe.test(datos.correoAlternativo)) {
    e.correoAlternativo = "Formato de correo inválido.";
  }

  if (!datos.telefono.trim()) {
    e.telefono = "El teléfono es obligatorio.";
  } else if (!telRe.test(datos.telefono)) {
    e.telefono = "Formato de teléfono inválido.";
  }

  return e;
}

export function useActualizarDatos() {
  const [form, setForm]         = useState(DATOS_INICIALES);
  const [errores, setErrores]   = useState({});
  const [guardado, setGuardado] = useState(false);
  const [ultimaAct, setUltimaAct] = useState(ULTIMA_ACTUALIZACION_INICIAL);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function handleCancelar() {
    setForm(DATOS_INICIALES);
    setErrores({});
    setGuardado(false);
  }

  function handleGuardar() {
    const e = validarCampos(form);
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    const ahora = new Date();
    const fechaHora = ahora.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) +
      ", " + ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUltimaAct(fechaHora);
    setGuardado(true);
    setErrores({});
  }

  return {
    datosInstitucionales: DATOS_INSTITUCIONALES,
    form, errores, guardado, ultimaAct,
    handleChange, handleCancelar, handleGuardar,
  };
}