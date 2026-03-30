import { useState } from "react";

const COORDINACION = { nombre: "Lic. Morales Vega" };

let nextId = 4;

const ANUNCIOS_INICIALES = [
  {
    id: 1,
    titulo: "Recordatorio: entrega de reporte parcial",
    contenido: "Se les recuerda a todos los alumnos en servicio social que el reporte parcial del primer bimestre debe ser entregado a más tardar el viernes 30 de mayo de 2025. El reporte debe incluir las actividades realizadas, horas acumuladas y una breve descripción de los avances obtenidos.",
    fechaHora: "20 de mayo de 2025, 10:15",
  },
  {
    id: 2,
    titulo: "Actualización de parámetros — periodo Ene–Jun 2025",
    contenido: "Se informa que a partir del 15 de mayo de 2025, el sistema ha sido actualizado con los parámetros del periodo escolar Ene–Jun 2025. Las horas requeridas para la conclusión del servicio social se mantienen en 480 horas.",
    fechaHora: "15 de mayo de 2025, 09:00",
  },
  {
    id: 3,
    titulo: "Bienvenida al periodo de servicio social Ene–Jun 2025",
    contenido: "La Coordinación de Servicio Social da la bienvenida a todos los alumnos que inician su servicio social en este periodo. Ante cualquier duda, pueden acudir a las oficinas de coordinación en horario de 9:00 a 14:00 h.",
    fechaHora: "13 de enero de 2025, 08:30",
  },
];

const FORM_VACIO = { titulo: "", contenido: "" };

function formatFechaHora(date) {
  const fecha = date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const hora  = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha}, ${hora}`;
}

export function usePublicarAnuncios() {
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
      mostrarToast("Anuncio publicado correctamente.");
    } else {
      setAnuncios(prev => prev.map(a =>
        a.id === anuncioActivo.id
          ? { ...a, titulo: form.titulo.trim(), contenido: form.contenido.trim(), fechaHora }
          : a
      ));
      mostrarToast("Anuncio actualizado correctamente.");
    }
    cancelar();
  }

  function handleEliminar() {
    setAnuncios(prev => prev.filter(a => a.id !== anuncioActivo.id));
    mostrarToast(`"${anuncioActivo.titulo}" eliminado.`, "danger");
    cancelar();
  }

  return {
    coordinacion: COORDINACION,
    anuncios, modo, anuncioActivo, form, errores, toast,
    abrirNuevo, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  };
}
