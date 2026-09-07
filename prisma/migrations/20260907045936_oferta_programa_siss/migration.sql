-- 1. Se agrega como opcional primero (todavía no hay datos que ponerle)
ALTER TABLE `oferta_servicio` ADD COLUMN `programa_SISS` VARCHAR(150) NULL;

-- 2. Se rellenan las 8 filas que ya existen
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-Aplicaciones de la Ing. en Sistemas Computacionales para el Servicio Social' WHERE `nombre_proyecto` = 'Sistema de gestión de bibliotecas escolares';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-S. S. para Apoyo al Área Académica' WHERE `nombre_proyecto` = 'Soporte técnico y mantenimiento de laboratorios de cómputo';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-S. S. para Apoyo al Área Administrativa' WHERE `nombre_proyecto` = 'Desarrollo de aplicación móvil para trámites escolares';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-S. S. para Apoyo al Área de Ciencias e Ingeniería de la Computación' WHERE `nombre_proyecto` = 'Análisis de datos académicos con Machine Learning';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-S. S. para Apoyo al Área de Servicios Educativos e Integración Social' WHERE `nombre_proyecto` = 'Automatización de procesos administrativos internos';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-S. S. para la Sección de Estudios de Posgrado' WHERE `nombre_proyecto` = 'Plataforma de visualización de datos institucionales';
UPDATE `oferta_servicio` SET `programa_SISS` = 'Tutoría entre Pares' WHERE `nombre_proyecto` = 'Auditoría y ciberseguridad en redes del plantel';
UPDATE `oferta_servicio` SET `programa_SISS` = 'ESCOM-Aplicaciones de la Ing. en Sistemas Computacionales para el Servicio Social' WHERE `nombre_proyecto` = 'Investigación aplicada en inteligencia artificial';

-- 3. Ahora sí, se vuelve obligatoria — ya no hay ninguna fila con NULL
ALTER TABLE `oferta_servicio` MODIFY COLUMN `programa_SISS` VARCHAR(150) NOT NULL;