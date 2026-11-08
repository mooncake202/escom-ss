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
