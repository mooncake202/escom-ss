-- CreateTable
CREATE TABLE `notificacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `ruta_relacionada` VARCHAR(255) NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(0) NOT NULL,
    `fecha_leida` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `notificacion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
