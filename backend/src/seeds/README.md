# Seeds finales — Sistema de Servicio Social ESCOM

Este directorio reemplaza a los seeds "de trabajo" ad-hoc (`seed-maestro-gr.js`,
`seed-demo-ah.js`, `seed-demo-lss.js`, etc., que siguen existiendo pero ya **no** son
la base de verdad de este esfuerzo). El objetivo es poblar la base de datos **desde
cero** con todos los casos y variantes de usuarios necesarios para:

1. Una demostración en vivo donde puedan pedirnos "muéstrame un caso específico" de
   cualquier módulo (`demo-final/`).
2. Un video tutorial de un solo recorrido, camino feliz, de principio a fin
   (`video-tutorial/` — **aún no se construye**, se define después).

## 📅 Fecha de la presentación: 23 de noviembre de 2026

`demo-final/` se va a mostrar en vivo ese día, con la fecha real del
sistema (no se simula ningún reloj) — así que **todo dato cuyo estado
dependa de la fecha debe seguir viéndose correcto el 23 de noviembre de
2026**, no solo hoy. Ejemplos de lo que esto afecta: que el periodo de
registro usado siga vigente (`fecha_max_expediente >= 23 nov 2026`), que
una actividad pensada para verse "próxima a vencer" tenga su
`fecha_limite` cerca de esa fecha (no de hoy), que las bitácoras/faltas
acumuladas correspondan a una línea de tiempo coherente hasta ese día, etc.

Regla de trabajo para cada seed de `demo-final/` que incluya fechas:
1. **Se construye y se prueba HOY** contra el código real (no esperamos al
   23 para descubrir que algo no corre).
2. Las fechas que use **se fijan pensando en el 23 de noviembre de 2026**
   como "hoy" del escenario, no en la fecha real de cuando se corrió el
   seed — igual que ya se hizo en `video-tutorial/ah/01-actividades-variadas.js`
   (fechas ancladas a octubre 2026 en vez de "relativas a hoy").
3. **Ojo con los crons reales** (`ah.cron.js`, `gr.cron.js` — de verdad
   registrados en `server.js`, corren solos cada noche si el backend sigue
   prendido): no basta con que la fecha ya esté "bien puesta hoy", hay que
   revisar que **ningún cron la vaya a mover sola** entre hoy y el 23.
   Specifically:
   - `marcarActividadesVencidas`: cualquier actividad `sin_comenzar`/
     `en_progreso` con `fecha_limite` antes del 23 se volverá `vencida` sola.
   - `contabilizarFaltasDiarias`: cualquier `alumno_asignado` cuyo periodo
     ya inició y cuyo `cumulo_horas_y_faltas.fecha_ultima_evaluacion_faltas`
     NO esté fijado (o esté fijado antes del 23) va a acumular faltas reales
     y retroactivas la próxima vez que corra el cron. Por eso todo alumno ya
     iniciado que no deba acumular faltas (porque el escenario no es sobre
     eso) necesita esa fecha fijada a propósito más allá del 23 (ver
     `04-ah.js`, Gerardo/Itzel/Sofía).
   - Mismo criterio para `gr.cron.js` (Reloj 1/Reloj 2): cualquier solicitud
     que deba seguir "pendiente de decidir en vivo" el 23 necesita que su
     `fecha_max_expediente`/`fecha_inicio` (según el reloj que le toque)
     caiga después del 23, no solo después de hoy.
4. Antes de la demo, se vuelve a verificar cada escenario (sin volver a
   sembrar nada, el dato ya quedó fijo) para confirmar que sigue viéndose
   bien con la fecha real de ese día.

## ⚠️ Antes de correr cualquier cosa de aquí

**Haz una copia de tu base de datos de pruebas actual** antes de ejecutar estos seeds.
La intención es reiniciar la BD y poblarla desde cero con todo lo de aquí — si tienes
algo en la BD actual que quieras recuperar después, resguárdalo antes.

## Estructura

```
backend/src/seeds/
  demo-final/
    00-comun/           ← una sola vez, para TODO el sistema (ver abajo)
    cred-gr-ah-lss/     ← CRED + GR + AH + LSS (ciclo completo del alumno)
    amd-pro-rep/        ← AMD + PRO + REP (se construye sobre lo de arriba)
  video-tutorial/        ← pendiente, no construir todavía
```

## División de responsabilidad

- **`cred-gr-ah-lss/`**: el ciclo real y completo del alumno — desde que se crean sus
  credenciales hasta que se libera del servicio social, cubriendo todos los estados y
  ramales reales de cada CU (incluyendo rechazos, correcciones, casos límite). Esta
  parte **no depende de nada que construya `amd-pro-rep/`**.
- **`amd-pro-rep/`**: se construye **sobre** `00-comun/` y `cred-gr-ah-lss/`, pero
  **no los modifica ni los reemplaza**. Para sus propios casos de demo, crea sus
  propios usuarios (no reutiliza los alumnos de `cred-gr-ah-lss/`), siguiendo el mismo
  patrón/estilo pero con su propio rango de boleta/correo para no chocar.
- **Fuente de verdad**: el código real de cada módulo (servicios, validadores,
  esquema de Prisma), **no** los seeds ad-hoc previos. `seed-maestro-gr.js` y
  similares solo sirven como banco de piezas/referencia de patrón, no como base.

## `00-comun` — lo realmente compartido (una sola versión, nunca duplicada)

Estos elementos se **crean literalmente** en `00-comun` (no se referencian por
find-or-create a una BD vieja — la idea es reconstruir todo desde cero):

| Elemento | Valor acordado |
|---|---|
| `carrera` | ISC, IA, LCD |
| `caracteristica` | 6 filas (Investigador +1, Presidente de academia +2, Coordinador +2, Jefe de departamento +3, Funcionario +3, Profesor coordinador de clubes +3). **`amd-pro-rep` debe confirmar que esto es correcto o corregirlo con datos reales** — es la dueña real de este catálogo (SOL) (CU-ADM-15/16); el resto del sistema solo lo consume. |
| `recurso` | 3 links institucionales reales: Constancia de créditos IPN, Plataforma SISS del IPN (https://serviciosocial.ipn.mx/), Constancia de vigencia del seguro social IMSS (portal IMSS). |
| `contacto_institucional` | Correo: `servicio_social_escom@ipn.mx`. Teléfono: 55 5729 6000 ext. 52056. Ubicación: "En edificio central de la ESCOM, subiendo las escaleras del lado derecho". Horario: 9:00–15:00 y 17:00–20:00 (fuente: página oficial de Apoyos Educativos ESCOM, [escom.ipn.mx/SSEIS/apoyoseducativos](https://www.escom.ipn.mx/SSEIS/apoyoseducativos/), misma extensión 52056 que servicio social). `amd-pro-rep` puede ajustar esto si lo necesita para su módulo, avisando antes. |
| Coordinadores | **2 cuentas nuevas y dedicadas**, compartidas por ambas partes (no se reutiliza ninguna de las cuentas sueltas que ya existen en la BD de pruebas). Nadie crea una tercera. |
| Calendario (festivos, vacaciones, periodos de registro) | **Ver tabla completa abajo. Cerrado — nadie agrega, quita ni modifica fechas aquí, bajo ninguna circunstancia.** |

### Calendario — cerrado, definitivo

**Por qué se movieron tantas fechas**: al revisar el código real
(`calendario.validaciones.js`, función `leerFecha`) encontramos que el validador
real **rechaza cualquier fecha en fin de semana**, para cualquier tipo de evento
(Inhabil, Vacacional o Periodo) y en cualquiera de sus campos de fecha — no solo
`fecha_inicio` como se pensó al principio. Por eso varias fechas que habíamos
acordado antes tuvieron que recorrerse: de lo contrario estaríamos sembrando datos
que el sistema real jamás habría dejado crear por la UI/API.

**Festivos oficiales México** (regla de la Ley Federal del Trabajo Art. 74, fechas
calculadas, más el 5 de mayo por decisión del equipo aunque no sea obligatorio por
ley). Día del Trabajo 2027 (1 mayo) y Navidad 2027 (25 dic) **se quitaron**: ambos
caen sábado, el validador real los rechazaría:

| Festivo | 2026 | 2027 |
|---|---|---|
| Año Nuevo | Jueves 1 enero | Viernes 1 enero |
| Día de la Constitución | Lunes 2 febrero | Lunes 1 febrero |
| 5 de mayo | Martes 5 mayo | Miércoles 5 mayo |
| Natalicio de Juárez | Lunes 16 marzo | Lunes 15 marzo |
| Día del Trabajo | Viernes 1 mayo | ~~Sábado 1 mayo~~ (quitado) |
| Independencia | Miércoles 16 septiembre | Jueves 16 septiembre |
| Revolución Mexicana | Lunes 16 noviembre | Lunes 15 noviembre |
| Navidad | Viernes 25 diciembre | ~~Sábado 25 diciembre~~ (quitado) |

**Inhabilitaciones parciales** (tipo `Inhabil` con el campo `hora`): investigamos
cómo funciona esto en el código (`ah.shared.js`, función `puedeIniciarJornadaAhora`)
antes de inventar nada — un evento `Inhabil` con `hora` bloquea **solo el inicio de
nuevas jornadas de AH a partir de esa hora ese mismo día**; no afecta el cálculo de
día hábil, no afecta faltas, y no interrumpe una jornada ya en curso. Solo acepta
horas en punto de 07:00 a 18:00. Se sembraron 2, en 2027 (para que sean fechas
futuras — si se querían otros años, avisar). También verificamos que `hora` se
guarda como reloj de México sin conversión de huso horario (`calendario.service.js`:
`new Date('1970-01-01THH:mm:00.000Z')`, se lee de vuelta con `getUTCHours`) —
nuestro seed escribe exactamente igual, así que "14:00"/"12:00" sí se comportan
como las 2pm/mediodía reales de México, sin desfase. Se sembraron inicialmente
en 2027 (para que fueran fechas futuras), pero se **corrigieron a 2026**
(2026-11-08) porque el ciclo real que usan tanto la demo como el video es
2026 — quedaron en octubre, eligiendo días que no choquen con las bitácoras
de octubre ya sembradas por el seed de AH del video (6, 13, 15, 20, 27 y 29):
- 8 de octubre de 2026, desde las 14:00
- 22 de octubre de 2026, desde las 12:00

(las fechas viejas de 2027 — 2 de noviembre y 27 de septiembre — ya se
borraron de la BD vía `INHABILES_PARCIALES_OBSOLETOS` en el propio seed,
mismo patrón que `FESTIVOS_OBSOLETOS`.)

**Periodos vacacionales** (tipo `Vacacional`) — **recorridos** para que ningún
extremo (ni inicio ni fin) caiga en fin de semana. Regla acordada: si cae **sábado**,
se recorre **+2 días** (al lunes siguiente); si cae **domingo**, se recorre **-2
días** (al viernes anterior) — aplica igual sea el extremo de inicio o de fin:

| Periodo | Antes | Después |
|---|---|---|
| Invierno (cont. 2025) | 2026-01-01 a 2026-01-24 (Sáb) | 2026-01-01 a **2026-01-26** |
| Primavera | 2026-03-22 (Dom) a 2026-04-02 | **2026-03-20** a 2026-04-02 |
| Verano | 2026-08-01 (Sáb) a 2026-08-23 (Dom) | **2026-08-03** a **2026-08-21** |
| Invierno | 2026-12-19 (Sáb) a 2027-01-24 (Dom) | **2026-12-21** a **2027-01-22** |

Equivalentes 2027 (Semana Santa, agosto, puente diciembre): siguen **pendientes**
de confirmar — no se calculan sin una fuente real (calendario oficial IPN del ciclo
2027), ver aviso en `03-calendario.js`.

**Periodos de registro** (los 38 oficiales de `seed-periodos-servicio-social.js`):
se reutilizan tal cual, con **dos tipos de corrección** (misma regla sábado→lunes
de arriba, aplicada aquí también a `fecha_fin`/`fecha_max_expediente`, no solo a
`fecha_inicio` como se pensó originalmente):

1. `fecha_inicio` del evento id 27: 2027-01-16 (sábado) → **2027-01-18** (lunes).
2. 9 filas más con `fecha_fin` y/o `fecha_max_expediente` en sábado, recorridas
   +2 días al lunes siguiente:

| id | Campo | Antes | Después |
|---|---|---|---|
| 26 | fecha_fin | 2027-07-17 | 2027-07-19 |
| 26 | fecha_max_expediente | 2026-12-12 | 2026-12-14 |
| 27 | fecha_fin | 2027-08-14 | 2027-08-16 |
| 29 | fecha_fin | 2027-10-02 | 2027-10-04 |
| 30 | fecha_fin | 2027-10-16 | 2027-10-18 |
| 30 | fecha_max_expediente | 2027-03-06 | 2027-03-08 |
| 32 | fecha_fin | 2027-12-04 | 2027-12-06 |
| 32 | fecha_max_expediente | 2027-04-24 | 2027-04-26 |
| 33 | fecha_fin | 2027-12-18 | 2027-12-20 |
| 34 | fecha_fin | 2028-01-01 | 2028-01-03 |
| 35 | fecha_fin | 2028-01-15 | 2028-01-17 |
| 37 | fecha_max_expediente | 2027-07-03 | 2027-07-05 |

**Corrección importante**: al revisar `periodos.service.js` (`listarPeriodosVigentes`,
lo que el formulario real de GR ofrece elegir) encontramos que "vigente" NO se decide
por `fecha_inicio` como asumimos antes, sino por **`fecha_max_expediente >= hoy`**
— el propio código real tiene un comentario explicando que filtrar por `fecha_inicio`
fue un bug ya corregido. Con esto, de los 38, **15 están vigentes hoy (2026-11-07):
ids 24 a 38**. El id 23 (`fecha_max_expediente` 2026-11-03) ya venció hace 4 días
aunque su `fecha_inicio` (2026-11-18) todavía no llega — no aparecería como opción
en el formulario real de GR hoy.

**Nota**: el validador real también exige que `Vacacional`/`Periodo` tengan
`fecha_inicio` **estrictamente futura** al momento de crearse por la UI — nosotros
nos saltamos esto a propósito, porque el seed necesita crear tanto casos pasados
como futuros (cosa que la UI real no permite hacer directamente, pero que sí
necesitamos para la demo).

Las ~38 filas adicionales de prueba/basura (`TEST...`, `TEMP...`, `[PRUEBA...]`, `DEMO
periodo...`) que hoy conviven con las 38 oficiales en la BD de desarrollo se descartan
al reiniciar la BD desde cero — no se migran a este seed.

## Reglas de generación de datos — verificadas contra el código real

Fuente: `backend/src/lib/validators.js`. Todo dato generado debe cumplir esto:

- **Nombre / apellidos**: `/^[A-Za-zÀ-ÖØ-öø-ÿÑñ' -]{2,50}$/` — solo letras (con
  acentos/Ñ), apóstrofe, guión, espacio. **Sin números** — esto es una regla real del
  backend, no solo estilo.
- **Correo alumno**: `/^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/i` — letras, luego
  exactamente 4 dígitos, dominio fijo `@alumno.ipn.mx`.
- **Correo profesor/coordinador**: el backend solo exige `/^[^\s@]+@ipn\.mx$/i`
  (permisivo), pero por convención del equipo se genera **sin números ni puntos** en
  la parte local (ej. `profesor.apellido@ipn.mx`, nunca `profesor1@ipn.mx` ni
  `p.ramirez@ipn.mx`).
- **Boleta**: `/^(19|20)\d{2}63\d{4}$/` — 10 dígitos exactos: año de cohorte
  (restringido por el equipo a **2018–2022**), luego `63` **fijo e inmutable**
  (código de carrera de ESCOM), luego 4 dígitos libres sin restricción adicional.
- **Teléfono / celular**: `/^\d{10}$/` — exactamente 10 dígitos.
- **Contraseña**: una sola contraseña fija para **todos** los usuarios de `00-comun`
  Y para todos los que cree cada quien en su propia parte (`cred-gr-ah-lss`,
  `amd-pro-rep`): **`JAjaja1818#`**. Pasa la validación real del backend
  (`validarContrasena` — mínimo 8 caracteres, mayúscula, minúscula, número y
  carácter especial), a diferencia del `12345678` que usan los seeds viejos del
  proyecto (ese no pasaría la validación real si alguna vez se revalida).

### Nombres de usuarios

**Todos** los usuarios que se generen (coordinadores, profesores, alumnos — en
`00-comun`, en `cred-gr-ah-lss` y en `amd-pro-rep` por igual) deben tener
**nombres normales, generados al azar** (ej. "GABRIELA HERRERA SOTELO"). **Nunca**
nombres que describan para qué sirve la cuenta o qué caso de prueba representa
(ej. nunca algo como "LSS COORD EVAL APRUEBA", que es el estilo que usan los seeds
ad-hoc viejos del proyecto). Por qué: estos seeds son para una demo real frente a
gente — un nombre que delata el caso de prueba rompe la ilusión de que es un
sistema con datos reales. Si se necesita documentar qué caso representa cada
usuario, eso va en comentarios del código o en una tabla aparte, nunca en el
nombre de la persona.

### `creado_por_id` en coordinadores/profesores

El alta real (CU-CRED-03, `crearUsuario`) siempre fija `creado_por_id` al
coordinador que da de alta la cuenta — nunca queda null. Como los 2 coordinadores
de `00-comun` son los primeros del seed (no hay un tercero previo que los cree),
decisión de equipo: el primero queda con `creado_por_id` apuntando **a sí mismo**
(autoreferencia — sí, se ve como que se creó solo, y está bien así, no tiene
efecto funcional) y el segundo queda creado por el primero. Si `amd-pro-rep` crea
más coordinadores o profesores, debe fijarles `creado_por_id` a alguno de los 2
de `00-comun` (nunca dejarlo en null).

### Campos que el alta real deja en `null` (no inventar un valor)

- `usuario.intentos_fallidos` / `usuario.cuenta_bloqueada` — el alta real no los
  toca, quedan `null`. No poner `0`/`false`.
- `recurso.fecha_actualizacion` — el alta real siempre lo deja `null` ("todavía
  no ha sido editado"); solo se llena cuando alguien lo edita después. No poner
  la misma fecha que `fecha_registro`.

## Lo que `amd-pro-rep` SÍ puede tocar

- `caracteristica` — confirmarlo o corregirlo con datos reales (es su catálogo).
- `contacto_institucional` — ajustarlo si su módulo lo necesita, avisando antes.

## Lo que `amd-pro-rep` NO debe tocar bajo ninguna circunstancia

- El calendario completo (festivos, vacacionales, periodos de registro,
  **incluidos los 2 inhábiles parciales de octubre 2026** — 8 y 22, ver
  `03-calendario.js`) — ya cerrado, fijo para siempre.
- `carrera`, `recurso` — ya están bien, tal cual.
- Los 2 coordinadores compartidos — no crear una tercera cuenta.
- Los usuarios/alumnos de `cred-gr-ah-lss/` — se usan como base de lectura, nunca se
  modifican ni se reemplazan desde `amd-pro-rep/`.

**Si necesitas mostrar que tu módulo reacciona de cierta forma a una fecha**
(un bloqueo, un estado distinto, etc.), el calendario ya tiene variedad de
sobra para eso (festivos, vacacionales, los 2 inhábiles parciales) — la
forma correcta es **acomodar los datos de un alumno** (qué bitácoras/
actividades tiene y en qué fechas, dentro de este calendario ya fijo), nunca
agregar o mover fechas del calendario mismo.

## Seeds ya probados (checklist)

- [x] `demo-final/00-comun/` — corrido y verificado en vivo en el navegador
      (login, calendario, recursos, contacto institucional, características) —
      ver detalle abajo en "Estado actual".
- [x] `demo-final/cred-gr-ah-lss/01-cred.js` — corrido y verificado en vivo
      en el navegador (con túnel). Ver detalle abajo en "Estado actual".
- [x] `demo-final/cred-gr-ah-lss/02-ofertas-minimas.js` — 13 ofertas ya aprobadas.
- [x] `demo-final/cred-gr-ah-lss/03-gr.js` — 13 escenarios de GR, verificados
      contra la BD y en el navegador. Ver `demo-final/CUENTAS.md`, sección GR.
- [x] `demo-final/cred-gr-ah-lss/04-ah.js` — 8 escenarios de AH (3 alumnos
      nuevos/reutilizados), verificados contra la BD, las funciones reales
      del módulo y el navegador. Ver `demo-final/CUENTAS.md`, sección AH.
- [x] `demo-final/cred-gr-ah-lss/05-reportes-minimos.js` — placeholder
      mínimo de REP (480h + 7 reportes mensuales + global, todos aprobados,
      Itzel) usando las funciones reales de reportes. Firmas de profesor y
      alumno ya commiteadas en `demo-final/firmas-referencia/`, reutilizables
      por cualquier seed vía `guardarRubrica` real.
- [x] `demo-final/cred-gr-ah-lss/06-lss.js` — 4 escenarios de LSS (Itzel +
      3 alumnos nuevos, cada uno recorriendo GR+AH+REP completos antes de
      llegar a su checkpoint), verificados contra la BD y el navegador. Ver
      `demo-final/CUENTAS.md`, sección LSS.
- [x] `demo-final/cred-gr-ah-lss/index.js` — encadena los 6 pasos de arriba.
      Verificado con **3 corridas completas desde cero** (BD vaciada +
      `00-comun/index.js` + este): la 1ª y 2ª encontraron bugs reales
      (ver "Correcciones encontradas al verificar todo junto" abajo); la 3ª,
      ya con todo corregido en el código, terminó con 0 errores y 0 riesgos
      de fecha. `demo-final/cred-gr-ah-lss/` queda completo: CRED → ofertas →
      GR → AH → REP mínimo → LSS.
- [ ] `demo-final/amd-pro-rep/` — sin empezar (de Sol).

### Correcciones encontradas al verificar todo junto

Nadie había corrido los 6 pasos completos **desde una BD vacía, de un
jalón**, hasta esta verificación — cada módulo se había probado por su
cuenta. Aparecieron 3 bugs reales, los 3 ya corregidos en el código (no
solo parchados en la BD) y reverificados:

1. **Rúbricas: el seed no era idempotente de verdad.** `sembrarRubricaSiFalta`
   (en `05-reportes-minimos.js` y `06-lss.js`) solo revisaba si
   `usuario.rubrica_imagen` ya tenía valor en la BD — pero `guardarRubrica`
   real también falla si el **archivo físico** ya existe en disco (mismo
   correo/boleta → misma ruta fija), algo que pasa si vacías la BD sin
   limpiar `uploads/` entre corridas. Se corrigió para que, si eso pasa,
   la BD se sincronice con el archivo que ya existe, en vez de tronar.
2. **4 actividades de AH con `fecha_limite` antes del 23 de noviembre**
   (la de Sofía que debía quedarse "sin comenzar", y 3 de Gerardo) — ya
   estaban corregidas a mano en la BD de una sesión anterior, pero nunca en
   el código de `04-ah.js`, así que reaparecieron al reconstruir desde
   cero. El cron real `marcarActividadesVencidas` las habría vuelto
   `vencida` solas antes de la demo.
3. **A Sofía le faltaba el "seguro" contra el cron de faltas**
   (`fecha_ultima_evaluacion_faltas`) — mismo caso que el punto 2: ya
   corregido a mano antes, nunca en el código. Sin esto, el cron real
   `contabilizarFaltasDiarias` le habría contado faltas retroactivas desde
   su fecha de inicio (16 de octubre) la próxima vez que corriera.

## Estado actual

**`00-comun/` ya está implementado y probado** contra la BD de desarrollo real
(`backend/src/seeds/demo-final/00-comun/`: `01-catalogos.js`, `02-coordinadores.js`,
`03-calendario.js`, `04-recursos-contacto.js`, `index.js`). Es idempotente — correrlo
de nuevo no duplica nada.

**`cred-gr-ah-lss/01-cred.js` ya está implementado y probado.** Siembra 7
profesores (uno "de base" sin característica + uno por cada una de las 6
características reales del catálogo de `00-comun`), usando las funciones
REALES del módulo en vez de insertar filas directas: `usuarios.service.js::crearUsuario`
(CU-CRED-03 — password aleatoria + token de bienvenida) y luego
`password.service.js::restablecerContrasena` (CU-CRED-02, mismo camino real
que `/establecer-contrasena/:token`) para dejarlos todos en la contraseña
fija del seed (`JAjaja1818#`). El bloqueo de cuenta por intentos fallidos y
la recuperación de contraseña se demuestran en vivo durante la demo —
decisión de equipo, no se siembra ningún estado para esos 2 casos.

Verificado en el navegador (vía túnel, `https://ttservicio.com`): login del
coordinador, lista de 9 usuarios (7 profesores + 2 coordinadores) en
"Gestión de Usuarios", detalle de un profesor con característica (cupos
calculados correctos), y login real de un profesor con la contraseña del
seed.

**Tabla de cuentas por escenario**: [`demo-final/CUENTAS.md`](demo-final/CUENTAS.md)
— qué correo usar para cada caso que pidan mostrar en la demo (y qué
combinación de cuentas usar cuando el caso necesita más de una ya
relacionada entre sí). Se actualiza cada vez que un seed nuevo agrega un
usuario o un escenario demostrable.

**`cred-gr-ah-lss/` completo** (01-cred → 02-ofertas-minimas → 03-gr →
04-ah → 05-reportes-minimos → 06-lss, encadenados en `index.js`) —
verificado con 3 corridas completas desde cero, la última con 0 errores y
0 riesgos de fecha (ver "Correcciones encontradas al verificar todo
junto" arriba). Detalle completo de cada escenario, actores y pasos para
reproducirlos en vivo: [`demo-final/CUENTAS.md`](demo-final/CUENTAS.md).

Pendiente: `demo-final/amd-pro-rep/` (de Sol). También pendiente: confirmar
`VACACIONES_2027` (ver `03-calendario.js` — se dejó vacío a propósito, no
se inventó nada).
