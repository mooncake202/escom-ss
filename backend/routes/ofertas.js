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
        o.actividades,
        o.tipo,
        o.cuposTotales,
        (o.cuposTotales + IFNULL(o.cuposExtraInvestigador,0) - COUNT(s.id)) AS cuposDisponibles,
        p.nombreCompleto AS profesor,
        GROUP_CONCAT(pd.nombre ORDER BY pd.nombre SEPARATOR ',') AS perfiles
        FROM oferta_servicio o
        JOIN profesor p ON o.profesor_id = p.id
        LEFT JOIN solicitud s ON s.oferta_id = o.id 
            AND s.estatus != 'espera_respuesta_de_profesor'
        LEFT JOIN oferta_perfilDeseado opd ON o.id = opd.oferta_id
        LEFT JOIN perfilDeseado pd ON opd.perfil_id = pd.id
        WHERE o.estado = 'activa'
        GROUP BY o.id, o.titulo, o.descripcion, o.actividades, o.tipo, o.cuposTotales, p.nombreCompleto
        HAVING cuposDisponibles > 0
    `);



    res.json(rows);
} catch (err) {
    res.status(500).json({ mensaje: "Error al obtener ofertas" });
}
});

router.get("/perfiles", async (req, res) => {
    try {
        const [perfiles] = await db.query(`SELECT id, nombre FROM perfilDeseado ORDER BY nombre`);
        res.json(perfiles);
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener perfiles" });
    }
});




module.exports = router;