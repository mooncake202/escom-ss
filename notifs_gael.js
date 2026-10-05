const prisma = require('/app/backend/src/lib/prisma');
(async () => {
  const alumno = await prisma.alumno.findUnique({ where: { boleta: '2022637765' } });
  const notifs = await prisma.notificacion.findMany({
    where: { usuario_id: alumno.usuario_id, leida: false, ruta_relacionada: { startsWith: '/alumno/historial' } },
    orderBy: { fecha_creacion: 'desc' },
  });
  console.log('usuario_id:', alumno.usuario_id);
  console.log(JSON.stringify(notifs, null, 2));
  process.exit(0);
})();
