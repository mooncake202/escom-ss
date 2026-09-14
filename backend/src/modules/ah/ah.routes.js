const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getAlumnos,
  getDetalleAlumno,
  postCrearActividad,
  putEditarActividad,
  deleteActividad,
  getBitacorasPendientes,
  postAprobarBitacora,
  postRechazarBitacora,
  getAcumuladoAlumnos,
  getHistorialAlumno,
  postAprobarBitacoraDesdeHistorial,
  putExtenderFechaLimiteActividad,
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

// CU-AH-04 — revisar bitácoras.
router.get('/bitacoras', requireAuth, requireRole('profesor'), getBitacorasPendientes);
router.post('/bitacoras/:id/aprobar', requireAuth, requireRole('profesor'), postAprobarBitacora);
router.post('/bitacoras/:id/rechazar', requireAuth, requireRole('profesor'), postRechazarBitacora);

// CU-AH-05 — consultar acumulado de horas.
router.get('/horas', requireAuth, requireRole('profesor'), getAcumuladoAlumnos);

// CU-AH-06 — consultar historial de actividades y bitácoras, y sus 2
// acciones reales expuestas desde esa pantalla (aprobar bitácora rechazada,
// extender fecha límite). Ruta de extender-fecha SEPARADA de PUT
// /actividades/:id (editarActividad) a propósito: esa exige tieneAvance o
// los 4 campos completos, aquí solo se quiere extender fecha de una
// actividad vencida que puede no tener ningún avance todavía.
router.get('/historial', requireAuth, requireRole('profesor'), getHistorialAlumno);
router.post('/bitacoras/:id/aprobar-desde-historial', requireAuth, requireRole('profesor'), postAprobarBitacoraDesdeHistorial);
router.put('/actividades/:id/extender-fecha', requireAuth, requireRole('profesor'), putExtenderFechaLimiteActividad);

module.exports = router;
