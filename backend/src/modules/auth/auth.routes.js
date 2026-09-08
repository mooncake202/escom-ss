const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { postLogin, postLogout } = require('./auth.controller');

const router = express.Router();

router.post('/login', postLogin);
router.post('/logout', requireAuth, postLogout);

module.exports = router;