// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Catálogos estáticos (sin tabla propia en BD)
// ============================================================

// Cupos base que todo profesor tiene. Debe coincidir con
// CUPOS_BASE en backend/src/modules/usuarios/usuarios.service.js
export const CUPOS_BASE = 3;

export const DEPARTAMENTOS = [
  "Sistemas Computacionales",
  "Inteligencia Artificial",
  "Ciencias Básicas",
  "Posgrado e Investigación",
  "Servicios Escolares",
];

// Roles permitidos según CU-CRED-03 (RF-CRED-16: nunca Alumno)
export const ROLES = ["Profesor", "Coordinador"];