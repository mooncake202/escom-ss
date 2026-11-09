/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.19-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: escom_ss
-- ------------------------------------------------------
-- Server version	10.11.19-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES
('0cc98258-090b-4587-8cf4-692c909690de','0c0f6c490f7fb95c0cd064f55307b24cdc05e9099ca4947526bf592d7e3f18bc','2026-09-16 05:40:39.232','20260915120000_add_tipo_cupo_solicitud_registro',NULL,NULL,'2026-09-16 05:40:39.121',1),
('37fce924-bf11-473a-83cb-6a7b51170152','de3cc2bb386627afe85fb2d1b8acad6fdd958fc4558f762d2c3c8c49f53294f8','2026-09-05 00:46:47.536','20260905004646_gr_solicitud_registro_campos_opcionales',NULL,NULL,'2026-09-05 00:46:47.120',1),
('3c258ba2-87d4-40ef-afc7-77921ed9194c','77e785714b66dfe8e3b4921a451b62b31fb1eb239a510cbf09f8d34c5c03bb02','2026-10-01 17:31:32.614','20261001170000_recurso_tipo_link_siss',NULL,NULL,'2026-10-01 17:31:32.570',1),
('3d85ec9a-d43e-4a2d-9c06-caab3a084170','4412a10f0be3fd2677459bcc5217488d3f06fb745fcab8218f4720ac1e233f68','2026-09-11 18:42:13.157','20260911184133_bitacora_unica_por_dia',NULL,NULL,'2026-09-11 18:42:13.030',1),
('3f62f38c-ff18-41c3-b0df-8f76412066a8','cd6eb23e16305e6f84174c2a27e77ef9b4cd8235a0bc05d61b05ba5ae076b31d','2026-09-28 17:02:33.025','20260916141219_oferta_siss_campos_opcionales',NULL,NULL,'2026-09-28 17:02:32.968',1),
('44c009af-62dd-455b-bd8d-d1004051c5ab','719592616ab619526b7281aef0838efb9f112e04dcbf51536f72482efbd68103','2026-09-03 18:53:11.530','20260903185311_add_caracteristicas_faltantes',NULL,NULL,'2026-09-03 18:53:11.453',1),
('4d501d43-6b69-4891-9fcc-05543efde680','a19be3d29b70f3881f4265f6cab9ac06c989993cdcc78a83eccd20234f5ef38e','2026-09-28 17:02:33.264','20260922175308_caracteristica_vigente_en_profesor',NULL,NULL,'2026-09-28 17:02:33.139',1),
('5b620869-7f85-424f-9013-6060928d4700','621b6fbe43a5aaa0e89fd50b65ad154dfb1b4fd5781fdabd0f8695c125893f32','2026-09-02 20:33:29.174','20260709205321_init',NULL,NULL,'2026-09-02 20:33:24.959',1),
('5d117b7f-1148-4a90-873e-703197a495a2','cd42702f33b33de389eeafceb567589f58dd960f41379bbc4c932314fe248a33','2026-09-03 19:00:27.278','20260903190027_unique_caracteristica_y_solicitud',NULL,NULL,'2026-09-03 19:00:27.154',1),
('61b18708-4ada-485b-aa10-1bbf1a5c4329','75218a0a707637c92e34694df4fa43c0eff21671fa6aa24a61bdbc81ba84e6fd','2026-09-03 05:22:11.056','20260903052210_add_rol_usuario_enum',NULL,NULL,'2026-09-03 05:22:10.999',1),
('76f0db35-d0c8-4501-b603-f5057af259c4','c1e6d3303b93117090e363fdf727a999876432a40c5d027fbaa47099e7c0bc4f','2026-10-01 18:26:08.558','20261001190000_recurso_tipo_link_seguro_social',NULL,NULL,'2026-10-01 18:26:08.535',1),
('810166f0-bc40-490e-8fec-df1a9b0fd261','2bfe811fc2f88d9c45827272e6c4c8bbaa37e11066c45819b5908bd2f39a3afe','2026-09-04 16:20:57.925','20260904162010_rename_fecha_hora_acceso',NULL,NULL,'2026-09-04 16:20:57.897',1),
('8ab21cdb-a9d9-4d58-9b51-f0e26fe285f6','93c168027514a838eb36b9d6b55bfb51efab6b33f29f50779dd56803be520fbb','2026-09-22 22:04:02.425','20260922220353_evaluacion_puntajes_factores','',NULL,'2026-09-22 22:04:02.425',0),
('8cfca2f7-2f83-4d64-a4c1-fa3dd2ffa4be','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',NULL,'20260911184125_bitacora_unica_por_dia','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260911184125_bitacora_unica_por_dia\n\nDatabase error code: 1065\n\nDatabase error:\nQuery was empty\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260911184125_bitacora_unica_por_dia\"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260911184125_bitacora_unica_por_dia\"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255','2026-09-11 18:42:06.493','2026-09-11 18:41:41.202',0),
('8f0d33fe-6d96-4034-ab22-5a5b3eae4d2f','78d0d5be746941c2f2af06bf6571f1aa5ca4384ce6c5b7123eef5808fed0c538','2026-09-07 20:28:38.792','20260907202838_solicitud_fecha_carta_compromiso',NULL,NULL,'2026-09-07 20:28:38.716',1),
('94ce0f1f-9439-4f48-982b-4ecc3e9b9c4a','094de3a2e4f3cbab601f60149cf8cc96c67edb6ef665f188e288be441ff67b6f','2026-09-29 22:32:06.586','20260929223155_recurso_tipo_enum_unico',NULL,NULL,'2026-09-29 22:32:06.512',1),
('a461e0ad-bc5c-4ddb-a103-fd79106f5514','1df3aae07f51045af8b4d8f8292b87de38cb318986182e91437360fc8d1b1ff4','2026-09-29 18:52:00.766','20260929185131_coordinador_id_ofertas_nullable_al_decidir',NULL,NULL,'2026-09-29 18:52:00.614',1),
('a79d14c2-6792-41fe-b487-e3982b3640e9','4210ae115e2334b88d8c5e086f8485a57bede9dea1ba8fbfa2159f58933c9446','2026-09-04 17:26:43.759','20260904172643_add_notificacion',NULL,NULL,'2026-09-04 17:26:43.714',1),
('b164597a-b90a-43cd-8a60-dcbcfec36410','44126c7c3fc513e01b1865d6e0f59a2de0213eea5eacd276d17fff12f4be78fe','2026-09-05 05:14:55.119','20260905051454_fix_estado_solicitud_nullability',NULL,NULL,'2026-09-05 05:14:55.054',1),
('b476941e-561a-4517-aaab-4f7d5a2be65b','b547234389a7dc4e19ddede80d16b4058edc55fcde000b32edde920b64624764','2026-09-05 15:37:01.710','20260905153701_usuario_rubrica_fecha_registro_opcional',NULL,NULL,'2026-09-05 15:37:01.629',1),
('bf1cfff9-4245-4a73-b273-bf0cb40307fd','365c2eed6f50dde0947fd53aebad171af1559673405093620d21b4cee6e9cbab','2026-09-28 17:02:33.300','20260922223546_solicitud_baja_resolucion',NULL,NULL,'2026-09-28 17:02:33.266',1),
('c3eeb5a2-290f-4f35-b197-1c81ebf30c19','b5d4d50566f84b56fdf8e541b48f9ee73f5786f1d25dd0f3245021221b108ac6','2026-09-05 16:28:21.201','20260905162350_alumno_creditos_decimal',NULL,NULL,'2026-09-05 16:28:21.162',1),
('c6b7878d-7cbc-4edb-bea1-a21375774cce','d26f63a07552db06c36934d0558c3db209f09765f5db80fcecc7e25b6a1bbca7','2026-09-28 17:02:33.079','20260918013339_drop_tipo_cupo_y_cupos_investigador',NULL,NULL,'2026-09-28 17:02:33.026',1),
('d5279e56-26f8-4742-a16c-a8c6b00684f3','d2c1bd1a93ef47ea7721767771ca008d5a426ca57b6256cb052d56e474d28bd8','2026-09-28 17:02:33.138','20260922110502_agregar_ruta_archivo_revisiones_reportes',NULL,NULL,'2026-09-28 17:02:33.104',1),
('ddfd54dd-7986-48ae-a90d-adc66147f26e','d0c0327e3bbaeaeff1702fe8fd86d436eee1617fa3775dd85d52455ad66b7d7e','2026-09-12 16:48:14.770','20260912164753_ultima_evaluacion_faltas','',NULL,'2026-09-12 16:48:14.770',0),
('e11c6805-c135-4548-87e5-9ebe7c8e457e','5dd56bae3038697255cefc86be03fdcfc7e31dccc2281c882510d0762bf6ab63','2026-09-22 23:07:26.966','20260922230718_evaluacion_documento_id_nullable','',NULL,'2026-09-22 23:07:26.966',0),
('f1dea4cb-60ce-4315-8c4c-5e994eee3ad9','4b2457a0537694523f496aaa53deefaddc21f9d8bdb7dea515b574577d4fd8b3','2026-09-07 05:00:47.437','20260907045936_oferta_programa_siss',NULL,NULL,'2026-09-07 05:00:47.366',1),
('f78d027f-d23e-46b0-a6ba-5430e2fd16de','2ccf60d8c07f65e04ce979d2d379dbe097c5a70ce706eda78e9d2d4e253af3e7','2026-09-28 17:02:33.103','20260920190000_reporte_mensual_snapshot_dias_horas',NULL,NULL,'2026-09-28 17:02:33.081',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actividad`
--

DROP TABLE IF EXISTS `actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_registro_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `entregable_esperado` text NOT NULL,
  `fecha_limite` date NOT NULL,
  `estado` varchar(20) NOT NULL,
  `fecha_asignacion` datetime NOT NULL,
  `porcentaje_progreso` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `fecha_completada` datetime DEFAULT NULL,
  `fecha_limite_original` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `actividad_solicitud_registro_id_fkey` (`solicitud_registro_id`),
  CONSTRAINT `actividad_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad`
--

LOCK TABLES `actividad` WRITE;
/*!40000 ALTER TABLE `actividad` DISABLE KEYS */;
/*!40000 ALTER TABLE `actividad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumno`
--

DROP TABLE IF EXISTS `alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno` (
  `boleta` char(10) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `celular` varchar(10) NOT NULL,
  `carrera` varchar(3) NOT NULL,
  `creditos` decimal(5,2) NOT NULL,
  `semestre` tinyint(3) unsigned NOT NULL,
  `correo_personal` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`boleta`),
  UNIQUE KEY `alumno_usuario_id_key` (`usuario_id`),
  CONSTRAINT `alumno_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno`
--

LOCK TABLES `alumno` WRITE;
/*!40000 ALTER TABLE `alumno` DISABLE KEYS */;
INSERT INTO `alumno` VALUES
('2021630001',4,'5598765432','ISC',90.00,8,'daniela.mendoza.personal@gmail.com');
/*!40000 ALTER TABLE `alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anuncio`
--

DROP TABLE IF EXISTS `anuncio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `anuncio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_publicacion` datetime NOT NULL,
  `origen` enum('coordinador','profesor') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `anuncio_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `anuncio_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anuncio`
--

LOCK TABLES `anuncio` WRITE;
/*!40000 ALTER TABLE `anuncio` DISABLE KEYS */;
/*!40000 ALTER TABLE `anuncio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_registro_id` int(11) NOT NULL,
  `hora_inicio` datetime NOT NULL,
  `hora_fin` datetime DEFAULT NULL,
  `horas_contabilizadas` tinyint(3) unsigned DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  `fecha_registro` date NOT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `fecha_revision` datetime DEFAULT NULL,
  `revisado_por_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bitacora_solicitud_registro_id_fecha_registro_key` (`solicitud_registro_id`,`fecha_registro`),
  KEY `bitacora_revisado_por_id_fkey` (`revisado_por_id`),
  CONSTRAINT `bitacora_revisado_por_id_fkey` FOREIGN KEY (`revisado_por_id`) REFERENCES `profesor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `bitacora_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caracteristica`
--

DROP TABLE IF EXISTS `caracteristica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `caracteristica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` enum('Presidente de academia','Coordinador','Jefe de departamento','Investigador','Funcionario','Profesor coordinador de clubes') NOT NULL,
  `incremento_cupos` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `caracteristica_nombre_key` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caracteristica`
--

LOCK TABLES `caracteristica` WRITE;
/*!40000 ALTER TABLE `caracteristica` DISABLE KEYS */;
INSERT INTO `caracteristica` VALUES
(1,'Investigador',1),
(2,'Presidente de academia',2),
(3,'Coordinador',2),
(4,'Jefe de departamento',3),
(5,'Funcionario',3),
(6,'Profesor coordinador de clubes',3);
/*!40000 ALTER TABLE `caracteristica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carrera`
--

DROP TABLE IF EXISTS `carrera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrera` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrera`
--

LOCK TABLES `carrera` WRITE;
/*!40000 ALTER TABLE `carrera` DISABLE KEYS */;
INSERT INTO `carrera` VALUES
(1,'ISC'),
(2,'IA'),
(3,'LCD');
/*!40000 ALTER TABLE `carrera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carta_termino`
--

DROP TABLE IF EXISTS `carta_termino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carta_termino` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liberacion_proceso_id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `carta_recogida` tinyint(1) NOT NULL,
  `fecha_disponible` datetime DEFAULT NULL,
  `fecha_recogida` datetime DEFAULT NULL,
  `fecha_solicitud` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carta_termino_liberacion_proceso_id_key` (`liberacion_proceso_id`),
  CONSTRAINT `carta_termino_liberacion_proceso_id_fkey` FOREIGN KEY (`liberacion_proceso_id`) REFERENCES `liberacion_proceso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carta_termino`
--

LOCK TABLES `carta_termino` WRITE;
/*!40000 ALTER TABLE `carta_termino` DISABLE KEYS */;
/*!40000 ALTER TABLE `carta_termino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacto_institucional`
--

DROP TABLE IF EXISTS `contacto_institucional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacto_institucional` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coordinador_id` int(11) NOT NULL,
  `tipo` enum('correo','telefono','ubicacion','horario') NOT NULL,
  `valor` varchar(255) NOT NULL,
  `fecha_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contacto_institucional_coordinador_id_fkey` (`coordinador_id`),
  CONSTRAINT `contacto_institucional_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacto_institucional`
--

LOCK TABLES `contacto_institucional` WRITE;
/*!40000 ALTER TABLE `contacto_institucional` DISABLE KEYS */;
INSERT INTO `contacto_institucional` VALUES
(1,1,'correo','servicio_social_escom@ipn.mx','2026-11-09 02:13:10'),
(2,1,'telefono','5557296000 ext. 52056','2026-11-09 02:13:10'),
(3,1,'ubicacion','En edificio central de la ESCOM, subiendo las escaleras del lado derecho','2026-11-09 02:13:10'),
(4,1,'horario','Lunes a viernes de 9:00 a 15:00 y de 17:00 a 20:00 horas','2026-11-09 02:13:10');
/*!40000 ALTER TABLE `contacto_institucional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coordinador`
--

DROP TABLE IF EXISTS `coordinador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `coordinador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coordinador_usuario_id_key` (`usuario_id`),
  CONSTRAINT `coordinador_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coordinador`
--

LOCK TABLES `coordinador` WRITE;
/*!40000 ALTER TABLE `coordinador` DISABLE KEYS */;
INSERT INTO `coordinador` VALUES
(1,1),
(2,2);
/*!40000 ALTER TABLE `coordinador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cumulo_horas_y_faltas`
--

DROP TABLE IF EXISTS `cumulo_horas_y_faltas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cumulo_horas_y_faltas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` char(10) NOT NULL,
  `horas_acumuladas` smallint(5) unsigned NOT NULL DEFAULT 0,
  `horas_rechazadas` smallint(5) unsigned NOT NULL DEFAULT 0,
  `faltas_acumuladas` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `faltas_consecutivas` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `fecha_ultima_evaluacion_faltas` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cumulo_horas_y_faltas_alumno_id_key` (`alumno_id`),
  CONSTRAINT `cumulo_horas_y_faltas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`boleta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cumulo_horas_y_faltas`
--

LOCK TABLES `cumulo_horas_y_faltas` WRITE;
/*!40000 ALTER TABLE `cumulo_horas_y_faltas` DISABLE KEYS */;
/*!40000 ALTER TABLE `cumulo_horas_y_faltas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deseo_de_carrera`
--

DROP TABLE IF EXISTS `deseo_de_carrera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deseo_de_carrera` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `oferta_id` int(11) NOT NULL,
  `carrera_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deseo_de_carrera_oferta_id_carrera_id_key` (`oferta_id`,`carrera_id`),
  KEY `deseo_de_carrera_carrera_id_fkey` (`carrera_id`),
  CONSTRAINT `deseo_de_carrera_carrera_id_fkey` FOREIGN KEY (`carrera_id`) REFERENCES `carrera` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `deseo_de_carrera_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deseo_de_carrera`
--

LOCK TABLES `deseo_de_carrera` WRITE;
/*!40000 ALTER TABLE `deseo_de_carrera` DISABLE KEYS */;
INSERT INTO `deseo_de_carrera` VALUES
(1,1,1);
/*!40000 ALTER TABLE `deseo_de_carrera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documento`
--

DROP TABLE IF EXISTS `documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` char(10) NOT NULL,
  `creador_id` int(11) NOT NULL,
  `tipo_documento` varchar(50) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado_documento` varchar(20) NOT NULL,
  `ruta_archivo` varchar(255) NOT NULL,
  `aprobado_por_id` int(11) DEFAULT NULL,
  `nombre_expediente` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documento_alumno_id_fkey` (`alumno_id`),
  KEY `documento_creador_id_fkey` (`creador_id`),
  KEY `documento_aprobado_por_id_fkey` (`aprobado_por_id`),
  CONSTRAINT `documento_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`boleta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `documento_aprobado_por_id_fkey` FOREIGN KEY (`aprobado_por_id`) REFERENCES `coordinador` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `documento_creador_id_fkey` FOREIGN KEY (`creador_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documento`
--

LOCK TABLES `documento` WRITE;
/*!40000 ALTER TABLE `documento` DISABLE KEYS */;
INSERT INTO `documento` VALUES
(1,'2021630001',4,'carta_creditos','2026-11-09 02:13:34','aprobado','2021630001/eb21d2b9-dbcc-4528-8449-50e2d30c03a3.pdf',1,'2021630001_CARTA_CREDITOS.pdf'),
(2,'2021630001',4,'constancia_seguro_social','2026-11-09 02:13:34','aprobado','2021630001/b8d80be6-4251-4401-a6ca-01449ecde9ee.pdf',1,'2021630001_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(3,'2021630001',4,'expediente','2026-11-09 02:13:55','en_revision','2021630001/6b6cdb8f-2023-4a0d-b7e3-1e824f60a1bd.pdf',NULL,'MENDOZA_CRUZ_DANIELA_2021630001.pdf');
/*!40000 ALTER TABLE `documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluacion_desempeno`
--

DROP TABLE IF EXISTS `evaluacion_desempeno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_desempeno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `documento_id` int(11) DEFAULT NULL,
  `liberacion_proceso_id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `observaciones_profesor` text DEFAULT NULL,
  `reportes_siss_confirmados` tinyint(1) NOT NULL,
  `fecha_evaluacion` datetime DEFAULT NULL,
  `motivo_rechazo_coordinacion` text DEFAULT NULL,
  `puntajes_factores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`puntajes_factores`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `evaluacion_desempeno_liberacion_proceso_id_key` (`liberacion_proceso_id`),
  UNIQUE KEY `evaluacion_desempeno_documento_id_key` (`documento_id`),
  CONSTRAINT `evaluacion_desempeno_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `evaluacion_desempeno_liberacion_proceso_id_fkey` FOREIGN KEY (`liberacion_proceso_id`) REFERENCES `liberacion_proceso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_desempeno`
--

LOCK TABLES `evaluacion_desempeno` WRITE;
/*!40000 ALTER TABLE `evaluacion_desempeno` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluacion_desempeno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento_calendario`
--

DROP TABLE IF EXISTS `evento_calendario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_calendario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coordinador_id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `tipo` enum('Vacacional','Inhabil','Periodo') NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evento_calendario_coordinador_id_fkey` (`coordinador_id`),
  CONSTRAINT `evento_calendario_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_calendario`
--

LOCK TABLES `evento_calendario` WRITE;
/*!40000 ALTER TABLE `evento_calendario` DISABLE KEYS */;
INSERT INTO `evento_calendario` VALUES
(1,1,'Año Nuevo','Inhabil','2026-01-01',NULL,NULL),
(2,1,'Día de la Constitución','Inhabil','2026-02-02',NULL,NULL),
(3,1,'5 de mayo','Inhabil','2026-05-05',NULL,NULL),
(4,1,'Natalicio de Benito Juárez','Inhabil','2026-03-16',NULL,NULL),
(5,1,'Día del Trabajo','Inhabil','2026-05-01',NULL,NULL),
(6,1,'Día de la Independencia','Inhabil','2026-09-16',NULL,NULL),
(7,1,'Día de la Revolución Mexicana','Inhabil','2026-11-16',NULL,NULL),
(8,1,'Navidad','Inhabil','2026-12-25',NULL,NULL),
(9,1,'Año Nuevo','Inhabil','2027-01-01',NULL,NULL),
(10,1,'Día de la Constitución','Inhabil','2027-02-01',NULL,NULL),
(11,1,'5 de mayo','Inhabil','2027-05-05',NULL,NULL),
(12,1,'Natalicio de Benito Juárez','Inhabil','2027-03-15',NULL,NULL),
(13,1,'Día de la Independencia','Inhabil','2027-09-16',NULL,NULL),
(14,1,'Día de la Revolución Mexicana','Inhabil','2027-11-15',NULL,NULL),
(15,1,'Cierre administrativo parcial','Inhabil','2026-10-08',NULL,'14:00:00'),
(16,1,'Cierre administrativo parcial','Inhabil','2026-10-22',NULL,'12:00:00'),
(17,1,'Periodo vacacional de invierno (cont. 2025)','Vacacional','2026-01-01','2026-01-26',NULL),
(18,1,'Periodo vacacional de primavera','Vacacional','2026-03-20','2026-04-02',NULL),
(19,1,'Periodo vacacional de verano','Vacacional','2026-08-03','2026-08-21',NULL),
(20,1,'Periodo vacacional de invierno','Vacacional','2026-12-21','2027-01-22',NULL),
(21,1,'Servicio Social 2026-1 (inicio 01/10/2025)','Periodo','2025-10-01','2026-04-30',NULL),
(22,1,'Servicio Social 2026-1 (inicio 16/10/2025)','Periodo','2025-10-16','2026-05-14',NULL),
(23,1,'Servicio Social 2026-1 (inicio 03/11/2025)','Periodo','2025-11-03','2026-06-03',NULL),
(24,1,'Servicio Social 2026-1 (inicio 18/11/2025)','Periodo','2025-11-18','2026-06-18',NULL),
(25,1,'Servicio Social 2026-1 (inicio 01/12/2025)','Periodo','2025-12-01','2026-07-01',NULL),
(26,1,'Servicio Social 2026-1 (inicio 16/12/2025)','Periodo','2025-12-16','2026-07-16',NULL),
(27,1,'Servicio Social 2026-1 (inicio 05/01/2026)','Periodo','2026-01-05','2026-07-17',NULL),
(28,1,'Servicio Social 2026-1 (inicio 16/01/2026)','Periodo','2026-01-16','2026-08-14',NULL),
(29,1,'Servicio Social 2026-2 (inicio 03/02/2026)','Periodo','2026-02-03','2026-09-03',NULL),
(30,1,'Servicio Social 2026-2 (inicio 02/03/2026)','Periodo','2026-03-02','2026-10-02',NULL),
(31,1,'Servicio Social 2026-2 (inicio 17/03/2026)','Periodo','2026-03-17','2026-10-16',NULL),
(32,1,'Servicio Social 2026-2 (inicio 16/04/2026)','Periodo','2026-04-16','2026-11-16',NULL),
(33,1,'Servicio Social 2026-2 (inicio 04/05/2026)','Periodo','2026-05-04','2026-12-04',NULL),
(34,1,'Servicio Social 2026-2 (inicio 18/05/2026)','Periodo','2026-05-18','2026-12-18',NULL),
(35,1,'Servicio Social 2026-2 (inicio 01/06/2026)','Periodo','2026-06-01','2027-01-01',NULL),
(36,1,'Servicio Social 2026-2 (inicio 16/06/2026)','Periodo','2026-06-16','2027-01-15',NULL),
(37,1,'Servicio Social 2026-2 (inicio 01/07/2026)','Periodo','2026-07-01','2027-02-01',NULL),
(38,1,'Servicio Social 2026-2 (inicio 16/07/2026)','Periodo','2026-07-16','2027-02-16',NULL),
(39,1,'Servicio Social 2027-1 (inicio 17/08/2026)','Periodo','2026-08-17','2027-03-17',NULL),
(40,1,'Servicio Social 2027-1 (inicio 01/10/2026)','Periodo','2026-10-01','2027-04-30',NULL),
(41,1,'Servicio Social 2027-1 (inicio 16/10/2026)','Periodo','2026-10-16','2027-05-14',NULL),
(42,1,'Servicio Social 2027-1 (inicio 03/11/2026)','Periodo','2026-11-03','2027-06-03',NULL),
(43,1,'Servicio Social 2027-1 (inicio 18/11/2026)','Periodo','2026-11-18','2027-06-18',NULL),
(44,1,'Servicio Social 2027-1 (inicio 01/12/2026)','Periodo','2026-12-01','2027-07-01',NULL),
(45,1,'Servicio Social 2027-1 (inicio 16/12/2026)','Periodo','2026-12-16','2027-07-16',NULL),
(46,1,'Servicio Social 2027-1 (inicio 05/01/2027)','Periodo','2027-01-05','2027-07-19',NULL),
(47,1,'Servicio Social 2027-1 (inicio 18/01/2027)','Periodo','2027-01-18','2027-08-16',NULL),
(48,1,'Servicio Social 2027-2 (inicio 03/02/2027)','Periodo','2027-02-03','2027-09-03',NULL),
(49,1,'Servicio Social 2027-2 (inicio 02/03/2027)','Periodo','2027-03-02','2027-10-04',NULL),
(50,1,'Servicio Social 2027-2 (inicio 17/03/2027)','Periodo','2027-03-17','2027-10-18',NULL),
(51,1,'Servicio Social 2027-2 (inicio 16/04/2027)','Periodo','2027-04-16','2027-11-16',NULL),
(52,1,'Servicio Social 2027-2 (inicio 04/05/2027)','Periodo','2027-05-04','2027-12-06',NULL),
(53,1,'Servicio Social 2027-2 (inicio 18/05/2027)','Periodo','2027-05-18','2027-12-20',NULL),
(54,1,'Servicio Social 2027-2 (inicio 01/06/2027)','Periodo','2027-06-01','2028-01-03',NULL),
(55,1,'Servicio Social 2027-2 (inicio 16/06/2027)','Periodo','2027-06-16','2028-01-17',NULL),
(56,1,'Servicio Social 2027-2 (inicio 01/07/2027)','Periodo','2027-07-01','2028-02-01',NULL),
(57,1,'Servicio Social 2027-2 (inicio 16/07/2027)','Periodo','2027-07-16','2028-02-16',NULL),
(58,1,'Servicio Social 2028-1 (inicio 17/08/2027)','Periodo','2027-08-17','2028-03-17',NULL),
(59,1,'Servicio Social — Video tutorial','Periodo','2026-11-24','2027-06-24',NULL);
/*!40000 ALTER TABLE `evento_calendario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inicio_sesion`
--

DROP TABLE IF EXISTS `inicio_sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inicio_sesion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `fecha_hora_acceso` datetime NOT NULL,
  `ip_acceso` varchar(45) NOT NULL,
  `resultado` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `inicio_sesion_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `inicio_sesion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inicio_sesion`
--

LOCK TABLES `inicio_sesion` WRITE;
/*!40000 ALTER TABLE `inicio_sesion` DISABLE KEYS */;
/*!40000 ALTER TABLE `inicio_sesion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `liberacion_proceso`
--

DROP TABLE IF EXISTS `liberacion_proceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `liberacion_proceso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_registro_id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `reportes_validados_siss` tinyint(1) NOT NULL,
  `evaluacion_subida_siss` tinyint(1) DEFAULT NULL,
  `evaluacion_descargada` tinyint(1) DEFAULT NULL,
  `carta_termino_recogida` tinyint(1) DEFAULT NULL,
  `expediente_enviado` tinyint(1) DEFAULT NULL,
  `observaciones_rechazo` text DEFAULT NULL,
  `mensaje_constancia_termino` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `liberacion_proceso_solicitud_registro_id_key` (`solicitud_registro_id`),
  CONSTRAINT `liberacion_proceso_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `liberacion_proceso`
--

LOCK TABLES `liberacion_proceso` WRITE;
/*!40000 ALTER TABLE `liberacion_proceso` DISABLE KEYS */;
/*!40000 ALTER TABLE `liberacion_proceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `mensaje` text NOT NULL,
  `ruta_relacionada` varchar(255) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` datetime NOT NULL,
  `fecha_leida` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notificacion_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `notificacion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oferta_servicio`
--

DROP TABLE IF EXISTS `oferta_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oferta_servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesor_id` int(11) NOT NULL,
  `coordinador_id` int(11) DEFAULT NULL,
  `nombre_SISS` varchar(100) DEFAULT NULL,
  `nombre_proyecto` varchar(150) NOT NULL,
  `tipo_oferta` enum('individual','proyecto') NOT NULL,
  `descripcion_actividades` text NOT NULL,
  `cupos_ofertados` tinyint(3) unsigned DEFAULT NULL,
  `cupos_disponibles` tinyint(3) unsigned NOT NULL,
  `estado_oferta` varchar(20) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `programa_SISS` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oferta_servicio_profesor_id_fkey` (`profesor_id`),
  KEY `oferta_servicio_coordinador_id_fkey` (`coordinador_id`),
  CONSTRAINT `oferta_servicio_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `oferta_servicio_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oferta_servicio`
--

LOCK TABLES `oferta_servicio` WRITE;
/*!40000 ALTER TABLE `oferta_servicio` DISABLE KEYS */;
INSERT INTO `oferta_servicio` VALUES
(1,1,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Desarrollo de sistema de seguimiento academico','individual','El alumno apoyara en el desarrollo y mantenimiento de un sistema interno de seguimiento academico, incluyendo captura de datos, generacion de reportes y pruebas funcionales.',NULL,0,'aprobada','2026-11-09 02:13:12',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL');
/*!40000 ALTER TABLE `oferta_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodo_registro`
--

DROP TABLE IF EXISTS `periodo_registro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodo_registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evento_calendario_id` int(11) NOT NULL,
  `anio` char(4) NOT NULL,
  `semestre` enum('01','02') NOT NULL,
  `fecha_max_expediente` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `periodo_registro_evento_calendario_id_key` (`evento_calendario_id`),
  CONSTRAINT `periodo_registro_evento_calendario_id_fkey` FOREIGN KEY (`evento_calendario_id`) REFERENCES `evento_calendario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodo_registro`
--

LOCK TABLES `periodo_registro` WRITE;
/*!40000 ALTER TABLE `periodo_registro` DISABLE KEYS */;
INSERT INTO `periodo_registro` VALUES
(1,21,'2026','01','2025-09-17'),
(2,22,'2026','01','2025-10-01'),
(3,23,'2026','01','2025-10-15'),
(4,24,'2026','01','2025-11-03'),
(5,25,'2026','01','2025-11-18'),
(6,26,'2026','01','2025-12-01'),
(7,27,'2026','01','2025-12-12'),
(8,28,'2026','01','2026-01-06'),
(9,29,'2026','02','2026-01-19'),
(10,30,'2026','02','2026-02-16'),
(11,31,'2026','02','2026-03-06'),
(12,32,'2026','02','2026-03-24'),
(13,33,'2026','02','2026-04-24'),
(14,34,'2026','02','2026-05-07'),
(15,35,'2026','02','2026-05-18'),
(16,36,'2026','02','2026-06-02'),
(17,37,'2026','02','2026-06-23'),
(18,38,'2026','02','2026-07-03'),
(19,39,'2027','01','2026-07-15'),
(20,40,'2027','01','2026-09-17'),
(21,41,'2027','01','2026-10-01'),
(22,42,'2027','01','2026-10-15'),
(23,43,'2027','01','2026-11-03'),
(24,44,'2027','01','2026-11-18'),
(25,45,'2027','01','2026-12-01'),
(26,46,'2027','01','2026-12-14'),
(27,47,'2027','01','2027-01-06'),
(28,48,'2027','02','2027-01-19'),
(29,49,'2027','02','2027-02-16'),
(30,50,'2027','02','2027-03-08'),
(31,51,'2027','02','2027-03-24'),
(32,52,'2027','02','2027-04-26'),
(33,53,'2027','02','2027-05-07'),
(34,54,'2027','02','2027-05-18'),
(35,55,'2027','02','2027-06-02'),
(36,56,'2027','02','2027-06-23'),
(37,57,'2027','02','2027-07-05'),
(38,58,'2028','01','2027-07-15'),
(39,59,'2027','01','2026-11-09');
/*!40000 ALTER TABLE `periodo_registro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesor`
--

DROP TABLE IF EXISTS `profesor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `departamento` varchar(100) NOT NULL,
  `telefono_personal` varchar(10) NOT NULL,
  `horario_atencion` varchar(100) NOT NULL,
  `cubiculo` varchar(100) NOT NULL,
  `cupos_totales` tinyint(3) unsigned NOT NULL,
  `caracteristica_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profesor_usuario_id_key` (`usuario_id`),
  KEY `profesor_caracteristica_id_fkey` (`caracteristica_id`),
  CONSTRAINT `profesor_caracteristica_id_fkey` FOREIGN KEY (`caracteristica_id`) REFERENCES `caracteristica` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `profesor_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesor`
--

LOCK TABLES `profesor` WRITE;
/*!40000 ALTER TABLE `profesor` DISABLE KEYS */;
INSERT INTO `profesor` VALUES
(1,3,'Sistemas Computacionales','5587451236','Lunes a viernes 10:00-12:00','ESCOM-204',3,NULL);
/*!40000 ALTER TABLE `profesor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurso`
--

DROP TABLE IF EXISTS `recurso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coordinador_id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `url` varchar(500) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `tipo` enum('link_constancia_creditos','link_siss','link_seguro_social') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recurso_tipo_key` (`tipo`),
  KEY `recurso_coordinador_id_fkey` (`coordinador_id`),
  CONSTRAINT `recurso_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurso`
--

LOCK TABLES `recurso` WRITE;
/*!40000 ALTER TABLE `recurso` DISABLE KEYS */;
INSERT INTO `recurso` VALUES
(1,1,'Constancia de creditos IPN','https://forms.cloud.microsoft/pages/responsepage.aspx?id=2fRL-ZeAlEet9qVGbKKFY-JLdN8w-KlBnYjodQmtWMpUQVNQMjdMQVFGNkY3RzdZVUZZUFlVTTVBWi4u&route=shorturl','2026-11-09 02:13:10',NULL,'link_constancia_creditos'),
(2,1,'Plataforma SISS del IPN','https://serviciosocial.ipn.mx/','2026-11-09 02:13:10',NULL,'link_siss'),
(3,1,'Constancia de vigencia del seguro social IMSS','https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/vigencia','2026-11-09 02:13:10',NULL,'link_seguro_social');
/*!40000 ALTER TABLE `recurso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_anuncio_visto`
--

DROP TABLE IF EXISTS `registro_anuncio_visto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `registro_anuncio_visto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` char(10) NOT NULL,
  `anuncio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registro_anuncio_visto_alumno_id_anuncio_id_key` (`alumno_id`,`anuncio_id`),
  KEY `registro_anuncio_visto_anuncio_id_fkey` (`anuncio_id`),
  CONSTRAINT `registro_anuncio_visto_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`boleta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registro_anuncio_visto_anuncio_id_fkey` FOREIGN KEY (`anuncio_id`) REFERENCES `anuncio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_anuncio_visto`
--

LOCK TABLES `registro_anuncio_visto` WRITE;
/*!40000 ALTER TABLE `registro_anuncio_visto` DISABLE KEYS */;
/*!40000 ALTER TABLE `registro_anuncio_visto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_bitacora_actividades`
--

DROP TABLE IF EXISTS `registro_bitacora_actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `registro_bitacora_actividades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` int(11) NOT NULL,
  `actividad_id` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `porcentaje_avance_registrado` tinyint(3) unsigned NOT NULL,
  `evidencia` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registro_bitacora_actividades_bitacora_id_actividad_id_key` (`bitacora_id`,`actividad_id`),
  KEY `registro_bitacora_actividades_actividad_id_fkey` (`actividad_id`),
  CONSTRAINT `registro_bitacora_actividades_actividad_id_fkey` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registro_bitacora_actividades_bitacora_id_fkey` FOREIGN KEY (`bitacora_id`) REFERENCES `bitacora` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_bitacora_actividades`
--

LOCK TABLES `registro_bitacora_actividades` WRITE;
/*!40000 ALTER TABLE `registro_bitacora_actividades` DISABLE KEYS */;
/*!40000 ALTER TABLE `registro_bitacora_actividades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporte_global`
--

DROP TABLE IF EXISTS `reporte_global`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte_global` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_registro_id` int(11) NOT NULL,
  `documento_id` int(11) NOT NULL,
  `actividades_resumen` text NOT NULL,
  `estado_reporte` varchar(35) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reporte_global_documento_id_key` (`documento_id`),
  KEY `reporte_global_solicitud_registro_id_fkey` (`solicitud_registro_id`),
  CONSTRAINT `reporte_global_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reporte_global_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_global`
--

LOCK TABLES `reporte_global` WRITE;
/*!40000 ALTER TABLE `reporte_global` DISABLE KEYS */;
/*!40000 ALTER TABLE `reporte_global` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporte_mensual`
--

DROP TABLE IF EXISTS `reporte_mensual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte_mensual` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_registro_id` int(11) NOT NULL,
  `documento_id` int(11) NOT NULL,
  `num_reporte` tinyint(3) unsigned NOT NULL,
  `actividades_mes` text NOT NULL,
  `estado_reporte` varchar(35) NOT NULL,
  `dias_laborados` tinyint(3) unsigned NOT NULL,
  `horas_reportadas` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reporte_mensual_documento_id_key` (`documento_id`),
  KEY `reporte_mensual_solicitud_registro_id_fkey` (`solicitud_registro_id`),
  CONSTRAINT `reporte_mensual_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reporte_mensual_solicitud_registro_id_fkey` FOREIGN KEY (`solicitud_registro_id`) REFERENCES `solicitud_registro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_mensual`
--

LOCK TABLES `reporte_mensual` WRITE;
/*!40000 ALTER TABLE `reporte_mensual` DISABLE KEYS */;
/*!40000 ALTER TABLE `reporte_mensual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_desempeno`
--

DROP TABLE IF EXISTS `revision_desempeno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `revision_desempeno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluacion_desempeno_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_revisor` varchar(20) NOT NULL,
  `estado` varchar(20) NOT NULL,
  `comentario` text DEFAULT NULL,
  `hash_documento` varchar(64) DEFAULT NULL,
  `ip_firma` varchar(45) DEFAULT NULL,
  `token_tsa` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `revision_desempeno_evaluacion_desempeno_id_fkey` (`evaluacion_desempeno_id`),
  KEY `revision_desempeno_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `revision_desempeno_evaluacion_desempeno_id_fkey` FOREIGN KEY (`evaluacion_desempeno_id`) REFERENCES `evaluacion_desempeno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `revision_desempeno_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_desempeno`
--

LOCK TABLES `revision_desempeno` WRITE;
/*!40000 ALTER TABLE `revision_desempeno` DISABLE KEYS */;
/*!40000 ALTER TABLE `revision_desempeno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_reporte_global`
--

DROP TABLE IF EXISTS `revision_reporte_global`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `revision_reporte_global` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporte_global_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_revisor` enum('alumno','profesor','coordinador') NOT NULL,
  `estado` enum('aprobado','rechazado') NOT NULL,
  `comentario` text DEFAULT NULL,
  `hash_documento` varchar(64) DEFAULT NULL,
  `ip_firma` varchar(45) DEFAULT NULL,
  `token_tsa` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `ruta_archivo` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `revision_reporte_global_reporte_global_id_fkey` (`reporte_global_id`),
  KEY `revision_reporte_global_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `revision_reporte_global_reporte_global_id_fkey` FOREIGN KEY (`reporte_global_id`) REFERENCES `reporte_global` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `revision_reporte_global_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_global`
--

LOCK TABLES `revision_reporte_global` WRITE;
/*!40000 ALTER TABLE `revision_reporte_global` DISABLE KEYS */;
/*!40000 ALTER TABLE `revision_reporte_global` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_reporte_mensual`
--

DROP TABLE IF EXISTS `revision_reporte_mensual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `revision_reporte_mensual` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporte_mensual_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_revisor` enum('alumno','profesor','coordinador') NOT NULL,
  `estado` enum('aprobado','rechazado') NOT NULL,
  `comentario` text DEFAULT NULL,
  `hash_documento` varchar(64) DEFAULT NULL,
  `ip_firma` varchar(45) DEFAULT NULL,
  `token_tsa` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `ruta_archivo` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `revision_reporte_mensual_reporte_mensual_id_fkey` (`reporte_mensual_id`),
  KEY `revision_reporte_mensual_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `revision_reporte_mensual_reporte_mensual_id_fkey` FOREIGN KEY (`reporte_mensual_id`) REFERENCES `reporte_mensual` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `revision_reporte_mensual_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_mensual`
--

LOCK TABLES `revision_reporte_mensual` WRITE;
/*!40000 ALTER TABLE `revision_reporte_mensual` DISABLE KEYS */;
/*!40000 ALTER TABLE `revision_reporte_mensual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_baja`
--

DROP TABLE IF EXISTS `solicitud_baja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_baja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` char(10) NOT NULL,
  `solicitante_id` int(11) NOT NULL,
  `coordinador_id` int(11) DEFAULT NULL,
  `documento_id` int(11) DEFAULT NULL,
  `estado` varchar(12) NOT NULL,
  `motivo` text NOT NULL,
  `fecha` datetime NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitud_baja_alumno_id_fkey` (`alumno_id`),
  KEY `solicitud_baja_solicitante_id_fkey` (`solicitante_id`),
  KEY `solicitud_baja_coordinador_id_fkey` (`coordinador_id`),
  KEY `solicitud_baja_documento_id_fkey` (`documento_id`),
  CONSTRAINT `solicitud_baja_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`boleta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_baja_coordinador_id_fkey` FOREIGN KEY (`coordinador_id`) REFERENCES `coordinador` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_baja_documento_id_fkey` FOREIGN KEY (`documento_id`) REFERENCES `documento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `solicitud_baja_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_baja`
--

LOCK TABLES `solicitud_baja` WRITE;
/*!40000 ALTER TABLE `solicitud_baja` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud_baja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_caracteristica`
--

DROP TABLE IF EXISTS `solicitud_caracteristica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_caracteristica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesor_id` int(11) NOT NULL,
  `caracteristica_id` int(11) DEFAULT NULL,
  `justificacion` text NOT NULL,
  `estado` varchar(30) NOT NULL,
  `fecha` datetime NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitud_caracteristica_caracteristica_id_fkey` (`caracteristica_id`),
  KEY `solicitud_caracteristica_profesor_id_idx` (`profesor_id`),
  CONSTRAINT `solicitud_caracteristica_caracteristica_id_fkey` FOREIGN KEY (`caracteristica_id`) REFERENCES `caracteristica` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_caracteristica_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `profesor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_caracteristica`
--

LOCK TABLES `solicitud_caracteristica` WRITE;
/*!40000 ALTER TABLE `solicitud_caracteristica` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud_caracteristica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_registro`
--

DROP TABLE IF EXISTS `solicitud_registro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` char(10) NOT NULL,
  `carrera_id` int(11) NOT NULL,
  `dictamen` tinyint(3) unsigned DEFAULT NULL,
  `periodo_registro_id` int(11) DEFAULT NULL,
  `oferta_id` int(11) DEFAULT NULL,
  `motivacion_oferta` text DEFAULT NULL,
  `estado_solicitud` varchar(50) NOT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `fecha_aplicacion` datetime NOT NULL,
  `tipo_rechazo` varchar(50) DEFAULT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `registro_siss` tinyint(1) NOT NULL DEFAULT 0,
  `docs_iniciales` tinyint(1) NOT NULL DEFAULT 0,
  `carta_compromiso` tinyint(1) NOT NULL DEFAULT 0,
  `expediente` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_carta_compromiso` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitud_registro_alumno_id_key` (`alumno_id`),
  KEY `solicitud_registro_carrera_id_fkey` (`carrera_id`),
  KEY `solicitud_registro_periodo_registro_id_fkey` (`periodo_registro_id`),
  KEY `solicitud_registro_oferta_id_fkey` (`oferta_id`),
  CONSTRAINT `solicitud_registro_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`boleta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_registro_carrera_id_fkey` FOREIGN KEY (`carrera_id`) REFERENCES `carrera` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_registro_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `oferta_servicio` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `solicitud_registro_periodo_registro_id_fkey` FOREIGN KEY (`periodo_registro_id`) REFERENCES `periodo_registro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_registro`
--

LOCK TABLES `solicitud_registro` WRITE;
/*!40000 ALTER TABLE `solicitud_registro` DISABLE KEYS */;
INSERT INTO `solicitud_registro` VALUES
(1,'2021630001',1,NULL,39,1,'Soy muy buena programando y me gustaría hacer mi servicio social aquí, ya casi acabo mi carrera así que siento que podría aportar mucho en este proyecto de seguimiento académico.','expediente_pendiente_revision','adjuntar_expediente','2026-11-09 02:13:21',NULL,NULL,1,1,1,1,'2026-11-09 02:13:55');
/*!40000 ALTER TABLE `solicitud_registro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_contrasena`
--

DROP TABLE IF EXISTS `token_contrasena`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_contrasena` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `token_contrasena_usuario_id_fkey` (`usuario_id`),
  CONSTRAINT `token_contrasena_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_contrasena`
--

LOCK TABLES `token_contrasena` WRITE;
/*!40000 ALTER TABLE `token_contrasena` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_contrasena` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol` enum('alumno_sin_asignar','alumno_asignado','profesor','coordinador') NOT NULL,
  `correo_institucional` varchar(35) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `intentos_fallidos` tinyint(3) unsigned DEFAULT NULL,
  `cuenta_bloqueada` tinyint(1) DEFAULT NULL,
  `fecha_bloqueo` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `creado_por_id` int(11) DEFAULT NULL,
  `rubrica_imagen` varchar(500) DEFAULT NULL,
  `rubrica_ip` varchar(45) DEFAULT NULL,
  `rubrica_fecha_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_correo_institucional_key` (`correo_institucional`),
  KEY `usuario_creado_por_id_fkey` (`creado_por_id`),
  CONSTRAINT `usuario_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES
(1,'coordinador','coordinadorherrera@ipn.mx','GABRIELA','HERRERA SOTELO','$2b$10$OSt18Ti672nalbfRx972IOQYGt/5cyqTaiXy82ZFq0AVnjbeg7Ptm',NULL,NULL,NULL,'2026-11-09 02:13:07',1,NULL,NULL,NULL),
(2,'coordinador','coordinadorvillagran@ipn.mx','OMAR','VILLAGRAN CASTRO','$2b$10$OSt18Ti672nalbfRx972IOQYGt/5cyqTaiXy82ZFq0AVnjbeg7Ptm',NULL,NULL,NULL,'2026-11-09 02:13:07',1,NULL,NULL,NULL),
(3,'profesor','profesornavarro@ipn.mx','RICARDO','NAVARRO OLVERA','$2b$10$OVnocPj64zbkNYb3O0Kkye6xZXEtSNuT4j3EThoQF0CuGoqzspYnG',NULL,NULL,NULL,'2026-11-09 02:13:11',1,NULL,NULL,NULL),
(4,'alumno_sin_asignar','mendoza0001@alumno.ipn.mx','DANIELA','MENDOZA CRUZ','$2b$10$WiXUzC.3ZOncP75RWzGDPOHW97lClkNR0/zuKpJ5WLPPnF6FUgALy',NULL,NULL,NULL,'2026-11-09 02:13:21',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'escom_ss'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-08 20:14:00
