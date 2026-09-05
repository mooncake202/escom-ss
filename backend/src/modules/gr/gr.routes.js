const express = require('express');


const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { postEnviarSolicitud, getVerificarCorreo, getEstadoSolicitud } = require('./gr.controller');

const router = express.Router();





// CU-GR-01: público a propósito — el "alumno no registrado" todavía no
// tiene cuenta ni token, por eso no lleva requireAuth.
router.post('/', postEnviarSolicitud);
router.get('/verificar-correo', getVerificarCorreo);
router.get('/estado', requireAuth, requireRole('alumno_sin_asignar'), getEstadoSolicitud);

module.exports = router;
