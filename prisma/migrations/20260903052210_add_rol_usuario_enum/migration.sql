/*
  Warnings:

  - You are about to alter the column `rol` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `usuario` MODIFY `rol` ENUM('alumno_sin_asignar', 'alumno_asignado', 'profesor', 'coordinador') NOT NULL;
