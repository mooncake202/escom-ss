-- DropForeignKey
ALTER TABLE `solicitud_registro` DROP FOREIGN KEY `solicitud_registro_oferta_id_fkey`;

-- DropForeignKey
ALTER TABLE `solicitud_registro` DROP FOREIGN KEY `solicitud_registro_periodo_registro_id_fkey`;

-- DropIndex
DROP INDEX `solicitud_registro_oferta_id_fkey` ON `solicitud_registro`;

-- DropIndex
DROP INDEX `solicitud_registro_periodo_registro_id_fkey` ON `solicitud_registro`;

-- AlterTable
ALTER TABLE `solicitud_registro` MODIFY `periodo_registro_id` INTEGER NULL,
    MODIFY `oferta_id` INTEGER NULL,
    MODIFY `motivacion_oferta` TEXT NULL,
    MODIFY `estado_solicitud` VARCHAR(50) NULL;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_periodo_registro_id_fkey` FOREIGN KEY (`periodo_registro_id`) REFERENCES `periodo_registro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
