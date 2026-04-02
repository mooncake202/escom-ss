const bcrypt = require("bcrypt");
const db = require("./config/db");

async function hashear() {
  const hash = await bcrypt.hash("1234", 10);
  await db.query(`UPDATE usuario SET password = ? WHERE rol = 'profesor'`, [hash]);
  console.log("Contraseñas actualizadas");
  process.exit();
}

hashear();