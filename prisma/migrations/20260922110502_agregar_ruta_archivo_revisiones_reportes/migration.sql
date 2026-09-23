/*
  Warnings:

  - Added the required column `ruta_archivo` to the `revision_reporte_global` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruta_archivo` to the `revision_reporte_mensual` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `revision_reporte_global` ADD COLUMN `ruta_archivo` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `revision_reporte_mensual` ADD COLUMN `ruta_archivo` VARCHAR(255) NOT NULL;
