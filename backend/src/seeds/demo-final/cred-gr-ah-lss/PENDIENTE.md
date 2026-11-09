# cred-gr-ah-lss — pendiente de implementar

Carpeta de KAREN — ciclo completo real del alumno: CRED → GR → AH → LSS.
Depende de `../00-comun` (ya debe estar corrido antes que esto).

Se construye módulo por módulo, verificando cada uno contra el código real (no contra
`seed-maestro-gr.js`, que solo se usa como banco de piezas reutilizables) antes de pasar
al siguiente:
1. [x] `01-cred.js` — 7 profesores, 1 por cada característica real.
2. [x] `02-ofertas-minimas.js` (placeholder mínimo de PRO: solo lo que GR necesita que ya exista) — 13 ofertas ya aprobadas.
3. [x] `03-gr.js` — 13 alumnos recorriendo la cadena real de GR, cada uno detenido en el
   paso de su escenario (ver `../CUENTAS.md`, sección GR, para el detalle y los pasos
   para reproducir cada uno en vivo el 23 de noviembre).
4. [x] `04-ah.js` — Sofía (actividades variadas + 1 para asignar en vivo),
   Mónica (sin actividades, ya existía de GR), Gerardo (bitácora rechazada /
   reaprobada / pendiente atrasada / faltas críticas / actividad editada y
   extendida) e Itzel (480h netas). Ver `../CUENTAS.md`, sección AH.
5. [x] `05-reportes-minimos.js` — Itzel con 480h + 7 reportes mensuales +
   global, todos aprobados, usando la cadena real de REP.
6. [x] `06-lss.js` — Itzel + 3 alumnos nuevos (Mariana, Francisco, Carolina),
   cada uno en su checkpoint de LSS. Ver `../CUENTAS.md`, sección LSS.
7. [x] `index.js` — encadena los 6 pasos de arriba. Verificado con 3 corridas
   completas desde cero (`00-comun/index.js` + este): la 1ª y 2ª
   encontraron 3 bugs reales (ver `../README.md`, sección de fecha del 23 de
   noviembre, para el detalle); la 3ª, ya con todo corregido en el código
   (no solo parchado en la BD), terminó sin errores y sin ningún riesgo de
   que un cron real mueva algo antes de la demo.

## Todo construido — listo para el 23 de noviembre

`demo-final/cred-gr-ah-lss/` está completo: CRED (7 profesores) → ofertas
mínimas (18) → GR (13 escenarios) → AH (8 escenarios) → REP mínimo (Itzel) →
LSS (4 escenarios). Todo verificado con una corrida limpia desde cero,
contra la BD, las funciones reales de cada módulo, y en el navegador. Ver
`../CUENTAS.md` para el detalle completo de cada escenario (caso → correo,
actores, pasos para reproducir en vivo).

Pendiente: `demo-final/amd-pro-rep/` (de Sol).
