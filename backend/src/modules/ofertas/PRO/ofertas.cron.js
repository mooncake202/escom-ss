const cron = require('node-cron');
// `../`, no `./`: ofertas.service.js vive un nivel arriba, fuera de PRO/. La ruta estaba mal desde
// que el cron se movió a esta subcarpeta y nadie lo notó porque nunca se cargaba — arrancarlo sin
// corregirla tiraría el servidor al iniciar.
const { revisarConclusionAutomatica } = require('../ofertas.service');

// Corre una vez al día a MEDIANOCHE DE MÉXICO — revisa ofertas Aprobada y las concluye
// automáticamente si ya cumplieron RN-PRO-18/19.
//
// Medianoche México se escribe '0 6 * * *' con { timezone: 'UTC' }, no '0 0 * * *': México es UTC-6
// todo el año, así que las 06:00 UTC son las 00:00 de allá. Es la convención del proyecto
// (HANDOFF-CONVENCIONES-COMPARTIDAS.md §6) y exactamente el mismo horario y forma que ya usan
// `marcarActividadesVencidas` y `contabilizarFaltasDiarias` (ah.cron.js) y `ejecutarVencimientoReloj2`
// (gr.cron.js). La zona se declara explícita porque sin ella node-cron toma la del proceso y la hora
// dependería de dónde corra el servidor.
function iniciarCronConclusionOfertas() {
  cron.schedule('0 6 * * *', async () => {
    try {
      const total = await revisarConclusionAutomatica();
      console.log(`[ofertas.cron] Revisión de conclusión automática: ${total} oferta(s) concluida(s).`);
    } catch (err) {
      console.error('[ofertas.cron] Error al revisar conclusión automática:', err.message);
    }
  }, { timezone: 'UTC' });
  console.log('[ofertas.cron] Cron de conclusión automática de ofertas registrado (06:00 UTC = medianoche México, diario).');
}

module.exports = { iniciarCronConclusionOfertas };
