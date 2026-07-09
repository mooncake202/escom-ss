import { useState, useMemo } from "react";

const MOCK_PROFESOR     = { nombre: "Dr. Torres Vega",   id: "PTC-2024-0187" };
const MOCK_COORDINACION = { nombre: "Lic. Morales Vega" };

const ALUMNOS_TORRES = [
  {
    id: 1, nombre: "García López Ana",
    boleta: "2022630001", carrera: "ISC",
    correoInst: "agarcia0001@alumno.ipn.mx", creditos: 480,
    correoAlt: "ana.garcia@gmail.com", telefono: "55 1234 5678",
  },
  {
    id: 2, nombre: "Hernández Ruiz Carlos",
    boleta: "2021630042", carrera: "LCD",
    correoInst: "chernandez0042@alumno.ipn.mx", creditos: 320,
    correoAlt: "carlos.hdz@hotmail.com", telefono: "55 9876 5432",
  },
  {
    id: 3, nombre: "Martínez Soto Diana",
    boleta: "2022630078", carrera: "ISC",
    correoInst: "dmartinez0078@alumno.ipn.mx", creditos: 410,
    correoAlt: "dianamtz@gmail.com", telefono: "55 5555 1234",
  },
];

const MOCK_PROFESORES = [
  {
    id: 1, nombre: "Dr. Torres Vega", idEmpleado: "PTC-2024-0187",
    alumnos: ALUMNOS_TORRES,
  },
  {
    id: 2, nombre: "Dra. Ramírez Flores", idEmpleado: "PTC-2024-0203",
    alumnos: [
      {
        id: 4, nombre: "López Torres Pedro",
        boleta: "2020630115", carrera: "ISC",
        correoInst: "plopez0115@alumno.ipn.mx", creditos: 510,
        correoAlt: "pedro.lopez@gmail.com", telefono: "55 3344 5566",
      },
      {
        id: 5, nombre: "Vargas Méndez Sofía",
        boleta: "2022630201", carrera: "LCD",
        correoInst: "svargas0201@alumno.ipn.mx", creditos: 390,
        correoAlt: "sofia.vargas@outlook.com", telefono: "55 7788 9900",
      },
    ],
  },
  {
    id: 3, nombre: "M.C. Gutiérrez Peña", idEmpleado: "PTC-2023-0156",
    alumnos: [], // flujo alterno 2.1: profesor sin alumnos
  },
];

export function useConsultarUsuarios(rol) {
  const [nivel, setNivel]         = useState(1);
  const [profesorSel, setProfesorSel] = useState(null);
  const [alumnoSel, setAlumnoSel]     = useState(null);
  const [busqueda, setBusqueda]       = useState("");

  const usuario = rol === "profesor" ? MOCK_PROFESOR : MOCK_COORDINACION;

  const alumnosActuales = rol === "profesor"
    ? ALUMNOS_TORRES
    : (profesorSel?.alumnos ?? []);

  const profesoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return MOCK_PROFESORES;
    return MOCK_PROFESORES.filter(p => p.nombre.toLowerCase().includes(texto));
  }, [busqueda]);

  function handleSeleccionarProfesor(p) {
    setProfesorSel(p);
    setBusqueda("");
    setNivel(2);
  }

  function handleSeleccionarAlumno(a) {
    setAlumnoSel(a);
    setNivel(rol === "profesor" ? 2 : 3);
  }

  function handleNavegar(nivelDestino) {
    if (nivelDestino <= 1) {
      setProfesorSel(null);
      setAlumnoSel(null);
      setNivel(1);
    } else if (nivelDestino === 2) {
      setAlumnoSel(null);
      setNivel(2);
    }
  }

  // Breadcrumbs: [{label, onClick?}] — último item sin onClick = nivel actual
  const breadcrumbs = (() => {
    if (rol === "profesor") {
      const items = [
        { label: "Inicio" },
        nivel > 1
          ? { label: "Mis alumnos", onClick: () => handleNavegar(1) }
          : { label: "Mis alumnos" },
      ];
      if (nivel === 2 && alumnoSel) items.push({ label: alumnoSel.nombre });
      return items;
    }
    // coordinacion — 3 niveles
    const items = [
      { label: "Inicio" },
      nivel > 1
        ? { label: "Profesores", onClick: () => handleNavegar(1) }
        : { label: "Profesores" },
    ];
    if (nivel >= 2 && profesorSel) {
      items.push(
        nivel > 2
          ? { label: profesorSel.nombre, onClick: () => handleNavegar(2) }
          : { label: profesorSel.nombre }
      );
    }
    if (nivel === 3 && alumnoSel) items.push({ label: alumnoSel.nombre });
    return items;
  })();

  return {
    usuario, nivel,
    profesoresFiltrados, profesorSel,
    alumnosActuales, alumnoSel,
    busqueda, setBusqueda,
    handleSeleccionarProfesor, handleSeleccionarAlumno,
    handleNavegar, breadcrumbs,
  };
}
