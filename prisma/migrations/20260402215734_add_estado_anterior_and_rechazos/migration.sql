-- AlterTable
ALTER TABLE `solicitud` ADD COLUMN `estatusAnterior` ENUM('espera_respuesta_de_profesor', 'espera_validacion_documentacion_y_registroSISS', 'espera_validacion_carta_compromiso', 'espera_validacion_expediente', 'Aprobada', 'rechazada_corregible', 'rechazada_definitiva') NULL,
    MODIFY `estatus` ENUM('espera_respuesta_de_profesor', 'espera_validacion_documentacion_y_registroSISS', 'espera_validacion_carta_compromiso', 'espera_validacion_expediente', 'Aprobada', 'rechazada_corregible', 'rechazada_definitiva') NOT NULL;
}