import { useEffect, useState } from "react";
import {
  getAlumnosAsignados,
  getDetalleAlumno as getDetalleAlumnoApi,
  crearActividad as crearActividadApi,
  editarActividad as editarActividadApi,
  eliminarActividad as eliminarActividadApi,
} from "@/services/ahProfesorService";

const FORM_INICIAL = { titulo: "", descripcion: "", entregable_esperado: "", fecha_limite: "" };

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useAsignarActividades() {
  const [alumnos, setAlumnos]                 = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(true);
  const [alumnoSeleccionado, setAlumno]       = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [actividadEnEdicion, setActividadEnEdicion] = useState(null);
  const [form, setForm]                 = useState(FORM_INICIAL);
  const [errores, setErrores]           = useState({});
  const [loading, setLoading]           = useState(false);
  const [exitoso, setExitoso]           = useState(false);
  // null | "crear" | "editar" | "extender-fecha"
  const [modoFormulario, setModoForm]   = useState(null);

  // Carga única al montar — esta sí debe mostrar "Cargando...".
  useEffect(() => {
    getAlumnosAsignados()
      .then(setAlumnos)
      .catch((err) => console.error("No se pudieron cargar los alumnos:", err))
      .finally(() => setCargandoAlumnos(false));
  }, []);

  // Parte 3 (sockets): revisado contra el catálogo completo de eventos —
  // los 5 eventos `actividad:*` se emiten únicamente al alumno dueño, nunca
  // al profesor. Esta pantalla no tiene ningún evento real que escuchar
  // hoy, así que NO se agrega ninguna suscripción de socket aquí (evitar
  // "socket sin destino"). El único mecanismo de frescura que le queda es
  // el refresco local tras las propias mutaciones del profesor, ya
  // implementado más abajo (refrescarAlumnoSeleccionado / setAlumnos).

  const refrescarAlumnoSeleccionado = async (solicitudId) => {
    const detalle = await getDetalleAlumnoApi(solicitudId);
    setAlumno(detalle);
    setAlumnos((prev) => prev.map((a) => (a.solicitudId === solicitudId ? { ...a, actividades: detalle.actividades } : a)));
    return detalle;
  };

  const seleccionarAlumno = async (alumno) => {
    setModoForm(null);
    setActividadEnEdicion(null);
    setExitoso(false);
    setForm(FORM_INICIAL);
    setErrores({});
    setCargandoDetalle(true);
    try {
      const detalle = await getDetalleAlumnoApi(alumno.solicitudId);
      setAlumno(detalle);
    } catch (err) {
      console.error("No se pudo cargar el detalle del alumno:", err);
      setAlumno(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrores((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const cerrarFormulario = () => {
    setModoForm(null);
    setActividadEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrores({});
  };

  const abrirCrear = () => {
    setModoForm("crear");
    setActividadEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrores({});
  };

  const abrirEditar = (actividad) => {
    setModoForm("editar");
    setActividadEnEdicion(actividad);
    setForm({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      entregable_esperado: actividad.entregable_esperado,
      fecha_limite: String(actividad.fecha_limite).slice(0, 10),
    });
    setErrores({});
  };

  const abrirExtenderFecha = (actividad) => {
    setModoForm("extender-fecha");
    setActividadEnEdicion(actividad);
    setForm({ ...FORM_INICIAL, fecha_limite: "" });
    setErrores({});
  };

  // RN-AH-02: los 4 campos obligatorios al crear/editar completo. Regla
  // nueva (decisión de diseño, no está en la ficha original): fecha_limite
  // > fecha de inicio del servicio social del alumno seleccionado.
  const validar = () => {
    const errs = {};

    if (modoFormulario === "extender-fecha") {
      if (!form.fecha_limite) {
        errs.fecha_limite = "La nueva fecha límite es obligatoria";
      } else {
        const nueva = new Date(form.fecha_limite);
        const actual = new Date(actividadEnEdicion.fecha_limite);
        if (nueva <= actual) {
          errs.fecha_limite = "Debe ser posterior a la fecha límite actual";
        } else if (alumnoSeleccionado?.periodoInicio && nueva <= new Date(alumnoSeleccionado.periodoInicio)) {
          errs.fecha_limite = "Debe ser posterior al inicio del servicio social del alumno";
        }
      }
    } else {
      if (!form.titulo.trim()) errs.titulo = "El título es obligatorio";
      if (!form.descripcion.trim()) errs.descripcion = "La descripción es obligatoria";
      if (!form.entregable_esperado.trim()) errs.entregable_esperado = "El entregable esperado es obligatorio";
      if (!form.fecha_limite) {
        errs.fecha_limite = "La fecha límite es obligatoria";
      } else {
        const limite = new Date(form.fecha_limite);
        // Regla independiente y adicional: sin importar el inicio del
        // periodo del alumno, la fecha límite no puede ser anterior a hoy.
        const ahora = new Date();
        const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
        if (limite < hoy) {
          errs.fecha_limite = "No puede ser anterior a hoy";
        } else if (alumnoSeleccionado?.periodoInicio) {
          const inicio = new Date(alumnoSeleccionado.periodoInicio);
          if (limite < inicio) errs.fecha_limite = "Debe ser posterior o igual al inicio del servicio social del alumno";
        }
      }
    }

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // Punto de entrada único del formulario — decide qué llamar según el modo.
  const guardar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      if (modoFormulario === "crear") {
        await crearActividadApi(alumnoSeleccionado.solicitudId, form);
      } else if (modoFormulario === "editar") {
        await editarActividadApi(actividadEnEdicion.id, form);
      } else if (modoFormulario === "extender-fecha") {
        await editarActividadApi(actividadEnEdicion.id, { fecha_limite: form.fecha_limite });
      }
      await refrescarAlumnoSeleccionado(alumnoSeleccionado.solicitudId);
      cerrarFormulario();
      setExitoso(true);
      setTimeout(() => setExitoso(false), 3000);
    } catch (err) {
      setErrores({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const eliminarActividad = async (actividadId) => {
    try {
      await eliminarActividadApi(actividadId);
      await refrescarAlumnoSeleccionado(alumnoSeleccionado.solicitudId);
    } catch (err) {
      alert(err.message);
    }
  };

  return {
    alumnos, cargandoAlumnos,
    alumnoSeleccionado, cargandoDetalle,
    actividadEnEdicion,
    form, errores, loading, exitoso,
    modoFormulario,
    seleccionarAlumno, handleChange,
    abrirCrear, abrirEditar, abrirExtenderFecha, cerrarFormulario,
    guardar, eliminarActividad,
    CARRERA_LABEL,
  };
}
