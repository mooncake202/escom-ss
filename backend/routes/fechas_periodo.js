const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {

try {

    const [rows] = await db.query(`
    SELECT id, fecha_inicio, fecha_fin
    FROM periodos
    WHERE fecha_inicio >= CURDATE()
    AND activo = 1
    ORDER BY fecha_inicio
    `);

    res.json(rows);

} catch (error) {

    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener periodos" });

}

});

module.exports = router;