const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
try {
    const [rows] = await db.query(`
        SELECT 
        o.id,
        o.titulo,
        o.descripcion,
        o.tipo,
        o.cupos,
        p.nombre AS profesor
        FROM ofertas_servicio o
        JOIN profesores p ON o.profesor_id = p.id
        WHERE o.cupos > 0
    `);
    res.json(rows);
} catch (err) {
    res.status(500).json({ mensaje: "Error al obtener ofertas" });
}
});

module.exports = router;