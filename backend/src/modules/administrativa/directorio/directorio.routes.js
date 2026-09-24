const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getMiProfesor, getMiEquipo } = require('./directorio.controller');
const {
  getMisAlumnos,
  getProfesores,
  getAlumnosDeProfesor,
  getAlumnoAsignado,
} = require('./usuarios-asignados.controller');

const router = express.Router();

// Montado bajo '/directorio' en server.js. TODO el módulo es de solo lectura.

// ── CU-ADM-01 / CU-ADM-03 · Alumno ──────────────────────────────────────────
// Quien no tiene asignación vigente no tiene profesor ni equipo que consultar. El alumno se deriva
// del token, así que estas rutas no exponen a nadie más.

// CU-ADM-01 — contacto del profesor que lo supervisa.
router.get('/mi-profesor', requireAuth, requireRole('alumno_asignado'), getMiProfesor);

// CU-ADM-03 — compañeros de la misma oferta de proyecto.
router.get('/mi-equipo', requireAuth, requireRole('alumno_asignado'), getMiEquipo);

// ── CU-ADM-17 · Profesor y Coordinación ─────────────────────────────────────

// Sus propios alumnos asignados. No recibe profesor_id: sale del token.
router.get('/mis-alumnos', requireAuth, requireRole('profesor'), getMisAlumnos);

// Navegación de coordinación: profesores → alumnos de ese profesor.
router.get('/profesores', requireAuth, requireRole('coordinador'), getProfesores);
router.get('/profesores/:profesorId/alumnos', requireAuth, requireRole('coordinador'), getAlumnosDeProfesor);

// Detalle del alumno. Un solo endpoint para las dos navegaciones: el dato es el mismo y el alcance
// lo impone el servicio según el rol del token (al profesor se le exige además que la oferta sea
// suya).
router.get('/alumnos/:boleta', requireAuth, requireRole('profesor', 'coordinador'), getAlumnoAsignado);

module.exports = router;
