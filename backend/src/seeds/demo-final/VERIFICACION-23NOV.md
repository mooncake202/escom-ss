# Verificación en navegador — corrida desde cero (checklist en vivo)

Corrida final: BD vaciada → `00-comun/index.js` → `cred-gr-ah-lss/index.js`, 0 errores.
Verificado contra la BD (consultas directas) y en el navegador real (túnel
`https://ttservicio.com`), iniciando sesión con cada cuenta de `CUENTAS.md`.

## ⚠️ 2 hallazgos reales corregidos en esta verificación

### 1. Frontend/backend desactualizados en el servidor
Al verificar GR-5 (Mónica, `quintero0401`), la pantalla mostró el mensaje
equivocado ("sin actividades" en vez de "tu servicio no ha iniciado") aunque
el backend ya calculaba bien el dato (`servicioNoIniciado: true`).
- **Frontend**: `front/dist` estaba compilado del 1° de noviembre, días antes
  de la última corrección de código (8 de noviembre) — `npm run build` lo corrigió.
- **Backend**: la API seguía sin el campo `servicioNoIniciado` incluso después
  de rebuildear el frontend — `nodemon` (dentro del contenedor) no había
  recogido el cambio más reciente pese a estar en modo watch. Un
  `docker compose restart backend` lo resolvió.
- **Recomendación para el 23 de noviembre**: si se toca código backend en los
  días previos, reiniciar el contenedor a mano después (no confiar en que
  `nodemon` recargue solo) y correr `npm run build` en `front/` tras cualquier
  cambio de frontend — el sitio real sirve `front/dist` compilado, no el
  código fuente en vivo.

### 2. Itzel (480h) terminaba sus bitácoras DESPUÉS del 23 de noviembre
`04-ah.js` usaba el periodo con `fecha_inicio = 2026-06-01` (id 15) para sus
120 días hábiles de bitácoras — con vacaciones de verano y festivos reales
incluidos, esos 120 días hábiles terminaban el **10 de diciembre de 2026**,
después de la demo, y además le sembraba una bitácora exactamente el 23 de
noviembre. En vivo, eso habría mostrado "ya registraste tu bitácora de hoy"
en vez de "ya completaste tus 480 horas" (el mensaje que el escenario AH-8
necesita mostrar). **Corregido**: cambiado al periodo con `fecha_inicio =
2026-05-04` (id 13) — verificado con el código real (`esDiaLaborable`): el
día 120 cae el 12 de noviembre, 11 días de margen. Repetida la corrida
completa desde cero con el fix; confirmado contra la BD: última bitácora
12 de noviembre, nada el 23, 480h netas.

## CRED
- [x] Login coordinador OK, dashboard real con 18 alumnos registrados
- [x] Login de profesor con password del seed OK (`profesorcastillo`, `profesorvaldez`, `profesorvega`, `profesorsandoval`)

## GR (13 escenarios)
- [x] 1. Oferta disponible para registro en vivo — confirmado contra BD: "Desarrollo de portal de trámites escolares", `profesorcastillo`, `cupos_disponibles: 1`, `estado_oferta: aprobada`
- [x] 2. Esperando respuesta (rosales0101) — pantalla "Esperando respuesta del profesor" ✅; confirmado en dashboard de `profesorvaldez` ("1 solicitud pendiente", Diego Rosales Peña)
- [x] 3. Venció Reloj 1 (camacho0201) — pantalla "Plazo de envío de expediente vencido" ✅
- [x] 4. Venció Reloj 2 (briones0301) — pantalla "Tu periodo de servicio social inició sin que tu expediente quedara aprobado" ✅
- [x] 5. Alumno asignado, aún no inicia (quintero0401) — ✅ correcta tras el fix #1 de arriba
- [x] 6. Alumno asignado, ya inició (barrera0501) — confirmado: 4 actividades exactas (sin_comenzar/completada_a_tiempo/vencida/completada_tarde), la 5ª NO existe (se asigna en vivo)
- [x] 7. Cupos dinámicos (estrada0601 / nava0701) — confirmado en dashboard de `profesorvega`: ambos con solicitud pendiente sobre la misma oferta de 1 cupo
- [ ] 8. Cambiar oferta tras rechazo por cupos — depende de la acción en vivo del escenario 7, no se puede pre-verificar
- [x] 9. Corrección SISS (guerrero0801) — cola de coordinación OK, 3 solicitudes pendientes, botones Aceptar/Corregir docs/Corregir SISS/Rechazar presentes
- [x] 10. Corrección documentos (maldonado0901) — mismo listado
- [x] 11. Rechazo definitivo a mano (cervantes1001) — mismo listado
- [x] 12. Expediente con correcciones (ibarra1101) — pantalla "Tu expediente requiere correcciones", motivo correcto, botón "Corregir y volver a enviar" ✅
- [x] 13. Expediente pendiente de revisión (pacheco1201) — cola de coordinación OK, 1 expediente pendiente
- [x] 14. Carta compromiso pendiente de confirmar (olvera1301) — cola de coordinación OK (1 alumno) y vista de la alumna ("Esperando confirmación de entrega") ✅

## AH (8 escenarios)
- [x] 1. Actividades variadas + una para asignar en vivo (barrera0501) — confirmado, ver GR-6
- [x] 2. Sin actividades asignadas (quintero0401) — vista de la alumna: "Tu profesor aún no te ha asignado actividades" ✅. **Ojo**: la alerta del PROFESOR (`sinActividades`) no se verá el 23 nov — solo se activa ≤1 día antes de que inicie el periodo del alumno (1° dic); corregido en `CUENTAS.md`.
- [x] 3-7. Historia variada Gerardo (rangel1401) — confirmado en dashboard de `profesorvaldez`: alertas "1 alumno con faltas críticas" y "bitácoras pendientes de revisión hace más de 5 días hábiles" presentes; cola de bitácoras muestra la suya del 27 de octubre pendiente
- [x] 8. 480h netas completas (fuentes1501) — ✅ corregido (hallazgo #2 arriba); dashboard muestra 480 horas acumuladas, 7 reportes aprobados

## REP (mínimo)
- [x] Itzel con 480h + 7 reportes + global aprobados — confirmado en su dashboard y contra BD

## LSS (4 escenarios)
- [x] 1. Evaluación sin evaluar (fuentes1501) — dashboard de `profesorcastillo`: "Tienes alumnos con evaluación de desempeño pendiente" / "1 alumno(s) con evaluación pendiente" ✅
- [x] 2. Evaluación aprobada, carta solicitada (rosado1601) — cola de coordinación "Gestionar carta de término" la muestra en espera ✅
- [x] 3. Carta recogida, expediente en revisión (duarte1701) — cola "Dictaminar expediente" lo muestra como único pendiente ✅
- [x] 4. Expediente aprobado, constancia solicitada (bravo1801) — cola "Gestionar constancia de término" la muestra como única pendiente ✅

## Pendiente de verificar en vivo (no pre-seedeable, son la acción misma de la demo)
- GR-1: el registro completo paso a paso.
- GR-2 (parte 2) y GR-8: el rechazo/cambio de oferta en sí.
- GR-7 (parte 2): la decisión del profesor y el auto-rechazo del otro alumno.
- AH-1 (parte 2): asignar la actividad y registrar/revisar la bitácora en vivo.
- LSS 1-4 (parte 2): las decisiones de profesor/coordinación/alumno en cada checkpoint.

Todo lo demás —el estado de partida de cada escenario— quedó verificado
contra la BD real y contra la pantalla real en el navegador.
