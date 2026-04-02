const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET solicitudes pendientes del profesor
router.get("/:usuarioId/solicitudes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id,
        CONCAT(a.nombres, ' ', a.apellidos) AS nombre,
        a.boleta,
        a.carrera,
        u.correoInst,
        a.correoPersonal,
        a.telefono,
        a.creditos,
        p.fechaInicio AS periodoInicio,
        p.fechaFin AS periodoFin,
        s.fechaCreacion,
        o.titulo AS tituloOferta,
        s.motivacion,
        s.estatus
      FROM solicitud s
      JOIN alumno a ON a.id = s.alumno_id
      JOIN usuario u ON u.id = a.usuario_id
      JOIN oferta_servicio o ON o.id = s.oferta_id
      JOIN periodo p ON p.id = s.periodo_id
      JOIN profesor pr ON pr.id = o.profesor_id
      WHERE pr.usuario_id = ?
      AND s.estatus = 'espera_respuesta_de_profesor'
    `, [req.params.usuarioId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener solicitudes" });
  }
});

// POST aceptar o rechazar solicitud
router.post("/solicitudes/:solicitudId/decidir", async (req, res) => {
  const { decision } = req.body; // "aceptar" o "rechazar"
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (decision === "aceptar") {
      // Cambiar estatus de la solicitud
      await connection.query(
        `UPDATE solicitud SET estatus = 'espera_validacion_documentacion_y_registroSISS' WHERE id = ?`,
        [req.params.solicitudId]
      );
      // Crear registro en solicitud_revision
      await connection.query(
        `INSERT INTO solicitud_revision (solicitud_id, etapa, estado)
         VALUES (?, 'documentacion_y_registroSISS', 'pendiente')`,
        [req.params.solicitudId]
      );
    } else {
      // Rechazar — guardar motivo (sin borrar aún)
      await connection.query(
        `UPDATE solicitud 
        SET estatus = 'espera_respuesta_de_profesor',
            motivoRechazo = 'No cumple con el perfil requerido',
            tipoRechazo = 'definitivo'
        WHERE id = ?`,
        [req.params.solicitudId]
      );

      // 🔥 LOG TEMPORAL
      console.log("⚠️ borrado en cascada activado (pendiente implementación)");
    }

    await connection.commit();
    connection.release();
    res.json({ mensaje: decision === "aceptar" ? "Solicitud aceptada" : "Solicitud rechazada" });

  } catch (err) {
    if (connection) { await connection.rollback(); connection.release(); }
    console.error(err);
    res.status(500).json({ mensaje: "Error al procesar decisión" });
  }
});

module.exports = router;