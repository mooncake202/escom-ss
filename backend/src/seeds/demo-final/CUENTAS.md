# Cuentas de `demo-final` — qué correo usar para cada escenario

`demo-final/` siembra **muchos casos y variantes** (a diferencia de
`video-tutorial/`, que es un solo camino feliz) — por eso va a haber muchas
cuentas. Esta tabla es la referencia rápida para la demo en vivo: si piden
"muéstrame tal caso", aquí se busca qué correo(s) usar. Contraseña única
para **todas** las cuentas de este archivo: `JAjaja1818#`.

Se va actualizando conforme se van sembrando más módulos — cada vez que un
seed nuevo crea un usuario o un escenario demostrable, se agrega una fila
aquí. **`cred-gr-ah-lss/` ya está completo** (CRED, ofertas mínimas, GR, AH,
REP mínimo y LSS); falta `amd-pro-rep/` (de Sol).

Recuerda: la demo es el 23 de noviembre de 2026 — todos los escenarios con
fecha de este archivo ya están verificados (3 corridas completas desde
cero, la última con 0 errores y 0 riesgos) para que se vean exactamente
así ese día, sin que ningún cron real los mueva antes. Ver "Fecha de la
presentación" en `../README.md` para el detalle de esa verificación.

## Por módulo — CASO → correo(s)

Esta es la forma rápida de buscar: te piden un caso, buscas el módulo,
encuentras el correo (o los correos, si el caso necesita más de uno).

### CRED

| Caso | Correo(s) |
|---|---|
| Coordinador genérico (cualquier caso de coordinación) | `coordinadorherrera@ipn.mx` o `coordinadorvillagran@ipn.mx` |
| Profesor sin característica (base, 3 cupos) | `profesorcastillo@ipn.mx` |
| Profesor con característica Investigador (+1, 4 cupos) | `profesorvaldez@ipn.mx` |
| Profesor con característica Presidente de academia (+2, 5 cupos) | `profesorromero@ipn.mx` |
| Profesor con característica Coordinador [de academia] (+2, 5 cupos) | `profesorochoa@ipn.mx` |
| Profesor con característica Jefe de departamento (+3, 6 cupos) | `profesorsandoval@ipn.mx` |
| Profesor con característica Funcionario (+3, 6 cupos) | `profesorfigueroa@ipn.mx` |
| Profesor con característica Profesor coordinador de clubes (+3, 6 cupos) | `profesorvega@ipn.mx` |
| Ver quién creó a quién (`creado_por_id`) | `coordinadorherrera@ipn.mx` creó a los 7 profesores de arriba; `coordinadorvillagran@ipn.mx` fue creado por `coordinadorherrera@ipn.mx` |

### GR

| Caso | Correo(s) |
|---|---|
| Oferta disponible para registrar un alumno EN VIVO (CU-GR-01 completo) | Oferta "Desarrollo de portal de trámites escolares", profesor `profesorcastillo@ipn.mx` |
| Alumno esperando respuesta del profesor | `rosales0101@alumno.ipn.mx` — profesor `profesorvaldez@ipn.mx` |
| Rechazo por perfil (profesor rechaza, no por cupos) | mismo `rosales0101@alumno.ipn.mx` — profesor `profesorvaldez@ipn.mx` |
| Venció Reloj 1 (nunca envió expediente a tiempo) — pantalla de rechazo definitivo | `camacho0201@alumno.ipn.mx` |
| Venció Reloj 2 (expediente nunca aprobado, el periodo ya inició) — pantalla de rechazo definitivo | `briones0301@alumno.ipn.mx` |
| Alumno asignado, su periodo aún no inicia | `quintero0401@alumno.ipn.mx` |
| Alumno asignado, ya inició — para grabar AH en vivo ese día | `barrera0501@alumno.ipn.mx` — profesor `profesorfigueroa@ipn.mx` |
| Cupos dinámicos: auto-rechazo al llenarse el cupo | `estrada0601@alumno.ipn.mx` + `nava0701@alumno.ipn.mx` — profesor `profesorvega@ipn.mx` |
| Cambiar de oferta tras un rechazo | el que quede rechazado del punto anterior (`estrada0601` o `nava0701`, según a cuál acepte el profesor) |
| Corrección de registro SISS | `guerrero0801@alumno.ipn.mx` — profesor `profesorcastillo@ipn.mx` (su 2ª oferta) |
| Corrección de documentos iniciales | `maldonado0901@alumno.ipn.mx` — profesor `profesorromero@ipn.mx` (su 2ª oferta) |
| Rechazo definitivo a mano por coordinación (no por cron) | `cervantes1001@alumno.ipn.mx` — profesor `profesorochoa@ipn.mx` (su 2ª oferta) |
| Expediente con correcciones, todavía vigente — corregir y reenviar | `ibarra1101@alumno.ipn.mx` — profesor `profesorsandoval@ipn.mx` (su 2ª oferta) |
| Expediente pendiente de revisión, sin decidir — coordinación decide en vivo | `pacheco1201@alumno.ipn.mx` — profesor `profesorfigueroa@ipn.mx` (su 2ª oferta) |
| Carta compromiso entregada, esperando que coordinación confirme recepción | `olvera1301@alumno.ipn.mx` — profesor `profesorvega@ipn.mx` (su 2ª oferta) |

Ver la sección **"GR — detalle de cada escenario"** más abajo para los pasos
exactos de cómo reproducir cada uno en vivo, con sus actores.

### AH

| Caso | Correo(s) |
|---|---|
| Actividades variadas (vencida, completada a tiempo, completada tarde) + una sin asignar todavía, para asignar y grabar bitácora EN VIVO | `barrera0501@alumno.ipn.mx` — profesor `profesorfigueroa@ipn.mx` |
| Alumno sin ninguna actividad asignada (dispara la alerta del profesor) | `quintero0401@alumno.ipn.mx` |
| Bitácora rechazada que se queda rechazada | `rangel1401@alumno.ipn.mx` ("historia variada") — profesor `profesorvaldez@ipn.mx` (su 2ª oferta) |
| Bitácora rechazada y luego reaprobada desde el historial | mismo `rangel1401@alumno.ipn.mx` |
| Bitácora pendiente de revisión hace más de 5 días hábiles (recordatorio al profesor) | mismo `rangel1401@alumno.ipn.mx` |
| 5+ faltas consecutivas y 18 faltas acumuladas a la vez | mismo `rangel1401@alumno.ipn.mx` |
| Actividad editada / actividad con fecha límite extendida | mismo `rangel1401@alumno.ipn.mx` |
| 480 horas netas completas — ya no puede iniciar jornada | `fuentes1501@alumno.ipn.mx` — profesor `profesorcastillo@ipn.mx` (su 2ª oferta) |

Ver la sección **"AH — detalle de cada escenario"** más abajo.

### REP (placeholder mínimo, solo lo que LSS necesita)

| Caso | Correo(s) |
|---|---|
| Alumno con 480h + 7 reportes mensuales + global, todos aprobados (requisito de LSS) | `fuentes1501@alumno.ipn.mx` — profesor `profesorcastillo@ipn.mx` |

El REP completo (todos los escenarios de reportes, rechazos, etc.) lo construye Sol en `amd-pro-rep/`.

### LSS

| Caso | Correo(s) |
|---|---|
| Evaluación de desempeño sin evaluar — profesor evalúa y firma en vivo, luego coordinación dictamina en vivo | `fuentes1501@alumno.ipn.mx` — profesor `profesorcastillo@ipn.mx` |
| Evaluación ya aprobada, carta de término "solicitada" — coordinación la marca lista para recoger en vivo, luego el alumno confirma la recogida en vivo | `rosado1601@alumno.ipn.mx` — profesor `profesorromero@ipn.mx` (3ª oferta) |
| Carta recogida, expediente de liberación enviado ("en revisión") — coordinación lo dictamina en vivo | `duarte1701@alumno.ipn.mx` — profesor `profesorochoa@ipn.mx` (3ª oferta) |
| Expediente aprobado, constancia de término solicitada — coordinación redacta el mensaje en vivo | `bravo1801@alumno.ipn.mx` — profesor `profesorsandoval@ipn.mx` (3ª oferta) |

Ver la sección **"LSS — detalle de cada escenario"** más abajo.

### PRO (de Sol)

Pendiente — `amd-pro-rep/`.

## GR — detalle de cada escenario (actores y pasos para reproducir)

Todos siguen el estado real de la cadena de GR (sembrados llamando a las
funciones reales del módulo, nunca insertando filas sueltas) — lo único que
cambia entre ellos es EN QUÉ PASO se detuvieron a propósito, listos para
que la acción en vivo del 23 de noviembre sea la que complete ese paso.

### 1. Registro completo en vivo (CU-GR-01)
- **Qué muestra:** el flujo de alta completo tal como lo vería cualquier
  alumno nuevo del IPN — desde que no tiene cuenta hasta que queda
  registrado como "Alumno Sin Asignar", sin ningún dato precargado.
- **Actor:** Alumna/o (inventa los datos en el momento).
- **Dónde:** login → "Regístrate aquí".
- **Pasos:** llenar los 4 pasos del formulario, eligiendo la oferta "Desarrollo
  de portal de trámites escolares" (profesor `profesorcastillo@ipn.mx`, 1
  cupo, intacta) y cualquier periodo vigente de la lista.
- **Resultado esperado:** queda `espera_respuesta_de_profesor`.

### 2. Esperando respuesta → rechazo por perfil → cambia de oferta
- **Qué muestra:** CU-GR-02 (el profesor decide sobre una solicitud) por el
  lado del rechazo "normal" — por su propio criterio, no porque se le
  hayan acabado los cupos — y lo que el sistema le ofrece de inmediato al
  alumno rechazado: conservar todos sus datos y solo elegir otra oferta,
  sin tener que registrarse de nuevo desde cero.
- **Actores:** Profesor `profesorvaldez@ipn.mx`, luego la alumna `rosales0101@alumno.ipn.mx`.
- **Pasos:** el profesor entra a "Solicitudes pendientes", abre a Diego
  Rosales Peña y da clic en **Rechazar**. Luego, con la sesión de Diego
  (o mostrando su vista), entra a la pantalla de espera: debe verse
  "rechazada porque no cumplías con el perfil requerido" + botón
  **Cambiar oferta** → elegir otra con cupo (p. ej. la misma de arriba) y
  reenviar.
- **Resultado esperado:** `rechazada_por_profesor` → tras cambiar de oferta,
  vuelve a `espera_respuesta_de_profesor` con la nueva oferta.

### 3. Venció Reloj 1 — solo mostrar la pantalla
- **Qué muestra:** qué le pasa a un alumno que se quedó a medio proceso
  (nunca llegó a subir su expediente) y se le pasó la fecha límite —
  RN-GR-04: el sistema borra automáticamente lo que ya no sirve (oferta,
  documentos, registro en SISS) y deja la cuenta en rechazo definitivo,
  sin que nadie de coordinación haya tenido que intervenir.
- **Actor:** Alumna `camacho0201@alumno.ipn.mx` (solo inicia sesión).
- **Ya está así, no se hace nada en vivo** — entra y se ve directamente la
  pantalla de rechazo definitivo con el motivo **"Plazo de envío de
  expediente vencido"**. (El botón "Modificar solicitud y reenviar" existe
  pero no se usa en este escenario, como pediste.)

### 4. Venció Reloj 2 — solo mostrar la pantalla
- **Qué muestra:** el OTRO reloj de vencimiento (RN-GR-63) — distinto del
  escenario 3: aquí el alumno sí llegó a enviar su expediente a tiempo,
  pero nadie en coordinación lo aprobó antes de que arrancara su periodo
  de servicio social, así que igual se le vence, con un motivo distinto
  que deja claro que el problema no fue suyo por no entregar a tiempo.
- **Actor:** Alumno `briones0301@alumno.ipn.mx` (solo inicia sesión).
- **Ya está así, no se hace nada en vivo** — pantalla de rechazo definitivo
  con el motivo **"Tu periodo de servicio social inició sin que tu
  expediente quedara aprobado"**.

### 5. Alumno asignado, aún no inicia
- **Qué muestra:** el estado "feliz" intermedio entre quedar asignado y
  realmente empezar a trabajar — ya pasó por todo el proceso de GR y
  coordinación ya aprobó su expediente, pero el sistema todavía no le
  habilita actividades porque su fecha de inicio no ha llegado.
- **Actor:** Alumna `quintero0401@alumno.ipn.mx` (solo inicia sesión).
- Pantalla de espera de inicio de servicio social — su periodo empieza el
  1° de diciembre de 2026, después de la demo.

### 6. Alumno asignado, ya inició — puente a AH
- **Qué muestra:** el mismo estado final que el escenario 5
  (`alumno_asignado`), pero ya con su fecha de inicio cumplida — es el
  punto exacto donde termina GR y empieza AH (actividades y horas), por
  eso es la única alumna de este archivo que además recibe actividades.
- **Actor:** Alumna `barrera0501@alumno.ipn.mx`, profesor `profesorfigueroa@ipn.mx`.
- Su periodo ya inició (16 oct 2026). Es el alumno sobre el que corre
  `04-ah.js` para dejarle actividades y poder grabar bitácoras en vivo.

### 7. Cupos dinámicos: auto-rechazo al llenarse el cupo
- **Qué muestra:** que los cupos no son solo un número estático — en cuanto
  se acepta a alguien y la oferta se queda en 0 cupos, el sistema mismo
  (sin que el profesor tenga que acordarse de hacerlo) rechaza a todos los
  demás que seguían esperando esa misma oferta (RN-GR-11).
- **Actores:** Profesor `profesorvega@ipn.mx`; alumnos `estrada0601@alumno.ipn.mx`
  y `nava0701@alumno.ipn.mx`, ambos esperando el mismo cupo (1) de "Club de
  robótica — apoyo en talleres".
- **Pasos:** el profesor entra a sus solicitudes pendientes, ve a los 2
  (Ricardo Estrada y Paulina Nava) y acepta a **uno cualquiera**.
- **Resultado esperado:** el aceptado queda `aceptada_por_profesor`; el OTRO,
  sin que el profesor lo toque, pasa automáticamente a `rechazada_por_cupos`
  (RN-GR-11) y recibe notificación.

### 8. Cambiar de oferta tras el rechazo por cupos
- **Qué muestra:** que un rechazo por cupos (a diferencia de un rechazo
  definitivo) no es el fin del camino — es "corregible": el mismo alumno,
  sin perder nada de lo que ya había llenado, simplemente elige otra
  oferta con cupo y sigue su proceso con normalidad.
- **Actor:** el alumno que quedó rechazado en el escenario 7.
- **Pasos:** con su sesión, entra a su vista de espera, ve "tu solicitud fue
  rechazada porque los cupos de la oferta fueron cubiertos" y da clic en
  **Cambiar oferta** → elige otra con cupo disponible (p. ej. la de
  `profesorcastillo@ipn.mx`) y confirma.
- **Resultado esperado:** vuelve a `espera_respuesta_de_profesor`, ahora en
  la nueva oferta, sin perder ningún dato de su registro original.

### 9. Corrección de registro SISS
- **Qué muestra:** una de las 2 formas específicas que tiene coordinación de
  pedir correcciones (distinta del rechazo definitivo) — aquí el problema
  está en lo que el alumno hizo en la plataforma externa SISS, así que el
  sistema lo regresa puntualmente a ese paso, sin tocar su documentación.
- **Actores:** Coordinación (`coordinadorherrera@ipn.mx` o `coordinadorvillagran@ipn.mx`);
  alumno `guerrero0801@alumno.ipn.mx`.
- **Pasos:** coordinación entra a "Documentación pendiente de revisión", abre a
  Luis Guerrero Pacheco y elige **"Solicitar corrección en registro SISS"**,
  escribiendo un motivo.
- **Resultado esperado:** sus archivos se eliminan, queda `corregir_SISS`; al
  entrar, el alumno ve el motivo y el botón para volver a CU-GR-04.

### 10. Corrección de documentos iniciales
- **Qué muestra:** la otra forma de pedir corrección — aquí el problema está
  en los documentos (carta de créditos / seguro social), no en el SISS, así
  que regresa a la alumna puntualmente a volver a adjuntarlos, en vez de
  tirar todo su proceso.
- **Actores:** Coordinación; alumna `maldonado0901@alumno.ipn.mx`.
- **Pasos:** mismo lugar que el 9, pero elegir **"Solicitar corrección en
  documentos"** sobre Daniela Maldonado Ríos.
- **Resultado esperado:** `corregir_docsini`; al entrar, la alumna ve el
  motivo y el botón para volver a CU-GR-05.

### 11. Rechazo definitivo a mano (sin cron)
- **Qué muestra:** que el rechazo definitivo no es exclusivo de los 2
  relojes automáticos (escenarios 3 y 4) — coordinación también puede
  rechazar definitivamente a alguien por su propio criterio, cuando algo
  de lo declarado no concuerda con la documentación real del alumno.
- **Actores:** Coordinación; alumno `cervantes1001@alumno.ipn.mx`.
- **Pasos:** mismo lugar, elegir **"Rechazar definitivamente"** sobre Oscar
  Cervantes Duarte, con un motivo de incongruencia (p. ej. "los créditos
  declarados no coinciden con la carta de créditos").
- **Resultado esperado:** `rechazada_definitivamente`, con el motivo que
  coordinación escribió — a diferencia de los escenarios 3/4, aquí el texto
  lo decide coordinación en el momento, no viene de un cron.

### 12. Expediente con correcciones, vigente — corregir y reenviar
- **Qué muestra:** el camino "sano" de una corrección de expediente —
  a diferencia del escenario 4 (donde el tiempo ya se acabó), aquí el
  periodo todavía no inicia, así que la alumna sí alcanza a corregir y
  reenviar sin que nada se pierda.
- **Actores:** Alumna `ibarra1101@alumno.ipn.mx`.
- Ya tiene `expediente_con_correcciones` con el motivo "Falta la firma del
  alumno en la carta compromiso escaneada" (su periodo empieza el 1° de
  diciembre, todavía no vence). **Pasos:** inicia sesión, ve el motivo y da
  clic en **"Corregir y reenviar expediente"**, vuelve a subir los documentos.
- **Resultado esperado:** vuelve a `expediente_pendiente_revision`.

### 13. Expediente pendiente de revisión — coordinación decide en vivo
- **Qué muestra:** el último filtro real antes de que alguien se vuelva
  Alumno Asignado — a diferencia de los demás alumnos de esta lista, a
  este nadie lo decidió todavía por seed: queda deliberadamente abierto
  para que coordinación tome la decisión (aprobar o corregir) frente a la
  gente el día de la demo.
- **Actores:** Coordinación; alumno `pacheco1201@alumno.ipn.mx`.
- **Pasos:** coordinación entra a "Expedientes pendientes", abre a Emiliano
  Pacheco Vera y elige **Aprobar** (pasa a `alumno_asignado`) o **Rechazar
  con correcciones** (pasa a `expediente_con_correcciones`, mismo estado
  que el escenario 12).

### 14. Carta compromiso entregada — registrar recepción
- **Qué muestra:** la única parte de todo el flujo de GR que depende de
  algo físico (el alumno entrega en persona su carta compromiso impresa y
  firmada) — coordinación tiene que confirmarlo a mano en el sistema antes
  de que el alumno pueda avanzar a subir su expediente.
- **Actores:** Coordinación; alumna `olvera1301@alumno.ipn.mx`.
- **Pasos:** coordinación entra a la lista de alumnos esperando que se
  confirme la carta compromiso, busca a Alejandra Olvera Franco y da clic
  en **"Registrar recepción"**.
- **Resultado esperado:** pasa a `carta_compromiso_confirmada`; al entrar,
  la alumna ve el botón para continuar a subir su expediente.

## AH — detalle de cada escenario (actores y pasos para reproducir)

Igual que GR: todo sembrado con las funciones reales del módulo
(`crearActividad`/`editarActividad`/`extenderFechaLimiteActividad`,
`aprobarBitacora`/`rechazarBitacora`/`aprobarBitacoraRechazadaDesdeHistorial`)
— solo las bitácoras y actividades con fecha ya pasada se escriben directo
por Prisma, porque las funciones reales de "hoy" no pueden usarse para
reconstruir historia (mismo criterio que ya se usó en el video).

### 1. Actividades variadas + una para asignar y trabajar en vivo
- **Qué muestra:** CU-AH-01/02/03 completos, en vivo — el profesor asigna
  la última actividad, la alumna la trabaja y registra su bitácora, el
  profesor la revisa (CU-AH-04).
- **Actores:** Profesor `profesorfigueroa@ipn.mx`; alumna `barrera0501@alumno.ipn.mx`.
- **Ya está así:** 4 actividades (`sin_comenzar`, `completada_a_tiempo`,
  `vencida`, `completada_tarde`) — ninguna tiene bitácora. La 5ª no existe
  todavía, se asigna en vivo ese día.
- **Pasos:** el profesor entra a sus alumnos, selecciona a Sofía, asigna una
  actividad nueva. Con la sesión de Sofía: iniciar jornada → finalizar →
  registrar bitácora sobre esa actividad. De vuelta con el profesor: revisar
  y aprobar esa bitácora.

### 2. Alumno sin ninguna actividad asignada
- **Qué muestra:** CU-AH-02 Flujo Alterno 2.1 (mensaje de "aún no se han
  asignado actividades") y la alerta calculada del profesor
  (`alumnoSinActividades`) — la misma que corregí para que NO se dispare en
  alumnos que ya completaron sus 480h.
- **Actor:** Alumna `quintero0401@alumno.ipn.mx` (solo inicia sesión; su
  periodo tampoco ha iniciado, ver GR escenario 5).

### 3-7. "Historia variada" — Gerardo Rangel Osorio
- **Qué muestra:** 5 reglas de negocio distintas conviviendo en la misma
  historia de un solo alumno, para no multiplicar usuarios:
  - Una bitácora (8 oct) **rechazada que se queda rechazada** (RN-AH-21,
    horas descontadas del acumulado).
  - Otra bitácora (13 oct) **rechazada y luego reaprobada desde el
    historial** (`aprobarBitacoraRechazadaDesdeHistorial`, RF-AH-38) — las
    horas regresan al acumulado.
  - Otra (27 oct) **pendiente de revisión desde hace más de 5 días
    hábiles** — dispara el recordatorio real al profesor
    (`bitacorasRevisionAtrasada`).
  - **18 faltas acumuladas en total**, con las **últimas 6 consecutivas**
    — ambas condiciones a la vez, verificado contra `alumnosConFaltasCriticas`
    del dashboard real del profesor.
  - Una actividad **editada** (`editarActividad`) y otra con la **fecha
    límite extendida** (`extenderFechaLimiteActividad`, de 12 a 25 de
    noviembre).
- **Actores:** Profesor `profesorvaldez@ipn.mx`; alumno `rangel1401@alumno.ipn.mx`.
- **Pasos para mostrarlo:** el profesor entra a su dashboard — debe ver las
  2 alertas ("1 alumno con faltas críticas" y "bitácoras pendientes de
  revisión hace más de 5 días hábiles"); entra a "Revisar bitácoras por
  alumno" para ver la de Gerardo pendiente desde el 27 de octubre y
  decidirla en vivo si se quiere; entra al historial de Gerardo para ver
  las 2 bitácoras ya rechazada/reaprobada.

### 8. 480 horas netas completas
- **Qué muestra:** RN-AH-17 (ya no puede iniciar una jornada nueva) — el
  mismo seguro que acabamos de poner también la bloquearía aunque alguien
  le asignara una actividad nueva por error, aunque en su caso basta con el
  límite de horas.
- **Actor:** Alumna `fuentes1501@alumno.ipn.mx` (profesor `profesorcastillo@ipn.mx`).
- **Pasos:** inicia sesión y entra a "Registrar bitácora" — debe ver
  directamente la pantalla bloqueada con el mensaje de las 480 horas (si
  ese día es fin de semana puede aparecer primero el aviso de "no es día
  laborable", pero el 23 de noviembre es lunes, así que se vería el mensaje
  correcto). También puede consultar su acumulado de horas (CU-AH-05): debe
  mostrar 480/480.

## LSS — detalle de cada escenario (actores y pasos para reproducir)

LSS es una **tubería lineal** (a diferencia de GR/AH): un alumno solo puede
estar en un punto a la vez, así que cada checkpoint tiene su propio alumno
— los 4 ya pasaron por la cadena real completa de GR, 480h reales de AH y
7 reportes reales de REP antes de llegar aquí (es el requisito real de
CU-LSS-01, RN-LSS-02). Firmas de profesor y alumno ya guardadas de verdad
(`guardarRubrica` real con los PNG de `firmas-referencia/`); el sello de
coordinación ya estaba sembrado de antes.

### 1. Evaluación sin evaluar — profesor evalúa, coordinación dictamina
- **Qué muestra:** el arranque real de todo LSS (CU-LSS-01, ya hecho por el
  seed) y las 2 firmas que de verdad importan: el profesor calificando por
  los 7 factores reales y firmando (CU-LSS-03), y coordinación dictaminando
  con su sello (CU-LSS-04).
- **Actores:** Alumna `fuentes1501@alumno.ipn.mx`; profesor `profesorcastillo@ipn.mx`;
  cualquier coordinador.
- **Pasos:** el profesor entra a "Evaluar desempeño de alumno" (su dashboard
  ya muestra "1 alumno con evaluación pendiente"), selecciona a Itzel,
  confirma que sus reportes están validados en SISS, califica los 7
  factores y firma. Coordinación entra a su propia bandeja de dictámenes,
  revisa y aprueba.
- **Resultado esperado:** `evaluacion_desempeno.estado` pasa de inexistente
  a `pendiente_dictamen` y luego a `aprobado_coordinador`.

### 2. Evaluación aprobada, carta de término solicitada
- **Qué muestra:** el "intermedio" que normalmente nadie ve en una demo —
  entre que el alumno pide su carta y coordinación se la entrega, alguien
  tiene que marcarla físicamente como lista (CU-LSS-06), y el alumno tiene
  que confirmar que la recogió en persona (CU-LSS-05).
- **Actores:** Coordinación; alumna `rosado1601@alumno.ipn.mx`.
- **Pasos:** coordinación entra a su lista de cartas de término pendientes,
  marca la de Mariana como "lista para recoger". Con la sesión de Mariana:
  entra a su seguimiento, ve que ya puede recogerla y confirma el check.
- **Resultado esperado:** `carta_termino.estado` pasa de `solicitada` a
  `lista_para_recoger` y luego a `recogida`; `liberacion_proceso.estado`
  avanza a `carta_recogida`.

### 3. Carta recogida, expediente de liberación en revisión
- **Qué muestra:** CU-LSS-09 — el último filtro de coordinación antes de
  que el alumno pueda pedir su constancia; a diferencia del expediente de
  GR, este combina carta compromiso + carta de término (y dictamen si
  aplica) en un solo PDF de máximo 1 MB.
- **Actores:** Coordinación; alumno `duarte1701@alumno.ipn.mx`.
- **Pasos:** coordinación entra a "Expedientes de liberación pendientes",
  abre el de Francisco, lo revisa y elige **Aprobar** (o **Rechazar** con
  observaciones, para mostrar el camino de corrección).
- **Resultado esperado:** `documento.estado_documento` (tipo
  `expediente_lss`) pasa de `en_revision` a `aprobado` (o `rechazado`).

### 4. Expediente aprobado, constancia de término solicitada
- **Qué muestra:** el último paso de todo el proceso — CU-LSS-11, donde
  coordinación redacta a mano un mensaje con el enlace a la plataforma
  externa donde el alumno de verdad tramita su constancia (ya no es un
  documento generado por el sistema).
- **Actores:** Coordinación; alumna `bravo1801@alumno.ipn.mx`.
- **Pasos:** coordinación entra a su lista de constancias pendientes, abre
  la de Carolina y redacta el mensaje (puede incluir un enlace, por
  ejemplo a serviciosocialconstancias.ipn.mx).
- **Resultado esperado:** `liberacion_proceso.estado` pasa a
  `constancia_disponible`; Carolina, al entrar, ve el mensaje completo con
  el enlace convertido en link clicable.

## Listado general de todas las cuentas

Para cuando ya sabes el correo y solo quieres confirmar el detalle (nombre,
rol, password), o para buscar al revés (correo → qué representa).

### Coordinadores

Cualquiera de los 2 puede decidir sobre cualquier oferta/solicitud — no
representan un escenario particular, son intercambiables.

| Correo | Nombre | Escenario |
|---|---|---|
| `coordinadorherrera@ipn.mx` | Gabriela Herrera Sotelo | Coordinador genérico — cualquier caso de coordinación |
| `coordinadorvillagran@ipn.mx` | Omar Villagran Castro | Coordinador genérico — cualquier caso de coordinación |

### Profesores (CU-CRED-03, variedad de características/cupos)

Cada uno representa **una característica distinta del catálogo real**
(CU-ADM-15/16) y por lo tanto un cálculo de cupos distinto —
`CUPOS_BASE (3) + incremento_cupos` de la característica:

| Correo | Nombre | Escenario / característica | Cupos totales |
|---|---|---|---|
| `profesorcastillo@ipn.mx` | Mariana Castillo Reyes | Profesor de base, sin característica | 3 |
| `profesorvaldez@ipn.mx` | Jorge Valdez Montes | Investigador (+1) | 4 |
| `profesorromero@ipn.mx` | Patricia Romero Aguilar | Presidente de academia (+2) | 5 |
| `profesorochoa@ipn.mx` | Fernando Ochoa Delgado | Coordinador [característica] (+2) | 5 |
| `profesorsandoval@ipn.mx` | Laura Sandoval Prieto | Jefe de departamento (+3) | 6 |
| `profesorfigueroa@ipn.mx` | Alejandro Figueroa Luna | Funcionario (+3) | 6 |
| `profesorvega@ipn.mx` | Carolina Vega Solís | Profesor coordinador de clubes (+3) | 6 |

(Ojo: "Coordinador" en la tabla de arriba es la **característica** de un
profesor — RF-CRED/CU-ADM-15/16 — no tiene relación con las cuentas de rol
`coordinador` de la sección anterior. Un profesor con esa característica
sigue siendo rol `profesor`, no puede iniciar sesión como coordinador.)

### Alumnos de GR (`03-gr.js`)

Todos con boleta `20xx63####` y correo `apellido####@alumno.ipn.mx`, misma
contraseña `JAjaja1818#`. "Estado el 8 nov" es el que dejó el seed; cada uno
cambia en vivo el 23 según su escenario (ver "GR — detalle de cada escenario").

| Correo | Nombre | Boleta | Profesor / oferta | Estado el 8 nov 2026 |
|---|---|---|---|---|
| `rosales0101@alumno.ipn.mx` | Diego Rosales Peña | 2020630101 | `profesorvaldez` | `espera_respuesta_de_profesor` |
| `camacho0201@alumno.ipn.mx` | Fernanda Camacho Ruiz | 2019630201 | `profesorromero` | `rechazada_definitivamente` (Reloj 1) |
| `briones0301@alumno.ipn.mx` | Andrés Briones Salas | 2020630301 | `profesorochoa` | `rechazada_definitivamente` (Reloj 2) |
| `quintero0401@alumno.ipn.mx` | Mónica Quintero Vega | 2021630401 | `profesorsandoval` | `alumno_asignado` (sin iniciar) |
| `barrera0501@alumno.ipn.mx` | Sofía Barrera León | 2019630501 | `profesorfigueroa` | `alumno_asignado` (ya inició) |
| `estrada0601@alumno.ipn.mx` | Ricardo Estrada Mora | 2020630601 | `profesorvega` (G1) | `espera_respuesta_de_profesor` |
| `nava0701@alumno.ipn.mx` | Paulina Nava Cortés | 2021630701 | `profesorvega` (G1, mismo cupo) | `espera_respuesta_de_profesor` |
| `guerrero0801@alumno.ipn.mx` | Luis Guerrero Pacheco | 2019630801 | `profesorcastillo` (2ª oferta) | `SISS_y_documentacion_pendiente` |
| `maldonado0901@alumno.ipn.mx` | Daniela Maldonado Ríos | 2020630901 | `profesorromero` (2ª oferta) | `SISS_y_documentacion_pendiente` |
| `cervantes1001@alumno.ipn.mx` | Oscar Cervantes Duarte | 2021631001 | `profesorochoa` (2ª oferta) | `SISS_y_documentacion_pendiente` |
| `ibarra1101@alumno.ipn.mx` | Valeria Ibarra Soto | 2019631101 | `profesorsandoval` (2ª oferta) | `expediente_con_correcciones` |
| `pacheco1201@alumno.ipn.mx` | Emiliano Pacheco Vera | 2020631201 | `profesorfigueroa` (2ª oferta) | `expediente_pendiente_revision` |
| `olvera1301@alumno.ipn.mx` | Alejandra Olvera Franco | 2021631301 | `profesorvega` (2ª oferta) | `espera_confirmacion_carta_compromiso` |

### Alumnos de AH (`04-ah.js`)

| Correo | Nombre | Boleta | Profesor / oferta | Periodo | Resumen |
|---|---|---|---|---|---|
| `rangel1401@alumno.ipn.mx` | Gerardo Rangel Osorio | 2020631401 | `profesorvaldez` (2ª oferta) | inicio 1 oct 2026 | 5 escenarios combinados (ver detalle arriba) |
| `fuentes1501@alumno.ipn.mx` | Itzel Fuentes Martínez | 2019631501 | `profesorcastillo` (2ª oferta) | inicio 1 jun 2026 | 480h netas, 120 bitácoras aprobadas, 0 faltas |

### Alumnos de LSS (`05-reportes-minimos.js` + `06-lss.js`)

Los 4 ya tienen 480h + 7 reportes aprobados (requisito real de CU-LSS-01)
antes de llegar a su checkpoint de LSS.

| Correo | Nombre | Boleta | Profesor / oferta | Checkpoint de LSS |
|---|---|---|---|---|
| `fuentes1501@alumno.ipn.mx` | Itzel Fuentes Martínez (reusada de AH) | 2019631501 | `profesorcastillo` | `evaluacion_solicitada`, sin evaluar |
| `rosado1601@alumno.ipn.mx` | Mariana Rosado Nava | 2020631601 | `profesorromero` (3ª oferta) | evaluación aprobada, carta "solicitada" |
| `duarte1701@alumno.ipn.mx` | Francisco Duarte León | 2019631701 | `profesorochoa` (3ª oferta) | carta recogida, expediente "en_revision" |
| `bravo1801@alumno.ipn.mx` | Carolina Bravo Santos | 2020631801 | `profesorsandoval` (3ª oferta) | expediente aprobado, constancia solicitada |

### Interacciones ya armadas (más de 1 usuario)

Para cuando el escenario pedido necesita que dos cuentas ya estén
relacionadas entre sí (no solo una cuenta aislada):

| Escenario | Usuarios involucrados |
|---|---|
| Ver quién creó a quién (CU-CRED-03, `creado_por_id`) | `coordinadorherrera@ipn.mx` creó a los 7 profesores de arriba; `coordinadorvillagran@ipn.mx` fue creado por `coordinadorherrera@ipn.mx` (autoreferenciada, es la primera) |
| Cupos dinámicos (GR, RN-GR-11) | `profesorvega@ipn.mx` + `estrada0601@alumno.ipn.mx` + `nava0701@alumno.ipn.mx`, los 2 sobre la misma oferta con 1 cupo |
| Documentación/expediente pendiente de decidir | cualquier coordinador + el alumno correspondiente (ver tabla de arriba) |
| Alertas reales del dashboard de profesor (faltas críticas + bitácora atrasada) | `profesorvaldez@ipn.mx` + `rangel1401@alumno.ipn.mx` — verificado contra `resumenProfesor()` real |
| Bitácora pendiente de revisión visible al profesor (CU-AH-04) | `profesorvaldez@ipn.mx` + `rangel1401@alumno.ipn.mx` (bitácora del 27 oct) |

Pendiente: las interacciones de AH/LSS/PRO/REP se agregan aquí según se
vayan sembrando `04-ah.js`, `05-reportes-minimos.js`, `06-lss.js` y,
después, `amd-pro-rep/`.
