import { useState } from "react";

const DATOS_INSTITUCIONALES = {
  nombre:      "Torres Vega Rafael",
  correo:      "torres.vega@escom.ipn.mx",
  cubiculo:    "Edificio de Cómputo, planta baja, CB-03",
  departamento: "Departamento de Sistemas Computacionales",
};

const DATOS_INICIALES = {
  horarioAtencion: "Lunes y miércoles, 10:00–12:00 h",
  telefonoPersonal: "55 5729-6000 ext. 52101",
};

const ULTIMA_ACTUALIZACION_INICIAL = "20 de enero de 2026, 10:15";

function validarCampos(datos) {
  const e = {};
  const telRe = /^[\d\s\+\-\(\)]{7,20}$/;

  if (!datos.horarioAtencion.trim())
    e.horarioAtencion = "El horario de atención es obligatorio.";

  if (datos.telefonoPersonal.trim() && !telRe.test(datos.telefonoPersonal))
    e.telefonoPersonal = "Formato de teléfono inválido.";

  return e;
}

export function useActualizarDatosProfesor() {
  const [form, setForm]           = useState(DATOS_INICIALES);
  const [errores, setErrores]     = useState({});
  const [guardado, setGuardado]   = useState(false);
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
