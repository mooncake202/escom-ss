import { useEffect, useMemo, useRef, useState } from "react";
import {
  obtenerMisAlumnos,
  obtenerProfesores,
  obtenerAlumnosDeProfesor,
  obtenerAlumnoAsignado,
} from "@/services/usuariosAsignadosService";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// CU-ADM-17. Datos reales, solo lectura.
//
// Dos navegaciones sobre el mismo módulo:
//   profesor    → nivel 1 sus alumnos, nivel 2 detalle
//   coordinación→ nivel 1 profesores, nivel 2 alumnos de ese profesor, nivel 3 detalle
//
// El profesor nunca manda su id: el backend lo deriva del token. Coordinación sí elige profesor,
// porque su CU es justamente navegar por todos.
//
// Las cargas de los niveles 2 y 3 se disparan desde el clic, no desde un efecto: así la navegación
// es explícita y un clic rápido sobre otra tarjeta descarta la respuesta anterior (contador `turno`)
// en vez de pintar datos de quien ya no está seleccionado.
export function useConsultarUsuarios(rol) {
  const esProfesor = rol === "profesor";
  const { usuario } = useSesion();

  const [nivel, setNivel] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [intento, setIntento] = useState(0);

  // Nivel 1: alumnos propios (profesor) o profesores (coordinación).
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [profesores, setProfesores] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  // Nivel 2 de coordinación: alumnos del profesor elegido.
  const [profesorSel, setProfesorSel] = useState(null);
  const [cargaAlumnos, setCargaAlumnos] = useState({ estado: "inactivo", error: null });

  // Detalle del alumno.
  const [alumnoSel, setAlumnoSel] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargaDetalle, setCargaDetalle] = useState({ estado: "inactivo", error: null });

  const turno = useRef(0);

  // El estado inicial ya es "cargando" y `recargar` lo repone, así que el efecto no llama a
  // setState de forma síncrona en su cuerpo.
  useEffect(() => {
    let vigente = true;
    const pedir = esProfesor ? obtenerMisAlumnos : obtenerProfesores;

    pedir().then(
      (r) => {
        if (!vigente) return;
        if (esProfesor) setAlumnos(r.alumnos);
        else setProfesores(r.profesores);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );

    return () => { vigente = false; };
  }, [esProfesor, intento]);

  function recargar() {
    turno.current += 1;
    setCarga({ estado: "cargando", error: null });
    setProfesorSel(null);
    setAlumnoSel(null);
    setDetalle(null);
    setCargaAlumnos({ estado: "inactivo", error: null });
    setCargaDetalle({ estado: "inactivo", error: null });
    setNivel(1);
    setIntento((n) => n + 1);
  }

  const profesoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return profesores;
    return profesores.filter((p) => p.nombreCompleto.toLowerCase().includes(texto));
  }, [profesores, busqueda]);

  async function seleccionarProfesor(profesor) {
    const mio = ++turno.current;
    setProfesorSel(profesor);
    setAlumnos([]);
    setBusqueda("");
    setNivel(2);
    setCargaAlumnos({ estado: "cargando", error: null });

    try {
      const r = await obtenerAlumnosDeProfesor(profesor.id);
      if (turno.current !== mio) return;
      setAlumnos(r.alumnos);
      setCargaAlumnos({ estado: "listo", error: null });
    } catch (err) {
      if (turno.current !== mio) return;
      setCargaAlumnos({ estado: "error", error: err.message });
    }
  }

  async function seleccionarAlumno(alumno) {
    const mio = ++turno.current;
    setAlumnoSel(alumno);
    setDetalle(null);
    setNivel(esProfesor ? 2 : 3);
    setCargaDetalle({ estado: "cargando", error: null });

    try {
      const r = await obtenerAlumnoAsignado(alumno.boleta);
      if (turno.current !== mio) return;
      setDetalle(r);
      setCargaDetalle({ estado: "listo", error: null });
    } catch (err) {
      if (turno.current !== mio) return;
      setCargaDetalle({ estado: "error", error: err.message });
    }
  }

  // Reintento del nivel en el que falló, sin perder la navegación.
  function reintentarAlumnos() { if (profesorSel) seleccionarProfesor(profesorSel); }
  function reintentarDetalle() { if (alumnoSel) seleccionarAlumno(alumnoSel); }

  function navegar(destino) {
    turno.current += 1;
    if (destino <= 1) {
      setProfesorSel(null);
      setAlumnoSel(null);
      setDetalle(null);
      setCargaDetalle({ estado: "inactivo", error: null });
      if (!esProfesor) {
        setAlumnos([]);
        setCargaAlumnos({ estado: "inactivo", error: null });
      }
      setNivel(1);
      return;
    }
    // Volver al listado de alumnos: se conserva lo ya cargado del profesor elegido.
    setAlumnoSel(null);
    setDetalle(null);
    setCargaDetalle({ estado: "inactivo", error: null });
    setNivel(2);
  }

  // [{ label, onClick? }] — el último sin onClick es el nivel actual.
  const breadcrumbs = useMemo(() => {
    const tituloAlumno = alumnoSel?.nombreCompleto ?? "Alumno";

    if (esProfesor) {
      const items = [
        { label: "Inicio" },
        nivel > 1 ? { label: "Mis alumnos", onClick: () => navegar(1) } : { label: "Mis alumnos" },
      ];
      if (nivel === 2 && alumnoSel) items.push({ label: tituloAlumno });
      return items;
    }

    const items = [
      { label: "Inicio" },
      nivel > 1 ? { label: "Profesores", onClick: () => navegar(1) } : { label: "Profesores" },
    ];
    if (nivel >= 2 && profesorSel) {
      items.push(nivel > 2
        ? { label: profesorSel.nombreCompleto, onClick: () => navegar(2) }
        : { label: profesorSel.nombreCompleto });
    }
    if (nivel === 3 && alumnoSel) items.push({ label: tituloAlumno });
    return items;
    // `navegar` es estable en la práctica (solo usa setters y el ref); se omite a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esProfesor, nivel, alumnoSel, profesorSel]);

  return {
    nombreUsuario: nombreCompletoSesion(usuario),
    esProfesor, nivel,
    carga, recargar,
    profesoresFiltrados, profesorSel,
    alumnos, cargaAlumnos, reintentarAlumnos,
    alumnoSel, detalle, cargaDetalle, reintentarDetalle,
    busqueda, setBusqueda,
    seleccionarProfesor, seleccionarAlumno, navegar,
    breadcrumbs,
  };
}
