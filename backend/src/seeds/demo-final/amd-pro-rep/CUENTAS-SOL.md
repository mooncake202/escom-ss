# Cuentas de `amd-pro-rep` — qué correo usar para cada escenario (PRO, REP, ADM)

Misma estructura que `demo-final/CUENTAS.md` (de Karen), solo con lo que
siembra `amd-pro-rep/`. Contraseña única para **todas** las cuentas de este
archivo: `JAjaja1818#`.

Se va actualizando conforme se siembra cada parte:
- Parte 1 (base): ✅ 3 profesores.
- Parte 2 (PRO): ✅ 11 ofertas.
- Parte 3 (REP): ✅ 6 alumnos de `profesorlozano` + su solicitud de característica.
- Parte 4 (ADM): ✅ característica de `profesorsalinas`, 3 alumnos de bajas, anuncios y carta firmada de `rojas2301`.

## ⚠️ Avisos para Karen

**a) Falta la TSA de respaldo en el `.env` de la VM.** Hay que agregar
`TSA_URL_RESPALDO=http://timestamp.digicert.com` y recrear el backend
(`docker compose up -d backend`). Sin eso, en vivo cualquier rechazo de FreeTSA
hace fallar firmas y aprobaciones.

**b) Lo que verás en coordinación por mis casos:**
- 2 ofertas por validar (S1 y S2 de `profesorsalinas`, caso en vivo).
- 1 reporte por validar (R4 de `espinoza2101`).
- 6 notificaciones sin leer (3 por coordinador: características de P1 y P2, y baja de `castro2601`).
- Bajas activas: `castro2601` (pendiente) y `zamora2701` (en revisión).
- S3 "Banco de reactivos para exámenes de Cálculo" (`profesorsalinas`, 1 cupo) en el catálogo de ofertas de los alumnos.
- A1 "Clasificación de imágenes para el acervo fotográfico" (`profesoraguirre`) vuelve al catálogo si en vivo apruebo la baja de `zamora2701`.

## Siembra del lunes 23 de noviembre de 2026

Los seeds de Karen dependen del día en que se corren, así que la cadena es única
y se corre **el mismo lunes, temprano (propuesta: ~8:00)**, sobre BD vacía.
Hay dos variantes, según quién la corra.

### A) Si la corro yo (Sol)

Mi usuario no puede leer el `.env` de la VM y `docker compose` lo necesita, así
que todo va con **`docker exec`** (el contenedor ya trae su entorno y su
directorio de trabajo es `/app`).

0. `docker exec escom_redis redis-cli FLUSHDB`
1. `docker exec escom_backend npx prisma migrate reset --force`
2. `docker exec escom_backend node backend/src/seeds/demo-final/00-comun/index.js`
3. `docker exec -e TSA_URL_RESPALDO=http://timestamp.digicert.com escom_backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js`
   Al terminar imprime "✅ cred-gr-ah-lss completo." y se queda colgado: Ctrl+C y
   luego `docker exec escom_backend pkill -f cred-gr-ah-lss/index.js` (el Ctrl+C
   corta el cliente, pero el proceso sigue vivo dentro del contenedor).
4. `docker exec -e TSA_URL_RESPALDO=http://timestamp.digicert.com escom_backend node backend/src/seeds/demo-final/amd-pro-rep/index.js`
   (termina solo con código 0; tarda ~30 s, en el peor caso ~11 min si la TSA
   principal no responde y cada firma espera al respaldo)
5. A las 9:30: `docker exec escom_backend node backend/src/seeds/demo-final/amd-pro-rep/verificar.js`

`-e TSA_URL_RESPALDO=…` solo aplica a **ese** proceso: no cambia el `.env` ni el
servidor en marcha (ver aviso a).

### B) Si la corre Karen con su usuario

1. `git pull`
2. `docker exec escom_redis redis-cli FLUSHDB`
3. `bash backend/src/seeds/demo-final/reset-y-sembrar-demo.sh` (reset, 00-comun y
   cred-gr-ah-lss). Al terminar imprime "✅ cred-gr-ah-lss completo." y se queda
   colgado: Ctrl+C y luego `docker exec escom_backend pkill -f cred-gr-ah-lss/index.js`
   (el Ctrl+C corta el cliente, pero el proceso sigue vivo dentro del contenedor).
4. `docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/index.js`
5. `docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/verificar.js`

Si el `.env` aún no tiene `TSA_URL_RESPALDO`, lo ideal es **agregarlo antes de
empezar** (ver aviso a): `reset-y-sembrar-demo.sh` también pide sellos de tiempo y,
sin respaldo, se detiene si FreeTSA rechaza uno (así falló el 22-nov en la VM). Si
aun así se siembra sin agregarlo, el paso 4 va con el `-e`:
`docker compose exec -T -e TSA_URL_RESPALDO=http://timestamp.digicert.com backend node backend/src/seeds/demo-final/amd-pro-rep/index.js`

En Windows los mismos comandos funcionan igual: todo corre dentro del contenedor.

### Notas de la verificación

`verificar.js` es solo lectura (~3 s) y termina con código 0 si todos mis casos están bien.

Se corre así, como root (no hace falta `-u node`): para probar el acceso real del
servidor, `verificar.js` lanza un proceso hijo con el uid/gid del usuario `node`
(leídos de `/etc/passwd` del contenedor), que lee cada firma y PDF de mis
usuarios y crea y borra un archivo temporal en sus carpetas. Si se corre con
`docker exec -u node escom_backend node …`, hace la misma prueba
directamente. Si `node` no puede leer o escribir algo mío: ❌ y código 1.
En la VM el servidor corre como root (comprobado con `docker top`), así que ahí
esta prueba siempre pasa; el problema de dueño `root` vs `node` solo existe en
entornos donde el servidor corre como `node` (mi local), y el paso 7 de mi
`index.js` lo resuelve para mis carpetas.

También revisa la regla de rúbricas: cada usuario mío tiene rúbrica ⇔ ya firmó
algo, y quien no tiene no deja carpeta `Rubrica/` en disco. ⚠️ Si se ensaya en
vivo con `ortega1901`, `mejia2001` o `hernandez2401` (o con `profesorsalinas`,
`profesoraguirre` o los de bajas), su rúbrica queda registrada: volver a sembrar
**desde cero** (variante A o B completa) para que la pida otra vez; correr solo mi
`index.js` no la quita.

Si mi `index.js` se detiene por la TSA (ambas caídas), se vuelve a correr solo ese
paso: retoma donde quedó, sin duplicar nada.

Los escenarios están pensados para verse igual de 9:30 a 13:00 y no moverse con
los crons de medianoche.

## Por módulo — CASO → correo(s)

### PRO

| Caso | Correo(s) |
|---|---|
| Coordinación aprueba una solicitud de oferta (CU-PRO-02) | cualquier coordinador → S1 o S2 de `profesorsalinas@ipn.mx` |
| Coordinación rechaza una solicitud de oferta con motivo (CU-PRO-02) | cualquier coordinador → la otra de S1/S2 |
| Profesora cierra una oferta aprobada sin alumnos (CU-PRO-04) | `profesorsalinas@ipn.mx` → S3 |
| Profesora corrige y reenvía una oferta rechazada | `profesorsalinas@ipn.mx` → S4 (notificación del rechazo sin leer) |
| Ver ofertas cerradas y concluidas en su historial (CU-PRO-05) | `profesorsalinas@ipn.mx` → S5 y S6 |
| Profesor con todas sus ofertas aprobadas (las ocupan los casos de REP) | `profesorlozano@ipn.mx` |
| Oferta de proyecto con 3 cupos (la ocupan los casos de bajas) | `profesoraguirre@ipn.mx` |

### REP

| Caso | Correo(s) |
|---|---|
| Generar y firmar un reporte mensual en vivo (último día de plazo, 5/5) | `ortega1901@alumno.ipn.mx` |
| Reporte vencido: aviso rojo en REP y jornada bloqueada en AH | `mejia2001@alumno.ipn.mx` |
| Bitácora sin revisar bloquea el reporte → el profesor la aprueba y se desbloquea | `hernandez2401@alumno.ipn.mx` + `profesorlozano@ipn.mx` |
| Profesor revisa y firma un reporte pendiente (CU-REP-05) | `profesorlozano@ipn.mx` → R4 de `padilla2201` |
| Coordinación valida un reporte con el sello (CU-REP-06) | cualquier coordinador → R4 de `espinoza2101` |
| Alumno corrige un reporte rechazado por coordinación | `espinoza2101@alumno.ipn.mx` (R3) |
| Alumno corrige un reporte rechazado por el profesor | `padilla2201@alumno.ipn.mx` (R2) |
| 480 horas: generar el reporte global en vivo | `rojas2301@alumno.ipn.mx` |
| Historial completo de reportes aprobados (7) | `rojas2301@alumno.ipn.mx` |

### ADM

| Caso | Correo(s) |
|---|---|
| Solicitud de característica que ya no puede aprobarse (CU-ADM-16) | cualquier coordinador → solicitud de `profesorlozano@ipn.mx` |
| Solicitud de característica aprobable (CU-ADM-16) | cualquier coordinador → solicitud de `profesorsalinas@ipn.mx` |
| Profesor amonesta o solicita la baja de un alumno (CU-ADM-09) | `profesoraguirre@ipn.mx` → `dominguez2501` |
| Coordinación turna una baja a las autoridades (CU-ADM-12) | cualquier coordinador → baja de `castro2601@alumno.ipn.mx` |
| Coordinación aprueba o rechaza una baja en revisión (CU-ADM-12) | cualquier coordinador → baja de `zamora2701@alumno.ipn.mx` |
| Alumno con baja rechazada y amonestación sin leer | `dominguez2501@alumno.ipn.mx` |
| Anuncios del profesor, uno sin leer (CU-ADM) | `ortega1901@alumno.ipn.mx` (o cualquier alumno de `profesorlozano`) · `dominguez2501@alumno.ipn.mx` |
| Coordinación sube la carta compromiso firmada (CU-ADM-14) | cualquier coordinador → `ortega1901` con `~/escom-ss-respaldos/demo/carta-firmada-1901.pdf` |
| Expediente de documentos (CU-ADM-13) | cualquier coordinador → `rojas2301` (11 documentos) |
| Usuarios asignados (CU-ADM-17) | cualquier coordinador → `profesorlozano` (6), `profesoraguirre` (3) |

## PRO — detalle de cada escenario (actores y pasos para reproducir)

Sembradas con los servicios reales (crear CU-PRO-01, decidir CU-PRO-02,
cerrar CU-PRO-04). S6 se pasa a "concluida" directo, sin alumnos, con la
misma notificación que manda el cron (ya leída).

| # | Profesor | Oferta | Tipo | Registro | Estado el 23 nov | Revisó |
|---|---|---|---|---|---|---|
| S1 | `profesorsalinas` | Asistente virtual para dudas de inscripción | proyecto, 2 cupos (ISC, IA) | 19 nov | En revisión | — |
| S2 | `profesorsalinas` | Tablero de asistencia a asesorías de Ciencias Básicas | individual (LCD) | 20 nov | En revisión | — |
| S3 | `profesorsalinas` | Banco de reactivos para exámenes de Cálculo | individual (ISC, LCD) | 9 nov | Activa, sin alumnos | herrera, 11 nov |
| S4 | `profesorsalinas` | Apoyo general en laboratorio | proyecto, 3 cupos (ISC) | 4 nov | Rechazada | villagrán, 6 nov |
| S5 | `profesorsalinas` | Captura de calificaciones históricas de Álgebra | individual (ISC) | 14 sep | Cerrada por la profesora | herrera, 17 sep |
| S6 | `profesorsalinas` | Material didáctico de Matemáticas Discretas | individual (ISC) | 9 feb | Concluida (30 oct) | villagrán, 11 feb |
| L1 | `profesorlozano` | Sistema de seguimiento de egresados | individual | 26 feb | Activa (para el alumno de 480 h) | herrera |
| L2 | `profesorlozano` | Migración del portal departamental | proyecto, 2 cupos | 2 jun | Activa (2 alumnos de REP) | herrera |
| L3 | `profesorlozano` | Inventario de equipo de laboratorios | individual | 26 ago | Activa (alumno con reporte vencido) | herrera |
| L4 | `profesorlozano` | Automatización de constancias internas | proyecto, 2 cupos | 9 sep | Activa (reporte en vivo + bitácora pendiente) | herrera |
| A1 | `profesoraguirre` | Clasificación de imágenes para el acervo fotográfico | proyecto, 3 cupos (IA, LCD) | 23 sep | Activa (3 alumnos de bajas) | villagrán |

**1. Aprobar y rechazar en vivo (CU-PRO-02).** Coordinación → Solicitudes de
oferta: abrir S1, elegir Programa y Actividad SISS y aprobar; abrir S2 y
rechazar con motivo. A `profesorsalinas` le llega la notificación.

**2. Cerrar una oferta (CU-PRO-04).** `profesorsalinas` → Mis ofertas → S3 →
Cerrar. No tiene alumnos, así que se permite.

**3. Corregir y reenviar una rechazada.** `profesorsalinas` ve sin leer el
rechazo de S4, con el motivo; corrige la descripción y los cupos, y reenvía.
Vuelve a "En revisión".

**4. Historial (CU-PRO-05).** `profesorsalinas` ve sus 6 ofertas, en los 5 estados.

## REP — detalle de cada escenario (actores y pasos para reproducir)

Todos los alumnos son de `profesorlozano` (6 de 6 cupos). Reportes sembrados con
los servicios reales de REP (PDF, firma, SHA-256, sello de tiempo y cifrado) con
fechas pasadas: envío el primer día generable, revisión del profesor 1 día hábil
después y validación de coordinación 1 día hábil después de esa. Bitácoras de 4 h
en días hábiles. Notificaciones leídas, salvo los 2 rechazos por corregir.

**Rúbricas (firmas).** Solo tiene rúbrica sembrada quien ya firmó algo:
`profesorlozano` (ya revisó reportes) y `espinoza2101`, `padilla2201` y `rojas2301`
(ya enviaron reportes). `ortega1901`, `mejia2001` y `hernandez2401` no han enviado
nada: **no tienen rúbrica** y el asistente de Generar reporte les agrega el paso
"Firma" para dibujarla/subirla en vivo la primera vez (sin ella, la vista previa y el
envío responden 409 `RUBRICA_NO_REGISTRADA`). `profesorsalinas`, `profesoraguirre` y
los alumnos de bajas (`2501`–`2701`) tampoco tienen. Lleva a la demo una imagen de
firma (PNG/JPG, máx. 3 MB) o dibújala en el momento.

| Alumno | Nombre | Oferta · inicio | Bitácoras | Reportes | Qué ve el 23 nov |
|---|---|---|---|---|---|
| `ortega1901` | Jimena Ortega Salazar | L4 · 16 oct | 24 aprobadas (96 h) | ninguno | R1 (16 oct–13 nov) listo para generar; plazo día 5 de 5 |
| `mejia2001` | Rodrigo Mejía Carrillo | L3 · 1 oct | 25 aprobadas (100 h), ninguna desde el 9 nov | ninguno | R1 (octubre) vencido desde el 6 nov; AH no le deja iniciar jornada |
| `espinoza2101` | Paola Espinoza Trejo | L2 · 1 jul | 84 aprobadas (336 h) | R1 y R2 aprobados · R3 rechazado por coordinación · R4 pendiente de coordinación | noviembre aún no cierra |
| `padilla2201` | Miguel Ángel Padilla Villa | L2 · 1 jul | 84 aprobadas (336 h) | R1 aprobado · R2 rechazado por el profesor · R3 aprobado · R4 pendiente del profesor | noviembre aún no cierra |
| `rojas2301` | Ximena Rojas Márquez | L1 · 16 abr | 120 aprobadas (480 h; cruza el 28 oct) | R1–R7 aprobados | reporte global listo para generar |
| `hernandez2401` | Bruno Hernández Galván | L4 · 16 oct | 18 aprobadas + 1 pendiente (12 nov) | ninguno | R1 bloqueado por bitácora sin revisar; plazo día 5 de 5 |

**1. Generar y firmar el reporte en vivo.** `ortega1901` → Mis reportes → Generar
R1 → calendario → actividades → **Firma** (registra su rúbrica, primera vez) →
vista previa → enviar. Va a `profesorlozano`, que lo firma; coordinación lo valida con el
sello. ⚠️ El 23 es el último día del plazo: el 24 ya sale vencido.

**2. Reporte vencido.** `mejia2001` ve el aviso rojo en Mis reportes (puede
generarlo igual; también le pide su rúbrica la primera vez) y en AH no puede iniciar jornada hasta enviarlo.

**3. Bitácora pendiente.** `hernandez2401` no puede generar R1 ("bitácoras sin
revisar"). `profesorlozano` aprueba la bitácora del 12 nov y el alumno ya puede
generarlo (con el paso "Firma", porque aún no tiene rúbrica).

**4. Revisión del profesor.** `profesorlozano` → Reportes por revisar → R4 de
`padilla2201` → aprobar y firmar (o rechazar con motivo).

**5. Validación de coordinación.** Coordinación → Reportes → R4 de
`espinoza2101` → validar (agrega el sello institucional).

**6. Corregir rechazados.** `espinoza2101` corrige R3 (motivo de coordinación);
`padilla2201` corrige R2 (motivo del profesor). Ambos tienen la notificación sin leer.

**7. Reporte global.** `rojas2301` → Reporte global → generar y enviar.

## ADM — detalle de cada escenario (actores y pasos para reproducir)

**1. Característica que ya no puede aprobarse (CU-ADM-16).** `profesorlozano`
(Jefe de departamento, 6 cupos) pidió el 21 sep cambiar a Investigador (4 cupos),
cuando tenía 3 alumnos y sí cabía. Hoy tiene 6. Coordinación → Solicitudes de
características: la tarjeta dice "⚠ Ya no se puede aprobar"; el detalle explica
que con 6 alumnos y capacidad 4 tendría que liberar 2 cupos, y el botón Aprobar
está deshabilitado. Solo se puede rechazar con motivo.

**2. Característica aprobable (CU-ADM-16).** `profesorsalinas` (base, 3 cupos,
0 alumnos) pidió el 18 nov la característica Investigador (4 cupos). Coordinación
la aprueba en vivo: pasa a 4 cupos. Ponla junto a la de `profesorlozano` para el
contraste.

**3. Bajas (CU-ADM-09, 11 y 12).** Profesor `profesoraguirre`, oferta A1, periodo
del 3 nov. En el flujo real el profesor no revisa bajas: las solicita (sin
expediente) o amonesta; el alumno puede pedir la suya (con expediente) o
adjuntarlo después; **solo coordinación decide**: pendiente → en revisión
(turnar, exige expediente) → aprobada o rechazada.

| Alumno | Historia sembrada | Estado el 23 nov | En vivo |
|---|---|---|---|
| `dominguez2501` (Santiago Domínguez Perea) | 9 nov: el profesor pide su baja por faltas · 10 nov: adjunta expediente · 12 nov: coordinación la rechaza (constancia médica) · 13 nov: el profesor lo amonesta | asignado; baja rechazada en su historial; amonestación sin leer | `profesoraguirre` lo amonesta o pide una baja nueva |
| `castro2601` (Renata Castro Leyva) | 18 nov: la alumna pide su baja con expediente (cambio de residencia) | baja pendiente de coordinación | coordinación la marca "en revisión" |
| `zamora2701` (Emilio Zamora Ávila) | 10 nov: el profesor pide la baja (horario de su nuevo empleo) · 11 nov: adjunta expediente · 13 nov: coordinación la turna | baja en revisión | coordinación la aprueba (o rechaza) |

Si se aprueba la de `zamora2701`: el alumno pasa a "sin asignar" y su solicitud a
"modificar y reenviar" (puede postularse a otra oferta); se borran sus
bitácoras, actividades y documentos del servicio; `profesoraguirre` queda con
2 de 3 cupos y la oferta A1 vuelve al catálogo con 1 lugar.

**4. Anuncios del profesor.** Sin anuncios de coordinación.

| Profesor | Fecha | Anuncio | Visto por |
|---|---|---|---|
| `profesorlozano` | 3 nov | Reunión de seguimiento del viernes 6 de noviembre | sus 6 alumnos |
| `profesorlozano` | 17 nov | Recordatorio: revisen el plazo de su reporte mensual | nadie (sin leer para los 6) |
| `profesoraguirre` | 4 nov | Reunión de arranque del proyecto | `castro2601` y `zamora2701` (sin leer para `dominguez2501`) |

**5. Carta compromiso firmada (CU-ADM-14).** Queda disponible para el alumno en
la etapa **"Término"** de sus documentos (ADM-13, RN-ADM-47). Ya enviada: solo
`rojas2301` (20 nov, después de su R7 validado el 19 nov), que está por terminar.
`espinoza2101`, `padilla2201` y los demás, pendientes. En vivo, coordinación sube
la de `ortega1901` con el PDF de ejemplo
**`~/escom-ss-respaldos/demo/carta-firmada-1901.pdf`** (fuera del repo; dice
"documento de ejemplo para la demostración").

**6. Expediente (CU-ADM-13) y usuarios asignados (CU-ADM-17).** Sin datos extra:
`rojas2301` tiene 11 documentos: en "Inicio" carta de créditos, seguro social y
expediente; en "Desarrollo" R1–R7; en "Término" la carta compromiso firmada.
`profesorlozano` 6 alumnos y `profesoraguirre` 3.

## Listado general de todas las cuentas

Para cuando ya sabes el correo y solo quieres confirmar el detalle.

### Coordinadores

Son los 2 de `00-comun` (ver `demo-final/CUENTAS.md`); `amd-pro-rep` solo
los usa como creador, revisor o validador, nunca los modifica.

### Profesores (CU-CRED-03)

Creados por `coordinadorherrera@ipn.mx` con fecha de alta 3 feb 2026 (no se
muestra en pantalla). Cupos = `CUPOS_BASE (3) + incremento_cupos` de la
característica.

| Correo | Nombre | Escenario / característica | Cupos totales | Departamento · cubículo · horario · teléfono |
|---|---|---|---|---|
| `profesorlozano@ipn.mx` | Roberto Lozano Medina | Casos de REP · Jefe de departamento (+3) | 6 | Sistemas Computacionales · ESCOM-201 · Lunes a viernes 10:00-12:00 · 5539174826 |
| `profesorsalinas@ipn.mx` | Elena Salinas Corona | Casos de PRO · profesor de base | 3 | Ciencias Básicas · ESCOM-202 · Lunes a viernes 12:00-14:00 · 5587203615 |
| `profesoraguirre@ipn.mx` | Héctor Aguirre Becerril | Bajas y anuncios (ADM) · profesor de base | 3 | Inteligencia Artificial · ESCOM-203 · Lunes a viernes 16:00-18:00 · 5562948307 |

### Alumnos

| Correo | Nombre | Boleta | Carrera | Profesor / oferta | Estado |
|---|---|---|---|---|---|
| `ortega1901@alumno.ipn.mx` | Jimena Ortega Salazar | 2020631901 | ISC | `profesorlozano` (L4) | `alumno_asignado` |
| `mejia2001@alumno.ipn.mx` | Rodrigo Mejía Carrillo | 2021632001 | IA | `profesorlozano` (L3) | `alumno_asignado` |
| `espinoza2101@alumno.ipn.mx` | Paola Espinoza Trejo | 2020632101 | ISC | `profesorlozano` (L2) | `alumno_asignado` |
| `padilla2201@alumno.ipn.mx` | Miguel Ángel Padilla Villa | 2021632201 | ISC | `profesorlozano` (L2) | `alumno_asignado` |
| `rojas2301@alumno.ipn.mx` | Ximena Rojas Márquez | 2019632301 | LCD | `profesorlozano` (L1) | `alumno_asignado` |
| `hernandez2401@alumno.ipn.mx` | Bruno Hernández Galván | 2021632401 | ISC | `profesorlozano` (L4) | `alumno_asignado` |
| `dominguez2501@alumno.ipn.mx` | Santiago Domínguez Perea | 2021632501 | IA | `profesoraguirre` (A1) | `alumno_asignado` (baja rechazada) |
| `castro2601@alumno.ipn.mx` | Renata Castro Leyva | 2020632601 | LCD | `profesoraguirre` (A1) | `alumno_asignado` (baja pendiente) |
| `zamora2701@alumno.ipn.mx` | Emilio Zamora Ávila | 2021632701 | IA | `profesoraguirre` (A1) | `alumno_asignado` (baja en revisión) |

### Interacciones ya armadas (más de 1 usuario)

| Escenario | Usuarios involucrados |
|---|---|
| Ver quién creó a quién (`creado_por_id`) | `coordinadorherrera@ipn.mx` creó a `profesorlozano`, `profesorsalinas` y `profesoraguirre` |
| Reporte en vivo: alumno → profesor → coordinación | `ortega1901` → `profesorlozano` → cualquier coordinador |
| Bitácora pendiente que desbloquea un reporte | `profesorlozano` + `hernandez2401` |
| Contraste de características (aprobable vs. no aprobable) | `profesorsalinas` y `profesorlozano` + cualquier coordinador |
| Baja completa hasta liberar el cupo | `zamora2701` + cualquier coordinador; se ve en `profesoraguirre` y en el catálogo |
