# Pruebas de rendimiento con k6

Scripts de las pruebas PR-01 a PR-05 contra la API (`/api` detrás de Nginx). Ninguna prueba llama a la TSA (FreeTSA):
solo consultas, la vista previa del reporte mensual (PDF en memoria) y la descarga de PDF ya generados.

```
pruebas/k6/
├── README.md
├── package.json              → solo para que Node cargue lib/config.js (ESM); k6 no lo usa
├── datos/preparar-datos.js   → crea el lote de usuarios y datos (dentro del contenedor)
├── datos/limpiar-datos.js    → borra todo lo del lote, incluidos los PDF
├── lib/config.js             → configuración única (variables de entorno, cantidades del lote, umbrales, pausas)
├── lib/auth.js               → login en setup() (un token por usuario) y lectura de los IDs de reportes
├── lib/escenarios.js         → escenarios por rol de PR-02, PR-03 y PR-05 (oficiales y reducido)
├── lib/operaciones.js        → operaciones por rol, un usuario distinto por VU y resumen por op (handleSummary)
├── pr01-humo.js
├── pr02-consultas.js         → también es PR-04 cambiando BASE_URL
├── pr03-pdf.js
└── pr05-estres.js
```

## Requisitos

- **k6 ≥ 0.54**. Si no está instalado, se usa la imagen oficial, siempre desde la **raíz del repo**:

  ```bash
  alias k6='docker run --rm -i --network host -u "$(id -u):$(id -g)" -v "$PWD":/work -w /work grafana/k6:0.54.0'
  ```

- El stack levantado (`escom_backend`, `escom_mariadb`, `escom_redis`, `escom_nginx`).
- La carpeta de resultados: `mkdir -p pruebas/k6/resultados` (está en `.gitignore`).

## Variables de entorno

Las leen **los scripts de k6 y los de datos por igual** (`lib/config.js`). Si cambias alguna para preparar los datos,
usa la misma al correr k6.

| Variable | Por omisión | Para qué |
|---|---|---|
| `K6_PREFIJO` | `kseis` | Prefijo del lote; **solo letras** (el correo del alumno debe ser letras + 4 dígitos) |
| `K6_ALUMNOS` / `K6_PROFESORES` / `K6_COORDINADORES` | `100` / `10` / `2` | Alumnos, profesores **base** (los que se conectan) y coordinadores; los profesores adicionales se calculan solos |
| `K6_PASSWORD` | `12345678` | Contraseña de todos los usuarios del lote |
| `K6_BOLETA_BASE` / `K6_BOLETA_DESDE` | `201963` / `9001` | Boletas `^(19\|20)\d{2}63\d{4}$` → 2019639001… |
| `K6_DIAS_ATRAS` | `120` | Inicio del periodo de los alumnos (≈ días antes de hoy, en lunes) |
| `K6_BITACORAS_POR_PERIODO` | `10` | Bitácoras aprobadas en los periodos #1 y #2 |
| `K6_BACKEND_DIR` | `/app/backend` | Ruta del backend dentro del contenedor |
| `BASE_URL` | `http://localhost` | Origen de la API (se le agrega `/api`) |
| `K6_PAUSA_MIN` / `K6_PAUSA_MAX` | `1` / `3` | Pausa aleatoria entre peticiones (s) |
| `K6_RESULTADOS_DIR` | `pruebas/k6/resultados` | Dónde se guarda el JSON de cada corrida |
| `K6_VUS_PROFESORES` / `K6_VUS_COORDINADORES` | `10` / `2` | VUs constantes de profesores y coordinación en PR-02, PR-03 y PR-05 |
| `K6_REDUCIDO` | — | `1` = validación rápida (no oficial): `K6_VUS_REDUCIDO` alumnos (5), 1 profesor y 1 coordinador durante `K6_DURACION_REDUCIDA` (30s) |
| `K6_DEPURAR_USUARIOS` | — | `1` = cada VU imprime qué usuario tomó (para comprobar que no se repiten) |
| `K6_NOMBRE` | — | Nombre del archivo de resultados de `pr02` (útil para PR-04) |

Correos del lote por omisión: `kseisalumno0001@alumno.ipn.mx` … `kseisalumno0100@…`, profesores base
`kseisprofesor01@ipn.mx` … `kseisprofesor10@ipn.mx`, profesores adicionales `kseisprofadic01@ipn.mx` …
`kseisprofadic24@ipn.mx` (no se conectan en las pruebas) y `kseiscoord01@ipn.mx`, `kseiscoord02@ipn.mx`.
Las pruebas inician sesión con **112 usuarios** (100 + 10 + 2).

## Preparar los datos

Respalda primero la BD y después corre el script dentro del contenedor, como `node` (si se corre como root, los PDF quedan
ilegibles para el backend):

```bash
mariadb_dump=/home/sol/Documentos/escom-ss-respaldos/escom_ss_$(date +%Y%m%d_%H%M%S)_antes-k6.sql
docker exec escom_mariadb sh -c 'mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' > "$mariadb_dump"

docker exec -u node -w /app/backend escom_backend node /app/pruebas/k6/datos/preparar-datos.js
# con otro lote:  docker exec -u node -w /app/backend -e K6_PREFIJO=kprueba escom_backend node /app/pruebas/k6/datos/preparar-datos.js
```

Qué crea (con los valores por omisión):

- **2 coordinadores.**
- **10 profesores base** y los **profesores adicionales** necesarios (24 con los valores por omisión). Todos sin
  característica, así que su cupo es el real del sistema: `CUPOS_BASE` = 3 (`caracteristicas.service.js`). Los alumnos
  llenan primero el cupo de los 10 base (30 alumnos) y el resto se reparte entre los adicionales (70 alumnos). Cada
  profesor tiene una oferta **aprobada** (programa SISS) con su cupo, y cada profesor base, además, una oferta
  **pendiente de revisión** (bandeja de coordinación).
- **100 alumnos asignados**, cada uno con su `solicitud_registro` en `alumno_asignado` ligada al periodo de registro y a
  la oferta de su profesor, con los datos que exige el registro (boleta válida, nombre y dos apellidos de solo letras,
  celular, correo personal, créditos, semestre y motivación), validados con los mismos validadores del backend.
- Por alumno: rúbrica, periodo iniciado, 20 bitácoras aprobadas (periodos #1 y #2, ambos cerrados, sin pendientes; se
  saltan los inhábiles/vacacionales del calendario), cúmulo y su **reporte mensual #1 con PDF cifrado**. El #2 queda
  listo para la vista previa.
- Los reportes se generan con el envío y la aprobación **reales**, pero con un sello de tiempo **falso** inyectado
  (`deps.solicitarSelloTiempo`): nunca se llama a FreeTSA. Los 30 de los alumnos de los profesores base quedan en
  `pendiente_revision_profesor` (3 en la bandeja de cada profesor base); los 70 de los adicionales los aprueba su
  profesor y quedan en `pendiente_revision_coordinador`.
- Cada usuario tiene **su propio hash** bcrypt (costo 10, igual que el registro del sistema).

Es idempotente: si el lote existe completo solo completa lo que falte; si existe con **otra forma** (por ejemplo, el lote
anterior de 35/10/5), lo borra y lo crea de nuevo.

## Matriz de pruebas

| Prueba | Script | BASE_URL | Desde dónde se ejecuta |
|---|---|---|---|
| PR-01 · humo | `pr01-humo.js` | `https://ttservicio.com` | Equipo externo a la VM (por el dominio, a través del túnel) |
| PR-02 · consultas | `pr02-consultas.js` | `https://ttservicio.com` | Equipo externo a la VM |
| PR-03 · PDF sin TSA | `pr03-pdf.js` | `https://ttservicio.com` | Equipo externo a la VM |
| PR-04 · línea base | `pr02-consultas.js` con `K6_NOMBRE=pr04-consultas` | `http://localhost` | Dentro de la VM de Azure |
| PR-05 · estrés | `pr05-estres.js` | `https://ttservicio.com` | Equipo externo a la VM |
| PR-06 · front | — (no es k6) | `https://ttservicio.com` | Se mide con **Lighthouse**, no con k6 |

PR-04 repite las consultas de PR-02 sin dominio ni túnel: la diferencia entre ambas es el costo de la red pública,
Cloudflare y el túnel.

## Ejecutar las pruebas (oficiales)

Desde la **raíz del repo** (en el equipo externo hace falta una copia del repo con `pruebas/k6/`). Si cambiaste
`K6_PREFIJO` o las cantidades al preparar los datos, pásalas también aquí con `-e`.

```bash
mkdir -p pruebas/k6/resultados

# PR-01 · humo: 1 alumno, 1 profesor y 1 coordinador durante 1 min (consultas + PDF) — equipo externo
k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr01-humo.js

# PR-02 · consultas: alumnos 0→50 en 1 min y 5 min a 50; 10 profesores y 2 coordinadores constantes — equipo externo
k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr02-consultas.js

# PR-03 · PDF sin TSA: mismos escenarios que PR-02 — equipo externo
k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr03-pdf.js

# PR-04 · línea base: mismas consultas que PR-02, dentro de la VM de Azure
k6 run -e BASE_URL=http://localhost -e K6_NOMBRE=pr04-consultas pruebas/k6/pr02-consultas.js

# PR-05 · estrés: alumnos en 50 durante 2 min y de 10 en 10 hasta 100 (2 min por nivel); 10 profesores y 2
#          coordinadores constantes — equipo externo
k6 run -e BASE_URL=https://ttservicio.com pruebas/k6/pr05-estres.js
```

## PR-06: navegación entre módulos (Lighthouse)

PR-06 no usa k6: mide en el navegador cuánto tarda en pintarse cada módulo (LCP, *Largest Contentful Paint*).

1. **Antes de medir, reconstruye el front** (`front/dist`, ver "Requisitos del entorno en Azure"): Lighthouse mide lo
   que sirve Nginx, no el código fuente.
2. Abre Chrome en una **ventana de incógnito** e inicia sesión en el dominio de Azure (`https://ttservicio.com`) con un
   usuario de prueba de cada rol (por ejemplo, del lote: `kseisalumno0001@alumno.ipn.mx`, `kseisprofesor01@ipn.mx`,
   `kseiscoord01@ipn.mx`, contraseña `12345678`).
3. Abre el módulo a medir y, en las herramientas de desarrollo (F12), la pestaña **Lighthouse**.
4. Configuración:
   - Modo: **Navegación**.
   - Dispositivo: **Escritorio**.
   - Categorías: solo **Rendimiento**.
   - En los ajustes (engrane), **desmarca "Borrar almacenamiento"** para conservar la sesión; si no, Lighthouse borra el
     token y mide la pantalla de inicio de sesión.
5. Ejecuta el análisis y anota el **LCP**. Repite **3 veces por módulo** y reporta la **mediana**.
6. Módulos a medir:

   | Rol | Módulo | LCP 1 | LCP 2 | LCP 3 | Mediana |
   |---|---|---|---|---|---|
   | Alumno | Inicio | | | | |
   | Alumno | Reportes | | | | |
   | Alumno | Perfil | | | | |
   | Profesor | Bandeja de reportes | | | | |
   | Profesor | Alumnos asignados | | | | |
   | Coordinación | Bandeja de reportes | | | | |
   | Coordinación | Ofertas pendientes | | | | |

## Validación local (no oficial)

Solo para comprobar que los scripts y los datos funcionan; sus números **no** son resultados de la matriz.
`K6_REDUCIDO=1` cambia los escenarios por 5 alumnos, 1 profesor y 1 coordinador durante 30 s (`K6_VUS_REDUCIDO`,
`K6_DURACION_REDUCIDA`) sin tocar los oficiales.

```bash
k6 run -e BASE_URL=http://localhost pruebas/k6/pr01-humo.js
k6 run -e BASE_URL=http://localhost -e K6_REDUCIDO=1 pruebas/k6/pr02-consultas.js
k6 run -e BASE_URL=http://localhost -e K6_REDUCIDO=1 pruebas/k6/pr03-pdf.js
k6 run -e BASE_URL=http://localhost -e K6_REDUCIDO=1 pruebas/k6/pr05-estres.js
```

Cómo funcionan:

- **Login solo en `setup()`**: un token por usuario, reutilizado en toda la carga. Los IDs de los reportes salen de
  `GET /api/reportes`, `/api/profesor/reportes` y `/api/coordinador/reportes` (coordinación solo abre los del lote).
- **Un escenario por rol, en paralelo** (`alumno`, `profesor`, `coordinacion`):

  | Prueba | Alumnos | Profesores | Coordinación | Duración |
  |---|---|---|---|---|
  | PR-01 | 1 | 1 | 1 | 1 min |
  | PR-02 y PR-03 | 0→50 en 1 min, 5 min a 50 | 10 constantes | 2 constantes | 6 min |
  | PR-05 | 50 durante 2 min, luego +10 cada 2 min 10 s hasta 100 | 10 constantes | 2 constantes | 12 min 50 s |
  | Reducido | 5 | 1 | 1 | 30 s |

- **Un usuario distinto por VU, sin reutilización**: cada VU toma el usuario #N de su rol, donde N sale del contador
  atómico del escenario (`exec.scenario.iterationInTest`). Cada VU hace una sola iteración larga (repite sus operaciones
  hasta el fin de su escenario), así que el contador vale 0, 1, 2… una vez por VU. Los profesores virtuales usan solo los 10
  profesores base. Si un escenario tuviera más VUs que usuarios de su rol, la prueba se detiene.
- Pausa aleatoria de 1 a 3 s entre peticiones. Cada petición lleva `tags: { rnf: 'consulta' | 'pdf', op }` y checks de 200.
- **Umbrales**: `http_req_duration{rnf:consulta}` p(95)<2000, `http_req_duration{rnf:pdf}` p(95)<3000,
  `http_req_failed` rate<0.01. Ninguno detiene la prueba; si alguno no se cumple, k6 termina con código 99.
- **Resultado**: en consola, los VUs por rol y una tabla con p95, tasa de error y peticiones **por op**; el JSON completo
  queda en `pruebas/k6/resultados/<prueba>-<fecha>.json`. Como cada VU hace una sola iteración, `iterations` = VUs que
  arrancaron.

| op | rol | rnf | petición |
|---|---|---|---|
| `alumno_perfil` | alumno | consulta | `GET /api/perfil/alumno` |
| `alumno_estado` | alumno | consulta | `GET /api/dashboard/resumen` |
| `alumno_historial` | alumno | consulta | `GET /api/reportes` |
| `profesor_bandeja` | profesor | consulta | `GET /api/profesor/reportes` |
| `profesor_alumnos` | profesor | consulta | `GET /api/profesor/actividades/alumnos` |
| `profesor_perfil` | profesor | consulta | `GET /api/perfil/profesor` |
| `coord_bandeja` | coordinación | consulta | `GET /api/coordinador/reportes` |
| `coord_ofertas_pendientes` | coordinación | consulta | `GET /api/ofertas/pendientes` |
| `coord_resumen` | coordinación | consulta | `GET /api/dashboard/resumen` |
| `alumno_vista_previa` | alumno | pdf | `POST /api/reportes/mensual/vista-previa` (genera el PDF en cada llamada) |
| `alumno_pdf` | alumno | pdf | `GET /api/reportes/:tipo/:id/pdf` |
| `profesor_pdf` | profesor | pdf | `GET /api/profesor/reportes/:tipo/:id/pdf` |
| `coord_pdf` | coordinación | pdf | `GET /api/coordinador/reportes/:tipo/:id/pdf` |

**Excluidos por llamar a la TSA**: envío y corrección de reportes, aprobación del profesor y de coordinación, y la
evaluación y el dictamen de LSS.

## Limpiar

```bash
docker exec -u node -w /app/backend escom_backend node /app/pruebas/k6/datos/limpiar-datos.js
```

Borra solo lo del lote (usuarios por sus correos y todo lo que cuelga de ellos, ofertas y periodo por su marca, PDF y
rúbricas en `uploads/`) y verifica que no queden restos. Conviene limpiar al terminar: mientras exista el lote, el cron
de AH empieza a contar faltas diarias a esos alumnos.

## Requisitos del entorno en Azure (antes de medir)

- [ ] **cloudflared corriendo en la VM**, con el dominio (`ttservicio.com`) apuntando a Nginx.
      Verificar: `systemctl status cloudflared` (o `docker ps` si corre en contenedor) y que `https://ttservicio.com`
      responda desde fuera.
- [ ] **docker-compose sin el puerto 3000 del backend publicado**, y **Nginx publicado solo hacia la propia VM**
      (`127.0.0.1:80:80`). El `docker-compose.yml` del repo publica hoy `3000:3000` y `80:80`: en Azure deben ajustarse.
      Verificar: `docker ps --format '{{.Names}}\t{{.Ports}}'` → `escom_nginx` con `127.0.0.1:80->80/tcp` y `escom_backend`
      sin puertos publicados.
- [ ] **Reloj sincronizado**: `timedatectl status` → `System clock synchronized: yes` y zona correcta (los datos se crean
      con fechas relativas a "hoy" en México y los JWT dependen del reloj).
- [ ] **Front reconstruido** (`front/dist`, con `npm run build` dentro de `front/`), **sin borrar la carpeta**: está
      montada en Nginx y, si desaparece, el sitio responde 403.
- [ ] **k6 instalado, o la imagen `grafana/k6`**, en el **equipo externo** desde donde se correrán las pruebas oficiales
      (PR-01, PR-02, PR-03, PR-05) **y también dentro de la VM** para PR-04.
- [ ] **Cloudflare y los bots**: Cloudflare puede tratar el tráfico de k6 como bots y limitarlo o bloquearlo (respuestas
      403/429 o páginas de desafío en lugar de JSON). Si pasa:
      1. revisar en el panel de Cloudflare la protección contra bots y las reglas de seguridad (WAF, límites de velocidad);
      2. permitir temporalmente la IP del equipo que corre k6, **solo durante las pruebas**, y retirarla al terminar;
      3. dejar documentado el ajuste (qué regla, IP, fecha y hora de alta y de baja) junto a los resultados.
- [ ] **Respaldo de la BD** con `mariadb-dump` antes de ejecutar `preparar-datos.js` (mismo comando que en "Preparar los
      datos", en la VM), y **`limpiar-datos.js` al terminar**: esa VM también se usa para la presentación y las revisiones
      del director, y el lote no debe quedarse ahí (además, el cron de AH les sumaría faltas diarias a esos alumnos).

## Antes de correr en Azure

Además del checklist anterior:

- **Registra el tamaño de la BD** antes de cada corrida (los resultados dependen de él):

  ```bash
  docker exec escom_mariadb sh -c 'mariadb -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT (SELECT COUNT(*) FROM usuario) usuarios, (SELECT COUNT(*) FROM reporte_mensual) reportes_mensuales, (SELECT COUNT(*) FROM reporte_global) reportes_globales, (SELECT COUNT(*) FROM bitacora) bitacoras;"'
  ```

- **Una prueba a la vez**: no corras dos pruebas al mismo tiempo (comparten usuarios, BD y CPU, y se contaminan entre sí).
- El único limitador de la aplicación es el de `POST /api/registro` (5/min por IP), que estas pruebas no usan: un 429
  durante las pruebas viene de Cloudflare, no de la aplicación.
