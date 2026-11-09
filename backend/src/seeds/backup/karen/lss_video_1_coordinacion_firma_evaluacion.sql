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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad`
--

LOCK TABLES `actividad` WRITE;
/*!40000 ALTER TABLE `actividad` DISABLE KEYS */;
INSERT INTO `actividad` VALUES
(1,1,'Diseñar diagrama entidad-relación del módulo de reportes','Elaborar el diagrama E-R de las entidades necesarias para el módulo de generación de reportes mensuales, incluyendo su relación con bitácoras y actividades.','Diagrama E-R en formato editable (draw.io o similar) más export a PNG.','2026-11-24','completada_a_tiempo','2026-10-05 00:00:00',100,'2026-11-08 16:05:55',NULL),
(2,1,'Implementar formulario de captura de avances','Desarrollar el formulario web que permite capturar el porcentaje de avance y evidencia de cada actividad dentro de la bitácora diaria.','Formulario funcional integrado al sistema, con validaciones de campos obligatorios.','2026-11-18','completada_a_tiempo','2026-10-01 00:00:00',100,'2026-11-08 16:05:55',NULL),
(3,1,'Documentar manual de usuario del módulo de consulta','Redactar el manual de usuario explicando cómo consultar actividades asignadas y su historial desde el rol de alumno.','Documento PDF con capturas de pantalla y explicación paso a paso.','2026-10-20','completada_tarde','2026-10-01 00:00:00',100,'2026-11-08 16:05:55',NULL),
(4,1,'Configurar entorno de pruebas del sistema','Preparar el entorno de pruebas (datos de ejemplo, usuarios de prueba) para validar el módulo de seguimiento académico antes de su liberación.','Entorno de pruebas accesible, con guía breve de cómo reiniciarlo.','2026-10-29','completada_a_tiempo','2026-10-01 00:00:00',100,'2026-10-27 00:00:00',NULL),
(5,1,'Elaborar reporte de pruebas funcionales','Documentar los casos de prueba ejecutados sobre el módulo de seguimiento académico y sus resultados.','Reporte de pruebas en formato tabular (casos, resultado esperado, resultado obtenido).','2026-10-15','completada_tarde','2026-10-01 00:00:00',100,'2026-10-27 00:00:00',NULL),
(7,1,'Dar seguimiento continuo al proyecto','Seguimiento, documentación y mantenimiento continuo de los distintos módulos del proyecto a lo largo del periodo de servicio social.','Bitácora diaria de avances y evidencia de las tareas realizadas.','2027-06-24','completada_a_tiempo','2026-10-01 15:00:00',100,'2026-11-08 16:05:55',NULL);
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
('2021630001',4,'5598765432','ISC',90.00,8,'daniela.mendonza.personal@gmail.com');
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
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
INSERT INTO `bitacora` VALUES
(1,1,'2026-10-06 15:00:00','2026-10-06 17:00:00',2,'rechazada','2026-10-06','Evidencia insuficiente: favor de anexar capturas del formulario ya implementado, no solo la descripción.','2026-10-06 01:00:00',1),
(2,1,'2026-10-13 15:00:00','2026-10-13 18:00:00',3,'aprobada','2026-10-13',NULL,'2026-10-13 01:00:00',1),
(3,1,'2026-10-27 15:00:00','2026-10-27 19:00:00',4,'aprobada','2026-10-27',NULL,'2026-10-27 01:00:00',1),
(4,1,'2026-11-02 15:00:00','2026-11-02 19:00:00',4,'aprobada','2026-11-02',NULL,'2026-11-02 20:00:00',1),
(5,1,'2026-11-03 15:00:00','2026-11-03 19:00:00',4,'aprobada','2026-11-03',NULL,'2026-11-03 20:00:00',1),
(6,1,'2026-11-04 15:00:00','2026-11-04 19:00:00',4,'aprobada','2026-11-04',NULL,'2026-11-04 20:00:00',1),
(7,1,'2026-11-05 15:00:00','2026-11-05 19:00:00',4,'aprobada','2026-11-05',NULL,'2026-11-05 20:00:00',1),
(8,1,'2026-11-06 15:00:00','2026-11-06 19:00:00',4,'aprobada','2026-11-06',NULL,'2026-11-06 20:00:00',1),
(9,1,'2026-11-09 15:00:00','2026-11-09 19:00:00',4,'aprobada','2026-11-09',NULL,'2026-11-09 20:00:00',1),
(10,1,'2026-11-10 15:00:00','2026-11-10 19:00:00',4,'aprobada','2026-11-10',NULL,'2026-11-10 20:00:00',1),
(11,1,'2026-11-11 15:00:00','2026-11-11 19:00:00',4,'aprobada','2026-11-11',NULL,'2026-11-11 20:00:00',1),
(12,1,'2026-11-12 15:00:00','2026-11-12 19:00:00',4,'aprobada','2026-11-12',NULL,'2026-11-12 20:00:00',1),
(13,1,'2026-11-13 15:00:00','2026-11-13 19:00:00',4,'aprobada','2026-11-13',NULL,'2026-11-13 20:00:00',1),
(14,1,'2026-11-17 15:00:00','2026-11-17 19:00:00',4,'aprobada','2026-11-17',NULL,'2026-11-17 20:00:00',1),
(15,1,'2026-11-18 15:00:00','2026-11-18 19:00:00',4,'aprobada','2026-11-18',NULL,'2026-11-18 20:00:00',1),
(16,1,'2026-11-19 15:00:00','2026-11-19 19:00:00',4,'aprobada','2026-11-19',NULL,'2026-11-19 20:00:00',1),
(17,1,'2026-11-20 15:00:00','2026-11-20 19:00:00',4,'aprobada','2026-11-20',NULL,'2026-11-20 20:00:00',1),
(18,1,'2026-11-23 15:00:00','2026-11-23 19:00:00',4,'aprobada','2026-11-23',NULL,'2026-11-23 20:00:00',1),
(19,1,'2026-11-24 15:00:00','2026-11-24 19:00:00',4,'aprobada','2026-11-24',NULL,'2026-11-24 20:00:00',1),
(20,1,'2026-11-25 15:00:00','2026-11-25 19:00:00',4,'aprobada','2026-11-25',NULL,'2026-11-25 20:00:00',1),
(21,1,'2026-11-26 15:00:00','2026-11-26 19:00:00',4,'aprobada','2026-11-26',NULL,'2026-11-26 20:00:00',1),
(22,1,'2026-11-27 15:00:00','2026-11-27 19:00:00',4,'aprobada','2026-11-27',NULL,'2026-11-27 20:00:00',1),
(23,1,'2026-11-30 15:00:00','2026-11-30 19:00:00',4,'aprobada','2026-11-30',NULL,'2026-11-30 20:00:00',1),
(24,1,'2026-12-01 15:00:00','2026-12-01 19:00:00',4,'aprobada','2026-12-01',NULL,'2026-12-01 20:00:00',1),
(25,1,'2026-12-02 15:00:00','2026-12-02 19:00:00',4,'aprobada','2026-12-02',NULL,'2026-12-02 20:00:00',1),
(26,1,'2026-12-03 15:00:00','2026-12-03 19:00:00',4,'aprobada','2026-12-03',NULL,'2026-12-03 20:00:00',1),
(27,1,'2026-12-04 15:00:00','2026-12-04 19:00:00',4,'aprobada','2026-12-04',NULL,'2026-12-04 20:00:00',1),
(28,1,'2026-12-07 15:00:00','2026-12-07 19:00:00',4,'aprobada','2026-12-07',NULL,'2026-12-07 20:00:00',1),
(29,1,'2026-12-08 15:00:00','2026-12-08 19:00:00',4,'aprobada','2026-12-08',NULL,'2026-12-08 20:00:00',1),
(30,1,'2026-12-09 15:00:00','2026-12-09 19:00:00',4,'aprobada','2026-12-09',NULL,'2026-12-09 20:00:00',1),
(31,1,'2026-12-10 15:00:00','2026-12-10 19:00:00',4,'aprobada','2026-12-10',NULL,'2026-12-10 20:00:00',1),
(32,1,'2026-12-11 15:00:00','2026-12-11 19:00:00',4,'aprobada','2026-12-11',NULL,'2026-12-11 20:00:00',1),
(33,1,'2026-12-14 15:00:00','2026-12-14 19:00:00',4,'aprobada','2026-12-14',NULL,'2026-12-14 20:00:00',1),
(34,1,'2026-12-15 15:00:00','2026-12-15 19:00:00',4,'aprobada','2026-12-15',NULL,'2026-12-15 20:00:00',1),
(35,1,'2026-12-16 15:00:00','2026-12-16 19:00:00',4,'aprobada','2026-12-16',NULL,'2026-12-16 20:00:00',1),
(36,1,'2026-12-17 15:00:00','2026-12-17 19:00:00',4,'aprobada','2026-12-17',NULL,'2026-12-17 20:00:00',1),
(37,1,'2026-12-18 15:00:00','2026-12-18 19:00:00',4,'aprobada','2026-12-18',NULL,'2026-12-18 20:00:00',1),
(38,1,'2027-01-25 15:00:00','2027-01-25 19:00:00',4,'aprobada','2027-01-25',NULL,'2027-01-25 20:00:00',1),
(39,1,'2027-01-26 15:00:00','2027-01-26 19:00:00',4,'aprobada','2027-01-26',NULL,'2027-01-26 20:00:00',1),
(40,1,'2027-01-27 15:00:00','2027-01-27 19:00:00',4,'aprobada','2027-01-27',NULL,'2027-01-27 20:00:00',1),
(41,1,'2027-01-28 15:00:00','2027-01-28 19:00:00',4,'aprobada','2027-01-28',NULL,'2027-01-28 20:00:00',1),
(42,1,'2027-01-29 15:00:00','2027-01-29 19:00:00',4,'aprobada','2027-01-29',NULL,'2027-01-29 20:00:00',1),
(43,1,'2027-02-02 15:00:00','2027-02-02 19:00:00',4,'aprobada','2027-02-02',NULL,'2027-02-02 20:00:00',1),
(44,1,'2027-02-03 15:00:00','2027-02-03 19:00:00',4,'aprobada','2027-02-03',NULL,'2027-02-03 20:00:00',1),
(45,1,'2027-02-04 15:00:00','2027-02-04 19:00:00',4,'aprobada','2027-02-04',NULL,'2027-02-04 20:00:00',1),
(46,1,'2027-02-05 15:00:00','2027-02-05 19:00:00',4,'aprobada','2027-02-05',NULL,'2027-02-05 20:00:00',1),
(47,1,'2027-02-08 15:00:00','2027-02-08 19:00:00',4,'aprobada','2027-02-08',NULL,'2027-02-08 20:00:00',1),
(48,1,'2027-02-09 15:00:00','2027-02-09 19:00:00',4,'aprobada','2027-02-09',NULL,'2027-02-09 20:00:00',1),
(49,1,'2027-02-10 15:00:00','2027-02-10 19:00:00',4,'aprobada','2027-02-10',NULL,'2027-02-10 20:00:00',1),
(50,1,'2027-02-11 15:00:00','2027-02-11 19:00:00',4,'aprobada','2027-02-11',NULL,'2027-02-11 20:00:00',1),
(51,1,'2027-02-12 15:00:00','2027-02-12 19:00:00',4,'aprobada','2027-02-12',NULL,'2027-02-12 20:00:00',1),
(52,1,'2027-02-15 15:00:00','2027-02-15 19:00:00',4,'aprobada','2027-02-15',NULL,'2027-02-15 20:00:00',1),
(53,1,'2027-02-16 15:00:00','2027-02-16 19:00:00',4,'aprobada','2027-02-16',NULL,'2027-02-16 20:00:00',1),
(54,1,'2027-02-17 15:00:00','2027-02-17 19:00:00',4,'aprobada','2027-02-17',NULL,'2027-02-17 20:00:00',1),
(55,1,'2027-02-18 15:00:00','2027-02-18 19:00:00',4,'aprobada','2027-02-18',NULL,'2027-02-18 20:00:00',1),
(56,1,'2027-02-19 15:00:00','2027-02-19 19:00:00',4,'aprobada','2027-02-19',NULL,'2027-02-19 20:00:00',1),
(57,1,'2027-02-22 15:00:00','2027-02-22 19:00:00',4,'aprobada','2027-02-22',NULL,'2027-02-22 20:00:00',1),
(58,1,'2027-02-23 15:00:00','2027-02-23 19:00:00',4,'aprobada','2027-02-23',NULL,'2027-02-23 20:00:00',1),
(59,1,'2027-02-24 15:00:00','2027-02-24 19:00:00',4,'aprobada','2027-02-24',NULL,'2027-02-24 20:00:00',1),
(60,1,'2027-02-25 15:00:00','2027-02-25 19:00:00',4,'aprobada','2027-02-25',NULL,'2027-02-25 20:00:00',1),
(61,1,'2027-02-26 15:00:00','2027-02-26 19:00:00',4,'aprobada','2027-02-26',NULL,'2027-02-26 20:00:00',1),
(62,1,'2027-03-01 15:00:00','2027-03-01 19:00:00',4,'aprobada','2027-03-01',NULL,'2027-03-01 20:00:00',1),
(63,1,'2027-03-02 15:00:00','2027-03-02 19:00:00',4,'aprobada','2027-03-02',NULL,'2027-03-02 20:00:00',1),
(64,1,'2027-03-03 15:00:00','2027-03-03 19:00:00',4,'aprobada','2027-03-03',NULL,'2027-03-03 20:00:00',1),
(65,1,'2027-03-04 15:00:00','2027-03-04 19:00:00',4,'aprobada','2027-03-04',NULL,'2027-03-04 20:00:00',1),
(66,1,'2027-03-05 15:00:00','2027-03-05 19:00:00',4,'aprobada','2027-03-05',NULL,'2027-03-05 20:00:00',1),
(67,1,'2027-03-08 15:00:00','2027-03-08 19:00:00',4,'aprobada','2027-03-08',NULL,'2027-03-08 20:00:00',1),
(68,1,'2027-03-09 15:00:00','2027-03-09 19:00:00',4,'aprobada','2027-03-09',NULL,'2027-03-09 20:00:00',1),
(69,1,'2027-03-10 15:00:00','2027-03-10 19:00:00',4,'aprobada','2027-03-10',NULL,'2027-03-10 20:00:00',1),
(70,1,'2027-03-11 15:00:00','2027-03-11 19:00:00',4,'aprobada','2027-03-11',NULL,'2027-03-11 20:00:00',1),
(71,1,'2027-03-12 15:00:00','2027-03-12 19:00:00',4,'aprobada','2027-03-12',NULL,'2027-03-12 20:00:00',1),
(72,1,'2027-03-16 15:00:00','2027-03-16 19:00:00',4,'aprobada','2027-03-16',NULL,'2027-03-16 20:00:00',1),
(73,1,'2027-03-17 15:00:00','2027-03-17 19:00:00',4,'aprobada','2027-03-17',NULL,'2027-03-17 20:00:00',1),
(74,1,'2027-03-18 15:00:00','2027-03-18 19:00:00',4,'aprobada','2027-03-18',NULL,'2027-03-18 20:00:00',1),
(75,1,'2027-03-19 15:00:00','2027-03-19 19:00:00',4,'aprobada','2027-03-19',NULL,'2027-03-19 20:00:00',1),
(76,1,'2027-03-22 15:00:00','2027-03-22 19:00:00',4,'aprobada','2027-03-22',NULL,'2027-03-22 20:00:00',1),
(77,1,'2027-03-23 15:00:00','2027-03-23 19:00:00',4,'aprobada','2027-03-23',NULL,'2027-03-23 20:00:00',1),
(78,1,'2027-03-24 15:00:00','2027-03-24 19:00:00',4,'aprobada','2027-03-24',NULL,'2027-03-24 20:00:00',1),
(79,1,'2027-03-25 15:00:00','2027-03-25 19:00:00',4,'aprobada','2027-03-25',NULL,'2027-03-25 20:00:00',1),
(80,1,'2027-03-26 15:00:00','2027-03-26 19:00:00',4,'aprobada','2027-03-26',NULL,'2027-03-26 20:00:00',1),
(81,1,'2027-03-29 15:00:00','2027-03-29 19:00:00',4,'aprobada','2027-03-29',NULL,'2027-03-29 20:00:00',1),
(82,1,'2027-03-30 15:00:00','2027-03-30 19:00:00',4,'aprobada','2027-03-30',NULL,'2027-03-30 20:00:00',1),
(83,1,'2027-03-31 15:00:00','2027-03-31 19:00:00',4,'aprobada','2027-03-31',NULL,'2027-03-31 20:00:00',1),
(84,1,'2027-04-01 15:00:00','2027-04-01 19:00:00',4,'aprobada','2027-04-01',NULL,'2027-04-01 20:00:00',1),
(85,1,'2027-04-02 15:00:00','2027-04-02 19:00:00',4,'aprobada','2027-04-02',NULL,'2027-04-02 20:00:00',1),
(86,1,'2027-04-05 15:00:00','2027-04-05 19:00:00',4,'aprobada','2027-04-05',NULL,'2027-04-05 20:00:00',1),
(87,1,'2027-04-06 15:00:00','2027-04-06 19:00:00',4,'aprobada','2027-04-06',NULL,'2027-04-06 20:00:00',1),
(88,1,'2027-04-07 15:00:00','2027-04-07 19:00:00',4,'aprobada','2027-04-07',NULL,'2027-04-07 20:00:00',1),
(89,1,'2027-04-08 15:00:00','2027-04-08 19:00:00',4,'aprobada','2027-04-08',NULL,'2027-04-08 20:00:00',1),
(90,1,'2027-04-09 15:00:00','2027-04-09 19:00:00',4,'aprobada','2027-04-09',NULL,'2027-04-09 20:00:00',1),
(91,1,'2027-04-12 15:00:00','2027-04-12 19:00:00',4,'aprobada','2027-04-12',NULL,'2027-04-12 20:00:00',1),
(92,1,'2027-04-13 15:00:00','2027-04-13 19:00:00',4,'aprobada','2027-04-13',NULL,'2027-04-13 20:00:00',1),
(93,1,'2027-04-14 15:00:00','2027-04-14 19:00:00',4,'aprobada','2027-04-14',NULL,'2027-04-14 20:00:00',1),
(94,1,'2027-04-15 15:00:00','2027-04-15 19:00:00',4,'aprobada','2027-04-15',NULL,'2027-04-15 20:00:00',1),
(95,1,'2027-04-16 15:00:00','2027-04-16 19:00:00',4,'aprobada','2027-04-16',NULL,'2027-04-16 20:00:00',1),
(96,1,'2027-04-19 15:00:00','2027-04-19 19:00:00',4,'aprobada','2027-04-19',NULL,'2027-04-19 20:00:00',1),
(97,1,'2027-04-20 15:00:00','2027-04-20 19:00:00',4,'aprobada','2027-04-20',NULL,'2027-04-20 20:00:00',1),
(98,1,'2027-04-21 15:00:00','2027-04-21 19:00:00',4,'aprobada','2027-04-21',NULL,'2027-04-21 20:00:00',1),
(99,1,'2027-04-22 15:00:00','2027-04-22 19:00:00',4,'aprobada','2027-04-22',NULL,'2027-04-22 20:00:00',1),
(100,1,'2027-04-23 15:00:00','2027-04-23 19:00:00',4,'aprobada','2027-04-23',NULL,'2027-04-23 20:00:00',1),
(101,1,'2027-04-26 15:00:00','2027-04-26 19:00:00',4,'aprobada','2027-04-26',NULL,'2027-04-26 20:00:00',1),
(102,1,'2027-04-27 15:00:00','2027-04-27 19:00:00',4,'aprobada','2027-04-27',NULL,'2027-04-27 20:00:00',1),
(103,1,'2027-04-28 15:00:00','2027-04-28 19:00:00',4,'aprobada','2027-04-28',NULL,'2027-04-28 20:00:00',1),
(104,1,'2027-04-29 15:00:00','2027-04-29 19:00:00',4,'aprobada','2027-04-29',NULL,'2027-04-29 20:00:00',1),
(105,1,'2027-04-30 15:00:00','2027-04-30 19:00:00',4,'aprobada','2027-04-30',NULL,'2027-04-30 20:00:00',1),
(106,1,'2027-05-03 15:00:00','2027-05-03 19:00:00',4,'aprobada','2027-05-03',NULL,'2027-05-03 20:00:00',1),
(107,1,'2027-05-04 15:00:00','2027-05-04 19:00:00',4,'aprobada','2027-05-04',NULL,'2027-05-04 20:00:00',1),
(108,1,'2027-05-06 15:00:00','2027-05-06 19:00:00',4,'aprobada','2027-05-06',NULL,'2027-05-06 20:00:00',1),
(109,1,'2027-05-07 15:00:00','2027-05-07 19:00:00',4,'aprobada','2027-05-07',NULL,'2027-05-07 20:00:00',1),
(110,1,'2027-05-10 15:00:00','2027-05-10 19:00:00',4,'aprobada','2027-05-10',NULL,'2027-05-10 20:00:00',1),
(111,1,'2027-05-11 15:00:00','2027-05-11 19:00:00',4,'aprobada','2027-05-11',NULL,'2027-05-11 20:00:00',1),
(112,1,'2027-05-12 15:00:00','2027-05-12 19:00:00',4,'aprobada','2027-05-12',NULL,'2027-05-12 20:00:00',1),
(113,1,'2027-05-13 15:00:00','2027-05-13 19:00:00',4,'aprobada','2027-05-13',NULL,'2027-05-13 20:00:00',1),
(114,1,'2027-05-14 15:00:00','2027-05-14 19:00:00',4,'aprobada','2027-05-14',NULL,'2027-05-14 20:00:00',1),
(115,1,'2027-05-17 15:00:00','2027-05-17 19:00:00',4,'aprobada','2027-05-17',NULL,'2027-05-17 20:00:00',1),
(116,1,'2027-05-18 15:00:00','2027-05-18 19:00:00',4,'aprobada','2027-05-18',NULL,'2027-05-18 20:00:00',1),
(117,1,'2027-05-19 15:00:00','2027-05-19 19:00:00',4,'aprobada','2027-05-19',NULL,'2027-05-19 20:00:00',1),
(118,1,'2027-05-20 15:00:00','2027-05-20 19:00:00',4,'aprobada','2027-05-20',NULL,'2027-05-20 20:00:00',1),
(119,1,'2027-05-21 15:00:00','2027-05-21 19:00:00',4,'aprobada','2027-05-21',NULL,'2027-05-21 20:00:00',1),
(120,1,'2027-05-24 15:00:00','2027-05-24 19:00:00',4,'aprobada','2027-05-24',NULL,'2027-05-24 20:00:00',1),
(121,1,'2027-05-25 15:00:00','2027-05-25 19:00:00',4,'aprobada','2027-05-25',NULL,'2027-05-25 20:00:00',1),
(122,1,'2027-05-26 15:00:00','2027-05-26 19:00:00',1,'aprobada','2027-05-26',NULL,'2027-05-26 20:00:00',1);
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
(1,1,'correo','servicio_social_escom@ipn.mx','2026-11-08 07:02:17'),
(2,1,'telefono','5557296000 ext. 52056','2026-11-08 07:02:17'),
(3,1,'ubicacion','En edificio central de la ESCOM, subiendo las escaleras del lado derecho','2026-11-08 07:02:17'),
(4,1,'horario','Lunes a viernes de 9:00 a 15:00 y de 17:00 a 20:00 horas','2026-11-08 07:02:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cumulo_horas_y_faltas`
--

LOCK TABLES `cumulo_horas_y_faltas` WRITE;
/*!40000 ALTER TABLE `cumulo_horas_y_faltas` DISABLE KEYS */;
INSERT INTO `cumulo_horas_y_faltas` VALUES
(1,'2021630001',482,2,0,0,'2026-11-07');
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documento`
--

LOCK TABLES `documento` WRITE;
/*!40000 ALTER TABLE `documento` DISABLE KEYS */;
INSERT INTO `documento` VALUES
(1,'2021630001',4,'carta_creditos','2026-11-08 19:30:28','aprobado','2021630001/dddd2eef-6922-41b0-9a08-abfbcd831fc9.pdf',1,'2021630001_CARTA_CREDITOS.pdf'),
(2,'2021630001',4,'constancia_seguro_social','2026-11-08 19:30:28','aprobado','2021630001/3d257895-df8a-484e-9a7d-748d5430926c.pdf',1,'2021630001_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(3,'2021630001',4,'expediente','2026-11-08 19:45:00','aprobado','2021630001/02721db6-076b-4f81-bfff-d115dba81982.pdf',1,'MENDOZA_CRUZ_DANIELA_2021630001.pdf'),
(31,'2021630001',4,'reporte_mensual','2026-12-09 12:00:00','vigente','2021630001/Reportes/ce85b45c-fb32-4e58-b955-b861f6fbca30.pdf',NULL,NULL),
(32,'2021630001',4,'reporte_mensual','2027-01-09 12:00:00','vigente','2021630001/Reportes/5f7a89e6-6a67-41f9-88bf-d8efe92e2ebd.pdf',NULL,NULL),
(33,'2021630001',4,'reporte_mensual','2027-02-09 12:00:00','vigente','2021630001/Reportes/bb0d9edb-861a-48b6-aeaf-d7d79e0af4ff.pdf',NULL,NULL),
(34,'2021630001',4,'reporte_mensual','2027-03-10 12:00:00','vigente','2021630001/Reportes/a3497e50-9334-4670-8e22-5d8e3141881a.pdf',NULL,NULL),
(35,'2021630001',4,'reporte_mensual','2027-04-07 12:00:00','vigente','2021630001/Reportes/8b947d70-eee4-43fa-bf34-cccd527f2aab.pdf',NULL,NULL),
(36,'2021630001',4,'reporte_mensual','2027-05-10 12:00:00','vigente','2021630001/Reportes/7955db1d-9493-4a3a-a6dc-e97c37d85af7.pdf',NULL,NULL),
(37,'2021630001',4,'reporte_mensual','2027-06-09 12:00:00','vigente','2021630001/Reportes/1ab789b0-ebcc-48cc-b52b-f1f887e01768.pdf',NULL,NULL),
(38,'2021630001',4,'reporte_mensual','2027-07-10 12:00:00','vigente','2021630001/Reportes/41818cfa-3c3e-4096-8891-513b564b9e3d.pdf',NULL,NULL),
(39,'2021630001',4,'reporte_global','2026-11-13 22:03:10','vigente','2021630001/Reportes/d4e3e14a-2368-468e-a827-b4856b387e1c.pdf',NULL,NULL),
(42,'2021630001',3,'evaluacion_desempeno','2026-11-09 06:23:05','pendiente','2021630001/85a9c442-3dc1-4f65-9f02-c3f96eb86845.pdf',NULL,'2021630001_EVALUACION_DESEMPENO.pdf');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_desempeno`
--

LOCK TABLES `evaluacion_desempeno` WRITE;
/*!40000 ALTER TABLE `evaluacion_desempeno` DISABLE KEYS */;
INSERT INTO `evaluacion_desempeno` VALUES
(3,42,1,'pendiente_dictamen','Excelente desempeño durante todo el periodo de servicio social.',1,'2026-11-09 06:23:05',NULL,'{\"Calidad del trabajo\":100,\"Aplicación de conocimientos\":100,\"Adquisición de conocimientos\":100,\"Disciplina\":100,\"Presentación personal\":100,\"Iniciativa\":100,\"Relaciones interpersonales\":85}');
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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(59,1,'Servicio Social — Video tutorial','Periodo','2026-10-01','2027-06-24',NULL),
(60,1,'Cierre administrativo parcial','Inhabil','2026-10-08',NULL,'14:00:00'),
(61,1,'Cierre administrativo parcial','Inhabil','2026-10-22',NULL,'12:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inicio_sesion`
--

LOCK TABLES `inicio_sesion` WRITE;
/*!40000 ALTER TABLE `inicio_sesion` DISABLE KEYS */;
INSERT INTO `inicio_sesion` VALUES
(1,3,'2026-11-08 07:20:43','172.18.0.1',1),
(2,3,'2026-11-08 14:27:19','172.18.0.1',1),
(3,1,'2026-11-08 18:28:48','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(4,1,'2026-11-08 18:37:01','172.18.0.1',1),
(5,3,'2026-11-08 18:40:09','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(6,3,'2026-11-08 18:40:51','172.18.0.1',1),
(7,3,'2026-11-08 18:44:17','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(8,3,'2026-11-08 18:46:24','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(9,4,'2026-11-08 19:00:38','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(10,4,'2026-11-08 19:04:47','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(11,4,'2026-11-08 19:08:53','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(12,3,'2026-11-08 19:10:34','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(13,1,'2026-11-08 19:31:29','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(14,3,'2026-11-08 21:56:01','172.18.0.1',1),
(15,3,'2026-11-09 06:11:07','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1),
(16,2,'2026-11-09 06:13:47','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `liberacion_proceso`
--

LOCK TABLES `liberacion_proceso` WRITE;
/*!40000 ALTER TABLE `liberacion_proceso` DISABLE KEYS */;
INSERT INTO `liberacion_proceso` VALUES
(1,1,'evaluacion_solicitada','2026-11-09 06:08:14',1,NULL,NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
INSERT INTO `notificacion` VALUES
(1,4,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',1,'2026-11-08 19:45:40','2026-11-08 19:45:53'),
(2,4,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',1,'2026-11-08 19:56:04','2026-11-08 19:56:43'),
(3,4,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=1',1,'2026-11-08 21:08:24','2026-11-08 21:36:07'),
(4,4,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=1',1,'2026-11-08 21:08:25','2026-11-08 21:36:07'),
(5,4,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=2',1,'2026-11-08 21:08:26','2026-11-08 21:36:07'),
(6,4,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=2',1,'2026-11-08 21:08:27','2026-11-08 21:36:07'),
(7,4,'info','Tu profesor aprobó tu Reporte Mensual No. 3. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=3',1,'2026-11-08 21:09:45','2026-11-08 21:36:07'),
(8,4,'success','Coordinación validó tu Reporte Mensual No. 3.','/alumno/reportes?destacar=3',1,'2026-11-08 21:09:46','2026-11-08 21:36:07'),
(9,4,'info','Tu profesor aprobó tu Reporte Mensual No. 4. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=4',1,'2026-11-08 21:09:47','2026-11-08 21:36:07'),
(10,4,'success','Coordinación validó tu Reporte Mensual No. 4.','/alumno/reportes?destacar=4',1,'2026-11-08 21:09:47','2026-11-08 21:36:07'),
(11,4,'info','Tu profesor aprobó tu Reporte Mensual No. 5. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=5',1,'2026-11-08 21:09:48','2026-11-08 21:36:07'),
(12,4,'success','Coordinación validó tu Reporte Mensual No. 5.','/alumno/reportes?destacar=5',1,'2026-11-08 21:09:49','2026-11-08 21:36:07'),
(13,4,'info','Tu profesor aprobó tu Reporte Mensual No. 6. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=6',1,'2026-11-08 21:09:49','2026-11-08 21:36:07'),
(14,4,'success','Coordinación validó tu Reporte Mensual No. 6.','/alumno/reportes?destacar=6',1,'2026-11-08 21:09:50','2026-11-08 21:36:07'),
(15,4,'info','Tu profesor aprobó tu Reporte Mensual No. 7. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=7',1,'2026-11-08 21:12:13','2026-11-08 21:36:07'),
(16,4,'success','Coordinación validó tu Reporte Mensual No. 7.','/alumno/reportes?destacar=7',1,'2026-11-08 21:12:13','2026-11-08 21:36:07'),
(17,4,'info','Tu profesor aprobó tu Reporte Mensual No. 8. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=8',1,'2026-11-08 21:12:14','2026-11-08 21:36:07'),
(18,4,'success','Coordinación validó tu Reporte Mensual No. 8.','/alumno/reportes?destacar=8',1,'2026-11-08 21:12:15','2026-11-08 21:36:07'),
(19,4,'info','Tu profesor aprobó tu Reporte Global. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=1&tipo=global',1,'2026-11-08 21:12:15','2026-11-08 21:36:07'),
(20,4,'success','Coordinación validó tu Reporte Global.','/alumno/reportes?destacar=1&tipo=global',1,'2026-11-08 21:12:16','2026-11-08 21:36:06'),
(21,4,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=9',1,'2026-11-08 21:41:55','2026-11-08 21:53:30'),
(22,4,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=9',1,'2026-11-08 21:41:55','2026-11-08 21:53:30'),
(23,4,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=10',1,'2026-11-08 21:41:56','2026-11-08 21:53:30'),
(24,4,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=10',1,'2026-11-08 21:41:57','2026-11-08 21:53:30'),
(25,4,'info','Tu profesor aprobó tu Reporte Mensual No. 3. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=11',1,'2026-11-08 21:41:57','2026-11-08 21:53:30'),
(26,4,'success','Coordinación validó tu Reporte Mensual No. 3.','/alumno/reportes?destacar=11',1,'2026-11-08 21:41:58','2026-11-08 21:53:30'),
(27,4,'info','Tu profesor aprobó tu Reporte Mensual No. 4. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=12',1,'2026-11-08 21:41:59','2026-11-08 21:53:30'),
(28,4,'success','Coordinación validó tu Reporte Mensual No. 4.','/alumno/reportes?destacar=12',1,'2026-11-08 21:41:59','2026-11-08 21:53:30'),
(29,4,'info','Tu profesor aprobó tu Reporte Mensual No. 5. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=13',1,'2026-11-08 21:42:00','2026-11-08 21:53:30'),
(30,4,'success','Coordinación validó tu Reporte Mensual No. 5.','/alumno/reportes?destacar=13',1,'2026-11-08 21:42:00','2026-11-08 21:53:30'),
(31,4,'info','Tu profesor aprobó tu Reporte Mensual No. 6. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=14',1,'2026-11-08 21:42:01','2026-11-08 21:53:30'),
(32,4,'success','Coordinación validó tu Reporte Mensual No. 6.','/alumno/reportes?destacar=14',1,'2026-11-08 21:42:02','2026-11-08 21:53:30'),
(33,4,'info','Tu profesor aprobó tu Reporte Mensual No. 7. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=15',1,'2026-11-08 21:42:03','2026-11-08 21:53:30'),
(34,4,'success','Coordinación validó tu Reporte Mensual No. 7.','/alumno/reportes?destacar=15',1,'2026-11-08 21:42:03','2026-11-08 21:53:30'),
(35,4,'info','Tu profesor aprobó tu Reporte Mensual No. 8. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=16',1,'2026-11-08 21:42:04','2026-11-08 21:53:30'),
(36,4,'success','Coordinación validó tu Reporte Mensual No. 8.','/alumno/reportes?destacar=16',1,'2026-11-08 21:42:05','2026-11-08 21:53:30'),
(37,4,'info','Tu profesor aprobó tu Reporte Global. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=2&tipo=global',1,'2026-11-08 21:42:05','2026-11-08 21:53:30'),
(38,4,'success','Coordinación validó tu Reporte Global.','/alumno/reportes?destacar=2&tipo=global',1,'2026-11-08 21:42:06','2026-11-08 21:53:30'),
(39,4,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=17',1,'2026-11-08 21:57:02','2026-11-08 21:59:09'),
(40,4,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=17',1,'2026-11-08 21:57:21','2026-11-08 21:59:09'),
(41,4,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=18',1,'2026-11-08 21:57:30','2026-11-08 21:59:09'),
(42,4,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=18',1,'2026-11-08 21:57:31','2026-11-08 21:59:09'),
(43,4,'info','Tu profesor aprobó tu Reporte Mensual No. 3. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=19',1,'2026-11-08 21:57:31','2026-11-08 21:59:09'),
(44,4,'success','Coordinación validó tu Reporte Mensual No. 3.','/alumno/reportes?destacar=19',1,'2026-11-08 21:57:32','2026-11-08 21:59:09'),
(45,4,'info','Tu profesor aprobó tu Reporte Mensual No. 4. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=20',1,'2026-11-08 21:57:33','2026-11-08 21:59:09'),
(46,4,'success','Coordinación validó tu Reporte Mensual No. 4.','/alumno/reportes?destacar=20',1,'2026-11-08 21:57:33','2026-11-08 21:59:09'),
(47,4,'info','Tu profesor aprobó tu Reporte Mensual No. 5. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=21',1,'2026-11-08 21:57:34','2026-11-08 21:59:09'),
(48,4,'success','Coordinación validó tu Reporte Mensual No. 5.','/alumno/reportes?destacar=21',1,'2026-11-08 21:57:35','2026-11-08 21:59:09'),
(49,4,'info','Tu profesor aprobó tu Reporte Mensual No. 6. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=22',1,'2026-11-08 21:57:36','2026-11-08 21:59:09'),
(50,4,'success','Coordinación validó tu Reporte Mensual No. 6.','/alumno/reportes?destacar=22',1,'2026-11-08 21:57:36','2026-11-08 21:59:09'),
(51,4,'info','Tu profesor aprobó tu Reporte Mensual No. 7. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=23',1,'2026-11-08 21:57:37','2026-11-08 21:59:09'),
(52,4,'success','Coordinación validó tu Reporte Mensual No. 7.','/alumno/reportes?destacar=23',1,'2026-11-08 21:57:38','2026-11-08 21:59:09'),
(53,4,'info','Tu profesor aprobó tu Reporte Mensual No. 8. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=24',1,'2026-11-08 21:57:39','2026-11-08 21:59:09'),
(54,4,'success','Coordinación validó tu Reporte Mensual No. 8.','/alumno/reportes?destacar=24',1,'2026-11-08 21:57:39','2026-11-08 21:59:09'),
(55,4,'info','Tu profesor aprobó tu Reporte Global. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=3&tipo=global',1,'2026-11-08 21:57:40','2026-11-08 21:59:09'),
(56,4,'success','Coordinación validó tu Reporte Global.','/alumno/reportes?destacar=3&tipo=global',1,'2026-11-08 21:57:40','2026-11-08 21:59:09'),
(57,4,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=25',1,'2026-11-08 22:01:54','2026-11-08 22:02:22'),
(58,4,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=25',1,'2026-11-08 22:02:54','2026-11-08 22:03:08'),
(59,4,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=26',1,'2026-11-08 22:03:01','2026-11-08 22:03:08'),
(60,4,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=26',1,'2026-11-08 22:03:02','2026-11-08 22:03:08'),
(61,4,'info','Tu profesor aprobó tu Reporte Mensual No. 3. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=27',1,'2026-11-08 22:03:03','2026-11-08 22:03:08'),
(62,4,'success','Coordinación validó tu Reporte Mensual No. 3.','/alumno/reportes?destacar=27',1,'2026-11-08 22:03:03','2026-11-08 22:03:08'),
(63,4,'info','Tu profesor aprobó tu Reporte Mensual No. 4. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=28',1,'2026-11-08 22:03:04','2026-11-08 22:03:08'),
(64,4,'success','Coordinación validó tu Reporte Mensual No. 4.','/alumno/reportes?destacar=28',1,'2026-11-08 22:03:05','2026-11-08 22:03:08'),
(65,4,'info','Tu profesor aprobó tu Reporte Mensual No. 5. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=29',1,'2026-11-08 22:03:05','2026-11-08 22:03:08'),
(66,4,'success','Coordinación validó tu Reporte Mensual No. 5.','/alumno/reportes?destacar=29',1,'2026-11-08 22:03:06','2026-11-08 22:03:08'),
(67,4,'info','Tu profesor aprobó tu Reporte Mensual No. 6. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=30',1,'2026-11-08 22:03:07','2026-11-08 22:03:08'),
(68,4,'success','Coordinación validó tu Reporte Mensual No. 6.','/alumno/reportes?destacar=30',1,'2026-11-08 22:03:07','2026-11-08 22:03:08'),
(69,4,'info','Tu profesor aprobó tu Reporte Mensual No. 7. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=31',1,'2026-11-08 22:03:08','2026-11-08 22:03:11'),
(70,4,'success','Coordinación validó tu Reporte Mensual No. 7.','/alumno/reportes?destacar=31',1,'2026-11-08 22:03:09','2026-11-08 22:03:11'),
(71,4,'info','Tu profesor aprobó tu Reporte Mensual No. 8. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=32',1,'2026-11-08 22:03:09','2026-11-08 22:03:11'),
(72,4,'success','Coordinación validó tu Reporte Mensual No. 8.','/alumno/reportes?destacar=32',1,'2026-11-08 22:03:10','2026-11-08 22:03:11'),
(73,4,'info','Tu profesor aprobó tu Reporte Global. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=4&tipo=global',1,'2026-11-08 22:03:10','2026-11-08 22:03:11'),
(74,4,'success','Coordinación validó tu Reporte Global.','/alumno/reportes?destacar=4&tipo=global',1,'2026-11-08 22:03:11','2026-11-08 22:03:13'),
(75,4,'info','Tu profesor registró tu evaluación de desempeño. Está pendiente del dictamen de coordinación.','/alumno/seguimiento-evaluacion',0,'2026-11-09 06:08:15',NULL),
(76,4,'info','Tu profesor registró tu evaluación de desempeño. Está pendiente del dictamen de coordinación.','/alumno/seguimiento-evaluacion',0,'2026-11-09 06:19:28',NULL),
(77,4,'info','Tu profesor registró tu evaluación de desempeño. Está pendiente del dictamen de coordinación.','/alumno/seguimiento-evaluacion',0,'2026-11-09 06:23:05',NULL);
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
(1,1,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Desarrollo de sistema de seguimiento academico','individual','El alumno apoyara en el desarrollo y mantenimiento de un sistema interno de seguimiento academico, incluyendo captura de datos, generacion de reportes y pruebas funcionales.',NULL,0,'aprobada','2026-11-08 07:20:27',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL');
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
(39,59,'2027','01','2026-09-21');
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
(1,1,'Constancia de creditos IPN','https://forms.cloud.microsoft/pages/responsepage.aspx?id=2fRL-ZeAlEet9qVGbKKFY-JLdN8w-KlBnYjodQmtWMpUQVNQMjdMQVFGNkY3RzdZVUZZUFlVTTVBWi4u&route=shorturl','2026-11-08 07:02:17',NULL,'link_constancia_creditos'),
(2,1,'Plataforma SISS del IPN','https://serviciosocial.ipn.mx/','2026-11-08 07:02:17',NULL,'link_siss'),
(3,1,'Constancia de vigencia del seguro social IMSS','https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/vigencia','2026-11-08 07:02:17',NULL,'link_seguro_social');
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
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_bitacora_actividades`
--

LOCK TABLES `registro_bitacora_actividades` WRITE;
/*!40000 ALTER TABLE `registro_bitacora_actividades` DISABLE KEYS */;
INSERT INTO `registro_bitacora_actividades` VALUES
(1,1,2,'Se maquetó el formulario de captura de avances con sus campos principales.',30,'Sin URL adjunta — pendiente de corrección señalada por el profesor.'),
(2,2,2,'Se agregaron las validaciones de campos obligatorios y el manejo de errores del formulario.',45,'https://ejemplo-interno.escom.ipn.mx/avances/formulario-captura-v2'),
(3,3,4,'Se finalizó la configuración del entorno de pruebas, incluyendo datos de ejemplo y guía de reinicio.',100,'https://ejemplo-interno.escom.ipn.mx/avances/entorno-pruebas-final'),
(4,3,5,'Se concluyó el reporte de pruebas funcionales con todos los casos documentados.',100,'https://ejemplo-interno.escom.ipn.mx/avances/reporte-pruebas-final'),
(5,4,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(6,5,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(7,6,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(8,7,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(9,8,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(10,9,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(11,10,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(12,11,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(13,12,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(14,13,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(15,14,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(16,15,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(17,16,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(18,17,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(19,18,7,'Avance continuo de seguimiento y documentación del proyecto.',55,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(20,19,7,'Avance continuo de seguimiento y documentación del proyecto.',56,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(21,20,7,'Avance continuo de seguimiento y documentación del proyecto.',57,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(22,21,7,'Avance continuo de seguimiento y documentación del proyecto.',58,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(23,22,7,'Avance continuo de seguimiento y documentación del proyecto.',59,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(24,23,7,'Avance continuo de seguimiento y documentación del proyecto.',60,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(25,24,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(26,25,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(27,26,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(28,27,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(29,28,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(30,29,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(31,30,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(32,31,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(33,32,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(34,33,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(35,34,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(36,35,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(37,36,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(38,37,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(39,38,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(40,39,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(41,40,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(42,41,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(43,42,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(44,43,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(45,44,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(46,45,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(47,46,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(48,47,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(49,48,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(50,49,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(51,50,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(52,51,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(53,52,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(54,53,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(55,54,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(56,55,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(57,56,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(58,57,7,'Avance continuo de seguimiento y documentación del proyecto.',55,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(59,58,7,'Avance continuo de seguimiento y documentación del proyecto.',56,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(60,59,7,'Avance continuo de seguimiento y documentación del proyecto.',57,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(61,60,7,'Avance continuo de seguimiento y documentación del proyecto.',58,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(62,61,7,'Avance continuo de seguimiento y documentación del proyecto.',59,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(63,62,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(64,63,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(65,64,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(66,65,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(67,66,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(68,67,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(69,68,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(70,69,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(71,70,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(72,71,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(73,72,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(74,73,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(75,74,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(76,75,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(77,76,7,'Avance continuo de seguimiento y documentación del proyecto.',55,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(78,77,7,'Avance continuo de seguimiento y documentación del proyecto.',56,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(79,78,7,'Avance continuo de seguimiento y documentación del proyecto.',57,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(80,79,7,'Avance continuo de seguimiento y documentación del proyecto.',58,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(81,80,7,'Avance continuo de seguimiento y documentación del proyecto.',59,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(82,81,7,'Avance continuo de seguimiento y documentación del proyecto.',60,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(83,82,7,'Avance continuo de seguimiento y documentación del proyecto.',61,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(84,83,7,'Avance continuo de seguimiento y documentación del proyecto.',62,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(85,84,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(86,85,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(87,86,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(88,87,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(89,88,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(90,89,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(91,90,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(92,91,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(93,92,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(94,93,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(95,94,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(96,95,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(97,96,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(98,97,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(99,98,7,'Avance continuo de seguimiento y documentación del proyecto.',55,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(100,99,7,'Avance continuo de seguimiento y documentación del proyecto.',56,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(101,100,7,'Avance continuo de seguimiento y documentación del proyecto.',57,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(102,101,7,'Avance continuo de seguimiento y documentación del proyecto.',58,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(103,102,7,'Avance continuo de seguimiento y documentación del proyecto.',59,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(104,103,7,'Avance continuo de seguimiento y documentación del proyecto.',60,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(105,104,7,'Avance continuo de seguimiento y documentación del proyecto.',61,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(106,105,7,'Avance continuo de seguimiento y documentación del proyecto.',62,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(107,106,7,'Avance continuo de seguimiento y documentación del proyecto.',41,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(108,107,7,'Avance continuo de seguimiento y documentación del proyecto.',42,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(109,108,7,'Avance continuo de seguimiento y documentación del proyecto.',43,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(110,109,7,'Avance continuo de seguimiento y documentación del proyecto.',44,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(111,110,7,'Avance continuo de seguimiento y documentación del proyecto.',45,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(112,111,7,'Avance continuo de seguimiento y documentación del proyecto.',46,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(113,112,7,'Avance continuo de seguimiento y documentación del proyecto.',47,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(114,113,7,'Avance continuo de seguimiento y documentación del proyecto.',48,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(115,114,7,'Avance continuo de seguimiento y documentación del proyecto.',49,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(116,115,7,'Avance continuo de seguimiento y documentación del proyecto.',50,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(117,116,7,'Avance continuo de seguimiento y documentación del proyecto.',51,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(118,117,7,'Avance continuo de seguimiento y documentación del proyecto.',52,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(119,118,7,'Avance continuo de seguimiento y documentación del proyecto.',53,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(120,119,7,'Avance continuo de seguimiento y documentación del proyecto.',54,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(121,120,7,'Avance continuo de seguimiento y documentación del proyecto.',55,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(122,121,7,'Avance continuo de seguimiento y documentación del proyecto.',56,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo'),
(123,122,7,'Avance continuo de seguimiento y documentación del proyecto.',57,'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_global`
--

LOCK TABLES `reporte_global` WRITE;
/*!40000 ALTER TABLE `reporte_global` DISABLE KEYS */;
INSERT INTO `reporte_global` VALUES
(4,1,39,'Resumen global de todo el periodo de servicio social.','aprobado_coordinador');
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_mensual`
--

LOCK TABLES `reporte_mensual` WRITE;
/*!40000 ALTER TABLE `reporte_mensual` DISABLE KEYS */;
INSERT INTO `reporte_mensual` VALUES
(25,1,31,1,'Resumen de actividades del periodo correspondiente al reporte #1.','aprobado_coordinador',2,7),
(26,1,32,2,'Resumen de actividades del periodo correspondiente al reporte #2.','aprobado_coordinador',20,80),
(27,1,33,3,'Resumen de actividades del periodo correspondiente al reporte #3.','aprobado_coordinador',14,56),
(28,1,34,4,'Resumen de actividades del periodo correspondiente al reporte #4.','aprobado_coordinador',5,20),
(29,1,35,5,'Resumen de actividades del periodo correspondiente al reporte #5.','aprobado_coordinador',19,76),
(30,1,36,6,'Resumen de actividades del periodo correspondiente al reporte #6.','aprobado_coordinador',22,88),
(31,1,37,7,'Resumen de actividades del periodo correspondiente al reporte #7.','aprobado_coordinador',22,88),
(32,1,38,8,'Resumen de actividades del periodo correspondiente al reporte #8.','aprobado_coordinador',17,65);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_desempeno`
--

LOCK TABLES `revision_desempeno` WRITE;
/*!40000 ALTER TABLE `revision_desempeno` DISABLE KEYS */;
INSERT INTO `revision_desempeno` VALUES
(3,3,3,'profesor','aprobado',NULL,'a74d40568220fb4db4ba9caf929aa055672612a50255ffdc3a4bd6ba3fd67bd0','127.0.0.1','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','2026-11-09 06:23:05');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_global`
--

LOCK TABLES `revision_reporte_global` WRITE;
/*!40000 ALTER TABLE `revision_reporte_global` DISABLE KEYS */;
INSERT INTO `revision_reporte_global` VALUES
(10,4,4,'alumno','aprobado',NULL,'98d153f86d8f453083970fc8306693210cf3f21770cd8026406ec0e0e1709695',NULL,'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','2026-11-13 22:03:10','2021630001/Reportes/3629c90b-a926-4cb4-aa08-31469a1287ea.pdf'),
(11,4,3,'profesor','aprobado',NULL,'8c17218087fb85e8c5eba611c598402f55096252c8beea648ae22f44c3bf91d3',NULL,'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','2026-11-13 22:03:10','2021630001/Reportes/b725c596-7a37-4c2a-9f68-86a3080b5892.pdf'),
(12,4,1,'coordinador','aprobado',NULL,'c122b7a8ee5a9137b446f8c2d4fffb4d49feda3354665d51454d61408e1bd694',NULL,'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','2026-11-13 22:03:10','2021630001/Reportes/d4e3e14a-2368-468e-a827-b4856b387e1c.pdf');
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
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_mensual`
--

LOCK TABLES `revision_reporte_mensual` WRITE;
/*!40000 ALTER TABLE `revision_reporte_mensual` DISABLE KEYS */;
INSERT INTO `revision_reporte_mensual` VALUES
(73,25,4,'alumno','aprobado',NULL,'6ede9af7f9aec0b0624eef2f214dff8613e93e1f2328d6cf1f0b734ac69d07d5',NULL,'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','2026-12-09 12:00:00','2021630001/Reportes/1f164e0d-07ce-4d8b-8004-e03e030aeb43.pdf'),
(74,25,3,'profesor','aprobado',NULL,'df0eba51bf0ab16031bc78513fc2def6edb33f82738147143bad809817267f72','172.18.0.1','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','2026-11-08 22:01:54','2021630001/Reportes/112386d2-5783-4fd7-88b4-2c023de8c049.pdf'),
(75,25,1,'coordinador','aprobado',NULL,'6f7d74663094725462957ac65f2210ebc6ed23a47bc76a9ffef179c81bc7c269',NULL,'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','2026-12-09 12:00:00','2021630001/Reportes/ce85b45c-fb32-4e58-b955-b861f6fbca30.pdf'),
(76,26,4,'alumno','aprobado',NULL,'6e10b4d0d1860a7a020ed134085c731889e37e932849a10c976fc957b90c0adc',NULL,'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','2027-01-09 12:00:00','2021630001/Reportes/7b54f740-c762-4149-8ee6-b35ca1ace65c.pdf'),
(77,26,3,'profesor','aprobado',NULL,'d39cfaa9910ba504c6d7963f84b5bdb6b8de2b99738007f312fb77c3f39878db',NULL,'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','2027-01-09 12:00:00','2021630001/Reportes/6a8c2e90-eece-448f-b6dc-158018d129d2.pdf'),
(78,26,1,'coordinador','aprobado',NULL,'575eda2b83018648df2e3c4c63912ce0f302d9f9427b4685b983651aacd46ee0',NULL,'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','2027-01-09 12:00:00','2021630001/Reportes/5f7a89e6-6a67-41f9-88bf-d8efe92e2ebd.pdf'),
(79,27,4,'alumno','aprobado',NULL,'83c37c5c0c3d2b31cde081e2f967f3eef3ac469219cf1990e92d99f7e91cf4d4',NULL,'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','2027-02-09 12:00:00','2021630001/Reportes/79d14188-4f05-4737-a98e-04af8af7edae.pdf'),
(80,27,3,'profesor','aprobado',NULL,'bc3c83e8d529e2ee377136a6c568e553491eab608589333acce8296c729a0d5b',NULL,'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','2027-02-09 12:00:00','2021630001/Reportes/720d37e9-bd83-4911-bd59-b92d34c4ba77.pdf'),
(81,27,1,'coordinador','aprobado',NULL,'f4b7759843971a9dafa31c964cbb10c25814f8351b581842848c1abbac3ddc20',NULL,'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','2027-02-09 12:00:00','2021630001/Reportes/bb0d9edb-861a-48b6-aeaf-d7d79e0af4ff.pdf'),
(82,28,4,'alumno','aprobado',NULL,'2821c46dd06341df10de20c1f763007cb629ef74a4cb03914e835d940d1eb60a',NULL,'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','2027-03-10 12:00:00','2021630001/Reportes/50f9f7fc-89c1-4928-a2c0-fcb6cfd6f7a4.pdf'),
(83,28,3,'profesor','aprobado',NULL,'466163be48f45500468eeaf30f12ebe1c402efb827db7b91de489966baf493e1',NULL,'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','2027-03-10 12:00:00','2021630001/Reportes/f8d192bb-25a5-4a9f-9aaf-e524ca759c25.pdf'),
(84,28,1,'coordinador','aprobado',NULL,'8f16601a0003df847cce54ebd12708574eba52bf67841f79cbd5cbb1ea4efcfa',NULL,'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','2027-03-10 12:00:00','2021630001/Reportes/a3497e50-9334-4670-8e22-5d8e3141881a.pdf'),
(85,29,4,'alumno','aprobado',NULL,'b4b0326b4d38398ec5f3afba485c1293643edfacf0dcbedb438fd1fb20a4f087',NULL,'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','2027-04-07 12:00:00','2021630001/Reportes/20a24788-3bd1-4d68-8c85-346c6bbf0b7f.pdf'),
(86,29,3,'profesor','aprobado',NULL,'82203b8a44cb75a6573a194fed93122fed99772ade32172ba41375b993862f83',NULL,'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','2027-04-07 12:00:00','2021630001/Reportes/4717eb56-3fc3-4a33-bf7d-1329cec3d7ca.pdf'),
(87,29,1,'coordinador','aprobado',NULL,'04e5627b000934b09b02cba7cc94ba8f85fc3e56cdb74831c219332883d095b1',NULL,'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','2027-04-07 12:00:00','2021630001/Reportes/8b947d70-eee4-43fa-bf34-cccd527f2aab.pdf'),
(88,30,4,'alumno','aprobado',NULL,'bc68c67cabadbe6299542c148900ba51fb418a38f6a22b3f12778384e87fb62b',NULL,'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','2027-05-10 12:00:00','2021630001/Reportes/22bdad99-546e-4a21-afb5-ce76a13bad77.pdf'),
(89,30,3,'profesor','aprobado',NULL,'1274cf5ddbd2c27f635c0e277f4d0e2d4246c6749404f6f7630283d351d3bdb9',NULL,'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','2027-05-10 12:00:00','2021630001/Reportes/08d2fb8a-d800-4f9d-8846-5278cd550236.pdf'),
(90,30,1,'coordinador','aprobado',NULL,'e0559ffb499908482029cebdc49a8eab93b722af79cf1b8d6d13e686f50c4bb3',NULL,'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','2027-05-10 12:00:00','2021630001/Reportes/7955db1d-9493-4a3a-a6dc-e97c37d85af7.pdf'),
(91,31,4,'alumno','aprobado',NULL,'a5db27c45e0f087cf996c21a7cda828b02234dea414ac07d38c11a9f1e29816a',NULL,'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','2027-06-09 12:00:00','2021630001/Reportes/f70dbf7d-bab9-4345-8bf4-2bf681e75339.pdf'),
(92,31,3,'profesor','aprobado',NULL,'eea178e1d7ec54912e22425dbfbbb60c113cbc32ff1f5e494e89fbb2c116fc3a',NULL,'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','2027-06-09 12:00:00','2021630001/Reportes/f1450578-c1f6-47d3-8ec1-589b04f06d15.pdf'),
(93,31,1,'coordinador','aprobado',NULL,'d41d60119a5c13618870ec5cdce95fcbee0a598b1fe6398005bd27af309ac657',NULL,'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','2027-06-09 12:00:00','2021630001/Reportes/1ab789b0-ebcc-48cc-b52b-f1f887e01768.pdf'),
(94,32,4,'alumno','aprobado',NULL,'af74d920fe033c126022eb37ecfa00aead43769bb0450e797b7c9c6246ce4d75',NULL,'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','2027-07-10 12:00:00','2021630001/Reportes/c680b845-e5fb-4867-95bf-5e361bc50077.pdf'),
(95,32,3,'profesor','aprobado',NULL,'9e797279fd9ebc8c4d70c48430fa273e7f8cd8b2c415f65dd75fea7314728be5',NULL,'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','2027-07-10 12:00:00','2021630001/Reportes/08dab143-29e5-4df2-b1f9-72bb104793ba.pdf'),
(96,32,1,'coordinador','aprobado',NULL,'5a5960853571ba04779ee7a02a2ef92d6cae5db573d38b35696b64a587640e9f',NULL,'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','2027-07-10 12:00:00','2021630001/Reportes/41818cfa-3c3e-4096-8891-513b564b9e3d.pdf');
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
(1,'2021630001',1,NULL,39,1,'soy muy buena programando y me gustaría hacer mi servicio social aquí, ya casi acabo mi carrera así que siento que podría aportar mucho en este proyecto de seguimiento académico','alumno_asignado','expediente_pendiente_revision','2026-11-08 19:08:26',NULL,NULL,1,1,1,1,'2026-11-08 19:34:30');
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
(1,'coordinador','coordinadorherrera@ipn.mx','GABRIELA','HERRERA SOTELO','$2b$10$QYMmAJcLZkuqjMT0fzBisuzH/oP4UpcYV68hfldCZpA7yZqckyqFG',NULL,NULL,NULL,'2026-11-08 07:02:16',1,NULL,NULL,NULL),
(2,'coordinador','coordinadorvillagran@ipn.mx','OMAR','VILLAGRAN CASTRO','$2b$10$FrHdnBDBPxh7uV2KBb9uXOYU1hAj4jFhF7PVsCppbSSHL0Oh0PzC.',0,0,NULL,'2026-11-08 07:02:16',1,NULL,NULL,NULL),
(3,'profesor','profesornavarro@ipn.mx','RICARDO','NAVARRO OLVERA','$2b$10$sxfdFOzyZbEf6Mo5X68d5O5uVv.aMRmvoTBOWRZk/fVUYDLPrHuD6',0,0,NULL,'2026-11-08 07:20:27',1,'profesornavarro@ipn.mx/Rubrica/rubrica.enc','172.18.0.1','2026-11-08 22:01:54'),
(4,'alumno_asignado','mendoza0001@alumno.ipn.mx','DANIELA','MENDOZA CRUZ','$2b$10$1oXdDDiA8M/nm8Qeijht/uXP3fPMSMDBjGVLGNeR4OvrcAW/OlXlS',0,0,NULL,'2026-11-08 19:00:23',NULL,'2021630001/Rubrica/rubrica.enc','2806:2f0:aa40:f095:d38:d3a:bf6a:6a27','2026-11-08 19:59:21');
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

-- Dump completed on 2026-11-09  0:23:12
