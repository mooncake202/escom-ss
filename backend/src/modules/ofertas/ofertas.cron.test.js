// CU-PRO-04 — el cron de conclusión automática de ofertas.
//
// Lo que se fija aquí es el CONTRATO de programación, no la lógica de negocio (esa la cubre
// ofertas.cierre.test.js): que corra diariamente a las 00:00, con zona declarada explícitamente, y
// —lo más importante— que server.js REALMENTE lo arranque. Estuvo definido y exportado pero sin
// llamarse, así que la conclusión automática no corría nunca.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const rutaCron = require.resolve('node-cron');
const rutaServicio = require.resolve('./ofertas.service');

const programados = [];

require.cache[rutaCron] = {
  id: rutaCron, filename: rutaCron, loaded: true,
  exports: {
    schedule: (expresion, tarea, opciones) => {
      programados.push({ expresion, tarea, opciones });
      return { stop: () => {} };
    },
  },
};

// El servicio real arrastra prisma/redis; aquí solo interesa el registro del cron.
let veces = 0;
require.cache[rutaServicio] = {
  id: rutaServicio, filename: rutaServicio, loaded: true,
  exports: { revisarConclusionAutomatica: async () => { veces += 1; return 0; } },
};

const { iniciarCronConclusionOfertas } = require('./PRO/ofertas.cron');

// Medianoche de MÉXICO, que en la convención del proyecto se escribe en UTC: México es UTC-6 todo
// el año, así que 06:00 UTC = 00:00 allá. Ver HANDOFF-CONVENCIONES-COMPARTIDAS.md §6.
test('el cron corre diariamente a medianoche de México (06:00 UTC)', () => {
  programados.length = 0;
  iniciarCronConclusionOfertas();

  assert.equal(programados.length, 1, 'registra exactamente una tarea');
  assert.equal(programados[0].expresion, '0 6 * * *');
  assert.notEqual(programados[0].expresion, '0 0 * * *', 'medianoche UTC serían las 18:00 en México');
});

test('el cron declara su zona explícitamente, igual que los de AH y GR', () => {
  programados.length = 0;
  iniciarCronConclusionOfertas();

  assert.equal(programados[0].opciones?.timezone, 'UTC');
});

// La convención tiene que ser la MISMA que la de los crons de medianoche ya existentes: si alguien
// cambiara uno sin el otro, esto lo señala.
test('usa exactamente el mismo horario que los crons de medianoche de AH y GR', () => {
  const fs = require('fs');
  const path = require('path');
  const leer = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

  assert.match(leer('../ah/ah.cron.js'), /cron\.schedule\('0 6 \* \* \*'/);
  assert.match(leer('../gr/gr.cron.js'), /cron\.schedule\('0 6 \* \* \*'/);

  programados.length = 0;
  iniciarCronConclusionOfertas();
  assert.equal(programados[0].expresion, '0 6 * * *');
});

test('la tarea invoca revisarConclusionAutomatica y no propaga errores', async () => {
  programados.length = 0;
  veces = 0;
  iniciarCronConclusionOfertas();

  await programados[0].tarea();
  assert.equal(veces, 1);
});

// Sin esta llamada el cron es código inerte: es justo el defecto que se corrigió.
test('server.js arranca el cron', () => {
  const servidor = fs.readFileSync(path.join(__dirname, '../../../server.js'), 'utf8');

  assert.match(servidor, /require\('\.\/src\/modules\/ofertas\/PRO\/ofertas\.cron'\)/);
  assert.match(servidor, /iniciarCronConclusionOfertas\(\);/);
});
