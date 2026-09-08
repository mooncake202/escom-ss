const express = require('express');
const { getOfertas, getPerfiles } = require('./ofertas.controller');

const router = express.Router();

// Públicas: se consultan desde /registro antes de que exista sesión.
router.get('/', getOfertas);
router.get('/perfiles', getPerfiles);

module.exports = router;
