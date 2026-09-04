const Redis = require('ioredis');

const redis = global.__redis || new Redis(process.env.REDIS_URL);

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}

redis.on('error', (err) => {
  console.error('Error de conexión a Redis:', err.message);
});

redis.on('connect', () => {
  console.log('Conectado a Redis.');
});

module.exports = redis;
