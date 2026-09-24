const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getRecursos, postRecurso, putRecurso, deleteRecurso } = require('./recursos.controller');

const router = express.Router();

// Montado bajo '/recursos' en server.js.

// Lectura: alumno asignado, profesor y coordinación. La lista es la misma para los tres — no hay
// nada que filtrar por rol, así que `listar()` ni siquiera recibe el usuario.
//
// `alumno_sin_asignar` queda FUERA por decisión de alcance: los recursos son del servicio en curso,
// no del trámite de registro.
router.get('/', requireAuth, requireRole('alumno_asignado', 'profesor', 'coordinador'), getRecursos);

// Escritura: SOLO coordinación. La protección del frontend no basta; el rol se exige aquí.
router.post('/', requireAuth, requireRole('coordinador'), postRecurso);
router.put('/:id', requireAuth, requireRole('coordinador'), putRecurso);
router.delete('/:id', requireAuth, requireRole('coordinador'), deleteRecurso);

module.exports = router;
