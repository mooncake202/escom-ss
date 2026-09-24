import { useEffect, useState } from "react";
import { obtenerPerfilAlumno, actualizarPerfilAlumno } from "@/services/perfilService";

// Datos reales del alumno. Solo correo personal y celular son editables; boleta, carrera, créditos,
// semestre, nombre y correo institucional son institucionales y el backend los ignora aunque se
// enviaran a mano.
//
// No se muestra "última actualización": el schema no guarda esa marca para alumno ni profesor.

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CELULAR_RE = /^\d{10}$/; // mismo criterio que validarTelefono en el backend

const VACIO = { correo_personal: "", celular: "" };

function validar(form) {
  const e = {};
  if (!form.correo_personal.trim()) {
    e.correo_personal = "El correo personal es obligatorio.";
  } else if (!CORREO_RE.test(form.correo_personal.trim())) {
    e.correo_personal = "Formato de correo inválido.";
  } else if (form.correo_personal.trim().length > 50) {
    e.correo_personal = "El correo personal no puede superar 50 caracteres.";
  }

  if (!form.celular.trim()) {
    e.celular = "El celular es obligatorio.";
  } else if (!CELULAR_RE.test(form.celular.trim())) {
    e.celular = "El celular debe tener exactamente 10 dígitos numéricos.";
  }
  return e;
}

export function useActualizarDatos() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [institucionales, setInstitucionales] = useState(null);
  const [guardados, setGuardados] = useState(VACIO); // últimos valores confirmados por el backend
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    obtenerPerfilAlumno().then(
      (p) => {
        if (!vigente) return;
        const editables = { correo_personal: p.editables.correoPersonal, celular: p.editables.celular };
        setInstitucionales(p.institucionales);
        setGuardados(editables);
        setForm(editables);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const recargar = () => setIntento((n) => n + 1);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setGuardado(false);
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  }

  // Cancelar vuelve a lo último confirmado por el servidor, no a un valor cableado.
  function handleCancelar() {
    setForm(guardados);
    setErrores({});
    setGuardado(false);
  }

  async function handleGuardar() {
    if (guardando) return;
    const e = validar(form);
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setGuardando(true);
    setErrores({});
    try {
      const r = await actualizarPerfilAlumno({
        correo_personal: form.correo_personal.trim(),
        celular: form.celular.trim(),
      });
      const editables = { correo_personal: r.perfil.editables.correoPersonal, celular: r.perfil.editables.celular };
      setGuardados(editables);
      setForm(editables);
      setGuardado(true);
    } catch (err) {
      // El backend revalida todo: su mensaje es el que manda.
      setErrores({ envio: err.message });
    } finally {
      setGuardando(false);
    }
  }

  const hayCambios = form.correo_personal !== guardados.correo_personal || form.celular !== guardados.celular;

  return {
    carga, recargar,
    institucionales,
    form, errores, guardando, guardado, hayCambios,
    handleChange, handleCancelar, handleGuardar,
  };
}
