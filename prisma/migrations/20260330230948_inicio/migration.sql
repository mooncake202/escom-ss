-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `correoInst` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `usuario_correoInst_key`(`correoInst`),
    INDEX `usuario_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coordinacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `nombreCompleto` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `coordinacion_usuario_id_key`(`usuario_id`),
    UNIQUE INDEX `coordinacion_nombreCompleto_key`(`nombreCompleto`),
    INDEX `coordinacion_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `boleta` VARCHAR(50) NOT NULL,
    `carrera` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `correoPersonal` VARCHAR(255) NOT NULL,
    `creditos` INTEGER NOT NULL,
    `bajaTemporal` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `alumno_usuario_id_key`(`usuario_id`),
    UNIQUE INDEX `alumno_boleta_key`(`boleta`),
    UNIQUE INDEX `alumno_telefono_key`(`telefono`),
    UNIQUE INDEX `alumno_correoPersonal_key`(`correoPersonal`),
    INDEX `alumno_usuario_id_idx`(`usuario_id`),
    INDEX `alumno_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `nombreCompleto` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `departamento` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `profesor_usuario_id_key`(`usuario_id`),
    UNIQUE INDEX `profesor_nombreCompleto_key`(`nombreCompleto`),
    UNIQUE INDEX `profesor_telefono_key`(`telefono`),
    INDEX `profesor_usuario_id_idx`(`usuario_id`),
    INDEX `profesor_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesor_caracteristica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `cuposExtra` INTEGER NOT NULL,
    `fechaAsignacion` DATETIME(3) NOT NULL,
    `asignadoPor` INTEGER NOT NULL,

    INDEX `profesor_caracteristica_profesor_id_idx`(`profesor_id`),
    INDEX `profesor_caracteristica_asignadoPor_idx`(`asignadoPor`),
    UNIQUE INDEX `profesor_caracteristica_profesor_id_tipo_key`(`profesor_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesor_caracteristica_solicitud` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `motivacion` TEXT NOT NULL,
    `comentario` TEXT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `fechaRespuesta` DATETIME(3) NULL,

    INDEX `profesor_caracteristica_solicitud_profesor_id_idx`(`profesor_id`),
    INDEX `profesor_caracteristica_solicitud_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` INTEGER NOT NULL,
    `horasAcumuladas` INTEGER NOT NULL DEFAULT 0,
    `horasRechazadas` INTEGER NOT NULL DEFAULT 0,
    `faltasSeguidas` INTEGER NOT NULL DEFAULT 0,
    `faltasAcumuladas` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `horas_alumno_id_key`(`alumno_id`),
    INDEX `horas_alumno_id_idx`(`alumno_id`),
    INDEX `horas_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oferta_servicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `tituloPlatSISS` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `actividades` TEXT NOT NULL,
    `cupos` INTEGER NOT NULL,
    `estado` VARCHAR(20) NOT NULL,

    INDEX `oferta_servicio_id_idx`(`id`),
    INDEX `oferta_servicio_profesor_id_idx`(`profesor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfilDeseado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `perfilDeseado_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oferta_perfilDeseado` (
    `oferta_id` INTEGER NOT NULL,
    `perfil_id` INTEGER NOT NULL,

    INDEX `oferta_perfilDeseado_perfil_id_idx`(`perfil_id`),
    PRIMARY KEY (`oferta_id`, `perfil_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semestre` VARCHAR(7) NOT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NOT NULL,
    `fechaLimExpedi` DATE NOT NULL,

    INDEX `periodo_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` INTEGER NOT NULL,
    `oferta_id` INTEGER NOT NULL,
    `periodo_id` INTEGER NOT NULL,
    `estatus` VARCHAR(50) NOT NULL,
    `motivacion` TEXT NOT NULL,
    `motivo_rechazo` TEXT NULL,

    UNIQUE INDEX `solicitud_alumno_id_key`(`alumno_id`),
    INDEX `solicitud_oferta_id_idx`(`oferta_id`),
    INDEX `solicitud_periodo_id_idx`(`periodo_id`),
    INDEX `solicitud_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `entregableEsperado` TEXT NOT NULL,
    `fecha_limite` DATE NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,

    INDEX `actividad_solicitud_id_idx`(`solicitud_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacora` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `horaInicio` TIME NULL,
    `horaFin` TIME NULL,
    `estado` VARCHAR(30) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `fechaRevision` DATETIME(3) NULL,

    INDEX `bitacora_solicitud_id_idx`(`solicitud_id`),
    UNIQUE INDEX `bitacora_solicitud_id_fecha_key`(`solicitud_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacora_actividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bitacora_id` INTEGER NOT NULL,
    `actividad_id` INTEGER NOT NULL,
    `descripcion` TEXT NOT NULL,
    `progreso` INTEGER NOT NULL,
    `evidencia` TEXT NOT NULL,

    INDEX `bitacora_actividades_bitacora_id_idx`(`bitacora_id`),
    INDEX `bitacora_actividades_actividad_id_idx`(`actividad_id`),
    UNIQUE INDEX `bitacora_actividades_bitacora_id_actividad_id_key`(`bitacora_id`, `actividad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `numero` SMALLINT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NOT NULL,
    `fechaLimite` DATE NOT NULL,
    `diasLaborados` INTEGER NOT NULL DEFAULT 0,
    `horasReportadas` INTEGER NOT NULL DEFAULT 0,
    `observaciones` TEXT NULL,
    `contenido` TEXT NULL,
    `estado` VARCHAR(40) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `fechaModificacion` DATETIME(3) NULL,
    `reporte_documento_id` INTEGER NULL,

    INDEX `reporte_solicitud_id_idx`(`solicitud_id`),
    UNIQUE INDEX `reporte_solicitud_id_fechaInicio_key`(`solicitud_id`, `fechaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_dias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_id` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,

    INDEX `reporte_dias_reporte_id_idx`(`reporte_id`),
    UNIQUE INDEX `reporte_dias_reporte_id_fecha_key`(`reporte_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_historial_estados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_id` INTEGER NOT NULL,
    `estadoAnterior` VARCHAR(60) NULL,
    `estadoNuevo` VARCHAR(60) NOT NULL,
    `actor_id` INTEGER NULL,
    `comentario` TEXT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,

    INDEX `reporte_historial_estados_reporte_id_idx`(`reporte_id`),
    INDEX `reporte_historial_estados_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_firmas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_id` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `fechaFirma` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reporte_firmas_reporte_id_tipo_key`(`reporte_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `firma` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `hash` VARCHAR(512) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `rutaImagen` VARCHAR(500) NOT NULL,

    UNIQUE INDEX `firma_usuario_id_key`(`usuario_id`),
    INDEX `firma_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `ruta` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `tamanio` INTEGER NOT NULL,
    `subidoPor` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,

    INDEX `documento_subidoPor_idx`(`subidoPor`),
    INDEX `documento_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_documentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `documento_id` INTEGER NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,

    INDEX `solicitud_documentos_solicitud_id_idx`(`solicitud_id`),
    INDEX `solicitud_documentos_documento_id_idx`(`documento_id`),
    UNIQUE INDEX `solicitud_documentos_solicitud_id_documento_id_key`(`solicitud_id`, `documento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendario_institucional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `semestre` VARCHAR(6) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `creadoPor` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,

    INDEX `calendario_institucional_creadoPor_idx`(`creadoPor`),
    INDEX `calendario_institucional_tipo_idx`(`tipo`),
    INDEX `calendario_institucional_semestre_idx`(`semestre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendario_vacacional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendario_id` INTEGER NOT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NOT NULL,

    UNIQUE INDEX `calendario_vacacional_calendario_id_key`(`calendario_id`),
    INDEX `calendario_vacacional_calendario_id_idx`(`calendario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendario_inhabil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendario_id` INTEGER NOT NULL,
    `fechaInhabil` DATE NOT NULL,
    `horaDesde` TIME NOT NULL,

    UNIQUE INDEX `calendario_inhabil_calendario_id_key`(`calendario_id`),
    UNIQUE INDEX `calendario_inhabil_fechaInhabil_key`(`fechaInhabil`),
    INDEX `calendario_inhabil_calendario_id_idx`(`calendario_id`),
    INDEX `calendario_inhabil_fechaInhabil_idx`(`fechaInhabil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anuncio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `autor_id` INTEGER NOT NULL,
    `profesor_id` INTEGER NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `contenido` TEXT NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,

    INDEX `anuncio_autor_id_idx`(`autor_id`),
    INDEX `anuncio_profesor_id_idx`(`profesor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `actualizadoPor` INTEGER NOT NULL,

    INDEX `recurso_actualizadoPor_idx`(`actualizadoPor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coordinacion` ADD CONSTRAINT `coordinacion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumno` ADD CONSTRAINT `alumno_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor` ADD CONSTRAINT `profesor_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor_caracteristica` ADD CONSTRAINT `profesor_caracteristica_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor_caracteristica` ADD CONSTRAINT `profesor_caracteristica_asignadoPor_fkey` FOREIGN KEY (`asignadoPor`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor_caracteristica_solicitud` ADD CONSTRAINT `profesor_caracteristica_solicitud_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horas` ADD CONSTRAINT `horas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_servicio` ADD CONSTRAINT `oferta_servicio_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_perfilDeseado` ADD CONSTRAINT `oferta_perfilDeseado_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_perfilDeseado` ADD CONSTRAINT `oferta_perfilDeseado_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfilDeseado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `solicitud_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `solicitud_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `solicitud_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad` ADD CONSTRAINT `actividad_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora_actividades` ADD CONSTRAINT `bitacora_actividades_bitacora_id_fkey` FOREIGN KEY (`bitacora_id`) REFERENCES `bitacora`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora_actividades` ADD CONSTRAINT `bitacora_actividades_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte` ADD CONSTRAINT `reporte_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte` ADD CONSTRAINT `reporte_reporte_documento_id_fkey` FOREIGN KEY (`reporte_documento_id`) REFERENCES `documento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_dias` ADD CONSTRAINT `reporte_dias_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reporte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_historial_estados` ADD CONSTRAINT `reporte_historial_estados_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reporte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_historial_estados` ADD CONSTRAINT `reporte_historial_estados_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_firmas` ADD CONSTRAINT `reporte_firmas_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reporte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_firmas` ADD CONSTRAINT `reporte_firmas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `firma` ADD CONSTRAINT `firma_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documento` ADD CONSTRAINT `documento_subidoPor_fkey` FOREIGN KEY (`subidoPor`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_documentos` ADD CONSTRAINT `solicitud_documentos_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_documentos` ADD CONSTRAINT `solicitud_documentos_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendario_institucional` ADD CONSTRAINT `calendario_institucional_creadoPor_fkey` FOREIGN KEY (`creadoPor`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendario_vacacional` ADD CONSTRAINT `calendario_vacacional_calendario_id_fkey` FOREIGN KEY (`calendario_id`) REFERENCES `calendario_institucional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendario_inhabil` ADD CONSTRAINT `calendario_inhabil_calendario_id_fkey` FOREIGN KEY (`calendario_id`) REFERENCES `calendario_institucional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anuncio` ADD CONSTRAINT `anuncio_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anuncio` ADD CONSTRAINT `anuncio_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurso` ADD CONSTRAINT `recurso_actualizadoPor_fkey` FOREIGN KEY (`actualizadoPor`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
