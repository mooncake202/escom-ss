import { useState } from "react";

const COORDINACION = { nombre: "Lic. Morales Vega" };

let nextId = 6;

const RECURSOS_INICIALES = [
  { id: 1, nombre: "Formato de solicitud de servicio social",  url: "https://www.escom.ipn.mx/formatos/solicitud-ss.pdf",       categoria: "Formatos",                   ultimaActualizacion: "15 de enero de 2026" },
  { id: 2, nombre: "Guía de llenado del formato SISS",          url: "https://www.escom.ipn.mx/guias/siss.pdf",                  categoria: "Guías",                      ultimaActualizacion: "10 de febrero de 2026" },
  { id: 3, nombre: "Carta compromiso alumno",                    url: "https://www.escom.ipn.mx/formatos/carta-compromiso.pdf",   categoria: "Documentos institucionales", ultimaActualizacion: "20 de diciembre de 2025" },
  { id: 4, nombre: "Plantilla de reporte mensual",               url: "https://www.escom.ipn.mx/plantillas/reporte-mensual.docx", categoria: "Plantillas",                 ultimaActualizacion: "5 de enero de 2026" },
  { id: 5, nombre: "Reglamento de servicio social ESCOM",        url: "https://www.escom.ipn.mx/reglamentos/ss.pdf",              categoria: "Documentos institucionales", ultimaActualizacion: "1 de octubre de 2025" },
];

const FORM_VACIO = { nombre: "", url: "" };

function formatFecha(date) {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export function useGestionarRecursos() {
  const [recursos, setRecursos]           = useState(RECURSOS_INICIALES);
  const [modo, setModo]                   = useState(null); // "agregar" | "editar" | "eliminar" | null
  const [recursoActivo, setRecursoActivo] = useState(null);
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
    if (!form.nombre.trim()) e.nombre = "El título del recurso es obligatorio.";
    if (!form.url.trim())    e.url    = "La URL es obligatoria.";
    return e;
  }

  function abrirAgregar() {
    setForm(FORM_VACIO);
    setErrores({});
    setRecursoActivo(null);
    setModo("agregar");
  }

  function abrirEditar(recurso) {
    setForm({ nombre: recurso.nombre, url: recurso.url || "" });
    setErrores({});
    setRecursoActivo(recurso);
    setModo("editar");
  }

  function abrirEliminar(recurso) {
    setRecursoActivo(recurso);
    setModo("eliminar");
  }

  function cancelar() {
    setModo(null);
    setRecursoActivo(null);
    setForm(FORM_VACIO);
    setErrores({});
  }

  function handleGuardar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    const fecha = formatFecha(new Date());
    if (modo === "agregar") {
      setRecursos(prev => [{ id: nextId++, nombre: form.nombre.trim(), url: form.url.trim(), ultimaActualizacion: fecha }, ...prev]);
      mostrarToast("Recurso agregado correctamente.");
    } else {
      setRecursos(prev => prev.map(r => r.id === recursoActivo.id
        ? { ...r, nombre: form.nombre.trim(), url: form.url.trim(), ultimaActualizacion: fecha }
        : r
      ));
      mostrarToast("Recurso actualizado correctamente.");
    }
    cancelar();
  }

  function handleEliminar() {
    setRecursos(prev => prev.filter(r => r.id !== recursoActivo.id));
    mostrarToast(`"${recursoActivo.nombre}" eliminado.`, "danger");
    cancelar();
  }

  return {
    coordinacion: COORDINACION,
    recursos, modo, recursoActivo, form, errores, toast,
    abrirAgregar, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  };
}
