-- AlterTable
ALTER TABLE `solicitud` ADD COLUMN `cartaCompromisoConfirmada` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `registroSISSConfirmado` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `solicitud_revision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `etapa` ENUM('documentacion_y_registroSISS', 'carta_compromiso', 'expediente') NOT NULL,
    `estado` ENUM('pendiente', 'aprobada', 'rechazada_corregible', 'rechazada_definitiva') NOT NULL DEFAULT 'pendiente',
    `comentario` TEXT NULL,
    `revisadoPor` INTEGER NULL,
    `fechaRevision` DATETIME(3) NULL,

    INDEX `solicitud_revision_solicitud_id_idx`(`solicitud_id`),
    INDEX `solicitud_revision_etapa_idx`(`etapa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitud_revision` ADD CONSTRAINT `solicitud_revision_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_revision` ADD CONSTRAINT `solicitud_revision_revisadoPor_fkey` FOREIGN KEY (`revisadoPor`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


--constraints
ALTER TABLE `oferta_servicio` 
  ADD CONSTRAINT `chk_cupos_tipo` 
  CHECK (`tipo` = 'individual' AND `cuposTotales` = 1 OR `tipo` = 'proyecto' AND `cuposTotales` >= 1);