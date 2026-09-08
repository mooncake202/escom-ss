import { useEffect, useState } from "react";
import { getOfertas, getPeriodos } from "@/services/registroService";
import { getInfoModificarSolicitud, reenviarSolicitudModificada } from "@/services/estadoSolicitudService";

const FORM_VACIO = {
  correoInst: "", correoPersonal: "", nombres: "", apellidos: "", telefono: "", boleta: "",
  carrera: "", creditos: "", semestre: "", tipoLiberacion: "",
  periodo: "", oferta: "", motivacion: "",
};

// Mismos patrones que CU-GR-01/utils/validations.js — validación de UX en
// cliente; la fuente de verdad sigue siendo el backend (reenviarSolicitudModificada
// ya reutiliza las mismas validaciones que enviarSolicitudRegistro).
const correoPersonalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefonoRegex = /^[2-9]\d{9}$/;
const nombresRegex = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)*$/;
const apellidosRegex = /^[A-ZÁÉÍÓÚÜÑ]+\s+[A-ZÁÉÍÓÚÜÑ]+$/;
const boletaRegex = /^(19|20)\d{2}63\d{4}$/;

function validarPaso(step, form, acepta) {
  const errs = {};

  if (step === 0) {
    if (form.correoPersonal && !correoPersonalRegex.test(form.correoPersonal.trim()))
      errs.correoPersonal = "Ingresa un correo válido";

    if (!form.nombres) errs.nombres = "Campo requerido";
    else if (!nombresRegex.test(form.nombres.trim().toUpperCase()))
      errs.nombres = "Ingresa un nombre válido";

    if (!form.apellidos) errs.apellidos = "Campo requerido";
    else if (!apellidosRegex.test(form.apellidos.trim().toUpperCase()))
      errs.apellidos = "Ingresa tus dos apellidos (paterno y materno)";

    if (!form.telefono) errs.telefono = "Campo requerido";
    else if (!telefonoRegex.test(form.telefono))
      errs.telefono = "Ingresa un número válido";

    if (!form.boleta) errs.boleta = "Campo requerido";
    else if (!boletaRegex.test(form.boleta))
      errs.boleta = "Ingresa una boleta válida en ESCOM";
  }

  if (step === 1) {
    if (!form.carrera) errs.carrera = "Selecciona una carrera";
    if (!form.creditos) errs.creditos = "Campo requerido";
    if (!form.semestre) errs.semestre = "Campo requerido";
    if (!form.periodo) errs.periodo = "Selecciona un periodo";

    if (form.creditos && form.semestre) {
      const creditos = Number(form.creditos);
      const semestre = Number(form.semestre);

      if (!form.tipoLiberacion) {
        if (creditos < 70) errs.creditos = "Necesitas mínimo el 70% para realizar tu servicio";
      } else if (form.tipoLiberacion === "creditos") {
        if (creditos < 60 || creditos > 70 || semestre < 6)
          errs.tipoLiberacion = "Con este dictamen tus créditos deben estar entre 60% y 70%, y debes estar en semestre 6 o superior";
      } else if (form.tipoLiberacion === "electiva") {
        if (creditos < 96.01)
          errs.tipoLiberacion = "Con este dictamen necesitas mínimo 96.01% de créditos";
      } else if (form.tipoLiberacion === "estancia") {
        if (creditos < 70) errs.creditos = "Necesitas mínimo el 70% para realizar tu servicio";
      }
    }
  }

  if (step === 2) {
    if (!form.oferta) errs.oferta = "Selecciona una oferta";
    if (!form.motivacion || form.motivacion.trim().length < 20)
      errs.motivacion = "Describe por qué deseas participar (mínimo 20 caracteres)";
  }

  if (step === 3) {
    if (!acepta) errs.acepta = "Debes declarar que la información es congruente";
  }

  return errs;
}

export function useModificarForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(FORM_VACIO);
  const [errors, setErrors] = useState({});
  const [ofertas, setOfertas] = useState([]);
  const [ofertasCargando, setOfertasCargando] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [acepta, setAceptaState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorInicial, setErrorInicial] = useState("");

  const totalSteps = 4;

  // Precarga los datos reales del alumno + catálogos al montar.
  useEffect(() => {
    getInfoModificarSolicitud()
      .then((info) => setForm((prev) => ({ ...prev, ...info })))
      .catch((err) => setErrorInicial(err.message || "No se pudo cargar tu solicitud."))
      .finally(() => setCargandoInicial(false));

    getOfertas()
      .then(setOfertas)
      .catch(() => setErrors((prev) => ({ ...prev, oferta: "Error al cargar ofertas. Recarga la página" })))
      .finally(() => setOfertasCargando(false));

    getPeriodos()
      .then(setPeriodos)
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorFinal = ["nombres", "apellidos"].includes(name) ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: valorFinal }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const seleccionarOferta = (id) => {
    setForm((prev) => ({
      ...prev,
      oferta: prev.oferta === id ? "" : id,
      motivacion: prev.oferta === id ? "" : prev.motivacion,
    }));
    setErrors((prev) => ({ ...prev, oferta: "" }));
  };

  const setAcepta = (val) => {
    setAceptaState(val);
    setErrors((prev) => ({ ...prev, acepta: "" }));
  };

  const next = () => {
    const errs = validarPaso(step, form, acepta);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const submit = async () => {
    const errs = validarPaso(3, form, acepta);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const resultado = await reenviarSolicitudModificada(form);
      const actual = JSON.parse(localStorage.getItem("usuario") || "null");
      if (actual) {
        localStorage.setItem("usuario", JSON.stringify({
          ...actual,
          estado_solicitud: resultado.estado_solicitud,
          estado_anterior: "modificar_reenviar",
        }));
      }
      return { exito: true };
    } catch (err) {
      if (err.code === "OFERTA_SIN_CUPOS") {
        setStep(2);
        setForm((prev) => ({ ...prev, oferta: "" }));
        getOfertas()
          .then((data) => {
            setOfertas(data);
            setErrors({
              oferta: data.length === 0
                ? "Lo sentimos, no hay ofertas disponibles en este momento."
                : "Lo sentimos, ese cupo se acaba de llenar. Selecciona otra oferta.",
            });
          })
          .catch(() => setErrors({ oferta: "Error al actualizar oferta. Recarga la página." }));
      } else {
        alert(err.message);
      }
      return { exito: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    step, form, errors,
    ofertas, ofertasCargando, periodos,
    acepta, loading, totalSteps,
    cargandoInicial, errorInicial,
    handleChange, seleccionarOferta, setAcepta,
    next, back, submit,
  };
}
