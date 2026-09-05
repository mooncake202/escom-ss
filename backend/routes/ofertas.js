const express = require("express");
const router = express.Router();
const ofertasController = require("../controllers/ofertasController");

router.post("/", ofertasController.solicitarRegistroOferta); // CU-PRO-01

module.exports = router;