const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getMisActividades,
  getDetalleActividad,
  getEstadoJornada,
  postIniciarJornada,
  postFinalizarJornada,
  postCancelarJornada,
  postConfirmarBitacora,
} = require('./ah-alumno.controller');

const router = express.Router();

// Montado bajo '/alumno' en server.js — CU-AH-02, 100% acciones del alumno.
router.get('/actividades', requireAuth, requireRole('alumno_asignado'), getMisActividades);
router.get('/actividades/:id', requireAuth, requireRole('alumno_asignado'), getDetalleActividad);

// CU-AH-03 — registrar bitácora del día.
router.get('/bitacora/estado', requireAuth, requireRole('alumno_asignado'), getEstadoJornada);
router.post('/bitacora/iniciar', requireAuth, requireRole('alumno_asignado'), postIniciarJornada);
router.post('/bitacora/finalizar', requireAuth, requireRole('alumno_asignado'), postFinalizarJornada);
router.post('/bitacora/cancelar', requireAuth, requireRole('alumno_asignado'), postCancelarJornada);
router.post('/bitacora/confirmar', requireAuth, requireRole('alumno_asignado'), postConfirmarBitacora);

module.exports = router;
