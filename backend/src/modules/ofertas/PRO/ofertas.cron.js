const cron = require('node-cron');
const { revisarConclusionAutomatica } = require('./ofertas.service');

// Corre una vez al día, a las 03:00 UTC — revisa ofertas Aprobada y las
// concluye automáticamente si ya cumplieron RN-PRO-18/19.
function iniciarCronConclusionOfertas() {
  cron.schedule('0 3 * * *', async () => {
    try {
      const total = await revisarConclusionAutomatica();
      console.log(`[ofertas.cron] Revisión de conclusión automática: ${total} oferta(s) concluida(s).`);
    } catch (err) {
      console.error('[ofertas.cron] Error al revisar conclusión automática:', err.message);
    }
  });
  console.log('[ofertas.cron] Cron de conclusión automática de ofertas registrado (03:00 UTC diario).');
}

module.exports = { iniciarCronConclusionOfertas };
