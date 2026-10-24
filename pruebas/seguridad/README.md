# Pruebas de seguridad

Datos y utilidades para las pruebas de seguridad **PS-02 a PS-06** del documento del TT. No forman parte de la aplicación:
cargan los módulos del backend desde `../../backend/` y se ejecutan dentro del contenedor `escom_backend` (el repo está
montado en `/app`).

| Archivo | Para qué |
|---|---|
| `seed-pruebas-seguridad.js` | Crea (o completa) los usuarios y reportes de prueba |
| `descifrar-documento.js` | Descifra un PDF almacenado (AES-256-GCM) y muestra su SHA-256, sin tocar el original |

## Qué crea el seed

Todos los usuarios usan la contraseña **`12345678`** y pueden iniciar sesión directamente (sin registro, activación ni
token adicional). Cada uno tiene **su propio hash** bcrypt (costo 10, igual que el registro del sistema): la misma
contraseña produce hashes distintos (PS-04). Si encuentra usuarios del fixture con un hash compartido (versiones
anteriores), les genera uno propio sin cambiar sus IDs.

| Rol | Correo | Datos |
|---|---|---|
| Coordinación | `seguridad.coord@ipn.mx` | — |
| Profesor | `seguridad.profesor@ipn.mx` | Una oferta aprobada (`[SEED-SEGURIDAD] Proyecto de pruebas de seguridad`) |
| Alumno A (asignado) | `segalumnoa6401@alumno.ipn.mx` | Boleta 2021636401, rúbrica, 5 bitácoras aprobadas, **reporte mensual 134** en `pendiente_revision_profesor` |
| Alumno B (asignado) | `segalumnob6402@alumno.ipn.mx` | Boleta 2021636402, rúbrica, 5 bitácoras aprobadas, **reporte mensual 135** en `pendiente_revision_profesor` |
| Alumno C (sin asignar) | `segalumnoc6403@alumno.ipn.mx` | Boleta 2021636403, solicitud en `adjuntar_documentacion_inicial` (para la carga de archivos) |

- Los reportes 134 y 135 son los de la BD local; en otra BD los IDs pueden cambiar (el seed los imprime al terminar).
- Los reportes se generan con el **flujo real de envío**: PDF con la rúbrica, SHA-256, sello de tiempo y cifrado.
- Es idempotente: si todo existe, responde `Ya estaba completo; no se modificó nada.` sin escribir ni pedir sellos.

> **Requiere internet.** Al crear reportes, el seed pide **sellos de tiempo reales a FreeTSA** (`https://freetsa.org/tsr`).
> Si la TSA no responde, el reporte no se registra, igual que en el sistema. Si el fixture ya está completo, no la llama.

## Antes de ejecutar el seed: respaldar la BD

```bash
docker exec escom_mariadb sh -c 'mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  > /home/sol/Documentos/escom-ss-respaldos/escom_ss_$(date +%Y%m%d_%H%M%S)_antes-seed-seguridad.sql
```

## Comandos

Siempre con `-u node`: el backend corre como `node` y, si se ejecuta como root, los archivos que se escriben quedan
ilegibles para él.

```bash
# Seed
docker exec -u node -w /app/backend escom_backend node /app/pruebas/seguridad/seed-pruebas-seguridad.js

# Descifrar un documento (trabaja sobre una COPIA; la salida no puede existir ni ser el original)
docker exec -u node -w /app/backend escom_backend sh -c '
  mkdir -p /tmp/integridad &&
  cp uploads/documentos/<ruta_archivo> /tmp/integridad/doc.cifrado &&
  node /app/pruebas/seguridad/descifrar-documento.js /tmp/integridad/doc.cifrado /tmp/integridad/doc.pdf'
```

`<ruta_archivo>` es `documento.ruta_archivo` del reporte (por ejemplo, la del reporte 109). El script imprime el SHA-256
del PDF en claro, que debe coincidir con `revision_reporte_*.hash_documento` de la revisión vigente. Usa la
`ENCRYPTION_KEY` del entorno del contenedor; no hay llaves en el código.

## Qué necesita cada caso

| Caso | Qué se prueba | Herramienta | Datos |
|---|---|---|---|
| PS-01 | Token alterado | `curl` y Node | Cualquier alumno con login |
| PS-02 | Acceso a función de otro rol | `curl` | Seed: alumno A y reporte 134 |
| PS-03 | Acceso a información de otro usuario | `curl` | Seed: alumnos A y B, reportes 134 y 135 |
| PS-04 | Almacenamiento de contraseñas | Consulta a la BD | Seed: alumnos A y B (misma contraseña, hash distinto) |
| PS-05 | Carga de archivo no permitido | `curl` con una imagen renombrada a `.pdf` | Seed: alumno C |
| PS-06 | Integridad de documento firmado | `descifrar-documento.js` y `sha256sum` | Reporte 109 |
| PS-07 | Exposición del servidor | `nmap` contra la IP pública de la VM de Azure | Entorno desplegado |
