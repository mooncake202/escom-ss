/*
  Warnings:

  - You are about to drop the column `fecha_hora` on the `inicio_sesion` table. All the data in the column will be lost.
  - Added the required column `fecha_hora_acceso` to the `inicio_sesion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `inicio_sesion` RENAME COLUMN `fecha_hora` TO `fecha_hora_acceso`;
