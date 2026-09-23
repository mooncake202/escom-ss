-- Característica institucional VIGENTE del profesor (CU-ADM-15/16).
--
-- profesor.caracteristica_id (nullable) pasa a ser la única fuente de la característica vigente: 0 o 1 por
-- profesor, con NULL = "Profesor base" (3 cupos). solicitud_caracteristica deja de expresar vigencia y queda
-- como HISTORIAL: se elimina su UNIQUE(profesor_id, caracteristica_id) para permitir varias solicitudes por
-- profesor, y su caracteristica_id pasa a nullable (NULL = solicitud para volver a Profesor base).
--
-- No se toca ningún otro módulo: evaluacion_desempeno/LSS, Ofertas y GR quedan intactos.

-- ── 1) profesor: columna de característica vigente + FK (RESTRICT protege cupos_totales de quedar obsoleto) ──
ALTER TABLE `profesor` ADD COLUMN `caracteristica_id` INTEGER NULL;

ALTER TABLE `profesor` ADD CONSTRAINT `profesor_caracteristica_id_fkey`
  FOREIGN KEY (`caracteristica_id`) REFERENCES `caracteristica`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 2) DATOS: preservar la característica aprobada vigente ──
-- Determinista aun si existieran varias solicitudes aprobadas: gana la MÁS RECIENTE por fecha_respuesta y,
-- en empate (o si es NULL), la de id mayor. En MariaDB, ORDER BY ... DESC coloca los NULL al final, así que
-- las solicitudes con fecha de respuesta real tienen prioridad sobre las que no la tienen.
-- Se aceptan las dos ortografías de estado que conviven en el repo ('aprobada' y 'aprobado').
-- Los profesores sin solicitud aprobada reciben NULL (Profesor base), que ya es su valor tras el paso 1.
UPDATE `profesor` p
SET p.`caracteristica_id` = (
  SELECT s.`caracteristica_id`
  FROM `solicitud_caracteristica` s
  WHERE s.`profesor_id` = p.`id`
    AND s.`estado` IN ('aprobada', 'aprobado')
    AND s.`caracteristica_id` IS NOT NULL
  ORDER BY s.`fecha_respuesta` DESC, s.`id` DESC
  LIMIT 1
);

-- ── 3) DATOS: cupos_totales = 3 (Profesor base) + incremento de la vigente; sin vigente = 3 ──
-- Normaliza de forma general cualquier capacidad capturada a mano (p. ej. profesor.volumen, 20 -> 3).
UPDATE `profesor` p
  LEFT JOIN `caracteristica` c ON c.`id` = p.`caracteristica_id`
  SET p.`cupos_totales` = 3 + COALESCE(c.`incremento_cupos`, 0);

-- ── 4) solicitud_caracteristica: historial (varias filas por profesor) ──
-- El índice por profesor_id se crea ANTES de borrar el UNIQUE compuesto: en MariaDB/MySQL toda FK necesita un
-- índice con su columna como prefijo izquierdo, y hoy ese papel lo cumple el compuesto. Creándolo primero, la FK
-- `solicitud_caracteristica_profesor_id_fkey` NUNCA queda eliminada en ningún punto de la migración.
CREATE INDEX `solicitud_caracteristica_profesor_id_idx`
  ON `solicitud_caracteristica`(`profesor_id`);

DROP INDEX `solicitud_caracteristica_profesor_id_caracteristica_id_key`
  ON `solicitud_caracteristica`;

ALTER TABLE `solicitud_caracteristica` MODIFY `caracteristica_id` INTEGER NULL;
