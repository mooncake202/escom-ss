const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getPerfilProfesor, putPerfilProfesor,
  getPerfilAlumno, putPerfilAlumno,
} = require('./perfil.controller');

const router = express.Router();

// Montado bajo '/perfil' en server.js.
//
// Cada rol solo alcanza su propio sub-recurso: un alumno recibe 403 en /perfil/profesor y al revés.
// Además el usuario sale del token, así que dentro de un rol tampoco puede verse el perfil ajeno.

// CU-ADM-10 — el profesor consulta y actualiza sus datos de contacto.
router.get('/profesor', requireAuth, requireRole('profesor'), getPerfilProfesor);
router.put('/profesor', requireAuth, requireRole('profesor'), putPerfilProfesor);

// CU-ADM-04 — el alumno consulta y actualiza su correo personal y su celular.
// SOLO 'alumno_asignado': quien sigue en registro captura estos datos en el flujo de GR, no aquí, y
// ninguna pantalla le ofrece esta ruta. Antes se aceptaba también 'alumno_sin_asignar', pero era
// permiso sin consumidor: el frontend ya lo desviaba a su paso del registro.
router.get('/alumno', requireAuth, requireRole('alumno_asignado'), getPerfilAlumno);
router.put('/alumno', requireAuth, requireRole('alumno_asignado'), putPerfilAlumno);

module.exports = router;
