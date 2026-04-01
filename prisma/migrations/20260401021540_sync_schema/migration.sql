/*
  Warnings:

  - You are about to alter the column `tipo` on the `profesor_caracteristica_solicitud` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `profesor_caracteristica_solicitud` MODIFY `tipo` ENUM('presidente_academia', 'coordinador', 'jefe_departamento', 'funcionario', 'coordinador_club', 'proyecto_investigacion') NOT NULL;
