// 04-recursos-contacto.js
//
// `recurso` (3 links institucionales reales, ya verificados contra la BD
// actual) y `contacto_institucional` (4 datos reales de ESCOM — ver fuentes
// en backend/src/seeds/README.md). Ambos quedan asociados a uno de los 2
// coordinadores compartidos (da igual cuál).

const prisma = require('../../../lib/prisma');
const coordinadoresSeed = require('./02-coordinadores');

const RECURSOS = [
  {
    nombre: 'Constancia de creditos IPN',
    url: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=2fRL-ZeAlEet9qVGbKKFY-JLdN8w-KlBnYjodQmtWMpUQVNQMjdMQVFGNkY3RzdZVUZZUFlVTTVBWi4u&route=shorturl',
    tipo: 'link_constancia_creditos',
  },
  {
    nombre: 'Plataforma SISS del IPN',
    url: 'https://serviciosocial.ipn.mx/',
    tipo: 'link_siss',
  },
  {
    nombre: 'Constancia de vigencia del seguro social IMSS',
    url: 'https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/vigencia',
    tipo: 'link_seguro_social',
  },
];

// Fuente: https://www.escom.ipn.mx/SSEIS/apoyoseducativos/servicios/servicioSocial.php
// (correo/tel./ext.) y https://www.escom.ipn.mx/SSEIS/apoyoseducativos/ (horario,
// misma ext. 52056). Ubicación: dato dado directamente por el equipo.
const CONTACTOS = [
  { tipo: 'correo', valor: 'servicio_social_escom@ipn.mx' },
  { tipo: 'telefono', valor: '5557296000 ext. 52056' },
  { tipo: 'ubicacion', valor: 'En edificio central de la ESCOM, subiendo las escaleras del lado derecho' },
  { tipo: 'horario', valor: 'Lunes a viernes de 9:00 a 15:00 y de 17:00 a 20:00 horas' },
];

async function obtenerCoordinadorId() {
  const resultado = await coordinadoresSeed.main();
  return resultado[0].coordinadorId;
}

async function crearRecursos(coordinadorId) {
  for (const r of RECURSOS) {
    const existente = await prisma.recurso.findUnique({ where: { tipo: r.tipo } });
    if (existente) {
      // Reconciliación: una corrida vieja de este archivo dejó fecha_actualizacion
      // con una fecha en vez de null (el alta real nunca la toca) — se corrige aquí.
      if (existente.fecha_actualizacion !== null) {
        await prisma.recurso.update({ where: { id: existente.id }, data: { fecha_actualizacion: null } });
        console.log(`✏️  recurso corregido: ${r.tipo} (fecha_actualizacion a null)`);
      } else {
        console.log(`↷ recurso ya existía: ${r.tipo}`);
      }
      continue;
    }
    await prisma.recurso.create({
      data: {
        coordinador_id: coordinadorId,
        nombre: r.nombre,
        url: r.url,
        tipo: r.tipo,
        fecha_registro: new Date(),
        fecha_actualizacion: null, // el alta real siempre lo deja null: "todavía no ha sido editado"
      },
    });
    console.log(`✅ recurso creado: ${r.tipo} (${r.nombre})`);
  }
}

async function crearContactos(coordinadorId) {
  for (const c of CONTACTOS) {
    const existente = await prisma.contacto_institucional.findFirst({ where: { tipo: c.tipo } });
    if (existente) {
      console.log(`↷ contacto institucional ya existía: ${c.tipo}`);
      continue;
    }
    await prisma.contacto_institucional.create({
      data: {
        coordinador_id: coordinadorId,
        tipo: c.tipo,
        valor: c.valor,
        fecha_actualizacion: new Date(),
      },
    });
    console.log(`✅ contacto institucional creado: ${c.tipo}`);
  }
}

async function main() {
  const coordinadorId = await obtenerCoordinadorId();
  await crearRecursos(coordinadorId);
  await crearContactos(coordinadorId);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en 04-recursos-contacto.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, RECURSOS, CONTACTOS };
