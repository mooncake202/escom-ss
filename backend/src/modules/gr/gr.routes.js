const express = require('express');


const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { postEnviarSolicitud, getVerificarCorreo, getEstadoSolicitud } = require('./gr.controller');
const { postCambiarOferta, postContinuarSISS } = require('./gr.controller'); 
const { getInfoSISS, postConfirmarSISS, postAdjuntarDocumentacion, postContinuarCartaCompromiso,
    postCorregirDocumentacion, postCorregirSISS, postModificarSolicitud, getMisDocumentos,
    postConfirmarCartaCompromiso, postContinuarExpediente
} = require('./gr.controller'); 

const router = express.Router();

const { crearRateLimiter } = require('../../middleware/rateLimiter.middleware');

const limitarRegistro = crearRateLimiter({ prefijo: 'rl:registro', maximo: 5, ventanaSegundos: 60 });




// CU-GR-01: público a propósito — el "alumno no registrado" todavía no
// tiene cuenta ni token, por eso no lleva requireAuth.
router.post('/', limitarRegistro, postEnviarSolicitud);
router.get('/verificar-correo', getVerificarCorreo);
router.get('/estado', requireAuth, requireRole('alumno_sin_asignar'), getEstadoSolicitud);


//GR-03
router.post('/cambiar-oferta', requireAuth, requireRole('alumno_sin_asignar'), postCambiarOferta);
router.post('/continuar-siss', requireAuth, requireRole('alumno_sin_asignar'), postContinuarSISS);

//gr04
router.get('/info-siss', requireAuth, requireRole('alumno_sin_asignar'), getInfoSISS);
router.post('/confirmar-siss', requireAuth, requireRole('alumno_sin_asignar'), postConfirmarSISS);

//gr-05
router.post('/adjuntar-documentacion', requireAuth, requireRole('alumno_sin_asignar'), postAdjuntarDocumentacion);

//gr06
router.post('/continuar-carta-compromiso', requireAuth, requireRole('alumno_sin_asignar'), postContinuarCartaCompromiso);
router.post('/corregir-documentacion', requireAuth, requireRole('alumno_sin_asignar'), postCorregirDocumentacion);
router.post('/corregir-siss', requireAuth, requireRole('alumno_sin_asignar'), postCorregirSISS);
router.post('/modificar-solicitud', requireAuth, requireRole('alumno_sin_asignar'), postModificarSolicitud);
router.get('/mis-documentos', requireAuth, requireRole('alumno_sin_asignar'), getMisDocumentos);

//gr-08
router.post('/confirmar-carta-compromiso', requireAuth, requireRole('alumno_sin_asignar'), postConfirmarCartaCompromiso);
router.post('/continuar-expediente', requireAuth, requireRole('alumno_sin_asignar'), postContinuarExpediente);





module.exports = router;
