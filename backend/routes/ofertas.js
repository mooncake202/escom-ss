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
        o.cuposTotales,
        p.nombreCompleto AS profesor
        FROM oferta_servicio o
        JOIN profesor p ON o.profesor_id = p.id
        WHERE o.cuposTotales > 0
    `);
    res.json(rows);
} catch (err) {
    res.status(500).json({ mensaje: "Error al obtener ofertas" });
}
});

module.exports = router;