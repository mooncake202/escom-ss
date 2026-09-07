const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getSolicitudesDocumentacion,
  postDecidirDocumentacion,
  getDescargarDocumento,
} = require('./gr-coordinador.controller');

const router = express.Router();

// RF-GR-67: lista de solicitudes con documentación pendiente.
router.get('/documentacion', requireAuth, requireRole('coordinador'), getSolicitudesDocumentacion);

// RF-GR-70 a RF-GR-74: las 4 decisiones de Coordinador.
router.post('/documentacion/:id/decidir', requireAuth, requireRole('coordinador'), postDecidirDocumentacion);

// RF-GR-68/69: descarga de un documento — el permiso exacto (coordinador
// cualquiera, alumno solo el suyo) se valida dentro del service, por eso
// aquí solo exigimos sesión, no un rol específico.
router.get('/documentos/:id/descargar', requireAuth, getDescargarDocumento);

module.exports = router;
