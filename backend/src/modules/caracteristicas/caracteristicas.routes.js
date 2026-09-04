const express = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, requireRole('coordinador'), async (req, res) => {
  try {
    const caracteristicas = await prisma.caracteristica.findMany({
      orderBy: { nombre: 'asc' },
    });
    return res.status(200).json(caracteristicas);
  } catch (err) {
    console.error('Error al listar características:', err);
    return res.status(500).json({ message: 'No se pudieron cargar las características.' });
  }
});

module.exports = router;
