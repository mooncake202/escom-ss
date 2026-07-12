const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
try {
    const [rows] = await db.query(`
    SELECT 
        pr.id,
        pr.anio,
        pr.semestre,
        ec.fecha_inicio AS fechaInicio,
        ec.fecha_fin AS fechaFin,
        pr.fecha_max_expediente AS fechaLimExpedi
      FROM periodo_registro pr
      JOIN evento_calendario ec ON pr.evento_calendario_id = ec.id
      WHERE ec.fecha_inicio >= CURDATE()
      ORDER BY ec.fecha_inicio
    `);

    res.json(rows);
} catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener periodos, FPJS" });
}
});

module.exports = router;