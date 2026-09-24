import { useEffect, useState } from "react";
import { obtenerPerfilProfesor, actualizarPerfilProfesor } from "@/services/perfilService";

// Datos reales del profesor. Solo horario de atención y teléfono personal son editables; nombre,
// correo institucional, cubículo y departamento los administra Coordinación y el backend los ignora
// aunque se enviaran a mano.
//
// No se muestra "última actualización" ni ID de empleado: ninguno existe en el schema.

const TELEFONO_RE = /^\d{10}$/; // mismo criterio que validarTelefono en el backend
const HORARIO_MAX = 100;

const VACIO = { horario_atencion: "", telefono_personal: "" };

function validar(form) {
  const e = {};
  if (!form.horario_atencion.trim()) {
    e.horario_atencion = "El horario de atención es obligatorio.";
  } else if (form.horario_atencion.trim().length > HORARIO_MAX) {
    e.horario_atencion = `El horario de atención no puede superar ${HORARIO_MAX} caracteres.`;
  }

  if (!form.telefono_personal.trim()) {
    e.telefono_personal = "El teléfono personal es obligatorio.";
  } else if (!TELEFONO_RE.test(form.telefono_personal.trim())) {
    e.telefono_personal = "El teléfono debe tener exactamente 10 dígitos numéricos.";
  }
  return e;
}

export function useActualizarDatosProfesor() {
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
    obtenerPerfilProfesor().then(
      (p) => {
        if (!vigente) return;
        const editables = {
          horario_atencion: p.editables.horarioAtencion,
          telefono_personal: p.editables.telefonoPersonal,
        };
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
      const r = await actualizarPerfilProfesor({
        horario_atencion: form.horario_atencion.trim(),
        telefono_personal: form.telefono_personal.trim(),
      });
      const editables = {
        horario_atencion: r.perfil.editables.horarioAtencion,
        telefono_personal: r.perfil.editables.telefonoPersonal,
      };
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

  const hayCambios = form.horario_atencion !== guardados.horario_atencion
    || form.telefono_personal !== guardados.telefono_personal;

  return {
    carga, recargar,
    institucionales,
    form, errores, guardando, guardado, hayCambios,
    handleChange, handleCancelar, handleGuardar,
  };
}
