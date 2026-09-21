const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getSiguienteReporteMensual, postRubrica, postVistaPreviaReporteMensual, postEnviarReporteMensual,
  getReportes, getSeguimientoReporte, getPdfReporte, postVistaPreviaCorreccion, postReenviarReporteCorregido,
  getSiguienteReporteGlobal, postVistaPreviaReporteGlobal, postEnviarReporteGlobal,
} = require('./reportes-alumno.controller');

const router = express.Router();

router.get('/mensual/siguiente', requireAuth, requireRole('alumno_asignado'), getSiguienteReporteMensual);
router.post('/mensual/vista-previa', requireAuth, requireRole('alumno_asignado'), postVistaPreviaReporteMensual);
router.post('/mensual', requireAuth, requireRole('alumno_asignado'), postEnviarReporteMensual);
router.post('/rubrica', requireAuth, requireRole('alumno_asignado'), postRubrica);

// CU-REP-07: reporte global (mismas reglas de seguridad que el mensual).
router.get('/global/siguiente', requireAuth, requireRole('alumno_asignado'), getSiguienteReporteGlobal);
router.post('/global/vista-previa', requireAuth, requireRole('alumno_asignado'), postVistaPreviaReporteGlobal);
router.post('/global', requireAuth, requireRole('alumno_asignado'), postEnviarReporteGlobal);

// CU-REP-02/03/04. Las rutas con :tipoReporte/:id van DESPUÉS de las de /mensual/... para no taparlas.
router.get('/', requireAuth, requireRole('alumno_asignado'), getReportes);
router.get('/:tipoReporte/:id', requireAuth, requireRole('alumno_asignado'), getSeguimientoReporte);
router.get('/:tipoReporte/:id/pdf', requireAuth, requireRole('alumno_asignado'), getPdfReporte);
router.post('/:tipoReporte/:id/correccion/vista-previa', requireAuth, requireRole('alumno_asignado'), postVistaPreviaCorreccion);
router.post('/:tipoReporte/:id/correccion', requireAuth, requireRole('alumno_asignado'), postReenviarReporteCorregido);

module.exports = router;
