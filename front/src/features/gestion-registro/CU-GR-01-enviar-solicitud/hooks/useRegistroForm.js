import { useEffect, useState } from "react";
import { FORM_INITIAL, STEPS } from "../utils/constants";
import { validateStep } from "../utils/validations";
import { getOfertas, postRegistro, verificarCorreoDisponible } from "@/services/registroService";
import { getPeriodos } from "@/services/registroService";

export function useRegistroForm() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState(FORM_INITIAL);
  const [errors, setErrors]           = useState({});
  const [ofertas, setOfertas]         = useState([]);
  // Distingue "todavía no llega la respuesta" de "ya llegó y viene vacía" —
  // sin esto no se puede mostrar el mensaje de 7.1 (Flujo Alterno) correcto.
  const [ofertasCargando, setOfertasCargando] = useState(true);
  const [aceptaCreditos, setAcepta]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [periodos, setPeriodos] = useState([]);

  // Carga de ofertas desde el backend
  useEffect(() => {
    getOfertas()
      .then((data) => setOfertas(data))
      .catch(() => setErrors({oferta: "Error al cargar ofertas. Recargue la página"}))
      .finally(() => setOfertasCargando(false));
  }, []);

  //carga periodos
  useEffect(() => {
  getPeriodos()
    .then(setPeriodos)
    .catch(err => console.error(err));
  }, []);


  const camposUperrcase=["nombres", "apellidos"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorFinal= camposUperrcase.includes(name) ? value.toUpperCase(): value;
    setForm(prev => ({ ...prev, [name]: valorFinal }));
  setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Punto 2: al seleccionar una oferta se revalida que siga teniendo cupo en
  // ESE momento (no solo hasta el envío final del paso 4). Si ya no lo
  // tiene, se refresca el listado de ofertas quitando la que se llenó, SIN
  // tocar ningún otro dato que el alumno ya haya llenado en el formulario.
  const seleccionarOferta = async (id) => {
    setErrors(prev => ({ ...prev, oferta: "" }));
    try {
      const ofertasFrescas = await getOfertas();
      const sigueDisponible = ofertasFrescas.some(o => o.id === Number(id));
      setOfertas(ofertasFrescas);

      if (!sigueDisponible) {
        setErrors(prev => ({ ...prev, oferta: "Esa oferta ya no tiene cupo disponible, selecciona otra." }));
        return;
      }

      setForm(prev => ({ ...prev, oferta: Number(id) }));
    } catch (err) {
      setErrors(prev => ({ ...prev, oferta: err.message }));
    }
  };

  const validate = () => {
    const errs = validateStep(step, form, aceptaCreditos);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Punto 1: al terminar el paso 1 (datos personales) se valida que el
  // correo no esté registrado, en vez de enterarse hasta el envío final.
  const next = async () => {
    if (!validate()) return;

    if (step === 0) {
      setLoading(true);
      try {
        const disponible = await verificarCorreoDisponible(form.correoInst);
        if (!disponible) {
          setErrors(prev => ({ ...prev, correoInst: "Este correo ya está registrado." }));
          return;
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, correoInst: err.message }));
        return;
      } finally {
        setLoading(false);
      }
    }

    setStep(s => s + 1);
  };

  const back = () => setStep(s => s - 1);

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await postRegistro(form);
      setSubmitted(true);
    } catch (err) {
      // Flujo Alterno 10.1: el cupo se llenó entre la selección y el envío.
      // Se compara por código, no por texto — el mensaje puede cambiar sin
      // romper este flujo.
      if (err.code === "OFERTA_SIN_CUPOS") {
        setStep(2);
        setForm(prev => ({...prev, oferta: ""}));
        getOfertas()
          .then(data => {
            setOfertas(data);
            if (data.length === 0){
            setErrors({oferta: "Lo sentimos, no hay ofertas disponibles en este momento."});
            } else {
              setErrors ({ oferta: "Lo sentimos, ese cupo se acaba de llenar. Selecciona otra oferta."});
            } 
          })
          .catch(()=> setErrors({oferta: "Error al actualizar oferta. Recarga la página."}));
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    // estado
    step, form, errors, ofertas, ofertasCargando, aceptaCreditos, periodos, submitted, loading,
    totalSteps: STEPS.length,
    // acciones
    handleChange, seleccionarOferta,
    setAcepta: (val) => { setAcepta(val); setErrors(p => ({ ...p, acepta: "" })); },
    next, back, submit,
  };




}