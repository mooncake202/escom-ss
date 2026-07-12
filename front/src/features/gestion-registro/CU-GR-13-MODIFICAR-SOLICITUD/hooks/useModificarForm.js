import { useState, useEffect } from "react";

// ── Datos en duro (reemplazar por llamadas a API) ─────────────
const ALUMNO_PRECARGADO = {
  correoInst:      "a2023630123@alumno.ipn.mx",
  correoPersonal:  "david.sixtos@gmail.com",
  nombres:         "DAVID",
  apellidos:       "SIXTOS HERNÁNDEZ",
  telefono:        "5512345678",
  boleta:          "2023630123",
  carrera:         "ISC",
  creditos:        "68",
  semestre:        "6",
  periodo:         "1",
  tipoLiberacion:  "",
  oferta:          "",
  motivacion:      "",
  password:        "**********", // solo display, no editable
};

const MOTIVO_RECHAZO =
  "El alumno no cumplía con el 70% de créditos requerido al momento de la solicitud. " +
  "Se requiere actualizar la constancia de créditos vigente antes de reenviar.";

const OFERTAS_MOCK = [
  {
    id: 1,
    titulo: "Desarrollo de herramientas educativas",
    profesor: "Dr. Ramírez López",
    descripcion: "Apoyo en el desarrollo de plataformas y recursos digitales para uso académico.",
    actividades: "Programación web, diseño de interfaces, pruebas.",
    cuposDisponibles: 5,
    perfiles: "ISC,IA",
  },
  {
    id: 2,
    titulo: "Análisis de datos de salud pública",
    profesor: "Dra. Torres Méndez",
    descripcion: "Procesamiento y visualización de datasets del sector salud.",
    actividades: "Python, pandas, visualizaciones, reportes.",
    cuposDisponibles: 2,
    perfiles: "LCD,IA",
  },
  {
    id: 3,
    titulo: "Mantenimiento de infraestructura de red",
    profesor: "Ing. Castillo Vera",
    descripcion: "Soporte técnico y monitoreo de equipos de red institucionales.",
    actividades: "Configuración de switches, documentación, soporte.",
    cuposDisponibles: 4,
    perfiles: "ISD,ISC",
  },
];

const PERIODOS_MOCK = [
  { id: 1, fechaInicio: "2025-02-03T00:00:00", fechaFin: "2025-07-31T00:00:00" },
  { id: 2, fechaInicio: "2025-08-18T00:00:00", fechaFin: "2026-01-30T00:00:00" },
];

// ── Validaciones por paso ─────────────────────────────────────
function validarPaso(step, form, acepta) {
  const errs = {};

  if (step === 0) {
    if (!form.correoPersonal) errs.correoPersonal = "El correo personal es requerido";
    if (!form.nombres)        errs.nombres        = "El nombre es requerido";
    if (!form.apellidos)      errs.apellidos      = "Los apellidos son requeridos";
    if (!form.telefono || form.telefono.replace(/\D/g, "").length < 10)
      errs.telefono = "Ingresa un número de 10 dígitos";
    if (!form.boleta) errs.boleta = "La boleta es requerida";
  }

  if (step === 1) {
    if (!form.carrera)  errs.carrera  = "Selecciona una carrera";
    if (!form.creditos) errs.creditos = "Ingresa el porcentaje de créditos";
    if (!form.semestre) errs.semestre = "Ingresa el semestre actual";
    if (!form.periodo)  errs.periodo  = "Selecciona un periodo";
  }

  if (step === 2) {
    if (!form.oferta)    errs.oferta    = "Debes seleccionar una oferta";
    if (form.oferta && !form.motivacion)
      errs.motivacion = "Escribe tu motivación para esta oferta";
  }

  if (step === 3) {
    if (!acepta) errs.acepta = "Debes declarar que la información es congruente";
  }

  return errs;
}

// ── Hook ──────────────────────────────────────────────────────
export function useModificarForm() {
  const [screen,   setScreen]   = useState("reject"); // "reject" | "form"
  const [step,     setStep]     = useState(0);
  const [form,     setForm]     = useState(ALUMNO_PRECARGADO);
  const [errors,   setErrors]   = useState({});
  const [ofertas,  setOfertas]  = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [acepta,   setAcepta]   = useState(false);
  const [submitted,setSubmitted]= useState(false);
  const [loading,  setLoading]  = useState(false);

  const totalSteps = 4;

  // Cargar ofertas y periodos al montar
  useEffect(() => {
    fetch("http://localhost:3000/ofertas")
      .then(r => r.json())
      .then(data => setOfertas(data))
      .catch(() => setOfertas(OFERTAS_MOCK));

    fetch("http://localhost:3000/periodos")
      .then(r => r.json())
      .then(data => setPeriodos(data))
      .catch(() => setPeriodos(PERIODOS_MOCK));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const seleccionarOferta = (id) => {
    setForm(prev => ({ ...prev, oferta: prev.oferta === id ? "" : id, motivacion: prev.oferta === id ? "" : prev.motivacion }));
    if (errors.oferta) setErrors(prev => { const n = { ...prev }; delete n.oferta; return n; });
  };

  const iniciarModificacion = () => {
    setScreen("form");
    setStep(0);
  };

  const next = () => {
    const errs = validarPaso(step, form, acepta);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const submit = async () => {
    const errs = validarPaso(3, form, acepta);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      // Verificar que la oferta sigue teniendo cupos antes de enviar
      const ofertaActual = ofertas.find(o => String(o.id) === String(form.oferta));
      if (!ofertaActual || ofertaActual.cuposDisponibles < 1) {
        setErrors({ oferta: "La oferta seleccionada ya no tiene cupos. Por favor elige otra." });
        setStep(2);
        setLoading(false);
        return;
      }

      await fetch("http://localhost:3000/solicitudes/modificar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          aceptaCongruencia: acepta,
          estadoSolicitud: "Pendiente de respuesta del profesor",
        }),
      });

      setSubmitted(true);
    } catch {
      // En demo sin backend, igual marca como enviado
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    // estado
    screen, step, form, errors,
    ofertas, periodos,
    acepta, submitted, loading, totalSteps,
    motivoRechazo: MOTIVO_RECHAZO,
    // acciones
    handleChange, seleccionarOferta,
    setAcepta,
    iniciarModificacion,
    next, back, submit,
  };
}
