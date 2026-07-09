import { useState } from "react";

const MOCKS = {
  coordinacion: {
    usuario: { nombre: "Lic. Morales Vega" },
    tieneAlumnos: null,
    alumnosAsignados: [],
    anunciosIniciales: [
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
    ],
    toastNuevo:    "Anuncio publicado correctamente.",
    toastEditar:   "Anuncio actualizado correctamente.",
    toastEliminar: (titulo) => `"${titulo}" eliminado.`,
  },
  profesor: {
    usuario: { nombre: "Dr. Torres Vega" },
    tieneAlumnos: true,
    alumnosAsignados: [
      { id: 1, nombre: "García López Ana",      boleta: "2022630001" },
      { id: 2, nombre: "Hernández Ruiz Carlos", boleta: "2021630042" },
      { id: 3, nombre: "Martínez Soto Diana",   boleta: "2022630078" },
    ],
    anunciosIniciales: [
      {
        id: 1,
        titulo: "Sesión de seguimiento — semana del 19 de mayo",
        contenido: "Les informo que tendremos una sesión de seguimiento el próximo miércoles 21 de mayo a las 11:00 h en el cubículo CB-03. Es importante que traigan su bitácora actualizada y tengan listo el avance de las actividades asignadas para revisión.",
        fechaHora: "18 de mayo de 2025, 14:30",
      },
      {
        id: 2,
        titulo: "Cambio en el formato de bitácora semanal",
        contenido: "A partir de esta semana, las bitácoras deben incluir una sección adicional de 'dificultades encontradas' y 'soluciones aplicadas'. Esto permitirá llevar un mejor registro del proceso de aprendizaje. El nuevo formato ya está disponible en el sistema.",
        fechaHora: "10 de mayo de 2025, 09:45",
      },
      {
        id: 3,
        titulo: "Recordatorio: entrega de avance de proyecto",
        contenido: "Les recuerdo que el avance parcial del proyecto debe estar documentado en el sistema antes del viernes. Revisen que sus actividades estén registradas correctamente y el acumulado de horas esté actualizado.",
        fechaHora: "5 de mayo de 2025, 11:00",
      },
    ],
    toastNuevo:    "Anuncio publicado. Tus alumnos ya pueden verlo.",
    toastEditar:   "Anuncio actualizado correctamente.",
    toastEliminar: (titulo) => `"${titulo}" eliminado. Ya no es visible para tus alumnos.`,
  },
};

let nextId = 4;

const FORM_VACIO = { titulo: "", contenido: "" };

function formatFechaHora(date) {
  const fecha = date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const hora  = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha}, ${hora}`;
}

export function usePublicarAnuncios(rol) {
  const mock = MOCKS[rol];

  const [anuncios, setAnuncios]           = useState(mock.anunciosIniciales);
  const [modo, setModo]                   = useState(null);
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
      mostrarToast(mock.toastNuevo);
    } else {
      setAnuncios(prev => prev.map(a =>
        a.id === anuncioActivo.id
          ? { ...a, titulo: form.titulo.trim(), contenido: form.contenido.trim(), fechaHora }
          : a
      ));
      mostrarToast(mock.toastEditar);
    }
    cancelar();
  }

  function handleEliminar() {
    mostrarToast(mock.toastEliminar(anuncioActivo.titulo), "danger");
    setAnuncios(prev => prev.filter(a => a.id !== anuncioActivo.id));
    cancelar();
  }

  return {
    usuario:          mock.usuario,
    tieneAlumnos:     mock.tieneAlumnos,
    alumnosAsignados: mock.alumnosAsignados,
    anuncios, modo, anuncioActivo, form, errores, toast,
    abrirNuevo, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  };
}
