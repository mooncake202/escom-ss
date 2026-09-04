const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { getResumen } = require('./dashboard.controller');

const router = express.Router();

router.get('/resumen', requireAuth, getResumen);

module.exports = router;
