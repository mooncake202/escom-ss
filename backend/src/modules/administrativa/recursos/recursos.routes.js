const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getRecursos, postRecurso, putRecurso, deleteRecurso } = require('./recursos.controller');

const router = express.Router();

// Montado bajo '/recursos' en server.js.

// Lectura: SOLO coordinación. El acceso de alumno/profesor a la consulta de recursos fue retirado
// por decisión explícita (ya no forma parte de la tabla de referencia de acciones por rol).
router.get('/', requireAuth, requireRole('coordinador'), getRecursos);

// Escritura: SOLO coordinación. La protección del frontend no basta; el rol se exige aquí.
router.post('/', requireAuth, requireRole('coordinador'), postRecurso);
router.put('/:id', requireAuth, requireRole('coordinador'), putRecurso);
router.delete('/:id', requireAuth, requireRole('coordinador'), deleteRecurso);

module.exports = router;
