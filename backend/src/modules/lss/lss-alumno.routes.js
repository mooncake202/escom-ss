const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getEstadoRequisitos,
  postIniciarEvaluacion,
  getEstadoEvaluacion,
  postReenviarEvaluacion,
  getDescargarEvaluacion,
  postConfirmarSiss,
  postCartaTermino,
  getEstadoCarta,
  postConfirmarRecogida,
} = require('./lss-alumno.controller');

const router = express.Router();

// Montado bajo '/alumno' en server.js — CU-LSS-01, iniciar evaluación de desempeño.
router.get('/liberacion/requisitos', requireAuth, requireRole('alumno_asignado'), getEstadoRequisitos);
router.post('/liberacion/iniciar', requireAuth, requireRole('alumno_asignado'), postIniciarEvaluacion);

// CU-LSS-02 — consultar/actuar sobre el estado de la evaluación de desempeño.
router.get('/evaluacion/estado', requireAuth, requireRole('alumno_asignado'), getEstadoEvaluacion);
router.post('/evaluacion/reenviar', requireAuth, requireRole('alumno_asignado'), postReenviarEvaluacion);
router.get('/evaluacion/descargar', requireAuth, requireRole('alumno_asignado'), getDescargarEvaluacion);
router.post('/evaluacion/confirmar-siss', requireAuth, requireRole('alumno_asignado'), postConfirmarSiss);
router.post('/evaluacion/carta-termino', requireAuth, requireRole('alumno_asignado'), postCartaTermino);

// CU-LSS-05 — consultar/confirmar recogida de la carta de término.
router.get('/carta-termino/estado', requireAuth, requireRole('alumno_asignado'), getEstadoCarta);
router.post('/carta-termino/confirmar', requireAuth, requireRole('alumno_asignado'), postConfirmarRecogida);

module.exports = router;
