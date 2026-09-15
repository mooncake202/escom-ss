# Handoff: convenciones e infraestructura compartida (rama `kar-azure`)

Este documento describe TODA la infraestructura y convenciones ya establecidas en esta rama, para que puedas ajustar tus CU (desarrollados en una rama distinta y desatrasada) **antes** de integrarlos aquí, sin necesidad de que alguien te lo revise pieza por pieza.

Cada regla de este documento está confirmada contra el código real de la rama (rutas y líneas citadas) — si algo cambia después de escribir esto, el código manda, no este documento.

---

## 1. Schema de base de datos

**Regla #1, la más importante de esta sección: el `prisma/schema.prisma` de esta rama es la versión real/actualizada.** Si tu rama tiene un `schema.prisma` desactualizado, reemplázalo por el de esta rama ANTES de escribir una sola línea de código nuevo — cualquier modelo, campo o relación que difiera va a causar migraciones conflictivas o código que no compila contra el schema real.

El schema vive en `prisma/schema.prisma` (raíz del proyecto, no dentro de `backend/`) y tiene 28 modelos.

### Convenciones de nombres confirmadas

- **Modelos**: singulares, snake_case (`usuario`, `alumno`, `solicitud_registro`, `oferta_servicio`, `reporte_mensual`). Ninguno está en plural.
- **Campos**: snake_case consistente (`fecha_creacion`, `estado_solicitud`, `usuario_id`, `porcentaje_progreso`).
- **FKs**: patrón `<modelo_referenciado>_id` (`usuario_id`, `profesor_id`, `solicitud_registro_id`), a veces abreviado (`oferta_id` en vez de `oferta_servicio_id`). `solicitud_registro.alumno_id` es un caso especial: referencia `alumno.boleta` (no un id numérico).
- **Relaciones ambiguas**: se nombran explícitamente, ej. `@relation("UsuarioCreador", ...)`.
- **Timestamps**: `fecha_creacion DateTime @db.DateTime(0)` es el patrón estándar. `fecha_actualizacion DateTime?` aparece donde aplica.
- **Fechas puras vs. timestamps reales**: `@db.Date` para día calendario sin hora (`evento_calendario.fecha_inicio`, `actividad.fecha_limite`, `bitacora.fecha_registro`); `@db.DateTime(0)` para fecha+hora real. **Esta distinción es crítica — ver Sección 3.**
- **Estados**: la mayoría son `String @db.VarChar(N)` con un comentario en línea listando los valores permitidos, NO un `enum` de Prisma:
  ```prisma
  // estado: 'en_curso' | 'pendiente_datos' | 'pendiente_revision'
  //         | 'aprobada' | 'rechazada'   (los 2 últimos los usa CU-AH-04)
  estado String @db.VarChar(30)
  ```
  Los pocos campos que SÍ son `enum` real de Prisma son catálogos estables/cerrados: `RolUsuario`, `TipoEventoCalendario`, `SemestrePeriodo`, `TipoContacto`, `OrigenAnuncio`, `TipoOfertaServicio`, `TipoRevisor`, `EstadoRevision`.

### Cadena `usuario` → `alumno`/`profesor`/`coordinador`

Es **1:1** en los tres casos, pero con dos formas distintas de implementarlo:

- **`alumno`**: NO usa el id de usuario como PK propia. Usa `boleta` (`String @id @db.Char(10)`) como llave primaria propia, más `usuario_id Int @unique` como FK 1:1 hacia `usuario.id`.
- **`profesor`/`coordinador`**: tienen `id Int @id @default(autoincrement())` propio e independiente, más `usuario_id Int @unique` como FK 1:1.
- Los tres borran en cascada (`onDelete: Cascade`) hacia `usuario`.
- Del lado `usuario`, la relación inversa es opcional (`alumno?`, `profesor?`, `coordinador?`) — un usuario puede no tener perfil de rol asociado.

### Relación `alumno` ↔ `solicitud_registro`

1:1 opcional **desde el lado `alumno`**:
```prisma
model alumno {
  solicitud_registro solicitud_registro?
}
model solicitud_registro {
  alumno_id String @unique @db.Char(10)
  alumno    alumno @relation(fields: [alumno_id], references: [boleta], onDelete: Cascade)
}
```
El `?` está en `alumno.solicitud_registro` (un alumno puede no tener aún solicitud); del lado `solicitud_registro`, `alumno_id` es obligatorio y `@unique` (fuerza 1:1 real).

### Excepciones de estilo a NO repetir

- `oferta_servicio.estado_oferta` usa `'Aprobada'` (mayúscula inicial) en vez de `'aprobada'` — es una inconsistencia ya existente, no la imites en código nuevo.
- Algunos valores de `estado_solicitud` conservan mayúsculas de siglas institucionales (`registro_SISS`, `SISS_y_documentacion_pendiente`) — es intencional (sigla), no un error de estilo.

---

## 2. Autenticación y sesión (JWT)

### Firma y verificación — `backend/src/lib/jwt.js` (archivo completo)

```js
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '4h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Agrégalo a las variables de entorno del servicio backend.');
}

function generarToken(payload) {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
```

- **Claims**: lo que el caller pase (siempre `sub` = id de usuario, `rol` = rol del usuario) + `jti` (UUID único, inyectado automáticamente por `generarToken`) + `exp` (calculado por `jsonwebtoken` a partir de `expiresIn`).
- **Algoritmo**: default de `jsonwebtoken` (HS256), no se especifica explícito.
- **Expiración**: 4h por default (`JWT_EXPIRES_IN`).
- Si `JWT_SECRET` no está en el entorno, el proceso **falla al arrancar**, no en runtime.

### `requireAuth` / `requireRole` — `backend/src/middleware/auth.middleware.js`

```js
async function requireAuth(req, res, next) {
  // ... valida header Bearer, verifica JWT, checa blacklist en Redis (fail-open si Redis falla)
  req.usuario = decoded; // { sub, rol, jti, exp }
  next();
}

function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ message: 'No autenticado.' });
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    next();
  };
}
```

**`requireRole` es completamente genérico** — recibe cualquier string como parámetro variádico (`requireRole('coordinador')`, `requireRole('profesor', 'coordinador')`). **No hay ningún enum ni lista cerrada de roles válidos codificada en el middleware** — la validez depende solo de qué compares al llamarlo en tu ruta. Ejemplo real de uso: `router.post('/usuarios', requireAuth, requireRole('coordinador'), crearUsuario)`.

Importante: `requireRole` valida contra el **rol firmado en el JWT**, no una consulta fresca a BD — si el rol de un usuario cambia en BD, su JWT viejo sigue teniendo el rol anterior hasta que se le reemita uno nuevo (ver siguiente subsección).

### Blacklist de tokens / logout

`backend/src/modules/auth/auth.service.js`:
```js
async function logout(usuarioDecodificado) {
  const ahora = Math.floor(Date.now() / 1000);
  const ttlRestante = usuarioDecodificado.exp - ahora;
  if (ttlRestante > 0) {
    await redis.set(`blacklist:${usuarioDecodificado.jti}`, '1', 'EX', ttlRestante);
  }
}
```
- **Key**: `` `blacklist:${jti}` ``. **TTL**: exactamente lo que le quedaba de vida al JWT (no tiene sentido guardarlo más).
- Se consulta en `requireAuth` (`auth.middleware.js`) Y en el handshake de sockets (`socket.server.js`) — **mismo criterio en ambos, incluyendo el mismo fail-open si Redis falla** (no bloquea el acceso, solo pierde la protección momentáneamente).

### Re-emisión de JWT

Un JWT nuevo se emite en 3 escenarios (siempre vía `generarToken`):
1. **Login normal** — `auth.service.js`.
2. **`continuarAlumnoAsignado`** (`gr.service.js`) — cuando un alumno pasa de `alumno_sin_asignar` a `alumno_asignado`; el comentario del código explica por qué hace falta: *"como requireRole() valida contra el rol FIRMADO en el JWT (no una consulta fresca a BD), sigue haciendo falta reemitir el token aquí."*
3. **`confirmarBienvenidaAlumnoAsignado`** (`gr.service.js`) — condicional: solo reemite si el usuario todavía trae un token con el rol viejo.

**Regla para tus CU**: si tu flujo cambia el `rol` de un usuario en BD, tienes que reemitir su JWT (devolverlo en la respuesta y que el frontend lo guarde) — de lo contrario `requireRole` seguirá usando el rol viejo hasta que el usuario vuelva a iniciar sesión.

### Patrón de seguridad: 404 genérico, nunca 403 por pertenencia

Cualquier función que resuelve "¿este recurso es de este usuario?" responde **404 genérico** si el recurso no existe O si existe pero no le pertenece a otro usuario — **nunca 403**, para no revelar que el recurso existe. Cita real (`ah-alumno.service.js`):
```js
/**
 * Mismo criterio de seguridad que ah-profesor.service.js: si la actividad
 * no existe o no pertenece a la solicitud_registro del alumno autenticado,
 * 404 genérico — nunca 403, para no revelar que el recurso existe pero es
 * ajeno.
 */
if (!actividad || actividad.solicitud_registro_id !== solicitud.id) {
  throw crearError('Actividad no encontrada.', 404);
}
```
El 403 de `requireRole` es la única excepción — ese sí es apropiado porque no depende de pertenencia de un recurso, sino de rol.

---

## 3. Manejo de fechas y horas — LA REGLA MÁS IMPORTANTE

**Regla de oro**: todo lo que el usuario ve o escribe se interpreta en **hora México** (`America/Mexico_City`), aunque internamente se guarde en UTC. Esta regla ya causó varios bugs reales antes de tener helpers centralizados — úsalos siempre, nunca reimplementes el cálculo.

### Los helpers exactos que debes usar

| Necesitas... | Backend | Frontend |
|---|---|---|
| "Hoy" en México (para comparar contra `@db.Date`) | `calcularDiaMexicoUTC()` — `backend/src/lib/fechas.js` | `calcularDiaMexicoUTC()` — `front/src/utils/fechas.js` |
| Mostrar un campo `@db.Date` puro (sin hora real) | — (el backend no formatea para mostrar) | `formatearFechaUTC(fecha, opciones)` — `front/src/utils/fechas.js` |
| Mostrar un campo `@db.DateTime` real (con hora) | — | `formatearFechaMexico(fecha, opciones)` / `formatearHoraMexico(fecha)` — `front/src/utils/fechas.js` |

### `calcularDiaMexicoUTC` (idéntico en backend y frontend)

```js
function calcularDiaMexicoUTC(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(ahora);
  const obtener = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return new Date(Date.UTC(obtener('year'), obtener('month') - 1, obtener('day')));
}
```
Usa `Intl.DateTimeFormat` con `timeZone` explícito — nunca `getUTCFullYear/Month/Date()` sobre el instante actual crudo.

### `formatearFechaUTC` vs. `formatearFechaMexico` — por qué son DISTINTOS a propósito

```js
// Para campos @db.Date puros (fecha_inicio, fecha_fin, fecha_limite, fecha_registro...)
export function formatearFechaUTC(fecha, opciones = {}) {
  return new Date(fecha).toLocaleDateString("es-MX", { ...opciones, timeZone: "UTC" });
}

// Para campos @db.DateTime reales (fecha_asignacion, fecha_aplicacion, hora_inicio...)
export function formatearFechaMexico(fecha, opciones = {}) {
  return new Date(fecha).toLocaleDateString("es-MX", { ...opciones, timeZone: "America/Mexico_City" });
}
```

**Por qué usar el incorrecto causa el "bug del día -1"**: un campo `@db.Date` (ej. `fecha_inicio = 2026-10-01`) Prisma lo serializa como medianoche UTC (`"2026-10-01T00:00:00.000Z"`) — no representa una hora real, solo un día calendario. Si lo formateas con la zona horaria LOCAL del navegador (México = UTC-6), esa medianoche UTC cae en las 18:00 del día ANTERIOR en hora local, y `toLocaleDateString` muestra un día atrás. Forzar `timeZone: "UTC"` evita ese corrimiento — por eso `formatearFechaUTC` existe.

Para un campo `@db.DateTime` real (que SÍ tiene una hora verdadera, ej. cuándo se registró una jornada), forzar `timeZone: "UTC"` sería el error — ahí necesitas forzar `America/Mexico_City` explícitamente (sin esto, `toLocaleDateString` usaría la zona horaria del navegador del usuario, que podría no ser México).

**Regla práctica**: antes de formatear cualquier fecha, mira el schema — si el campo es `@db.Date`, usa `formatearFechaUTC`; si es `@db.DateTime`, usa `formatearFechaMexico`/`formatearHoraMexico`. Mezclarlos reintroduce el bug.

### Qué NO hacer (ya causó bugs reales en esta rama)

- `new Date()` crudo para "hoy" sin especificar timezone — usa la zona horaria del entorno de ejecución (servidor o navegador), no necesariamente México.
- `ahora.getUTCFullYear()/getUTCMonth()/getUTCDate()` para obtener "el día de hoy" — da el día calendario **UTC**, que se adelanta hasta 6 horas respecto al día real en México durante la noche (00:00–05:59 hora servidor UTC = 18:00–23:59 del día anterior en México). Cita real del código (`ah.cron.js`), documentando un bug ya corregido:
  > "Antes esto se calculaba con `ahora.getUTCFullYear/Month/Date()` — daba el resultado correcto SOLO porque el cron real siempre se dispara exactamente a las 06:00 UTC [...]. Si esta función se invoca a otra hora [...] el corte quedaba hasta 6 horas adelantado."
- Formatear un `@db.Date` con la zona horaria local del navegador — bug del día -1, explicado arriba.

---

## 4. WebSockets (Socket.io)

### Autenticación del handshake — `backend/src/sockets/socket.server.js`

Replica exactamente la lógica de `requireAuth`, pero para sockets:
```js
async function autenticarSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No se proporcionó un token de autenticación.'));

  let decoded;
  try { decoded = verificarToken(token); }
  catch (err) { return next(new Error('Token inválido o expirado.')); }

  try {
    const revocado = await redis.get(`blacklist:${decoded.jti}`);
    if (revocado) return next(new Error('Tu sesión fue cerrada. Vuelve a iniciar sesión.'));
  } catch (err) {
    console.error('Error al consultar blacklist en Redis (socket):', err.message); // fail-open
  }

  socket.data.usuarioId = decoded.sub;
  socket.data.rol = decoded.rol;
  next();
}
```
Mismo `JWT_SECRET`, mismo chequeo de blacklist, mismo fail-open que HTTP — a propósito, para no tener dos criterios de seguridad distintos.

### Patrón de sala por usuario

```js
io.on('connection', (socket) => {
  socket.join(`usuario_${socket.data.usuarioId}`);
});

function emitirAUsuario(usuarioId, evento, datos) {
  io.to(`usuario_${usuarioId}`).emit(evento, datos);
}
```
Solo hay salas por usuario (`usuario_<id>`) — no hay salas por rol ni por recurso. Para emitir a un usuario específico desde cualquier `.service.js`, importa `emitirAUsuario` de `backend/src/sockets/socket.server.js`.

### Frontend: `SocketContext` — `front/src/context/SocketContext.jsx`

Una sola conexión de socket.io compartida en toda la app:
```js
const nuevoSocket = io(new URL(API_URL).origin, { auth: { token } });
```
**Importante**: se conecta al `origin` (protocolo+host+puerto), **nunca** a `API_URL` completo — si `API_URL` trae un path (ej. `https://ttservicio.com/api`), `io(...)` lo interpreta como un *namespace* de socket.io (no un path HTTP) y el servidor lo rechaza.

Hooks expuestos:
- `useSocket()` → `{ socket, conectar, desconectar }`.
- `useSocketReconectado(callback)` → dispara `callback` **solo** cuando el socket se reconecta tras una desconexión real (no en la conexión inicial) — cierra el hueco de eventos perdidos durante cortes de red/laptop dormida.

### Patrón fail-open (obligatorio en cada emit)

Cualquier `emitirAUsuario(...)` va envuelto en try/catch que solo hace `console.error` — **nunca debe tumbar la operación principal** si el socket falla:
```js
try {
  emitirAUsuario(alumnoUsuarioId, 'actividad:creada', { actividad: actividadMapeada });
} catch (err) {
  console.error('Error al emitir actividad:creada:', err.message);
}
```

### El evento genérico `resumen:actualizado`

Úsalo para **cualquier mutación** que el propio usuario (o un actor relacionado, ej. su profesor) deba ver reflejada en vivo, sin payload significativo — el frontend lo usa solo como disparador para volver a pedir su resumen completo (refetch, nunca merge parcial):
```js
function emitirResumenActualizado(usuarioId) {
  try { emitirAUsuario(usuarioId, 'resumen:actualizado', {}); }
  catch (err) { console.error('Error al emitir resumen:actualizado:', err.message); }
}
```
Ya existen además eventos **específicos** para casos de negocio puntuales (coexisten con el genérico, no lo reemplazan): `actividad:creada`, `actividad:editada`, `actividad:fecha_extendida`, `actividad:eliminada`, `actividad:vencida`, `expediente:decidido`, `solicitud:nueva`, `documentacion:pendiente`, `documentacion:decidida`, `expediente:pendiente_revision`. Antes de inventar un evento nuevo para tu CU, revisa si `resumen:actualizado` ya te sirve — solo crea uno específico si el frontend necesita reaccionar de forma distinta según el tipo exacto de cambio (ej. resaltar una fila recién creada).

### Patrón de hook que escucha eventos — ejemplo real (`useConsultarActividades.js`, CU-AH-02)

```js
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

const EVENTOS_ACTIVIDAD = ["actividad:creada", "actividad:editada", "actividad:fecha_extendida", "actividad:eliminada", "actividad:vencida"];

export function useMiHook() {
  const { socket } = useSocket();
  const cargar = useCallback(() => { /* fetch completo */ }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    EVENTOS_ACTIVIDAD.forEach((evento) => socket.on(evento, handler));
    return () => EVENTOS_ACTIVIDAD.forEach((evento) => socket.off(evento, handler));
  }, [socket, cargar]);

  useSocketReconectado(cargar);
}
```
Patrón: `useSocket()` para el socket compartido, `socket.on(evento, handler)` dentro de un `useEffect` con cleanup `socket.off`, **siempre refetch completo** (nunca merge parcial de estado — es el criterio ya establecido en TODO el proyecto, más simple y confiable), y `useSocketReconectado(cargar)` para no perder eventos tras una reconexión.

---

## 5. Notificaciones (Tipo A y Tipo B)

### Tipo A — calculada, sin persistir

Se recalcula en **cada carga** del dashboard (`dashboard.service.js`), nunca se guarda en tabla `notificacion`. Ejemplo real (`ah.shared.js`):
```js
async function tieneActividadesPendientes(solicitudRegistroId) {
  const conteo = await prisma.actividad.count({
    where: { solicitud_registro_id: Number(solicitudRegistroId), estado: { notIn: ESTADOS_COMPLETADA } },
  });
  return conteo > 0;
}
```
Se muestra en frontend vía:
- `SlotNotificacionCalculada` — posicionada en un slot específico del dashboard, aparece solo mientras la condición sea verdadera y desaparece sola cuando deja de serlo. Úsala para cualquier mensaje que sea una CONSULTA en vivo (ej. `resumen.jornadaSinTerminar`), no un evento histórico.
- `BloqueAlertasGenerales` con la prop `slotsCalculados` — para el bloque general de arriba del dashboard (ej. "Falta tu bitácora del día").

### Tipo B — persistida en tabla `notificacion`

Se crea una fila real con `crearNotificacion` (`backend/src/modules/notificaciones/notificaciones.service.js`):
```js
async function crearNotificacion({ usuarioId, tipo, mensaje, rutaRelacionada = null }) {
  if (!TIPOS_VALIDOS.includes(tipo)) throw new Error(...); // 'info' | 'warning' | 'urgente' | 'success'
  return prisma.notificacion.create({
    data: { usuario_id: usuarioId, tipo, mensaje, ruta_relacionada: rutaRelacionada, fecha_creacion: new Date() },
  });
}
```
Se muestra vía `SlotNotificacion` (posicionada, busca una notificación real que matchee la ruta del slot) o el bloque general si `ruta_relacionada` es `null`.

### Patrón de deduplicación

Antes de crear una notificación Tipo B, se busca si ya existe una **sin leer** del mismo tipo/ruta — si existe, no se crea otra:
```js
async function notificarBitacoraRevisada(alumnoUsuarioId, bitacoraId) {
  const ruta = `/alumno/historial?bitacora=${bitacoraId}`;
  const existente = await prisma.notificacion.findFirst({
    where: { usuario_id: alumnoUsuarioId, ruta_relacionada: { startsWith: '/alumno/historial?bitacora=' }, leida: false },
  });
  if (existente) {
    if (existente.ruta_relacionada !== ruta) {
      await prisma.notificacion.update({ where: { id: existente.id }, data: { ruta_relacionada: ruta } });
    }
    return;
  }
  await crearNotificacion({ usuarioId: alumnoUsuarioId, tipo: 'info', mensaje: 'Te han revisado una bitácora.', rutaRelacionada: ruta });
}
```
No hay índice único en BD para esto — la deduplicación es 100% a nivel de aplicación (`findFirst` + lógica condicional), no un `upsert` de Prisma.

### Descubrimiento reciente importante: matching por PREFIJO, no igualdad exacta

`front/src/features/dashboard/dashboards.jsx`:
```js
// Match por PREFIJO (no igualdad exacta): algunas rutas llevan query string
// para apuntar a un registro específico (ej. '/alumno/historial?actividad=5'
// o '/alumno/historial?bitacora=9') — el slot se declara con la ruta base
// ('/alumno/historial') y así reconoce cualquier variante con query.
function notificacionPorRuta(notificaciones, ruta) {
  return notificaciones.find((n) => n.ruta_relacionada?.startsWith(ruta)) || null;
}
```
Este cambio existe porque una versión anterior comparaba con `===` (igualdad exacta) y nunca reconocía rutas con query string — la notificación se creaba en BD y la devolvía la API, pero ningún slot del dashboard la mostraba jamás. **Si tu CU crea notificaciones con `ruta_relacionada` + query string, declara el slot con la ruta BASE** (sin query) — el `startsWith` se encarga del resto. Si dos notificaciones sin leer comparten el mismo prefijo de ruta, el slot (una sola línea) muestra la más reciente; al marcarla leída, la siguiente aparece.

### Endpoint `PUT /notificaciones/leer-por-ruta`

```
GET  /notificaciones            → notificaciones sin leer del usuario autenticado
PUT  /notificaciones/:id/leer   → marca UNA notificación específica como leída
PUT  /notificaciones/leer-por-ruta → marca TODAS las sin leer de una ruta_relacionada como leídas
```
Usa `leer-por-ruta` (body `{ rutaRelacionada }`) cuando una pantalla debe "limpiar" su propia notificación con solo entrar (ej. `HistorialActividades.jsx` la llama con la ruta exacta, incluyendo query string, al montar).

---

## 6. Crons (tareas programadas)

Solo existen 2 archivos `*.cron.js` en todo el proyecto — **no crees uno nuevo si tu necesidad encaja en uno de estos**, y revisa esta lista antes de agregar un cron para no duplicar uno que ya existe.

### `backend/src/modules/ah/ah.cron.js`

| Cron | Expresión (UTC) | Equivalente México | Qué hace |
|---|---|---|---|
| `marcarActividadesVencidas` | `0 6 * * *` | 00:00 (medianoche) | Marca `actividad.estado = 'vencida'` si `fecha_limite` ya pasó y sigue en `sin_comenzar`/`en_progreso`. |
| `cerrarJornadasAbandonadas` | `*/15 * * * *` | cada 15 min (no depende de TZ) | Auto-cierra a `pendiente_datos` cualquier `bitacora` `en_curso` cuya `hora_inicio` ya pasó las 4h (`HORAS_POR_JORNADA`). |
| `contabilizarFaltasDiarias` | `0 6 * * *` | 00:00 (medianoche) | Recorre TODOS los días pendientes de evaluar por alumno (ver patrón de puntero abajo) y contabiliza faltas. |

### `backend/src/modules/gr/gr.cron.js`

| Cron | Expresión (UTC) | Equivalente México | Qué hace |
|---|---|---|---|
| `ejecutarVencimientoReloj1` | `2 20 * * *` | 14:02 | Evalúa vencimiento de `fecha_max_expediente` para solicitudes en ciertos estados. |
| `ejecutarVencimientoReloj2` | `0 6 * * *` | 00:00 (medianoche) | Evalúa vencimiento de `fecha_inicio` del periodo. |

Nota real del código sobre separación de responsabilidades (`gr.cron.js`): el cron solo encuentra candidatas y llama en batch a la función que hace el cálculo real — **el cálculo del instante de corte exacto NUNCA vive en el archivo `.cron.js`**, vive en la función de negocio (`verificarYAplicarVencimiento`, `marcarActividadesVencidas`, etc.). Sigue este mismo patrón: el cron es solo el disparador + batch + try/catch por candidata, la lógica de negocio vive en el `.service.js`.

### Cálculo de fechas dentro de crons

Siempre `calcularDiaMexicoUTC()` (Sección 3) — nunca un cálculo propio. `ah.cron.js` tiene además su propio `calcularCorteMedianocheUTC` con exactamente el mismo patrón (`Intl.DateTimeFormat` con `timeZone` explícito), necesario porque esa función también se invoca manualmente en scripts de prueba a horas arbitrarias.

### Lección aprendida: puntero de "última fecha evaluada"

Un cron que calcula "ayer" relativo al momento exacto de su ejecución **pierde información si el servidor estuvo apagado** uno o más días — nunca vuelve a evaluar esos días. El patrón correcto, ya implementado en `contabilizarFaltasDiarias` (`ah.cron.js`), es:

1. Guardar un puntero persistente (`cumulo_horas_y_faltas.fecha_ultima_evaluacion_faltas`) con la última fecha ya evaluada.
2. Al ejecutarse, recorrer un **loop día por día** desde el día siguiente al puntero (o desde `fecha_inicio` si nunca se evaluó) hasta ayer inclusive — no solo "ayer".
3. Actualizar el puntero junto con el resultado del recorrido en una sola transacción (nunca uno sin el otro).
4. Tener una cota de seguridad (`LIMITE_DIAS_RECORRIDO_FALTAS = 60`) para no recorrer meses de golpe si el servidor estuvo apagado mucho tiempo.

Cita real del comentario que documenta el razonamiento:
> "recorre TODOS los días pendientes de evaluar [...] no solo 'ayer' — para que un cron que no corrió uno o varios días (servidor apagado) no pierda esos días para siempre."

Si tu CU necesita un cron que dependa de "días transcurridos", replica este patrón (puntero persistido + loop + cota de seguridad), no calcules solo contra "ahora".

---

## 7. Separación de código por actor (alumno/profesor/coordinador)

**Patrón ya establecido en TODO el proyecto**: cada actor (alumno/profesor/coordinador) tiene su propio archivo `<modulo>-<actor>.service.js` / `.controller.js` / `.routes.js`, **sin compartir código entre actores** — cada uno duplica su propia query de verificación de pertenencia, resolución de solicitud, etc.

Cita textual real (`ah-coordinador.service.js`):
```js
// CU-AH-05: consultar acumulado de horas (vista coordinador).
// Primera vez que el módulo ah/ necesita este actor — no existe ningún
// patrón previo aquí. Mismo criterio que gr-coordinador.service.js: no
// comparte código con ah-profesor.service.js (se duplica la query de
// alumnos con acumulado), consistente con que gr-coordinador.service.js
// tampoco comparte código con gr-profesor.service.js hoy.
```

**Por qué**: consistencia con el resto del proyecto (GR ya lo hacía así antes de que AH existiera) y aislamiento de seguridad — cada actor tiene reglas de pertenencia y permisos distintas (un profesor solo ve sus propios alumnos, un coordinador ve todos, un alumno solo se ve a sí mismo), y mezclar el código de resolución de "esto le pertenece a X" entre actores aumenta el riesgo de una fuga de datos entre roles por un descuido al reutilizar una función pensada para otro contexto.

**No intentes "optimizar" esto compartiendo código entre `-alumno.service.js`, `-profesor.service.js` y `-coordinador.service.js`** — sí puedes (y debes) compartir código DENTRO de los archivos de un mismo actor, o en un `<modulo>.shared.js` para funciones verdaderamente neutrales de actor (ej. `esDiaLaborable`, `calcularHorasNetas` en `ah.shared.js`), pero nunca funciones que resuelven pertenencia/permisos entre actores distintos.

---

## 8. Validaciones compartidas

Solo existen 2 archivos `validators.js` en el proyecto:
- `backend/src/modules/ah/validators.js` — específico del módulo AH.
- `backend/src/lib/validators.js` — compartido, pero **solo para datos personales/académicos de GR**.

Cita real de por qué AH no reutiliza el compartido (`ah/validators.js`, cabecera del archivo):
```js
// Validaciones propias del módulo AH (Actividades y Horas) — no reutiliza
// backend/src/lib/validators.js a propósito, ese archivo es solo para datos
// personales/académicos de GR.
```
**Si tu CU pertenece a un módulo nuevo, crea tu propio `validators.js` dentro de tu carpeta de módulo** en vez de meter tus reglas en `backend/src/lib/validators.js`.

### Qué va en `validators.js` vs. qué va en el `.service.js`

- **En `validators.js`**: reglas de formato/obligatoriedad puras que NO requieren consultar la BD (campos obligatorios, formato de fecha, longitud, arrays con estructura esperada).
- **En el `.service.js`**: reglas que necesitan datos ya traídos de BD por el caller (ej. `validarActividadesReportables(avances, actividadesDelAlumno)` recibe el array ya consultado — el validator solo compara, no hace queries).

### Patrón "helper básico + validación completa" (crear vs. editar)

Cuando el mismo conjunto de campos se valida distinto según el contexto, extrae el subconjunto común a una función básica y compón sobre ella — no dupliques los checks individuales. Cita real:
```js
function validarCamposBasicosActividad({ titulo, descripcion, entregable_esperado }) {
  if (!titulo || !titulo.trim()) throw crearError('El título es obligatorio.');
  if (!descripcion || !descripcion.trim()) throw crearError('La descripción es obligatoria.');
  if (!entregable_esperado || !entregable_esperado.trim()) throw crearError('El entregable esperado es obligatorio.');
}

function validarCamposActividad(datos) {          // usado en CREAR
  validarCamposBasicosActividad(datos);
  if (!datos.fecha_limite || isNaN(new Date(datos.fecha_limite).getTime())) {
    throw crearError('La fecha límite es obligatoria y debe ser una fecha válida.');
  }
}

function validarCamposEdicionActividad(datos) {   // usado en EDITAR (sin fecha)
  validarCamposBasicosActividad(datos);
}
```

---

## 9. Convenciones de nombres y estados

Todos los valores de estado en BD y en código son **snake_case**. Ejemplos reales confirmados en múltiples módulos:

- `actividad.estado`: `'sin_comenzar'`, `'en_progreso'`, `'vencida'`, `'completada_a_tiempo'`, `'completada_tarde'`.
- `bitacora.estado`: `'en_curso'`, `'pendiente_datos'`, `'pendiente_revision'`, `'aprobada'`, `'rechazada'`.
- `solicitud_registro.estado_solicitud`: `'espera_respuesta_de_profesor'`, `'alumno_asignado'`, `'expediente_pendiente_revision'`, `'rechazada_definitivamente'`, entre otros (20 valores en total a lo largo del flujo GR).
- `notificacion.tipo`: `'info'`, `'warning'`, `'urgente'`, `'success'`.

**No inventes tu propio estilo** (camelCase, PascalCase, mayúsculas) para valores de estado nuevos — sigue snake_case como el resto del proyecto, salvo el caso legítimo de conservar una sigla institucional en mayúsculas dentro del snake_case (ej. `SISS`).

### Patrón "helper fecha/valor → label visual"

Cuando necesites mapear un valor crudo de BD a texto mostrado al usuario, usa un objeto de mapeo simple (no un `switch`), típicamente junto a su contraparte de estilo — patrón ya repetido en varios componentes del frontend:
```js
const ESTADO_LABEL = {
  sin_comenzar: "Sin comenzar",
  en_progreso: "En progreso",
  vencida: "Vencida",
  completada_a_tiempo: "Completada a tiempo",
  completada_tarde: "Completada fuera de tiempo",
};
const ESTADO_STYLE = {
  sin_comenzar: { bg: "rgba(85,85,85,0.12)", color: "#9A9A9A" },
  // ...
};
// uso:
const etiqueta = ESTADO_LABEL[valor] ?? valor; // fallback al valor crudo si falta el mapeo
```
**Importante**: si tu CU muestra un estado que YA existe en otra pantalla (ej. `completada_tarde` de `actividad`), copia el mismo texto y color exactos que ya usa esa otra pantalla — no reinventes tu propia etiqueta/color para el mismo estado, ya causó una inconsistencia visual real en esta rama (ver Sección 11).

---

## 10. Estructura de archivos

### Backend — `backend/src/modules/<modulo>/`

Módulos existentes: `ah`, `auth`, `caracteristicas`, `dashboard`, `gr`, `notificaciones`, `ofertas`, `password`, `perfil`, `periodos`, `usuarios`.

Convención de nombres de archivo dentro de un módulo (ejemplo real, `ah/`):
```
ah-alumno.controller.js       ← lógica HTTP específica del actor alumno
ah-alumno.routes.js
ah-alumno.service.js
ah-profesor.service.js        ← (mismo patrón para profesor)
ah-coordinador.controller.js  ← (mismo patrón para coordinador)
ah-coordinador.routes.js
ah-coordinador.service.js
ah.controller.js              ← genérico/compartido del módulo (sin actor)
ah.routes.js
ah.cron.js                    ← tareas programadas del módulo
ah.shared.js                  ← funciones neutrales compartidas ENTRE actores del mismo módulo
validators.js                 ← sin prefijo de módulo, vive dentro de la carpeta del módulo
seeds/                        ← scripts de datos de prueba
```
Tu módulo nuevo debe seguir exactamente este patrón: `<modulo>-<actor>.service.js/.controller.js/.routes.js` por cada actor que necesites, `<modulo>.shared.js` para lo neutral, `<modulo>.cron.js` si necesitas tareas programadas, `validators.js` propio.

### Frontend — `front/src/features/<modulo-en-kebab-case>/CU-<SIGLA>-<NN>-<nombre-kebab-case>/`

Módulos existentes: `dashboard`, `gestion-actividades`, `gestion-admin`, `gestion-administrativa`, `gestion-ofertas`, `gestion-registro`, `gestion-reportes`, `liberacion-ss`, `login`.

Convención de carpeta CU: `CU-<SIGLA_MODULO>-<NN>-<nombre-kebab-case>` (ej. `CU-AH-01-asignar-actividades`, `CU-GR-06-carta-compromiso`) — sigla en mayúsculas (`AH`, `GR`), número de 2 dígitos, nombre descriptivo en **minúsculas** kebab-case (evita el error ya cometido en `CU-GR-13-MODIFICAR-SOLICITUD`, que rompe la convención usando mayúsculas).

Estructura interna típica de una carpeta CU (ejemplo real, `CU-AH-01-asignar-actividades/`):
```
AsignarActividades.jsx        ← componente de página, PascalCase, SIN el prefijo CU-XX-NN
components/
  ActividadRow.jsx            ← subcomponentes PascalCase específicos de este CU
  AlumnoCard.jsx
hooks/
  useAsignarActividades.js    ← hook use<NombreCU>.js, encapsula datos/estado
```
Opcionalmente, si tu CU es multi-paso o tiene constantes/validaciones propias: `steps/` (visto en `CU-GR-01-enviar-solicitud/steps/`) y `utils/` (`constants.js`, `validations.js`) dentro de la propia carpeta CU. Si algo se reutiliza entre VARIOS CU del mismo módulo (no solo uno), va en `components/`/`hooks/`/`utils/` a nivel del módulo (fuera de cualquier carpeta CU específica), no duplicado dentro de cada CU.

---

## 11. Errores comunes ya corregidos en esta rama (para no repetirlos)

| Bug | Causa | Dónde se corrigió |
|---|---|---|
| **"Día -1" al mostrar fechas** | Formatear un campo `@db.Date` (medianoche UTC) con la zona horaria LOCAL del navegador — cae en las 18:00 del día anterior en México. | `formatearFechaUTC` (frontend) fuerza `timeZone: "UTC"` para estos campos. |
| **Corte de cron adelantado hasta 6h** | Calcular "hoy" con `getUTCFullYear/Month/Date()` crudo del instante de ejecución en vez de usar `Intl.DateTimeFormat` con timezone México explícito — solo coincidía por casualidad cuando el cron corría justo a las 06:00 UTC. | `calcularCorteMedianocheUTC`/`calcularDiaMexicoUTC` en `ah.cron.js`/`ah.shared.js`. |
| **Horas brutas mostradas como si fueran el total real** | `horas_acumuladas` es un total BRUTO histórico que solo sube (nunca baja, ni al rechazar una bitácora); el total real del alumno siempre es `horas_acumuladas - horas_rechazadas`. Comparar/mostrar `horas_acumuladas` sola subestima cuánto le falta rechazar y sobreestima su progreso real. | `calcularHorasNetas(cumulo)` centralizado en `ah.shared.js`, usado en todos los puntos de comparación contra el límite de 480h. |
| **Colisión de `id` de React entre tablas distintas** | Un historial que mezcla filas de `actividad` y `bitacora` usaba el `id` crudo como `key` — ambas tablas empiezan su autoincremental en 1, así que una actividad id=1 y una bitácora id=1 colisionaban como misma `key`, rompiendo el `expandido`/scroll de React. | Clave compuesta `` `${tipo}-${id}` `` en vez de solo `id`, en `HistorialActividades.jsx`. |
| **Notificaciones con query string invisibles** | El matching de notificación-por-ruta en el dashboard comparaba con igualdad exacta (`===`); una notificación con `ruta_relacionada = '/alumno/historial?actividad=5'` nunca calzaba contra el slot declarado como `'/alumno/historial'`. La fila se creaba bien en BD y la API la devolvía bien — el bug era puramente de matching en frontend. | `notificacionPorRuta` ahora usa `startsWith` (prefijo) en vez de `===`. |
| **Etiqueta/color de un mismo estado distintos según la pantalla** | Cada pantalla define su propio mapa `ESTADO_LABEL`/`ESTADO_STYLE` (por diseño, sin compartir código entre pantallas — ver Sección 9) — cuando uno de esos mapas se copió mal, el mismo estado (`completada_tarde`) apareció con color ámbar en una pantalla y rojo en otra, y con dos textos distintos ("Completada tarde" vs. "Completada fuera de tiempo"). | Alineado manualmente contra la pantalla de referencia — **por eso el checklist de abajo insiste en verificar contra pantallas ya existentes antes de definir tu propio mapa**. |
| **Cron que pierde días si el servidor estuvo apagado** | Un cron que calcula "ayer" solo relativo al momento exacto de ejecución nunca vuelve a evaluar un día si el servidor estuvo apagado ese día — la falta/evento de ese día se pierde para siempre. | Patrón de puntero persistido + recorrido de todos los días pendientes, en `contabilizarFaltasDiarias` (ver Sección 6). |

---

## Checklist antes de integrar tus CU a esta rama

- [ ] Reemplacé mi `prisma/schema.prisma` por el de esta rama (no al revés) y regeneré el cliente de Prisma.
- [ ] Mis modelos/campos nuevos (si los necesito) siguen snake_case singular, con FKs `<modelo>_id`, y usé `@db.Date` solo para día-sin-hora / `@db.DateTime(0)` para timestamps reales.
- [ ] Cualquier valor de estado nuevo que agregué es snake_case, consistente con los catálogos ya existentes (no inventé un estilo propio).
- [ ] Uso `requireAuth` + `requireRole('<rol>')` en mis rutas nuevas, con el mismo criterio de 404 genérico (nunca 403) para recursos que no pertenecen al usuario.
- [ ] Si mi flujo cambia el `rol` de un usuario, reemito su JWT.
- [ ] TODA fecha que muestro/comparo usa los helpers de la Sección 3 (`calcularDiaMexicoUTC`, `formatearFechaUTC`, `formatearFechaMexico`/`formatearHoraMexico`) según corresponda al tipo de campo — nunca `new Date()` crudo ni `getUTCFullYear/Month/Date()`.
- [ ] Si emito eventos de socket, uso `emitirAUsuario` con try/catch fail-open, y evalué primero si `resumen:actualizado` ya me sirve antes de crear un evento específico nuevo.
- [ ] Si mi hook de frontend necesita reaccionar a sockets, sigue el patrón `useSocket()` + `socket.on/off` + `useSocketReconectado(cargar)` con refetch completo (no merge parcial).
- [ ] Si creo notificaciones Tipo B, implementé deduplicación (buscar antes de crear) y, si mi `ruta_relacionada` lleva query string, confirmé que el slot del dashboard la reconoce (usa `startsWith`, no igualdad exacta).
- [ ] Mis archivos de servicio/controlador/rutas por actor NO comparten código entre `-alumno`/`-profesor`/`-coordinador` (cada uno duplica su propia resolución de pertenencia).
- [ ] Mi `validators.js` (si lo necesito) vive dentro de mi propio módulo, no en `backend/src/lib/validators.js` (reservado para datos personales/académicos de GR).
- [ ] Si un cron nuevo depende de "días transcurridos", usé el patrón de puntero persistido + recorrido completo (no un cálculo relativo solo a "ahora").
- [ ] Mis carpetas/archivos nuevos siguen exactamente la convención de la Sección 10 (`<modulo>-<actor>.service.js` en backend; `CU-<SIGLA>-<NN>-<nombre-kebab>` en frontend, minúsculas).
- [ ] Si mi CU muestra un estado que ya existe en otra pantalla del proyecto, copié el mismo texto/color exactos que ya usa esa pantalla (no definí mi propio mapa desde cero).
- [ ] Repasé la tabla de la Sección 11 y confirmé que no estoy reintroduciendo ninguno de esos bugs ya corregidos.
