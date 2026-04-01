ALTER TABLE `oferta_servicio` 
  CHANGE `cupos` `cuposTotales` INT NOT NULL,
  ADD COLUMN `cuposExtraInvestigador` INT NULL;