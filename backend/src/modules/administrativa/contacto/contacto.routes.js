const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getContactos, postContacto, putContacto, deleteContacto } = require('./contacto.controller');

const router = express.Router();

// Montado bajo '/contacto-institucional' en server.js.

// Lectura: alumno asignado (su pantalla "Coordinación"), profesor y coordinación. La lista es la
// misma para los tres — `listar()` ni siquiera recibe el usuario.
router.get('/', requireAuth, requireRole('alumno_asignado', 'profesor', 'coordinador'), getContactos);

// Escritura: SOLO coordinación. El rol se exige aquí, no solo en el frontend.
router.post('/', requireAuth, requireRole('coordinador'), postContacto);
router.put('/:id', requireAuth, requireRole('coordinador'), putContacto);
router.delete('/:id', requireAuth, requireRole('coordinador'), deleteContacto);

module.exports = router;
