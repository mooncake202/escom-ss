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
// Ambos roles de alumno: el dato de contacto es suyo desde antes de quedar asignado.
router.get('/alumno', requireAuth, requireRole('alumno_asignado', 'alumno_sin_asignar'), getPerfilAlumno);
router.put('/alumno', requireAuth, requireRole('alumno_asignado', 'alumno_sin_asignar'), putPerfilAlumno);

module.exports = router;
