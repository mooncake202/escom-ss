/*
  Warnings:

  - Made the column `estado_solicitud` on table `solicitud_registro` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `solicitud_registro` MODIFY `estado_solicitud` VARCHAR(50) NOT NULL,
    MODIFY `estado_anterior` VARCHAR(50) NULL;
