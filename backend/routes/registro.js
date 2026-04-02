const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcrypt");
const db      = require("../config/db");

// ── Validaciones ───────────────────────────────────────────────
const correoInstRegex     = /^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/;
const correoPersonalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefonoRegex       = /^[2-9]\d{9}$/;
const nombresRegex        = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)*$/;
const apellidosRegex      = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)+$/;
const boletaRegex         = /^(19|20)\d{2}63\d{4}$/;
const passwordRegex       = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validar(data) {
  if (!data.correoInst)                                      return "Correo institucional requerido";
  if (!correoInstRegex.test(data.correoInst.trim()))         return "Correo institucional inválido";
  if (!data.correoPersonal)                                  return "Correo personal requerido";
  if (!correoPersonalRegex.test(data.correoPersonal.trim())) return "Correo personal inválido";
  if (!data.telefono)                                        return "Teléfono requerido";
  if (!telefonoRegex.test(data.telefono))                    return "Número de teléfono inválido";
  if (!data.nombres)                                         return "Nombres requerido";
  if (!nombresRegex.test(data.nombres.trim().toUpperCase())) return "Nombres inválido";
  if (!data.apellidos)                                       return "Apellidos requerido";
  if (!apellidosRegex.test(data.apellidos.trim().toUpperCase())) return "Apellidos inválido";
  if (!data.boleta)                                          return "Boleta requerida";
  if (!boletaRegex.test(data.boleta))                        return "Boleta inválida para ESCOM";
  if (!data.carrera)                                         return "Selecciona una carrera";
  if (!data.creditos)                                        return "Porcentaje de créditos requerido";
  if (data.creditos < 70)                                    return "Necesitas mínimo el 70% de créditos";
  if (!data.periodo)                                         return "Selecciona un periodo";
  if (!data.oferta)                                          return "Selecciona una oferta";
  if (!data.password)                                        return "Crea una contraseña";
  if (!passwordRegex.test(data.password.trim()))             return "Contraseña débil: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo";
  if (data.password.trim() !== data.confirmarPassword)       return "Las contraseñas no coinciden";
  if (!data.motivacion)                                      return "Ingresa tu motivación y aportaciones que harías a la oferta";
  return null;
}

// ── POST /registro ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  let connection;
  try {
    const data = req.body;

    // 1. Validar campos
    const error = validar(data);
    if (error) return res.status(400).json({ mensaje: error });

    const correoInst     = data.correoInst.trim();
    const correoPersonal = data.correoPersonal.trim();
    const password       = data.password.trim();
    const nombres       = data.nombres.trim().toUpperCase();
    const apellidos     = data.apellidos.trim().toUpperCase();


    // 2. Verificar correo y boleta duplicado
    const [[existente]] = await db.query(
      `SELECT id FROM usuario WHERE correoInst = ?`,
      [correoInst]
    );
    if (existente) {
      return res.status(400).json({ mensaje: "Este correo ya está registrado" });
    }

    const [[existe]]=await db.query(
      `SELECT id FROM alumno WHERE boleta = ?`,
      [data.boleta]
    );
    if (existe) {
      return res.status(400).json({ mensaje: "Esta boleta ya está registrada" });
    }


    // 3. Transacción
    connection = await db.getConnection();
    await connection.beginTransaction();



    // Reducir cupos de forma atómica
    const [[oferta]] = await connection.query(
      `SELECT o.cuposTotales,
        COUNT(s.id) AS ocupados
      FROM oferta_servicio o
      LEFT JOIN solicitud s ON s.oferta_id = o.id 
        AND s.estatus != 'espera_respuesta_de_profesor'
      WHERE o.id = ?
      GROUP BY o.id`,
      [data.oferta]
    );
    if (!oferta || (oferta.cuposTotales - oferta.ocupados) <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: "Lo sentimos, el cupo se acaba de llenar" });
    }



    

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [usuario] = await connection.query(
      `INSERT INTO usuario (correoInst, password, rol) VALUES (?, ?, ?)`,
      [correoInst, hashedPassword, "alumno_sin_asignar"]
    );
    const usuarioId = usuario.insertId;

    // Insertar alumno
    const [alumno] = await connection.query(
      `INSERT INTO alumno (usuario_id, nombres, apellidos, boleta, carrera, telefono, correoPersonal, creditos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, nombres, apellidos, data.boleta, data.carrera, data.telefono, correoPersonal, data.creditos]
    );
    const alumnoId = alumno.insertId;

    // Insertar solicitud
    await connection.query(
      `INSERT INTO solicitud 
      (alumno_id, oferta_id, periodo_id, estatus, motivacion, motivoRechazo, tipoRechazo, registroSISSConfirmado, cartaCompromisoConfirmada, fechaCreacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        alumnoId,
        data.oferta,
        data.periodo,
        "espera_respuesta_de_profesor",
        data.motivacion,
        null,
        "ninguno",
        false,
        false
      ]
    );

    




    await connection.commit();
    connection.release();

    res.json({ mensaje: "Registro exitoso" });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ mensaje: "Este correo ya está registrado" });
    }
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;