const express = require('express');
const { getPeriodos } = require('./periodos.controller');

const router = express.Router();

// Pública: se consulta desde /registro antes de que exista sesión.
router.get('/', getPeriodos);

module.exports = router;
