-- CU-ADM-09 / CU-ADM-11 / CU-ADM-12 — campos de resolución de la solicitud de baja.
--
-- 1) coordinador_id pasa a NULL: al crear la solicitud (profesor o alumno) todavía no hay
--    coordinador asignado; se fija cuando Coordinación la resuelve. Obligarlo antes forzaría
--    a elegir uno arbitrario, que es justo lo que no queremos en una bandeja compartida.
-- 2) fecha_respuesta y comentario: sin ellos no se puede ordenar el historial ni guardar el
--    motivo de rechazo (`motivo` pertenece al solicitante, no a Coordinación).
--
-- `estado` se queda en VARCHAR(12): pendiente (9), aprobada (8) y rechazada (9) caben.
-- La tabla está vacía, así que no hay backfill ni riesgo de datos.

ALTER TABLE `solicitud_baja` ADD COLUMN `comentario` TEXT NULL,
    ADD COLUMN `fecha_respuesta` DATETIME(0) NULL,
    MODIFY `coordinador_id` INTEGER NULL;
