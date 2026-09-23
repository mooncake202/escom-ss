const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const {
  getContexto, getMisSolicitudes, postSolicitud,
  getSolicitudes, getSolicitud, postAprobar, postRechazar,
} = require('./caracteristicas.controller');

const router = express.Router();

// Montado bajo '/solicitudes-caracteristicas' en server.js.
//
// La autorización es por rol y es estricta en las dos direcciones: un profesor no puede resolver
// solicitudes (ADM-16) y un coordinador no puede enviar una (ADM-15). Además, en ADM-15 el profesor
// siempre sale del token, así que nadie puede operar sobre otro profesor.
// El servicio revalida todo: que el front deshabilite un botón no es una garantía.

// ── CU-ADM-15 · Profesor ──
router.get('/contexto', requireAuth, requireRole('profesor'), getContexto);
router.get('/mias', requireAuth, requireRole('profesor'), getMisSolicitudes);
router.post('/', requireAuth, requireRole('profesor'), postSolicitud);

// ── CU-ADM-16 · Coordinación ──
// Bandeja compartida: ningún listado filtra por coordinador, cualquiera ve y resuelve todo.
// GET '/' devuelve pendientes + resueltas; va antes que '/:id' para no chocar con la paramétrica.
router.get('/', requireAuth, requireRole('coordinador'), getSolicitudes);
router.get('/:id', requireAuth, requireRole('coordinador'), getSolicitud);
router.post('/:id/aprobar', requireAuth, requireRole('coordinador'), postAprobar);
router.post('/:id/rechazar', requireAuth, requireRole('coordinador'), postRechazar);

module.exports = router;
