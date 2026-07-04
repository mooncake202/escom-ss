const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
try {
    const [rows] = await db.query(`
    SELECT id, semestre, fechaInicio, fechaFin, fechaLimExpedi
    FROM periodo
    WHERE fechaInicio >= CURDATE()
    ORDER BY fechaInicio
    `);

    res.json(rows);
} catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener periodos" });
}
});

module.exports = router;