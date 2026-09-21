// Prisma y Redis falsos en memoria para las pruebas del calendario (no es un test; no toca BD ni Redis).

const igual = (a, b) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b);

function coincideCampo(valor, condicion) {
  if (condicion === null) return valor === null;
  if (condicion instanceof Date || typeof condicion !== 'object') return igual(valor, condicion);
  return Object.entries(condicion).every(([operador, ref]) => {
    switch (operador) {
      case 'in': return ref.includes(valor);
      case 'not': return !igual(valor, ref);
      case 'lte': return valor !== null && valor.getTime() <= ref.getTime();
      case 'gte': return valor !== null && valor.getTime() >= ref.getTime();
      default: throw new Error(`Operador no soportado por el fake: ${operador}`);
    }
  });
}

function coincide(fila, where = {}) {
  return Object.entries(where).every(([campo, condicion]) => {
    if (campo === 'AND') return condicion.every((c) => coincide(fila, c));
    if (campo === 'OR') return condicion.some((c) => coincide(fila, c));
    return coincideCampo(fila[campo], condicion);
  });
}

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
const horaUtc = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

/** Fila de evento_calendario tal como la devuelve Prisma. */
const evento = (id, tipo, fechaInicio, extra = {}) => ({
  id,
  coordinador_id: 1,
  nombre: `Evento ${id}`,
  tipo,
  fecha_inicio: utc(fechaInicio),
  fecha_fin: null,
  hora: null,
  ...extra,
});

function crearPrismaFalso({ eventos = [], periodos = [], coordinadores = [{ id: 1, usuario_id: 10 }] } = {}) {
  const estado = {
    eventos: eventos.map((e) => ({ ...e })),
    periodos: periodos.map((p) => ({ ...p })),
    escrituras: 0,
    fallarAlCrearPeriodo: false,
  };
  let siguienteEvento = Math.max(0, ...estado.eventos.map((e) => e.id)) + 1;
  let siguientePeriodo = Math.max(0, ...estado.periodos.map((p) => p.id)) + 1;

  const conRelacion = (fila, include) => {
    if (!fila) return null;
    if (!include?.periodo_registro) return { ...fila };
    return { ...fila, periodo_registro: estado.periodos.find((p) => p.evento_calendario_id === fila.id) ?? null };
  };

  const prisma = {
    estado,
    coordinador: {
      findUnique: async ({ where }) => coordinadores.find((c) => c.usuario_id === where.usuario_id) ?? null,
    },
    evento_calendario: {
      findMany: async ({ where, include, orderBy }) => {
        const filas = estado.eventos.filter((e) => coincide(e, where));
        if (orderBy) filas.sort((a, b) => a.fecha_inicio - b.fecha_inicio || a.id - b.id);
        return filas.map((f) => conRelacion(f, include));
      },
      findUnique: async ({ where, include }) => conRelacion(estado.eventos.find((e) => e.id === where.id), include),
      findFirst: async ({ where }) => {
        const fila = estado.eventos.find((e) => coincide(e, where));
        return fila ? { ...fila } : null;
      },
      create: async ({ data }) => {
        estado.escrituras++;
        const fila = { id: siguienteEvento++, ...data };
        estado.eventos.push(fila);
        return { ...fila };
      },
      update: async ({ where, data }) => {
        estado.escrituras++;
        const fila = estado.eventos.find((e) => e.id === where.id);
        Object.assign(fila, data);
        return { ...fila };
      },
      delete: async ({ where }) => {
        estado.escrituras++;
        estado.eventos = estado.eventos.filter((e) => e.id !== where.id);
      },
    },
    periodo_registro: {
      create: async ({ data }) => {
        if (estado.fallarAlCrearPeriodo) throw new Error('Fallo simulado al crear periodo_registro');
        estado.escrituras++;
        const fila = { id: siguientePeriodo++, ...data };
        estado.periodos.push(fila);
        return { ...fila };
      },
    },
    // Transacción atómica simulada: si algo lanza, se restaura el estado anterior.
    $transaction: async (funcion) => {
      const respaldo = structuredClone({ eventos: estado.eventos, periodos: estado.periodos });
      try {
        return await funcion(prisma);
      } catch (err) {
        estado.eventos = respaldo.eventos;
        estado.periodos = respaldo.periodos;
        throw err;
      }
    },
  };
  return prisma;
}

/** modo: 'ok' | 'error' (rechaza) | 'colgado' (nunca responde). */
function crearRedisFalso({ modo = 'ok' } = {}) {
  const datos = new Map();
  const llamadas = [];
  const operar = (operacion, args, accion) => {
    llamadas.push([operacion, ...args]);
    if (modo === 'error') return Promise.reject(new Error('Redis caído (simulado)'));
    if (modo === 'colgado') return new Promise(() => {});
    return Promise.resolve(accion());
  };
  return {
    datos,
    llamadas,
    get: (clave) => operar('get', [clave], () => datos.get(clave) ?? null),
    set: (...args) => operar('set', args, () => { datos.set(args[0], args[1]); return 'OK'; }),
    del: (clave) => operar('del', [clave], () => (datos.delete(clave) ? 1 : 0)),
  };
}

module.exports = { crearPrismaFalso, crearRedisFalso, evento, utc, horaUtc };
