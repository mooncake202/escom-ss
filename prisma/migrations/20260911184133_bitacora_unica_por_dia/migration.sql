-- AlterTable
ALTER TABLE `bitacora` MODIFY `hora_fin` DATETIME(0) NULL,
    MODIFY `horas_contabilizadas` TINYINT UNSIGNED NULL;

-- CreateIndex
CREATE UNIQUE INDEX `bitacora_solicitud_registro_id_fecha_registro_key` ON `bitacora`(`solicitud_registro_id`, `fecha_registro`);

