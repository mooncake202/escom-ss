# Backups — antes de empezar a poblar `seeds/demo-final`

Respaldo de la base de datos de desarrollo (estructura completa + datos), tomado
**antes** de seguir construyendo `cred-gr-ah-lss/` y `amd-pro-rep/`, por si hace
falta consultar cómo estaba la BD o recuperar algo de lo que ya había.

- `karen/` — respaldos de Karen:
  - `respaldo_20261107_2233.sql` — el primero de todos, tomado antes de
    empezar a construir nada (datos viejos de desarrollo, por si hay que
    consultar cómo estaba la BD originalmente).
  - `respaldo_20261108_1358.sql` — **este es el que necesita Sol** (ver
    `../video-tutorial/TRASPASO-SOL.md`): GR + AH completos, 6 actividades y
    3 bitácoras de octubre ya sembradas, calendario correcto, cero reportes
    — el punto de partida exacto para que grabe PRO/REP.
  - `antes_lss_solo_karen.sql` — exclusivo de Karen, no es para Sol: el
    punto justo antes de grabar LSS (480h + 8 reportes + firmas ya listos).
  - `antes_grabar_cred_profesor.sql` — tomado antes de vaciar la BD para
    grabar en vivo la creación de Ricardo por CU-CRED-03 (contiene el
    estado de LSS ya grabado por Karen, por si hace falta volver). El
    respaldo tomado justo DESPUÉS de esa grabación (`despues_grabar_cred_video.sql`)
    ya se borró — una vez confirmado que `demo-final/cred-gr-ah-lss/01-cred.js`
    corre limpio desde cero sobre `00-comun/`, no hacía falta conservarlo.
  - `gr_video_1_profesor_recibe_solicitud.sql`, `gr_video_2_coordinador_revisa_documentacion.sql`,
    `gr_video_3_coordinador_revisa_carta.sql`, `gr_video_4_coordinador_revisa_expediente.sql`
    — los 4 checkpoints de GR del **video** (Daniela), para regrabar
    cualquiera de esas 4 escenas sin tener que rehacer el registro completo.
  - `demo_final_v2_sin_riesgos.sql` — estado completo y actual de `demo-final/`
    (CRED + ofertas + GR + AH + REP + LSS, los 6 pasos de
    `cred-gr-ah-lss/index.js`), verificado con una corrida limpia desde cero
    y sin ningún riesgo de que un cron real mueva algo antes del 23 de
    noviembre. Los respaldos intermedios de cada módulo (`demo_final_gr_*.sql`,
    etc.) ya se borraron — quedaron superados por este, y los seeds son
    idempotentes: se reconstruyen desde cero corriendo `00-comun/index.js` +
    `cred-gr-ah-lss/index.js`, así que no hace falta un respaldo por cada
    módulo.
- `sol/` — para que Sol ponga aquí su propio respaldo cuando empiece a trabajar
  en `amd-pro-rep/`.

## Cómo se generó (MariaDB, estructura + datos + triggers/rutinas)

```bash
docker compose exec -T mariadb sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --routines --triggers --single-transaction "$MYSQL_DATABASE" > /tmp/respaldo.sql'
docker compose cp mariadb:/tmp/respaldo.sql backend/src/seeds/backup/<tu-nombre>/respaldo_YYYYMMDD_HHMM.sql
```

## Cómo restaurar si hace falta

```bash
docker compose exec -T mariadb sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backend/src/seeds/backup/karen/respaldo_YYYYMMDD_HHMM.sql
```

⚠️ Restaurar un respaldo **reemplaza** las tablas con los datos del archivo — no se
hace sin confirmar antes con el equipo.
