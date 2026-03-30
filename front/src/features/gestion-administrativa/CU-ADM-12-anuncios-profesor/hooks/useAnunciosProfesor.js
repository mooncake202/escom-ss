import { useState } from "react";

// false → muestra empty state "sin alumnos asignados"
const MOCK_TIENE_ALUMNOS = true;

const PROFESOR = { nombre: "Dr. Torres Vega" };

const ALUMNOS_ASIGNADOS = [
  { id: 1, nombre: "García López Ana",      boleta: "2022630001" },
  { id: 2, nombre: "Hernández Ruiz Carlos", boleta: "2021630042" },
  { id: 3, nombre: "Martínez Soto Diana",   boleta: "2022630078" },
];

let nextId = 4;

const ANUNCIOS_INICIALES = [
  {
    id: 1,
    titulo: "Sesión de seguimiento — semana del 19 de mayo",
    contenido:
      "Les informo que tendremos una sesión de seguimiento el próximo miércoles 21 de mayo a las 11:00 h en el cubículo CB-03. Es importante que traigan su bitácora actualizada y tengan listo el avance de las actividades asignadas para revisión.",
    fechaHora: "18 de mayo de 2025, 14:30",
  },
  {
    id: 2,
    titulo: "Cambio en el formato de bitácora semanal",
    contenido:
      "A partir de esta semana, las bitácoras deben incluir una sección adicional de 'dificultades encontradas' y 'soluciones aplicadas'. Esto permitirá llevar un mejor registro del proceso de aprendizaje. El nuevo formato ya está disponible en el sistema.",
    fechaHora: "10 de mayo de 2025, 09:45",
  },
  {
    id: 3,
    titulo: "Recordatorio: entrega de avance de proyecto",
    contenido:
      "Les recuerdo que el avance parcial del proyecto debe estar documentado en el sistema antes del viernes. Revisen que sus actividades estén registradas correctamente y el acumulado de horas esté actualizado.",
    fechaHora: "5 de mayo de 2025, 11:00",
  },
];

const FORM_VACIO = { titulo: "", contenido: "" };

function formatFechaHora(date) {
  const fecha = date.toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric",
  });
  const hora = date.toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return `${fecha}, ${hora}`;
}

export function useAnunciosProfesor() {
  const [anuncios, setAnuncios]           = useState(ANUNCIOS_INICIALES);
  const [modo, setModo]                   = useState(null); // "nuevo" | "editar" | "eliminar" | null
  const [anuncioActivo, setAnuncioActivo] = useState(null);
  const [form, setForm]                   = useState(FORM_VACIO);
  const [errores, setErrores]             = useState({});
  const [toast, setToast]                 = useState(null);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function validar() {
    const e = {};
    if (!form.titulo.trim())    e.titulo    = "El título del anuncio es obligatorio.";
    if (!form.contenido.trim()) e.contenido = "El contenido del anuncio es obligatorio.";
    return e;
  }

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setErrores({});
    setAnuncioActivo(null);
    setModo("nuevo");
  }

  function abrirEditar(a) {
    setForm({ titulo: a.titulo, contenido: a.contenido });
    setErrores({});
    setAnuncioActivo(a);
    setModo("editar");
  }

  function abrirEliminar(a) {
    setAnuncioActivo(a);
    setModo("eliminar");
  }

  function cancelar() {
    setModo(null);
    setAnuncioActivo(null);
    setForm(FORM_VACIO);
    setErrores({});
  }

  function handleGuardar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    const fechaHora = formatFechaHora(new Date());
    if (modo === "nuevo") {
      setAnuncios(prev => [
        { id: nextId++, titulo: form.titulo.trim(), contenido: form.contenido.trim(), fechaHora },
        ...prev,
      ]);
      mostrarToast("Anuncio publicado. Tus alumnos ya pueden verlo.");
    } else {
      setAnuncios(prev =>
        prev.map(a =>
          a.id === anuncioActivo.id
            ? { ...a, titulo: form.titulo.trim(), contenido: form.contenido.trim(), fechaHora }
            : a
        )
      );
      mostrarToast("Anuncio actualizado correctamente.");
    }
    cancelar();
  }

  function handleEliminar() {
    setAnuncios(prev => prev.filter(a => a.id !== anuncioActivo.id));
    mostrarToast(`"${anuncioActivo.titulo}" eliminado. Ya no es visible para tus alumnos.`, "danger");
    cancelar();
  }

  return {
    profesor:       PROFESOR,
    tieneAlumnos:   MOCK_TIENE_ALUMNOS,
    alumnosAsignados: ALUMNOS_ASIGNADOS,
    anuncios, modo, anuncioActivo, form, errores, toast,
    abrirNuevo, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  };
}
