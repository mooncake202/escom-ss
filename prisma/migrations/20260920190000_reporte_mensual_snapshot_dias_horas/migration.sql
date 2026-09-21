-- Snapshot del primer envío de cada reporte mensual (CU-REP-01): bitácoras aprobadas por AH dentro del periodo del reporte
-- (fecha_revision) y la suma de sus horas_contabilizadas. No se recalculan nunca.
--
-- Columnas requeridas y sin DEFAULT. Si la tabla ya tuviera filas (reportes de prueba), MariaDB las rellena con 0 al
-- añadir la columna: bórralas o vuélvelas a enviar en lugar de dejar ese 0 como si fuera un dato real.

-- AlterTable
ALTER TABLE `reporte_mensual` ADD COLUMN `dias_laborados` TINYINT UNSIGNED NOT NULL,
    ADD COLUMN `horas_reportadas` SMALLINT UNSIGNED NOT NULL;
