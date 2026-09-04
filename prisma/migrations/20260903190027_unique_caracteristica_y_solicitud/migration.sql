/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `caracteristica` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profesor_id,caracteristica_id]` on the table `solicitud_caracteristica` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `caracteristica_nombre_key` ON `caracteristica`(`nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `solicitud_caracteristica_profesor_id_caracteristica_id_key` ON `solicitud_caracteristica`(`profesor_id`, `caracteristica_id`);
