const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getAlumnos,
  getDetalleAlumno,
  postCrearActividad,
  putEditarActividad,
  deleteActividad,
} = require('./ah.controller');

const router = express.Router();

// Montado bajo '/profesor' en server.js (mismo prefijo que gr-profesor.routes.js,
// coexisten sin choque porque los sub-paths no se traslapan). CU-AH-01 es
// 100% acciones del profesor.
router.get('/actividades/alumnos', requireAuth, requireRole('profesor'), getAlumnos);
router.get('/actividades/alumnos/:solicitudId', requireAuth, requireRole('profesor'), getDetalleAlumno);
router.post('/actividades/alumnos/:solicitudId', requireAuth, requireRole('profesor'), postCrearActividad);
router.put('/actividades/:id', requireAuth, requireRole('profesor'), putEditarActividad);
router.delete('/actividades/:id', requireAuth, requireRole('profesor'), deleteActividad);

module.exports = router;
