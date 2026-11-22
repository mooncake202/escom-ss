// 01-profesores.js — amd-pro-rep
//
// Mis 3 profesores (CU-CRED-03 real vía crearProfesor de _helpers.js):
//   P1 profesorlozano  — Jefe de departamento (6 cupos) — casos de REP
//   P2 profesorsalinas — base (3 cupos)                 — casos de PRO
//   P3 profesoraguirre — base (3 cupos)                 — bajas y anuncios (ADM)
// creado_por_id = coordinadorherrera (buscado por correo; solo se referencia).
// Idempotente: si el correo ya existe, se salta.

const prisma = require('../../../lib/prisma');
const { PROFESORES, CORREO_COORDINADOR_CREADOR, FECHA_CREACION_PROFESORES } = require('./_datos');
const { crearProfesor } = require('./_helpers');

async function main() {
  const creador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR_CREADOR } });
  if (!creador || creador.rol !== 'coordinador') {
    throw new Error(`No existe el coordinador ${CORREO_COORDINADOR_CREADOR}; corre primero 00-comun.`);
  }

  const resultado = {};
  for (const p of Object.values(PROFESORES)) {
    resultado[p.clave] = await crearProfesor(p, creador.id);
    // Alta con fecha anterior a su primera oferta (solo mis filas; idempotente).
    await prisma.usuario.update({
      where: { id: resultado[p.clave].usuarioId },
      data: { fecha_creacion: new Date(FECHA_CREACION_PROFESORES) },
    });
  }
  return resultado;
}

module.exports = { main };
