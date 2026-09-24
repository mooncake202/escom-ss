import { useEffect, useState } from "react";
import { obtenerMisAnuncios, publicarAnuncio } from "@/services/anunciosService";
import { obtenerMisAlumnos } from "@/services/usuariosAsignadosService";

// CU-ADM-07 — publicar anuncios. Datos reales, sin mocks.
//
// NO hay editar ni eliminar: un anuncio publicado es registro histórico.
// NO se eligen destinatarios: el alcance lo deriva el backend de las asignaciones vigentes.
//   profesor    → todos sus alumnos asignados
//   coordinación→ todos los alumnos asignados
//
// El autor y el origen los pone el backend a partir del token: aquí solo viajan título y contenido.

const FORM_VACIO = { titulo: "", contenido: "" };
export const MAX_TITULO = 150; // anuncio.titulo es VarChar(150); el backend lo revalida

export function usePublicarAnuncios(rol) {
  const esProfesor = rol === "profesor";

  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [anuncios, setAnuncios] = useState([]);
  const [alcance, setAlcance] = useState(null);   // nº de alumnos (solo profesor)
  const [alumnos, setAlumnos] = useState([]);     // para la barra "Visible para" del profesor
  const [intento, setIntento] = useState(0);

  const [modo, setModo] = useState(null);         // null | 'nuevo'
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let vigente = true;

    // El historial es lo esencial. La lista de alumnos solo alimenta la barra de alcance del
    // profesor, así que si falla no se rompe la pantalla: se cae al conteo que da el backend.
    const peticiones = esProfesor
      ? [obtenerMisAnuncios(), obtenerMisAlumnos().catch(() => ({ alumnos: [] }))]
      : [obtenerMisAnuncios()];

    Promise.all(peticiones).then(
      ([historial, misAlumnos]) => {
        if (!vigente) return;
        setAnuncios(historial.anuncios);
        setAlcance(historial.alcance);
        if (misAlumnos) setAlumnos(misAlumnos.alumnos);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );

    return () => { vigente = false; };
  }, [esProfesor, intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setIntento((n) => n + 1);
  }

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // Un profesor sin alumnos asignados no tiene a quién publicar; el backend también lo impide.
  const puedePublicar = !esProfesor || (alcance ?? 0) > 0;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  }

  function validar() {
    const e = {};
    if (!form.titulo.trim()) e.titulo = "El título del anuncio es obligatorio.";
    else if (form.titulo.trim().length > MAX_TITULO) {
      e.titulo = `El título no puede pasar de ${MAX_TITULO} caracteres.`;
    }
    if (!form.contenido.trim()) e.contenido = "El contenido del anuncio es obligatorio.";
    return e;
  }

  function abrirNuevo() {
    if (!puedePublicar) return;
    setForm(FORM_VACIO);
    setErrores({});
    setModo("nuevo");
  }

  function cancelar() {
    setModo(null);
    setForm(FORM_VACIO);
    setErrores({});
  }

  async function handleGuardar() {
    if (enviando) return;
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setEnviando(true);
    try {
      const { anuncio } = await publicarAnuncio({
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
      });
      // El backend devuelve el anuncio ya creado: se antepone sin volver a pedir el historial.
      setAnuncios((prev) => [anuncio, ...prev]);
      mostrarToast(esProfesor
        ? "Anuncio publicado. Tus alumnos asignados ya pueden verlo."
        : "Anuncio publicado correctamente.");
      cancelar();
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return {
    esProfesor,
    carga, recargar,
    anuncios, alcance, alumnos, puedePublicar,
    modo, form, errores, enviando, toast,
    abrirNuevo, cancelar, handleChange, handleGuardar,
  };
}
