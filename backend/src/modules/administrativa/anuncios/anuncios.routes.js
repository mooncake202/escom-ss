const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getAnuncios, postVisto, getMisAnuncios, postAnuncio } = require('./anuncios.controller');

const router = express.Router();

// Montado bajo '/anuncios' en server.js.
//
// No hay PUT ni DELETE a propósito: un anuncio publicado es registro histórico, no se edita ni se
// borra.

// ── CU-ADM-02 · Alumno ──────────────────────────────────────────────────────
// Solo 'alumno_asignado': quien sigue en registro (alumno_sin_asignar) no tiene profesor ni
// asignación y no entra a esta sección.

// Anuncios de Coordinación + los de SU profesor actual. Acepta ?limite=N para el resumen del
// dashboard, con la MISMA regla de visibilidad.
router.get('/', requireAuth, requireRole('alumno_asignado'), getAnuncios);

// Acuse de lectura. Revalida la visibilidad: un id ajeno no sirve de nada.
router.post('/:id/visto', requireAuth, requireRole('alumno_asignado'), postVisto);

// ── CU-ADM-07 · Profesor y Coordinación ─────────────────────────────────────
// Se declara ANTES de nada que pueda taparla, y el autor sale del token en ambas.

// Historial propio de quien publica.
router.get('/mios', requireAuth, requireRole('profesor', 'coordinador'), getMisAnuncios);

// Publicar. El origen lo decide el rol del token, no el cuerpo.
router.post('/', requireAuth, requireRole('profesor', 'coordinador'), postAnuncio);

module.exports = router;
