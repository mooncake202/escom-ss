# Video tutorial — Sistema de Servicio Social ESCOM

Carpeta: `backend/src/seeds/video-tutorial/` — subcarpetas `cred/`, `gr/`, `ah/`, `lss/`
(de Karen) y, más adelante, `amd/`, `pro/`, `rep/` (de Sol, reutilizando los mismos
usuarios de aquí, **sin crear ninguno nuevo**).

Este README documenta el **happy path** tal como se ve en el video — no los
detalles de ingeniería usados para producirlo (esos viven como comentarios
dentro de cada script de seed, por si hay que volver a correrlos).

## Seeds ya probados (checklist)

- [x] `../demo-final/00-comun/` — reutilizado tal cual.
- [x] `00-periodo-video.js` — periodo dedicado al video, ya creado.
- [x] `cred/01-profesor.js` — crea al profesor Ricardo Navarro Olvera.
- [x] `gr/00-oferta-prerequisito.js` — crea su oferta ya aprobada.
- [x] GR — grabado en vivo completo (Daniela registrada, profesor aceptó,
      coordinador aprobó expediente → `alumno_asignado`).
- [x] `ah/01-actividades-variadas.js` — corrido: 6 actividades + 3 bitácoras
      de octubre ya existen.
- [ ] AH (grabación en cámara) — pendiente (día hábil real, lunes).
- [x] `lss/00-horas-y-reportes-prueba.js` — corrido: 480h netas + 8 reportes
      mensuales + 1 global, todos aprobados con lógica real de REP. Ver
      "LSS — preparación por seed" abajo. Exclusivo de Karen, no se le pasa
      a Sol.
- [ ] LSS (grabación en cámara) — pendiente. Respaldo de este punto listo:
      `backend/src/seeds/backup/karen/antes_lss_solo_karen.sql`.
- [ ] Sol: AMD, PRO, REP — ver [`TRASPASO-SOL.md`](TRASPASO-SOL.md).

## Diferencia con `demo-final/`

| | `demo-final/` | `video-tutorial/` |
|---|---|---|
| Usuarios | Pueden ser independientes entre `cred-gr-ah-lss` y `amd-pro-rep` | **Un solo hilo de usuarios**, compartido por todas las partes |
| Casos | Muchos, variantes de cada estado posible | **Uno solo: el camino feliz**, de principio a fin |
| Cómo se crean | Por script (seed), en lote | **En vivo, en la UI real**, durante la grabación |
| Calendario/catálogos | `00-comun` | **Mismo `00-comun`** — se reutiliza tal cual, no se duplica |

## Regla dura: el calendario nunca se modifica

El periodo del video (`fecha_inicio`), los festivos, vacacionales e
inhábiles de `00-comun` son **fijos, para siempre, para todos** (Karen y
Sol). Si en algún momento hace falta mostrar que el sistema reacciona de
cierta forma a una fecha, la manera correcta es **acomodar los datos de un
alumno** (qué bitácoras/actividades tiene y en qué fechas, dentro del
calendario ya fijo) — nunca editar el calendario mismo.

## Periodo de registro dedicado al video

- `anio`: `2027`, `semestre`: `s01`.
- `fecha_inicio`: **1 de octubre de 2026** (fijo, permanente).
- `fecha_max_expediente`: **21 de septiembre de 2026** (fijo, permanente).
- `fecha_fin`: **24 de junio de 2027**.
- Coordinador dueño del evento: `coordinadorherrera@ipn.mx`.

Script: `backend/src/seeds/video-tutorial/00-periodo-video.js`.

## Datos para crear en vivo durante la grabación

Contraseña única para todo el seed final: **`JAjaja1818#`**.

### Coordinador (ya existe, de `00-comun`)
- `coordinadorherrera@ipn.mx` / `JAjaja1818#`

### Profesor (ya existe, por seed — `cred/01-profesor.js`)

| Campo | Valor |
|---|---|
| Nombre | RICARDO NAVARRO OLVERA |
| Correo institucional | `profesornavarro@ipn.mx` |
| Departamento | Sistemas Computacionales |
| Teléfono personal | `5587451236` |
| Horario de atención | Lunes a viernes 10:00–12:00 |
| Cubículo | ESCOM-204 |

### Oferta (ya existe, aprobada, por seed — `gr/00-oferta-prerequisito.js`)

| Campo | Valor |
|---|---|
| Proyecto | Desarrollo de sistema de seguimiento académico |
| Tipo | Individual |
| Programa SISS | ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL |
| Actividad SISS | APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES |
| Carrera deseada | ISC |

### Alumna (grabada en vivo — CU-GR-01)

| Campo | Valor |
|---|---|
| Nombre | DANIELA MENDOZA CRUZ |
| Boleta | `2021630001` |
| Correo institucional | `mendoza0001@alumno.ipn.mx` |
| Correo personal | `daniela.mendoza.personal@gmail.com` |
| Celular | `5598765432` |
| Carrera | ISC |
| Semestre | 8 |
| Créditos | 90.00 |
| Contraseña | `JAjaja1818#` |
| Motivo de solicitud | "Soy muy buena programando y me gustaría hacer mi servicio social aquí, ya casi acabo mi carrera así que siento que podría aportar mucho en este proyecto de seguimiento académico." |

## Actividades y bitácoras de AH (ya creadas por seed)

`ah/01-actividades-variadas.js` deja 6 actividades, ancladas a octubre de
2026, para no tener que grabar en cámara cada estado posible
(RN-AH-08). Dos fechas de octubre están marcadas como inhábil parcial en el
calendario (8 y 22 — ver "Regla dura" arriba, nunca se mueven):

| Actividad | Estado |
|---|---|
| Diseñar diagrama entidad-relación del módulo de reportes | `sin_comenzar` (referencia) |
| Implementar formulario de captura de avances | `en_progreso` (45%) — 1 bitácora rechazada + 1 aprobada |
| Documentar manual de usuario del módulo de consulta | `vencida` |
| Configurar entorno de pruebas del sistema | `completada_a_tiempo` |
| Elaborar reporte de pruebas funcionales | `completada_tarde` |
| Generar reportes de avance en formato PDF | `sin_comenzar` — esta es la que se asigna y se trabaja EN VIVO |

(Nota: rechazar una bitácora resta horas pero nunca genera falta — la falta
solo depende de si existe algún registro de bitácora ese día, sin importar
su estado.)

### Plan por bloques para grabar AH

1. CU-AH-01: Ricardo asigna la actividad "Generar reportes de avance en
   formato PDF" — las otras 5 ya existen por seed.
2. CU-AH-02: Daniela entra a `/alumno/actividades`, se ve la lista completa.
3. CU-AH-03: Daniela inicia jornada (día hábil real), trabaja ≥1h, finaliza,
   reporta avance sobre la actividad nueva, confirma.
4. CU-AH-04: Ricardo revisa esa bitácora en `/profesor/bitacoras`.
5. CU-AH-05: acumulado de horas.
6. CU-AH-06: historial, opcionalmente "ampliar fecha límite" sobre la
   actividad vencida.

## Dónde entra Sol

Cuando Karen termina de grabar AH, hace un respaldo de la BD
(`backend/src/seeds/backup/karen/respaldo_20261108_1358.sql`) — ese es el
punto de partida de Sol para PRO/REP. Ver [`TRASPASO-SOL.md`](TRASPASO-SOL.md)
para todo lo que necesita.

## LSS — preparación por seed (exclusivo de Karen)

Karen graba LSS **en paralelo**, sin esperar a que Sol termine REP — por eso
esta parte usa su propia copia de la BD, separada de la que restaura Sol.

CU-LSS-01 exige 480 horas netas + 6 reportes mensuales + 1 global, todos
aprobados por coordinación (confirmado en `lss-alumno.service.js`). Generar
eso a mano en vivo (meses de bitácoras reales) no es práctico, así que
`lss/00-horas-y-reportes-prueba.js` lo arma usando la LÓGICA REAL de REP
(`enviarReporteMensual`/`enviarReporteGlobal` + `aprobarReporte` de profesor
y de coordinación) — con PDF, hash y sello de tiempo reales — en vez de
insertar filas inventadas. Termina generando 8 reportes (no 6): el periodo
vacacional de invierno ya sembrado en `00-comun` (21 dic 2026 – 22 ene 2027)
deja enero muy corto, así que hubo que completar las horas con 2 meses más.

**Las firmas de este seed se dibujaron en el canvas real** (Ricardo
entrando a `/profesor/reportes`, no un archivo subido) — por eso también
quedó exportada en
[`firmas-referencia/firma_ricardo_real.png`](firmas-referencia/firma_ricardo_real.png)
la firma exacta que usa esta copia, para que Sol pueda replicarla al dibujar
la de Ricardo en su propia grabación de REP (ver `TRASPASO-SOL.md`, sección
de Firmas, para el porqué).

Respaldo de este punto (antes de grabar LSS):
`backend/src/seeds/backup/karen/antes_lss_solo_karen.sql`.

## Pendiente

- Grabar AH en vivo (lunes, para que sea día hábil real).
- Avisarle a Sol — ver [`TRASPASO-SOL.md`](TRASPASO-SOL.md).
- Grabar LSS en vivo (CU-LSS-01 a 11 — ver `estados-lss.txt` del frontend
  para el detalle de cada transición si hace falta consultarlo).
