import { useEffect, useState } from "react";
import {
  obtenerRecursos, crearRecurso, actualizarRecurso, eliminarRecurso,
} from "@/services/recursosService";

// CU-ADM-05 — Coordinación administra los recursos. Datos reales, sin mocks.
//
// El modelo NO tiene categoría y la interfaz tampoco la usa: el formulario es título + URL.
// No se suben archivos; solo se administra el enlace.

export const MAX_NOMBRE = 150; // recurso.nombre VarChar(150); el backend lo revalida
export const MAX_URL = 500;    // recurso.url    VarChar(500)

const FORM_VACIO = { nombre: "", url: "", tipo: "" };

/** "15 de enero de 2026" — la fecha llega en ISO desde el backend. */
export function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export function useGestionarRecursos() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [recursos, setRecursos] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState({});
  const [intento, setIntento] = useState(0);

  const [modo, setModo] = useState(null); // "agregar" | "editar" | "eliminar" | null
  const [recursoActivo, setRecursoActivo] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let vigente = true;
    obtenerRecursos().then(
      (r) => { if (vigente) { setRecursos(r.recursos); setTiposDisponibles(r.tiposDisponibles || {}); setCarga({ estado: "listo", error: null }); } },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  }

  // Validación de cortesía: el backend vuelve a comprobar todo, incluido el esquema de la URL.
  function validar() {
    const e = {};
    const nombre = form.nombre.trim();
    const url = form.url.trim();

    if (!nombre) e.nombre = "El título del recurso es obligatorio.";
    else if (nombre.length > MAX_NOMBRE) e.nombre = `El título no puede pasar de ${MAX_NOMBRE} caracteres.`;

    if (!url) e.url = "La URL es obligatoria.";
    else if (url.length > MAX_URL) e.url = `La URL no puede pasar de ${MAX_URL} caracteres.`;
    else if (!/^https?:\/\//i.test(url)) e.url = "La URL debe comenzar con http:// o https://";

    return e;
  }

  function abrirAgregar() {
    setForm(FORM_VACIO);
    setErrores({});
    setRecursoActivo(null);
    setModo("agregar");
  }

  function abrirEditar(recurso) {
    setForm({ nombre: recurso.nombre, url: recurso.url, tipo: recurso.tipo || "" });
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

  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre);

  async function handleGuardar() {
    if (enviando) return;
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    const datos = { nombre: form.nombre.trim(), url: form.url.trim(), tipo: form.tipo || null };
    setEnviando(true);
    try {
      if (modo === "agregar") {
        const { recurso } = await crearRecurso(datos);
        setRecursos((prev) => [...prev, recurso].sort(porNombre));
        mostrarToast("Recurso agregado correctamente.");
      } else {
        const { recurso } = await actualizarRecurso(recursoActivo.id, datos);
        setRecursos((prev) => prev.map((r) => (r.id === recurso.id ? recurso : r)).sort(porNombre));
        mostrarToast("Recurso actualizado correctamente.");
      }
      cancelar();
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar() {
    if (enviando) return;
    setEnviando(true);
    try {
      await eliminarRecurso(recursoActivo.id);
      setRecursos((prev) => prev.filter((r) => r.id !== recursoActivo.id));
      mostrarToast(`"${recursoActivo.nombre}" eliminado.`, "danger");
      cancelar();
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return {
    carga, recargar,
    recursos, tiposDisponibles, modo, recursoActivo, form, errores, enviando, toast,
    abrirAgregar, abrirEditar, abrirEliminar,
    cancelar, handleChange, handleGuardar, handleEliminar,
  };
}

// ── Vista de consulta (alumno asignado y profesor) ──────────────────────────

/**
 * Solo lectura: la misma lista que administra Coordinación, sin acciones. La comparten el alumno
 * asignado y el profesor, porque el backend devuelve lo mismo para ambos.
 */
export function useRecursosConsulta() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [recursos, setRecursos] = useState([]);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerRecursos().then(
      (r) => { if (vigente) { setRecursos(r.recursos); setCarga({ estado: "listo", error: null }); } },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  return { carga, recargar, recursos };
}
