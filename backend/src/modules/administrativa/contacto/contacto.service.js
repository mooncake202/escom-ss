// CU-ADM-06 — Contacto institucional.
//
// Coordinación administra los medios de contacto de la Coordinación de Servicio Social y el alumno
// asignado los consulta en solo lectura.
//
// EL MODELO ES tipo + valor, Y NO SE AMPLÍA.
// `contacto_institucional` tiene un único campo de texto (`valor`) y un enum cerrado de 4 tipos.
// Las etiquetas del diseño original ("Coordinación general", "Oficina principal", "Lunes a
// viernes") NO se persisten: el CU solo exige tipo + valor. La pantalla agrupa por tipo y muestra
// el valor tal cual, sin depender de ninguna etiqueta.
//
// Para `ubicacion` y `horario` el valor puede ser un texto completo, incluso multilínea, mientras
// quepa en VarChar(255).
//
// Es información INSTITUCIONAL: cualquier coordinador puede editar o eliminar cualquier registro.
// `coordinador_id` queda como autoría de la última escritura.

const prisma = require('../../../lib/prisma');
const { crearError } = require('../directorio/directorio.shared');

// Mismo orden en que la pantalla presenta las secciones. Coincide con el enum TipoContacto.
const TIPOS = Object.freeze(['correo', 'telefono', 'ubicacion', 'horario']);

const MAX_VALOR = 255; // contacto_institucional.valor  VarChar(255)

const limpiar = (valor) => (typeof valor === 'string' ? valor.trim() : '');

function validarTipo(tipo) {
  if (!TIPOS.includes(tipo)) {
    throw crearError(`El tipo de contacto debe ser uno de: ${TIPOS.join(', ')}.`, 400, 'TIPO_INVALIDO');
  }
  return tipo;
}

function validarValor(valor) {
  const limpio = limpiar(valor);
  if (limpio === '') throw crearError('El valor del contacto es obligatorio.', 400, 'VALOR_VACIO');
  if (limpio.length > MAX_VALOR) {
    throw crearError(`El valor no puede pasar de ${MAX_VALOR} caracteres.`, 400, 'VALOR_MUY_LARGO');
  }
  return limpio;
}

const vistaContacto = (c) => ({
  id: c.id,
  tipo: c.tipo,
  valor: c.valor,
  fechaActualizacion: c.fecha_actualizacion.toISOString(),
});

function resolverId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw crearError('Contacto inválido.', 400, 'CONTACTO_INVALIDO');
  return n;
}

async function perfilCoordinador(usuarioId) {
  const coordinador = await prisma.coordinador.findUnique({
    where: { usuario_id: usuarioId },
    select: { id: true },
  });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404, 'SIN_PERFIL_COORDINADOR');
  return coordinador;
}

/**
 * Lista agrupada por tipo. Devuelve SIEMPRE las cuatro claves, aunque estén vacías, para que la
 * pantalla no tenga que conocer el enum ni manejar `undefined`. Varios registros del mismo tipo son
 * válidos y esperados (p. ej. dos teléfonos).
 */
async function listar() {
  const filas = await prisma.contacto_institucional.findMany({ orderBy: [{ id: 'asc' }] });
  const contactos = filas.map(vistaContacto);

  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, []]));
  for (const c of contactos) porTipo[c.tipo].push(c);

  return { contactos, porTipo, tipos: TIPOS, total: contactos.length };
}

async function crear({ usuarioId, tipo, valor }) {
  validarTipo(tipo);
  const valorLimpio = validarValor(valor);
  const coordinador = await perfilCoordinador(usuarioId);

  const fila = await prisma.contacto_institucional.create({
    data: {
      coordinador_id: coordinador.id,
      tipo,
      valor: valorLimpio,
      fecha_actualizacion: new Date(),
    },
  });

  return { contacto: vistaContacto(fila) };
}

async function actualizar({ usuarioId, id, tipo, valor }) {
  const contactoId = resolverId(id);
  validarTipo(tipo);
  const valorLimpio = validarValor(valor);
  const coordinador = await perfilCoordinador(usuarioId);

  const existente = await prisma.contacto_institucional.findUnique({ where: { id: contactoId } });
  if (!existente) throw crearError('No se encontró ese contacto.', 404, 'CONTACTO_NO_ENCONTRADO');

  const fila = await prisma.contacto_institucional.update({
    where: { id: contactoId },
    data: {
      tipo,
      valor: valorLimpio,
      fecha_actualizacion: new Date(),
      coordinador_id: coordinador.id,
    },
  });

  return { contacto: vistaContacto(fila) };
}

async function eliminar({ usuarioId, id }) {
  const contactoId = resolverId(id);
  await perfilCoordinador(usuarioId);

  const existente = await prisma.contacto_institucional.findUnique({ where: { id: contactoId } });
  if (!existente) throw crearError('No se encontró ese contacto.', 404, 'CONTACTO_NO_ENCONTRADO');

  await prisma.contacto_institucional.delete({ where: { id: contactoId } });
  return { id: contactoId };
}

module.exports = { listar, crear, actualizar, eliminar, TIPOS, MAX_VALOR };
