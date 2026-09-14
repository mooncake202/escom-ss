import { useCallback, useEffect, useState } from "react";
import { getHistorialPropio } from "@/services/ahAlumnoService";
import { getAcumuladoAlumnos } from "@/services/ahProfesorService";
import { getHistorialAlumno as getHistorialAlumnoProfesor, aprobarBitacoraDesdeHistorial, extenderFechaActividad } from "@/services/ahProfesorService";
import { getAcumuladoProfesores } from "@/services/ahCoordinadorService";
import { getHistorialAlumno as getHistorialAlumnoCoordinador } from "@/services/ahCoordinadorService";

export function useHistorial(rolInterno) {
  const [tipoFiltro, setTipoFiltro]     = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaDesde, setFechaDesde]     = useState("");
  const [fechaHasta, setFechaHasta]     = useState("");

  // Para profesor/coordinación: alumno seleccionado en la lista
  const [profesorVisto, setProfesorVisto] = useState(null);
  const [alumnoVisto, setAlumnoVisto]     = useState(null);

  // Listas de selección (profesor/coordinación) — reusan los endpoints ya
  // reales de AH-05 (getAcumuladoAlumnos/getAcumuladoProfesores), sin
  // duplicar un listado nuevo solo para poblar estas columnas.
  const [alumnos, setAlumnos] = useState([]);
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    if (rolInterno === "profesor") {
      getAcumuladoAlumnos().then(setAlumnos).catch((err) => console.error("Error al listar alumnos:", err));
    } else if (rolInterno === "coordinacion") {
      getAcumuladoProfesores().then(setProfesores).catch((err) => console.error("Error al listar profesores:", err));
    }
  }, [rolInterno]);

  // Contenido del historial (registros + totales) del alumno activo según
  // el rol — se re-pide cada vez que cambian los filtros o el alumno
  // seleccionado, el filtrado vive en el backend, no localmente.
  const [registros, setRegistros] = useState([]);
  const [totales, setTotales] = useState({ actividades: 0, bitacoras: 0 });
  const [cargando, setCargando] = useState(false);
  const [alumnoDetalle, setAlumnoDetalle] = useState(null); // { nombre, boleta, carrera, oferta, profesorNombre? } — solo profesor/coordinación

  const filtros = { tipo: tipoFiltro, estado: estadoFiltro, fechaDesde, fechaHasta };

  const cargarHistorial = useCallback(async () => {
    try {
      setCargando(true);
      if (rolInterno === "alumno") {
        const data = await getHistorialPropio(filtros);
        setRegistros(data.registros);
        setTotales(data.totales);
        setAlumnoDetalle(null);
      } else if (rolInterno === "profesor" && alumnoVisto) {
        const data = await getHistorialAlumnoProfesor(alumnoVisto.boleta, filtros);
        setRegistros(data.registros);
        setTotales(data.totales);
        setAlumnoDetalle(data.alumno);
      } else if (rolInterno === "coordinacion" && alumnoVisto) {
        const data = await getHistorialAlumnoCoordinador(alumnoVisto.boleta, filtros);
        setRegistros(data.registros);
        setTotales(data.totales);
        setAlumnoDetalle(data.alumno);
      } else {
        setRegistros([]);
        setTotales({ actividades: 0, bitacoras: 0 });
        setAlumnoDetalle(null);
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolInterno, alumnoVisto, tipoFiltro, estadoFiltro, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  async function aprobarBitacoraRechazada(bitacoraId, confirmarSobrepasoHoras = false) {
    const resultado = await aprobarBitacoraDesdeHistorial(bitacoraId, confirmarSobrepasoHoras);
    if (!resultado.requiereConfirmacion) await cargarHistorial();
    return resultado;
  }

  async function extenderFechaActividadHistorial(actividadId, nuevaFecha) {
    await extenderFechaActividad(actividadId, nuevaFecha);
    await cargarHistorial();
  }

  // Al cambiar de tipo, el estado seleccionado del tipo anterior ya no
  // aplica (los dos espacios de estado no comparten valores) — se resetea
  // para no dejar un filtro fantasma activo.
  function cambiarTipoFiltro(nuevoTipo) {
    setTipoFiltro(nuevoTipo);
    setEstadoFiltro("todos");
  }

  return {
    registros, totales, cargando,
    tipoFiltro, setTipoFiltro: cambiarTipoFiltro,
    estadoFiltro, setEstadoFiltro,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    profesores, profesorVisto, setProfesorVisto,
    alumnos, alumnoVisto, setAlumnoVisto,
    alumnoDetalle,
    aprobarBitacoraRechazada,
    extenderFechaActividad: extenderFechaActividadHistorial,
  };
}
