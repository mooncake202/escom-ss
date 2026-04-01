/*
  Warnings:

  - You are about to alter the column `tipo` on the `oferta_servicio` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(2))`.
  - You are about to alter the column `estado` on the `oferta_servicio` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(3))`.
  - You are about to alter the column `tipo` on the `profesor_caracteristica` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(0))`.
  - You are about to alter the column `estado` on the `profesor_caracteristica_solicitud` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(1))`.
  - You are about to drop the column `motivo_rechazo` on the `solicitud` table. All the data in the column will be lost.
  - You are about to alter the column `estatus` on the `solicitud` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `oferta_servicio` MODIFY `tipo` ENUM('proyecto', 'individual') NOT NULL,
    MODIFY `estado` ENUM('activa', 'pendiente', 'finalizado') NOT NULL;

-- AlterTable
ALTER TABLE `profesor_caracteristica` MODIFY `tipo` ENUM('presidente_academia', 'coordinador', 'jefe_departamento', 'funcionario', 'coordinador_club', 'proyecto_investigacion') NOT NULL;

-- AlterTable
ALTER TABLE `profesor_caracteristica_solicitud` MODIFY `estado` ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL;

-- AlterTable
ALTER TABLE `solicitud` DROP COLUMN `motivo_rechazo`,
    ADD COLUMN `motivoRechazo` TEXT NULL,
    ADD COLUMN `tipoRechazo` ENUM('ninguno', 'definitivo', 'corregible') NOT NULL DEFAULT 'ninguno',
    MODIFY `estatus` ENUM('espera_respuesta_de_profesor', 'espera_validacion_documentacion_y_registroSISS', 'espera_validacion_carta_compromiso', 'espera_validacion_expediente', 'Aprobada') NOT NULL;
