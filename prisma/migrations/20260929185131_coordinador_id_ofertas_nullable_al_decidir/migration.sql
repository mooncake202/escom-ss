-- DropForeignKey
ALTER TABLE `oferta_servicio` DROP FOREIGN KEY `oferta_servicio_coordinador_id_fkey`;

-- AlterTable
ALTER TABLE `oferta_servicio` MODIFY `coordinador_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `oferta_servicio` ADD CONSTRAINT `oferta_servicio_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
