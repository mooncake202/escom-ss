# Traspaso a Sol — AMD / PRO / REP del video

Este archivo es para ti, Sol. Aquí está todo lo que necesitas para grabar tu
parte del video — **primero PRO, luego REP** — usando exactamente los mismos
usuarios que Karen ya dejó listos en CRED/GR/AH. **No crees ningún usuario
nuevo**, reutiliza estos.

## 0. Tu punto de partida: respaldar lo tuyo, luego restaurar lo de Karen

**No corras ninguno de los scripts de Karen.** Pasos, en orden:

1. **Primero, respalda tú misma tus datos actuales** (aunque estén sucios o
   sean de prueba) en tu propia carpeta de respaldos — solo para tener a
   dónde volver si algo se rompe a medio camino. Una vez que confirmes que
   ese respaldo tuyo quedó bien, sigue al paso 2.
2. Graba PRO primero (ver sección de "La oferta ya aprobada" más abajo —
   un setup mínimo aparte, SIN el respaldo de Karen todavía).
3. Cuando termines PRO: limpia tu base de datos local (vacía todas las
   tablas, o reinicia el contenedor de MariaDB con el volumen borrado) y
   restaura el archivo que Karen te va a pasar:
   `backend/src/seeds/backup/karen/respaldo_20261108_1358.sql`. Usa `root` y
   tu propia variable `$MYSQL_ROOT_PASSWORD` (la de TU `.env`, no la de
   Karen) — así no depende de que tu usuario/contraseña de MySQL coincidan
   con los de nadie más:
   ```bash
   docker compose cp respaldo_20261108_1358.sql mariadb:/tmp/restore.sql
   docker compose exec -T mariadb sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /tmp/restore.sql'
   ```
4. Con eso ya tienes, para grabar REP: los 2 coordinadores, Ricardo
   (profesor), su oferta aprobada, Daniela ya `alumno_asignado`, sus 6
   actividades y 3 bitácoras de octubre, el calendario correcto (incluyendo
   los 2 inhábiles parciales de octubre) — **y cero reportes todavía**. Es
   tu punto de partida exacto para REP.

## Regla dura: el calendario nunca se modifica

El periodo del video (`fecha_inicio = 1 de octubre de 2026`), los festivos,
vacacionales e inhábiles son **fijos, para siempre**. Si quieres mostrar que
tu módulo reacciona de cierta forma a una fecha (un bloqueo, un estado
distinto, lo que sea), la forma correcta es **acomodar los datos de un
alumno** — qué bitácoras/actividades tiene y en qué fechas, dentro del
calendario ya fijo — **nunca** editar el calendario ni el periodo.

Hay 2 fechas marcadas como inhábil parcial en octubre 2026 que debes tener
en cuenta (pueden aparecer en tu reporte como inconsistencia si cae ahí una
bitácora, es normal, el sistema solo lo informa):
- **8 de octubre**, desde las 14:00
- **22 de octubre**, desde las 12:00

## Túnel de Cloudflare — para que también te salga el dominio real

Karen te va a mandar por privado (nunca por git, ese archivo NO está en el
repo) un archivo de credenciales: `bd4f7bbc-67a7-4a98-aee2-c3cd3dc55eb1.json`.

1. Instala `cloudflared` en tu máquina (gratis, no depende de la cuenta de
   Karen).
2. Pon ese archivo, sin cambiarle el nombre, en tu propia carpeta
   `~/.cloudflared/`.
3. Con tu Docker ya corriendo (nginx en el puerto 80):
   ```bash
   cloudflared tunnel run --url http://localhost:80 bd4f7bbc-67a7-4a98-aee2-c3cd3dc55eb1
   ```
   Usa el UUID tal cual (no el nombre "escom-ss") — así no necesitas el
   `cert.pem` de Karen para nada.
4. **Acuerdo importante: nunca lo corran las dos al mismo tiempo.**

## Usuarios ya existentes (contraseña única: `JAjaja1818#`)

| Rol | Nombre | Correo / boleta |
|---|---|---|
| Coordinador 1 | GABRIELA HERRERA SOTELO | `coordinadorherrera@ipn.mx` |
| Coordinador 2 | OMAR VILLAGRAN CASTRO | `coordinadorvillagran@ipn.mx` |
| Profesor | RICARDO NAVARRO OLVERA | `profesornavarro@ipn.mx` |
| Alumna | DANIELA MENDOZA CRUZ | boleta `2021630001`, correo `mendoza0001@alumno.ipn.mx` |

## La oferta ya aprobada

| Campo | Valor |
|---|---|
| `nombre_proyecto` | Desarrollo de sistema de seguimiento academico |
| `tipo_oferta` | individual |
| `programa_SISS` | ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL |
| `nombre_SISS` | APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES |
| Carrera deseada | ISC |
| `estado_oferta` | aprobada |
| `cupos_disponibles` | 1 (ocupado por Daniela) |

**Para PRO (CU-PRO-01/02):** esta oferta ya viene aprobada en el respaldo —
para grabar en vivo el proceso de solicitar y aprobar una oferta (no solo
mostrar una ya aprobada), sigue este camino:
- montar un setup mínimo aparte, sin el respaldo completo: corre solo
  `00-comun` + `cred/01-profesor.js` (coordinador + Ricardo, nada de
  Daniela/AH), y graba en vivo la solicitud/aprobación tecleando **los
  mismos datos de la tabla de arriba**, para que el resultado coincida
  exactamente con el que ya existe del lado de Karen.

## Tus 6 actividades y 3 bitácoras de octubre (ya existen)

| Actividad | Estado |
|---|---|
| Diseñar diagrama entidad-relación... | `sin_comenzar` (referencia) |
| Implementar formulario de captura de avances | `en_progreso` (45%) — 1 bitácora rechazada + 1 aprobada |
| Documentar manual de usuario... | `vencida` |
| Configurar entorno de pruebas... | `completada_a_tiempo` |
| Elaborar reporte de pruebas funcionales | `completada_tarde` |
| Generar reportes de avance en formato PDF | `sin_comenzar`, sin bitácora — así la vas a encontrar siempre, sin importar qué haya grabado Karen en su propia sesión |

Esto ya te da variedad real para tu reporte: una bitácora rechazada, una
vencida, una a tiempo, una tarde — sin que tengas que crear nada tú. Si
quieres variedad adicional (por ejemplo, provocar un bloqueo de
`BITACORAS_SIN_REVISAR`), puedes agregar tú una bitácora extra en estado
`pendiente_revision` sin que el profesor la revise.

## Para el video: graba solo el Reporte 1 (octubre)

El Reporte 1 corresponde al mes de octubre 2026 — es el único que necesitas
grabar para el video. **El candado de fecha ya está abierto de verdad**
(confirmado: el periodo mensual de octubre ya cerró en tiempo real) — no
necesitas ningún truco, ni fingir ninguna fecha, ni script especial: entra
como Daniela y genera el reporte directo desde la pantalla real.

Si en algún punto el sistema te dice que el reporte aún no se puede generar,
**no es un problema de fecha que tengas que resolver moviendo nada** — revisa
si falta algo de datos o si hay una bitácora sin revisar; la tabla de
bloqueos de abajo te dice qué buscar.

## Bloqueos posibles (opcional)

Tú decides si vale la pena mostrarlos — Karen opina que probablemente
sobran para el video, pero quedan documentados por si te sirven:

| Motivo de bloqueo | Cuándo aparece |
|---|---|
| `SIN_BITACORAS_APROBADAS` | periodo sin ninguna bitácora `aprobada` |
| `BITACORAS_SIN_REVISAR` | queda 1+ bitácora `pendiente_revision`/`en_curso`/`pendiente_datos` dentro del periodo |
| `DEMASIADAS_BITACORAS_EN_EL_PERIODO` | más de 24 jornadas en el periodo |
| `PERIODO_NO_CERRADO` | todavía no llega el día hábil administrativo siguiente al `fin` del periodo mensual |
| `SIN_PROGRAMA_SISS` / `SIN_PROFESOR_RESPONSABLE` / `SIN_CORREO_PERSONAL` / `CARRERA_NO_RECONOCIDA` | datos faltantes — con los datos ya dados esto no debería dispararse, pero es útil si quieres mostrar un bloqueo "de datos" aparte de uno "de fechas" |

El reporte global (CU-REP-07) necesita además 480 horas netas aprobadas y
`fecha_fin` del periodo oficial — probablemente fuera de alcance salvo que
quieras mostrarlo también.

## Firmas — se dibujan en un canvas

El componente real es
[`FirmaCanvas.jsx`](../../../../../front/src/features/gestion-reportes/compartido/FirmaCanvas.jsx):
se dibuja con mouse/trackpad/táctil, se exporta como PNG. El backend solo
valida tamaño (≤3 MB) y dimensiones (máx. 4000px de lado).

**Ojo:** Daniela (como alumna) también necesita su propia rúbrica registrada
antes de poder enviar su primer reporte — si no la tiene, el backend
rechaza el envío con "Registra tu rúbrica antes de continuar con el
reporte." No es nada que tengas que resolver aparte: la misma pantalla de
generar reporte (CU-REP-01) ya tiene su propio `FirmaCanvas` para que ella
la dibuje ahí mismo la primera vez, igual que el profesor/coordinación con
las suyas.

**CORRECCIÓN IMPORTANTE (2026-11-08):** la firma del profesor SÍ se comparte
automáticamente entre REP y LSS cuando ambas ocurren sobre la misma base de
datos continua (misma ruta de archivo, confirmado en `lss.rubricas.js`) —
pero Karen va a grabar LSS en su propia copia de la BD, en paralelo, sin
esperar a que tú grabes REP. Eso rompe el compartido automático: su copia ya
tiene una firma de Ricardo dibujada por ella; la tuya (en tu copia restaurada
desde el backup) va a ser un archivo distinto. Si las dos quedan en el video
final, el espectador podría notar que la firma de Ricardo "cambia" entre el
segmento de REP y el de LSS.

**Por eso sí importa que la repliques.** Karen ya exportó la firma EXACTA
que quedó en su grabación de LSS, para que la calques lo más parecido
posible al dibujar la del profesor en REP:

[`firmas-referencia/firma_ricardo_real.png`](firmas-referencia/firma_ricardo_real.png)

La firma de la ALUMNA (Daniela), en cambio, confirmado que LSS **no la usa
en ningún lado** — dibújala como quieras, sin preocuparte por nada.

El sello de coordinación de LSS ya está sembrado de antes, no es algo que
tengas que subir.

(El archivo viejo `firmas profesor y alumno.jpg` en esta misma carpeta ya no
aplica — tenía líneas de guía que se colaban en la imagen real; el nuevo
`firma_ricardo_real.png` es la firma real, ya limpia, tal cual quedó en la
BD de Karen.)

## Resumen rápido del orden

1. Respalda lo tuyo → graba PRO → restaura el respaldo de Karen (todo el
   detalle en la sección 0, arriba).
2. Graba REP: genera el Reporte 1 de octubre (candado ya abierto de verdad,
   sin trucos), revísalo/apruébalo en sus distintos roles, firma (replicando
   la referencia de Ricardo — ver "Firmas" arriba).
3. Edita tu video y júntalo con lo que te pase Karen. **El orden final del
   video es: CRED → PRO → GR → AH → REP → LSS.**
4. Avísale a Karen cuándo termines.
