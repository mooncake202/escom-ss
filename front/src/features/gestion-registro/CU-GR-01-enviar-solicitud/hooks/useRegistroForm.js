import { useEffect, useState } from "react";
import { FORM_INITIAL, STEPS } from "../utils/constants";
import { validateStep } from "../utils/validations";
import { getOfertas, postRegistro } from "@/services/registroService";
import { getPeriodos } from "@/services/registroService";

export function useRegistroForm() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState(FORM_INITIAL);
  const [errors, setErrors]           = useState({});
  const [ofertas, setOfertas]         = useState([]);
  const [aceptaCreditos, setAcepta]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [periodos, setPeriodos] = useState([]);

  // Carga de ofertas desde el backend
  useEffect(() => {
    getOfertas()
      .then(setOfertas)
      .catch(() => setErrors({oferta: "Error al cargar ofertas. Recargue la página"}));
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




  const seleccionarOferta = (id) => {
    setForm(prev => ({ ...prev, oferta: Number(id) }));
    setErrors(prev => ({ ...prev, oferta: "" }));
  };

  const validate = () => {
    const errs = validateStep(step, form, aceptaCreditos);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await postRegistro(form);
      setSubmitted(true);
    } catch (err) {
      //el error es de cupos?
      if(err.message==="Lo sentimos, el cupo se acaba de llenar"){
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
    step, form, errors, ofertas, aceptaCreditos, periodos, submitted, loading,
    totalSteps: STEPS.length,
    // acciones
    handleChange, seleccionarOferta,
    setAcepta: (val) => { setAcepta(val); setErrors(p => ({ ...p, acepta: "" })); },
    next, back, submit,
  };




}
