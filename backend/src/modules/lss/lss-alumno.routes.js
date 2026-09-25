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
  getInfoExpediente,
  postSubirExpedienteLss,
  getDescargarExpedienteLss,
  getEstadoExpediente,
  postSolicitarConstancia,
  postCorregirExpedienteLss,
  getEstadoConstancia,
  getDescargarConstancia,
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

// CU-LSS-07 — integración de expediente.
router.get('/expediente/info', requireAuth, requireRole('alumno_asignado'), getInfoExpediente);
router.post('/expediente/subir', requireAuth, requireRole('alumno_asignado'), postSubirExpedienteLss);
router.get('/expediente/descargar', requireAuth, requireRole('alumno_asignado'), getDescargarExpedienteLss);

// CU-LSS-08 — consultar estado de resolución del expediente.
router.get('/expediente/estado', requireAuth, requireRole('alumno_asignado'), getEstadoExpediente);
router.post('/expediente/solicitar-constancia', requireAuth, requireRole('alumno_asignado'), postSolicitarConstancia);
router.post('/expediente/corregir', requireAuth, requireRole('alumno_asignado'), postCorregirExpedienteLss);

// CU-LSS-10 — consultar/descargar la constancia de término.
router.get('/constancia-termino/estado', requireAuth, requireRole('alumno_asignado'), getEstadoConstancia);
router.get('/constancia-termino/descargar', requireAuth, requireRole('alumno_asignado'), getDescargarConstancia);

module.exports = router;
