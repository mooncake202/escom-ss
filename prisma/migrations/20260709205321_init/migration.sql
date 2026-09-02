-- CreateTable
CREATE TABLE `carrera` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caracteristica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` ENUM('Presidente de academia', 'Coordinador', 'Jefe de departamento', 'Investigador') NOT NULL,
    `incremento_cupos` TINYINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rol` VARCHAR(20) NOT NULL,
    `correo_institucional` VARCHAR(35) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `apellidos` VARCHAR(50) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `intentos_fallidos` TINYINT UNSIGNED NULL,
    `cuenta_bloqueada` BOOLEAN NULL,
    `fecha_bloqueo` DATETIME NULL,
    `fecha_creacion` DATETIME NOT NULL,
    `creado_por_id` INTEGER NULL,
    `rubrica_imagen` VARCHAR(500) NULL,
    `rubrica_ip` VARCHAR(45) NULL,
    `rubrica_fecha_registro` DATETIME NOT NULL,

    UNIQUE INDEX `usuario_correo_institucional_key`(`correo_institucional`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumno` (
    `boleta` CHAR(10) NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `celular` VARCHAR(10) NOT NULL,
    `carrera` VARCHAR(3) NOT NULL,
    `creditos` TINYINT UNSIGNED NOT NULL,
    `semestre` TINYINT UNSIGNED NOT NULL,
    `correo_personal` VARCHAR(50) NULL,

    UNIQUE INDEX `alumno_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`boleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `departamento` VARCHAR(100) NOT NULL,
    `telefono_personal` VARCHAR(10) NOT NULL,
    `horario_atencion` VARCHAR(100) NOT NULL,
    `cubiculo` VARCHAR(100) NOT NULL,
    `cupos_totales` TINYINT UNSIGNED NOT NULL,

    UNIQUE INDEX `profesor_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coordinador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,

    UNIQUE INDEX `coordinador_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inicio_sesion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `fecha_hora` DATETIME NOT NULL,
    `ip_acceso` VARCHAR(45) NOT NULL,
    `resultado` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_contrasena` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `fecha_expiracion` DATETIME NOT NULL,
    `usado` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_caracteristica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `caracteristica_id` INTEGER NOT NULL,
    `justificacion` TEXT NOT NULL,
    `estado` VARCHAR(30) NOT NULL,
    `fecha` DATETIME NOT NULL,
    `comentario` TEXT NULL,
    `fecha_respuesta` DATETIME NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evento_calendario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coordinador_id` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `tipo` ENUM('Vacacional', 'Inhabil', 'Periodo') NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_fin` DATE NULL,
    `hora` TIME NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodo_registro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evento_calendario_id` INTEGER NOT NULL,
    `anio` CHAR(4) NOT NULL,
    `semestre` ENUM('01', '02') NOT NULL,
    `fecha_max_expediente` DATE NOT NULL,

    UNIQUE INDEX `periodo_registro_evento_calendario_id_key`(`evento_calendario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coordinador_id` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `fecha_registro` DATETIME NOT NULL,
    `fecha_actualizacion` DATETIME NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacto_institucional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coordinador_id` INTEGER NOT NULL,
    `tipo` ENUM('correo', 'telefono', 'ubicacion', 'horario') NOT NULL,
    `valor` VARCHAR(255) NOT NULL,
    `fecha_actualizacion` DATETIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anuncio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `contenido` TEXT NOT NULL,
    `fecha_publicacion` DATETIME NOT NULL,
    `origen` ENUM('coordinador', 'profesor') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registro_anuncio_visto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` CHAR(10) NOT NULL,
    `anuncio_id` INTEGER NOT NULL,

    UNIQUE INDEX `registro_anuncio_visto_alumno_id_anuncio_id_key`(`alumno_id`, `anuncio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cumulo_horas_y_faltas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` CHAR(10) NOT NULL,
    `horas_acumuladas` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `horas_rechazadas` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `faltas_acumuladas` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `faltas_consecutivas` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    UNIQUE INDEX `cumulo_horas_y_faltas_alumno_id_key`(`alumno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oferta_servicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profesor_id` INTEGER NOT NULL,
    `coordinador_id` INTEGER NOT NULL,
    `nombre_SISS` VARCHAR(100) NOT NULL,
    `nombre_proyecto` VARCHAR(150) NOT NULL,
    `tipo_oferta` ENUM('individual', 'proyecto') NOT NULL,
    `descripcion_actividades` TEXT NOT NULL,
    `cupos_ofertados` TINYINT UNSIGNED NULL,
    `cupos_investigador` TINYINT UNSIGNED NULL,
    `cupos_disponibles` TINYINT UNSIGNED NOT NULL,
    `estado_oferta` VARCHAR(20) NOT NULL,
    `fecha_registro` DATETIME NOT NULL,
    `motivo_rechazo` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deseo_de_carrera` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oferta_id` INTEGER NOT NULL,
    `carrera_id` INTEGER NOT NULL,

    UNIQUE INDEX `deseo_de_carrera_oferta_id_carrera_id_key`(`oferta_id`, `carrera_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_registro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` CHAR(10) NOT NULL,
    `carrera_id` INTEGER NOT NULL,
    `dictamen` TINYINT UNSIGNED NULL,
    `periodo_registro_id` INTEGER NOT NULL,
    `oferta_id` INTEGER NOT NULL,
    `motivacion_oferta` TEXT NOT NULL,
    `estado_solicitud` VARCHAR(50) NOT NULL,
    `estado_anterior` VARCHAR(50) NOT NULL,
    `fecha_aplicacion` DATETIME NOT NULL,
    `tipo_rechazo` VARCHAR(50) NULL,
    `motivo_rechazo` TEXT NULL,
    `registro_siss` BOOLEAN NOT NULL DEFAULT false,
    `docs_iniciales` BOOLEAN NOT NULL DEFAULT false,
    `carta_compromiso` BOOLEAN NOT NULL DEFAULT false,
    `expediente` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `solicitud_registro_alumno_id_key`(`alumno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` CHAR(10) NOT NULL,
    `creador_id` INTEGER NOT NULL,
    `tipo_documento` VARCHAR(50) NOT NULL,
    `fecha_creacion` DATETIME NOT NULL,
    `estado_documento` VARCHAR(20) NOT NULL,
    `ruta_archivo` VARCHAR(255) NOT NULL,
    `aprobado_por_id` INTEGER NULL,
    `nombre_expediente` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_registro_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `entregable_esperado` TEXT NOT NULL,
    `fecha_limite` DATE NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `fecha_asignacion` DATETIME NOT NULL,
    `porcentaje_progreso` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `fecha_completada` DATETIME NULL,
    `fecha_limite_original` DATE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacora` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_registro_id` INTEGER NOT NULL,
    `hora_inicio` DATETIME NOT NULL,
    `hora_fin` DATETIME NOT NULL,
    `horas_contabilizadas` TINYINT UNSIGNED NOT NULL,
    `estado` VARCHAR(30) NOT NULL,
    `fecha_registro` DATE NOT NULL,
    `motivo_rechazo` TEXT NULL,
    `fecha_revision` DATETIME NULL,
    `revisado_por_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registro_bitacora_actividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bitacora_id` INTEGER NOT NULL,
    `actividad_id` INTEGER NOT NULL,
    `descripcion` TEXT NOT NULL,
    `porcentaje_avance_registrado` TINYINT UNSIGNED NOT NULL,
    `evidencia` TEXT NOT NULL,

    UNIQUE INDEX `registro_bitacora_actividades_bitacora_id_actividad_id_key`(`bitacora_id`, `actividad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_mensual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_registro_id` INTEGER NOT NULL,
    `documento_id` INTEGER NOT NULL,
    `num_reporte` TINYINT UNSIGNED NOT NULL,
    `actividades_mes` TEXT NOT NULL,
    `estado_reporte` VARCHAR(35) NOT NULL,

    UNIQUE INDEX `reporte_mensual_documento_id_key`(`documento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_global` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_registro_id` INTEGER NOT NULL,
    `documento_id` INTEGER NOT NULL,
    `actividades_resumen` TEXT NOT NULL,
    `estado_reporte` VARCHAR(35) NOT NULL,

    UNIQUE INDEX `reporte_global_documento_id_key`(`documento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revision_reporte_mensual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_mensual_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo_revisor` ENUM('alumno', 'profesor', 'coordinador') NOT NULL,
    `estado` ENUM('aprobado', 'rechazado') NOT NULL,
    `comentario` TEXT NULL,
    `hash_documento` VARCHAR(64) NULL,
    `ip_firma` VARCHAR(45) NULL,
    `token_tsa` TEXT NULL,
    `fecha` DATETIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revision_reporte_global` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_global_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo_revisor` ENUM('alumno', 'profesor', 'coordinador') NOT NULL,
    `estado` ENUM('aprobado', 'rechazado') NOT NULL,
    `comentario` TEXT NULL,
    `hash_documento` VARCHAR(64) NULL,
    `ip_firma` VARCHAR(45) NULL,
    `token_tsa` TEXT NULL,
    `fecha` DATETIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liberacion_proceso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_registro_id` INTEGER NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `fecha_inicio` DATETIME NOT NULL,
    `reportes_validados_siss` BOOLEAN NOT NULL,
    `evaluacion_subida_siss` BOOLEAN NULL,
    `evaluacion_descargada` BOOLEAN NULL,
    `carta_termino_recogida` BOOLEAN NULL,
    `expediente_enviado` BOOLEAN NULL,
    `observaciones_rechazo` TEXT NULL,

    UNIQUE INDEX `liberacion_proceso_solicitud_registro_id_key`(`solicitud_registro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluacion_desempeno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documento_id` INTEGER NOT NULL,
    `liberacion_proceso_id` INTEGER NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `observaciones_profesor` TEXT NULL,
    `reportes_siss_confirmados` BOOLEAN NOT NULL,
    `fecha_evaluacion` DATETIME NULL,
    `motivo_rechazo_coordinacion` TEXT NULL,

    UNIQUE INDEX `evaluacion_desempeno_documento_id_key`(`documento_id`),
    UNIQUE INDEX `evaluacion_desempeno_liberacion_proceso_id_key`(`liberacion_proceso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revision_desempeno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluacion_desempeno_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo_revisor` VARCHAR(20) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `comentario` TEXT NULL,
    `hash_documento` VARCHAR(64) NULL,
    `ip_firma` VARCHAR(45) NULL,
    `token_tsa` TEXT NULL,
    `fecha` DATETIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carta_termino` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `liberacion_proceso_id` INTEGER NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `carta_recogida` BOOLEAN NOT NULL,
    `fecha_disponible` DATETIME NULL,
    `fecha_recogida` DATETIME NULL,
    `fecha_solicitud` DATETIME NOT NULL,

    UNIQUE INDEX `carta_termino_liberacion_proceso_id_key`(`liberacion_proceso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_baja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumno_id` CHAR(10) NOT NULL,
    `solicitante_id` INTEGER NOT NULL,
    `coordinador_id` INTEGER NOT NULL,
    `documento_id` INTEGER NULL,
    `estado` VARCHAR(12) NOT NULL,
    `motivo` TEXT NOT NULL,
    `fecha` DATETIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumno` ADD CONSTRAINT `alumno_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profesor` ADD CONSTRAINT `profesor_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coordinador` ADD CONSTRAINT `coordinador_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inicio_sesion` ADD CONSTRAINT `inicio_sesion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_contrasena` ADD CONSTRAINT `token_contrasena_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_caracteristica` ADD CONSTRAINT `solicitud_caracteristica_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_caracteristica` ADD CONSTRAINT `solicitud_caracteristica_caracteristica_id_fkey` FOREIGN KEY (`caracteristica_id`) REFERENCES `caracteristica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_calendario` ADD CONSTRAINT `evento_calendario_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodo_registro` ADD CONSTRAINT `periodo_registro_evento_calendario_id_fkey` FOREIGN KEY (`evento_calendario_id`) REFERENCES `evento_calendario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurso` ADD CONSTRAINT `recurso_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacto_institucional` ADD CONSTRAINT `contacto_institucional_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anuncio` ADD CONSTRAINT `anuncio_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registro_anuncio_visto` ADD CONSTRAINT `registro_anuncio_visto_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`boleta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registro_anuncio_visto` ADD CONSTRAINT `registro_anuncio_visto_anuncio_id_fkey` FOREIGN KEY (`anuncio_id`) REFERENCES `anuncio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cumulo_horas_y_faltas` ADD CONSTRAINT `cumulo_horas_y_faltas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`boleta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_servicio` ADD CONSTRAINT `oferta_servicio_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_servicio` ADD CONSTRAINT `oferta_servicio_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deseo_de_carrera` ADD CONSTRAINT `deseo_de_carrera_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deseo_de_carrera` ADD CONSTRAINT `deseo_de_carrera_carrera_id_fkey` FOREIGN KEY (`carrera_id`) REFERENCES `carrera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`boleta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_carrera_id_fkey` FOREIGN KEY (`carrera_id`) REFERENCES `carrera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_periodo_registro_id_fkey` FOREIGN KEY (`periodo_registro_id`) REFERENCES `periodo_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_registro` ADD CONSTRAINT `solicitud_registro_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documento` ADD CONSTRAINT `documento_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`boleta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documento` ADD CONSTRAINT `documento_creador_id_fkey` FOREIGN KEY (`creador_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documento` ADD CONSTRAINT `documento_aprobado_por_id_fkey` FOREIGN KEY (`aprobado_por_id`) REFERENCES `coordinador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad` ADD CONSTRAINT `actividad_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_revisado_por_id_fkey` FOREIGN KEY (`revisado_por_id`) REFERENCES `profesor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registro_bitacora_actividades` ADD CONSTRAINT `registro_bitacora_actividades_bitacora_id_fkey` FOREIGN KEY (`bitacora_id`) REFERENCES `bitacora`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registro_bitacora_actividades` ADD CONSTRAINT `registro_bitacora_actividades_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_mensual` ADD CONSTRAINT `reporte_mensual_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_mensual` ADD CONSTRAINT `reporte_mensual_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_global` ADD CONSTRAINT `reporte_global_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_global` ADD CONSTRAINT `reporte_global_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_reporte_mensual` ADD CONSTRAINT `revision_reporte_mensual_reporte_mensual_id_fkey` FOREIGN KEY (`reporte_mensual_id`) REFERENCES `reporte_mensual`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_reporte_mensual` ADD CONSTRAINT `revision_reporte_mensual_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_reporte_global` ADD CONSTRAINT `revision_reporte_global_reporte_global_id_fkey` FOREIGN KEY (`reporte_global_id`) REFERENCES `reporte_global`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_reporte_global` ADD CONSTRAINT `revision_reporte_global_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liberacion_proceso` ADD CONSTRAINT `liberacion_proceso_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacion_desempeno` ADD CONSTRAINT `evaluacion_desempeno_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacion_desempeno` ADD CONSTRAINT `evaluacion_desempeno_liberacion_proceso_id_fkey` FOREIGN KEY (`liberacion_proceso_id`) REFERENCES `liberacion_proceso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_desempeno` ADD CONSTRAINT `revision_desempeno_evaluacion_desempeno_id_fkey` FOREIGN KEY (`evaluacion_desempeno_id`) REFERENCES `evaluacion_desempeno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revision_desempeno` ADD CONSTRAINT `revision_desempeno_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carta_termino` ADD CONSTRAINT `carta_termino_liberacion_proceso_id_fkey` FOREIGN KEY (`liberacion_proceso_id`) REFERENCES `liberacion_proceso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_baja` ADD CONSTRAINT `solicitud_baja_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno`(`boleta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_baja` ADD CONSTRAINT `solicitud_baja_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_baja` ADD CONSTRAINT `solicitud_baja_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_baja` ADD CONSTRAINT `solicitud_baja_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
