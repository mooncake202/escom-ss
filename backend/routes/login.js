const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {

  try {

    const { correoInst, password } = req.body;

    if (!correoInst || !password) {
      return res.status(400).json({
        mensaje: "Correo y contraseña requeridos"
      });
    }

    const [[usuario]] = await db.query(
      `SELECT u.id, u.correoInst, u.password, u.rol,
              s.estatus, s.tipoRechazo, s.estatusAnterior, s.motivoRechazo,
              
              s.registroSISSConfirmado, s.cartaCompromisoConfirmada,
              (SELECT COUNT(*) FROM solicitud_documentos sd WHERE sd.solicitud_id = s.id) AS numDocumentos
      FROM usuario u
      LEFT JOIN alumno a ON a.usuario_id = u.id
      LEFT JOIN solicitud s ON s.alumno_id = a.id
      WHERE u.correoInst = ?`,
      [correoInst.trim()]
    );

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    res.json({
      mensaje: "Login correcto",
      usuario: {
        id: usuario.id,
        correo: usuario.correoInst,
        rol: usuario.rol,
        estatus: usuario.estatus || null,
        tipoRechazo: usuario.tipoRechazo || "ninguno",
        estatusAnterior: usuario.estatusAnterior || null,
        motivoRechazo: usuario.motivoRechazo || null,
        registroSISSConfirmado: usuario.registroSISSConfirmado || false,
        cartaCompromisoConfirmada: usuario.cartaCompromisoConfirmada || false,
        numDocumentos: usuario.numDocumentos || 0
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      mensaje: "Error en el servidor"
    });

  }

});

module.exports = router;