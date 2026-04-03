const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/solicitud/:usuarioId", async (req, res) => {
  try {
    const [[data]] = await db.query(`
      SELECT 
        a.nombres, a.apellidos,
        o.titulo AS vacante,
        p.nombreCompleto AS profesor,
        s.estatus, 
        s.motivacion,
        s.motivoRechazo,
        s.tipoRechazo
      FROM usuario u
      JOIN alumno a ON a.usuario_id = u.id
      JOIN solicitud s ON s.alumno_id = a.id
      JOIN oferta_servicio o ON o.id = s.oferta_id
      JOIN profesor p ON p.id = o.profesor_id
      WHERE u.id = ?
    `, [req.params.usuarioId]);

    if (!data) return res.status(404).json({ mensaje: "No se encontró solicitud" });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener datos" });
  }
});


router.post("/solicitud/:usuarioId/reset", async (req, res) => {
  try {
    console.log("🔥 aqui borrado cascada");

    // luego aquí harás el delete real
    // DELETE FROM solicitud WHERE alumno_id = ?

    res.json({ mensaje: "Solicitud reiniciadaAAAAAAAAAAAAAAAAA" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al reiniciar solicitud" });
  }
});

module.exports = router;