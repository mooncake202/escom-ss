const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getOfertas, getPerfiles, solicitarRegistroOferta, postDecidirOferta, getOfertasPendientes, getMisOfertas, getConsultarOfertas, postReenviarOferta, postCerrarOferta } = require('./ofertas.controller');

const router = express.Router();

// Públicas: se consultan desde /registro antes de que exista sesión.
router.get('/', getOfertas);
router.get('/perfiles', getPerfiles);

// CU-PRO-01: Solicitar registro de oferta (profesor)
router.post('/', requireAuth, requireRole('profesor'), solicitarRegistroOferta);

// CU-PRO-02: Revisar solicitud de oferta (coordinador aprueba/rechaza)
router.post('/:id/decidir', requireAuth, requireRole('coordinador'), postDecidirOferta);

// CU-PRO-02 (listado): ofertas pendientes de revisión
router.get('/pendientes', requireAuth, requireRole('coordinador'), getOfertasPendientes);
// CU-PRO-05: Consultar mis ofertas (profesor)
router.get('/mias', requireAuth, requireRole('profesor'), getMisOfertas);
// CU-PRO-03: Consultar ofertas (coordinador)
router.get('/consultar', requireAuth, requireRole('coordinador'), getConsultarOfertas);
// CU-PRO-05 (Flujo A): Corregir y reenviar oferta rechazada
router.post('/:id/reenviar', requireAuth, requireRole('profesor'), postReenviarOferta);
// CU-PRO-04: Cerrar oferta manualmente (profesor)
router.post('/:id/cerrar', requireAuth, requireRole('profesor'), postCerrarOferta);

module.exports = router;