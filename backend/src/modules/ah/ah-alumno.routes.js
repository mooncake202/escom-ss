const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getMisActividades, getDetalleActividad } = require('./ah-alumno.controller');

const router = express.Router();

// Montado bajo '/alumno' en server.js — CU-AH-02, 100% acciones del alumno.
router.get('/actividades', requireAuth, requireRole('alumno_asignado'), getMisActividades);
router.get('/actividades/:id', requireAuth, requireRole('alumno_asignado'), getDetalleActividad);

module.exports = router;
