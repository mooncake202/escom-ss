// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Datos en duro: Catálogo de Profesores
//  Actualizado conforme a CU-CRED-03
// ============================================================


export const CARACTERISTICAS = {
  "Presidente de academia":          2,
  "Coordinador":                     2,
  "Jefe de departamento":            3,
  "Funcionario":                     3,
  "Profesor coordinador de clubes":  3,
  "Investigador":                    0, // no suma cupos
};

// Cupos base que todo profesor tiene
export const CUPOS_BASE = 3;

export const DEPARTAMENTOS = [
  "Sistemas Computacionales",
  "Inteligencia Artificial",
  "Ciencias Básicas",
  "Posgrado e Investigación",
  "Servicios Escolares",
];

// Roles permitidos según CU-CRED-03 (RN-CRED-02 y RF-CRED-05: solo Profesor o Coordinador)
export const ROLES = ["Profesor", "Coordinador"];

// Correos ya registrados en el sistema (para validación RN-CRED-01)
export const CORREOS_REGISTRADOS = new Set([
  "l.ramirez@ipn.mx",
  "m.gonzalez@ipn.mx",
  "j.vasquez@ipn.mx",
  "c.morales@ipn.mx",
  "e.torres@ipn.mx",
]);

export const PROFESORES = [
  {
    id: 1,
    usuario_id: 101,
    nombre: "Ramírez Ortega",
    apellidos: "Luis",
    correo_institucional: "l.ramirez@ipn.mx",
    rol: "Profesor",
    departamento: "Sistemas Computacionales",
    telefono_personal: "5512345678",
    horario_atencion: "Lunes a viernes 10:00–12:00",
    cubiculo: "A-204",
    cupos_totales: 5,
    caracteristica: ["Coordinador"],
    fecha_creacion: "2024-08-15T09:00:00",
    creado_por_id: 1,
  },
  {
    id: 2,
    usuario_id: 102,
    nombre: "González Pérez",
    apellidos: "Mariana",
    correo_institucional: "m.gonzalez@ipn.mx",
    rol: "Profesor",
    departamento: "Inteligencia Artificial",
    telefono_personal: "5598765432",
    horario_atencion: "Martes y jueves 14:00–16:00",
    cubiculo: "B-112",
    cupos_totales: 4,
    caracteristica: ["Investigador"],
    fecha_creacion: "2024-08-16T10:30:00",
    creado_por_id: 1,
  },
  {
    id: 3,
    usuario_id: 103,
    nombre: "Vásquez Hernández",
    apellidos: "Jorge",
    correo_institucional: "j.vasquez@ipn.mx",
    rol: "Profesor",
    departamento: "Sistemas Computacionales",
    telefono_personal: "5567891234",
    horario_atencion: "Miércoles 9:00–13:00",
    cubiculo: "A-310",
    cupos_totales: 5,
    caracteristica: ["Jefe de departamento"],
    fecha_creacion: "2024-08-17T08:00:00",
    creado_por_id: 1,
  },
  {
    id: 4,
    usuario_id: 104,
    nombre: "Morales Ríos",
    apellidos: "Carmen",
    correo_institucional: "c.morales@ipn.mx",
    rol: "Profesor",
    departamento: "Ciencias Básicas",
    telefono_personal: "5534561234",
    horario_atencion: "Lunes y miércoles 11:00–13:00",
    cubiculo: "C-205",
    cupos_totales: 3,
    caracteristica: ["Presidente de academia"],
    fecha_creacion: "2024-08-18T11:00:00",
    creado_por_id: 1,
  },
  {
    id: 5,
    usuario_id: 105,
    nombre: "Torres Salinas",
    apellidos: "Eduardo",
    correo_institucional: "e.torres@ipn.mx",
    rol: "Profesor",
    departamento: "Posgrado e Investigación",
    telefono_personal: "5578904321",
    horario_atencion: "Viernes 9:00–14:00",
    cubiculo: "D-401",
    cupos_totales: 6,
    caracteristica: ["Investigador"],
    fecha_creacion: "2024-08-19T14:00:00",
    creado_por_id: 1,
  },
];