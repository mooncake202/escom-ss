// CU-PRO-03 — consulta de ofertas por Coordinación: validación del filtro de tipo, búsqueda
// insensible a mayúsculas y acentos, y el aviso por socket a los demás coordinadores cuando se
// decide una oferta (CU-PRO-02 → esta pantalla).
//
// Tres comportamientos que antes no estaban cubiertos por nada:
//   · un `tipo` fuera del enum llegaba al `where` y Prisma lanzaba un error sin `status`, que el
//     controller traducía a 500 en vez de 400;
//   · la búsqueda era sensible a acentos: "integracion" no encontraba "integración";
//   · la decisión no avisaba a los demás coordinadores, así que su bandeja quedaba desactualizada.
//
// Prisma, redis, notificaciones y sockets se sustituyen ANTES de cargar el servicio.

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearBd, profesor, ofertaProyecto, ofertaIndividual } = require('./ofertas.fakes');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let prismaActual = null;
let bd = null;
const emitidos = [];

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, { del: async () => {} });
fingir(rutaNotificaciones, { crearNotificacion: async () => {} });
fingir(rutaSocket, { emitirAUsuario: (usuarioId, evento, datos) => { emitidos.push({ usuarioId, evento, datos }); } });
fingir(rutaPrisma, new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }));

const servicio = require('./ofertas.service');

const COORDINADOR_A = 7;
const COORDINADOR_B = 8;
const DATOS_APROBACION = { programaSISS: 'Programa X', actividadSISS: 'Actividad Y' };

// Dos coordinadores reales, para poder afirmar a quién llega el aviso y a quién no.
const COORDINADORES = [
  { id: COORDINADOR_A, usuario_id: 900 },
  { id: COORDINADOR_B, usuario_id: 901 },
];

// `consultarOfertas` consulta `oferta_servicio.findMany` y, vía construirContextoCupos,
// `solicitud_registro.findMany`. El fake del módulo no los implementa, así que se añaden aquí sin
// tocarlo: aplican el mismo `where` que usa el servicio.
function montar({ ofertas = [], profesores = [profesor()] } = {}) {
  const creada = crearBd({ profesores, ofertas, ocupantes: [] });
  bd = creada.bd;
  prismaActual = new Proxy(creada.prisma, {
    get: (destino, propiedad) => {
      if (propiedad === 'coordinador') {
        return {
          findMany: async ({ select } = {}) => COORDINADORES.map((c) => (select?.id ? c : { usuario_id: c.usuario_id })),
          findUnique: async ({ where }) => COORDINADORES.find((c) => c.usuario_id === where.usuario_id) ?? null,
        };
      }
      if (propiedad === 'solicitud_registro') {
        return { ...destino.solicitud_registro, findMany: async () => [] };
      }
      if (propiedad === 'oferta_servicio') {
        return {
          ...destino.oferta_servicio,
          findMany: async ({ where = {} }) => bd.ofertas
            .filter((o) => {
              const e = where.estado_oferta;
              const coincideEstado = e === undefined
                || (typeof e === 'string' ? o.estado_oferta === e : e.in.includes(o.estado_oferta));
              const coincideTipo = where.tipo_oferta === undefined || o.tipo_oferta === where.tipo_oferta;
              return coincideEstado && coincideTipo;
            })
            .map((o) => ({
              ...o,
              fecha_registro: o.fecha_registro ?? new Date('2026-09-20T00:00:00Z'),
              profesor: { ...bd.profesores.find((p) => p.id === o.profesor_id) },
              deseo_de_carrera: [],
            })),
        };
      }
      return destino[propiedad];
    },
  });
  emitidos.length = 0;
  return bd;
}

// Profesores con nombres que distinguen acentos y mayúsculas.
const PROFESORES = [
  profesor({ id: 1, usuarioId: 10, nombre: 'Ramón', apellidos: 'Pérez Gómez' }),
  profesor({ id: 2, usuarioId: 11, nombre: 'Ana', apellidos: 'Torres Vega' }),
];

const OFERTAS = [
  { ...ofertaProyecto({ id: 1, profesorId: 1, cuposOfertados: 3, estado: 'pendiente_revision' }), nombre_proyecto: 'Prueba de integración' },
  { ...ofertaIndividual({ id: 2, profesorId: 2, estado: 'pendiente_revision' }), nombre_proyecto: 'Apoyo en laboratorio' },
  { ...ofertaProyecto({ id: 3, profesorId: 1, cuposOfertados: 2, estado: 'aprobada' }), nombre_proyecto: 'Análisis de datos' },
  { ...ofertaIndividual({ id: 4, profesorId: 2, estado: 'rechazada' }), nombre_proyecto: 'Sin descripción clara' },
];

const consultar = (opciones) => servicio.consultarOfertas(opciones);
const ids = (r) => r.map((o) => o.id).sort((a, b) => a - b);

test.beforeEach(() => { montar({ ofertas: OFERTAS, profesores: PROFESORES }); });

// ════════════════════════════════════════════════════════════════════════════
// A — el filtro de tipo se valida antes de llegar al `where`
// ════════════════════════════════════════════════════════════════════════════

test('PRO-03: un `tipo` fuera del enum da 400, no 500', async () => {
  for (const malo of ['basura', 'INDIVIDUAL', 'Proyecto', 'individual ', '1']) {
    await assert.rejects(
      consultar({ vista: 'pendientes', tipoOferta: malo }),
      (err) => err.status === 400 && /tipo_oferta debe ser/.test(err.message),
      JSON.stringify(malo),
    );
  }
});

test('PRO-03: los dos tipos válidos filtran, y sin tipo no se filtra', async () => {
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', tipoOferta: 'proyecto' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', tipoOferta: 'individual' })), [2]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes' })), [1, 2]);
});

test('PRO-03: la validación de `vista` sigue intacta', async () => {
  for (const mala of ['otra', '', undefined, null]) {
    await assert.rejects(
      consultar({ vista: mala }),
      (err) => err.status === 400 && /vista debe ser/.test(err.message),
      JSON.stringify(mala),
    );
  }
});

// La constante es la MISMA que usan el registro y el reenvío: si alguien la cambiara en un solo
// sitio, esta prueba lo caza.
test('PRO-03: TIPOS_OFERTA es la única fuente de los tipos permitidos', () => {
  assert.deepEqual([...servicio.TIPOS_OFERTA], ['individual', 'proyecto']);
  assert.ok(Object.isFrozen(servicio.TIPOS_OFERTA));
  assert.equal(servicio.MENSAJE_TIPO_OFERTA_INVALIDO, "tipo_oferta debe ser 'individual' o 'proyecto'.");
});

// ════════════════════════════════════════════════════════════════════════════
// B — búsqueda insensible a mayúsculas y a acentos, en los mismos 4 campos
// ════════════════════════════════════════════════════════════════════════════

test('PRO-03: busca por nombre de oferta ignorando acentos en los dos sentidos', async () => {
  // El dato guardado lleva acento y el término no.
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'integracion' })), [1]);
  // Y al revés: término con acento, y también la forma exacta.
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'integración' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'historial', busqueda: 'analisis' })), [3]);
  assert.deepEqual(ids(await consultar({ vista: 'historial', busqueda: 'descripcion' })), [4]);
});

test('PRO-03: busca ignorando mayúsculas', async () => {
  for (const termino of ['INTEGRACION', 'Integración', 'iNtEgRaCiOn']) {
    assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: termino })), [1], termino);
  }
});

test('PRO-03: siguen siendo los mismos 4 campos — nombre, apellidos y nombre completo', async () => {
  // nombre del profesor, con y sin acento
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'ramon' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'Ramón' })), [1]);
  // apellidos
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'perez' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'gomez' })), [1]);
  // nombre completo concatenado: no coincide con ninguno de los campos por separado
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'ramon perez' })), [1]);
  // otro profesor, sin acentos de por medio
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'torres' })), [2]);
});

test('PRO-03: un término sin coincidencias devuelve lista vacía', async () => {
  assert.deepEqual(await consultar({ vista: 'pendientes', busqueda: 'zzzz' }), []);
  assert.deepEqual(await consultar({ vista: 'historial', busqueda: 'zzzz' }), []);
});

test('PRO-03: la búsqueda se combina con el filtro de tipo', async () => {
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'a', tipoOferta: 'individual' })), [2]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'integracion', tipoOferta: 'individual' })), []);
});

// ════════════════════════════════════════════════════════════════════════════
// E — la decisión avisa a los DEMÁS coordinadores
// ════════════════════════════════════════════════════════════════════════════

const avisosActualizada = () => emitidos.filter((e) => e.evento === 'oferta:actualizada');
const avisosDecidida = () => emitidos.filter((e) => e.evento === 'oferta:decidida');

test('PRO-03/02: aprobar avisa a los otros coordinadores y NO a quien decidió', async () => {
  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })], profesores: [profesor({ cuposTotales: 5 })] });

  await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_A);

  const avisos = avisosActualizada();
  assert.equal(avisos.length, 1, 'solo al coordinador B');
  assert.equal(avisos[0].usuarioId, 901, 'el usuario_id de B');
  assert.deepEqual(avisos[0].datos, { ofertaId: 1, decididaPor: COORDINADOR_A });
  assert.ok(!avisos.some((e) => e.usuarioId === 900), 'A no recibe su propio evento');
});

test('PRO-03/02: rechazar avisa igual a los otros coordinadores', async () => {
  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })], profesores: [profesor({ cuposTotales: 5 })] });

  await servicio.decidirOferta(1, 'rechazar', 'No procede.', null, COORDINADOR_B);

  const avisos = avisosActualizada();
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].usuarioId, 900, 'ahora el excluido es B, así que recibe A');
  assert.deepEqual(avisos[0].datos, { ofertaId: 1, decididaPor: COORDINADOR_B });
});

// El aviso al profesor es otro evento y no debe haber cambiado.
test('PRO-03/02: `oferta:decidida` al profesor sigue intacto en ambas ramas', async () => {
  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })], profesores: [profesor({ cuposTotales: 5 })] });
  await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_A);
  assert.equal(avisosDecidida().length, 1);
  assert.equal(avisosDecidida()[0].usuarioId, 10, 'al usuario_id del profesor');
  assert.deepEqual(avisosDecidida()[0].datos, { ofertaId: 1, resultado: 'aprobada' });

  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })], profesores: [profesor({ cuposTotales: 5 })] });
  await servicio.decidirOferta(1, 'rechazar', 'No.', null, COORDINADOR_A);
  assert.equal(avisosDecidida().length, 1);
  assert.deepEqual(avisosDecidida()[0].datos, { ofertaId: 1, resultado: 'rechazada' });
});

// Sin exclusión, el broadcast sigue llegando a todos: es lo que hacen el registro y el reenvío.
test('PRO-03: emitirATodosLosCoordinadores sin exclusión avisa a todos', async () => {
  montar({ ofertas: [] });

  await servicio.emitirATodosLosCoordinadores('oferta:actualizada', { ofertaId: 99 });

  assert.deepEqual(avisosActualizada().map((e) => e.usuarioId).sort(), [900, 901]);
});

// ════════════════════════════════════════════════════════════════════════════
// El término de búsqueda se recorta (solo los extremos)
// ════════════════════════════════════════════════════════════════════════════
//
// Antes, "  integracion  " devolvía 0 resultados aunque "integracion" sí encontrara la oferta: el
// término llegaba crudo al `includes`. El recorte además decide si HAY búsqueda, así que un texto
// de solo espacios equivale a no buscar en vez de no encontrar nada. Mismo criterio que
// `filtrarPorAlumno` de CU-REP-05, que ya recortaba.

test('PRO-03: espacios al inicio, al final y en ambos lados encuentran lo mismo', async () => {
  const esperado = [1];
  for (const termino of ['integracion', ' integracion', 'integracion ', '   integracion   ', '\tintegracion\n']) {
    assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: termino })), esperado, JSON.stringify(termino));
  }
});

test('PRO-03: un término de solo espacios equivale a NO buscar, no a 0 resultados', async () => {
  const sinBusqueda = ids(await consultar({ vista: 'pendientes' }));
  assert.deepEqual(sinBusqueda, [1, 2], 'control: sin búsqueda salen las dos pendientes');

  for (const vacio of ['   ', '\t', '\n', '  \t\n  ', '']) {
    assert.deepEqual(
      ids(await consultar({ vista: 'pendientes', busqueda: vacio })),
      sinBusqueda,
      JSON.stringify(vacio),
    );
  }
});

// El recorte es SOLO de los extremos: el espacio de dentro es parte del término.
test('PRO-03: el espacio interior se conserva', async () => {
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'Prueba de' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: '  Prueba de  ' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: 'Pruebade' })), [], 'sin el espacio no coincide');
  // Nombre completo del profesor: dos palabras separadas por espacio.
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: '  ramon perez  ' })), [1]);
});

test('PRO-03: el término recortado se combina con el filtro de modalidad', async () => {
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: '  integracion  ', tipoOferta: 'proyecto' })), [1]);
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: '  integracion  ', tipoOferta: 'individual' })), []);
  // Solo espacios + filtro: el filtro sigue aplicando, la búsqueda no.
  assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: '   ', tipoOferta: 'individual' })), [2]);
});

test('PRO-03: un término recortado sin coincidencias sigue devolviendo lista vacía', async () => {
  for (const termino of ['zzzz', '  zzzz  ', '\tzzzz\n']) {
    assert.deepEqual(await consultar({ vista: 'pendientes', busqueda: termino }), [], JSON.stringify(termino));
  }
});

// Un valor no textual no debe provocar 500: se conserva el comportamiento de hoy, que es
// convertirlo a texto y simplemente no coincidir (o no filtrar si queda vacío).
test('PRO-03: un `busqueda` no string no revienta y conserva su comportamiento', async () => {
  const sinBusqueda = ids(await consultar({ vista: 'pendientes' }));

  // Se convierten a un texto que no coincide con nada.
  for (const valor of [123, {}, true]) {
    assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: valor })), [], JSON.stringify(valor));
  }
  // Se convierten a cadena vacía tras recortar, así que no filtran.
  for (const valor of [[], null, undefined]) {
    assert.deepEqual(ids(await consultar({ vista: 'pendientes', busqueda: valor })), sinBusqueda, JSON.stringify(valor));
  }
});
