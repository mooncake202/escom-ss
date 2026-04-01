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
      `SELECT id, correoInst, password, rol
       FROM usuario
       WHERE correoInst = ?`,
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
        rol: usuario.rol
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