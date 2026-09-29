-- AlterTable
ALTER TABLE `recurso` ADD COLUMN `tipo` ENUM('link_constancia_creditos') NULL;

-- CreateIndex
CREATE UNIQUE INDEX `recurso_tipo_key` ON `recurso`(`tipo`);
