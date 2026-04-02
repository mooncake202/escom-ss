-- AlterTable
ALTER TABLE `alumno` ADD COLUMN `semestre` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `profesor` ADD COLUMN `cubiculo` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `anuncio_visto` (
    `alumno_id` INTEGER NOT NULL,
    `anuncio_id` INTEGER NOT NULL,
    `visto_en` DATETIME(3) NOT NULL,

    PRIMARY KEY (`alumno_id`, `anuncio_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `anuncio_visto` ADD CONSTRAINT `anuncio_visto_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anuncio_visto` ADD CONSTRAINT `anuncio_visto_anuncio_id_fkey` FOREIGN KEY (`anuncio_id`) REFERENCES `anuncio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
