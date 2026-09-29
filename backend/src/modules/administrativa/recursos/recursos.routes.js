const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getRecursos, postRecurso, putRecurso, deleteRecurso, getRecursoConstanciaCreditos } = require('./recursos.controller');

const router = express.Router();

// Montado bajo '/recursos' en server.js.

// CU-GR-01: público, sin requireAuth — el alumno_sin_asignar llena este formulario ANTES de tener
// cuenta. Expone solo la URL de un recurso puntual, no el catálogo (eso sigue exclusivo de
// coordinación más abajo).
router.get('/publico/constancia-creditos', getRecursoConstanciaCreditos);

// Lectura del catálogo completo: SOLO coordinación. El acceso de alumno/profesor a la consulta de
// recursos fue retirado por decisión explícita (ya no forma parte de la tabla de referencia de
// acciones por rol).
router.get('/', requireAuth, requireRole('coordinador'), getRecursos);

// Escritura: SOLO coordinación. La protección del frontend no basta; el rol se exige aquí.
router.post('/', requireAuth, requireRole('coordinador'), postRecurso);
router.put('/:id', requireAuth, requireRole('coordinador'), putRecurso);
router.delete('/:id', requireAuth, requireRole('coordinador'), deleteRecurso);

module.exports = router;
