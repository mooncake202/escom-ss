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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad`
--

LOCK TABLES `actividad` WRITE;
/*!40000 ALTER TABLE `actividad` DISABLE KEYS */;
INSERT INTO `actividad` VALUES
(1,5,'Diseñar diagrama entidad-relación del módulo de becas','Diseñar diagrama entidad-relación del módulo de becas.','Entregable documentado en el repositorio del proyecto.','2026-12-04','sin_comenzar','2026-10-16 00:00:00',0,NULL,NULL),
(2,5,'Configurar entorno de pruebas del sistema','Configurar entorno de pruebas del sistema.','Entregable documentado en el repositorio del proyecto.','2026-10-26','completada_a_tiempo','2026-10-16 00:00:00',100,'2026-10-24 00:00:00',NULL),
(3,5,'Documentar manual de usuario del módulo de consulta','Documentar manual de usuario del módulo de consulta.','Entregable documentado en el repositorio del proyecto.','2026-10-30','vencida','2026-10-16 00:00:00',20,NULL,NULL),
(4,5,'Elaborar reporte de pruebas funcionales','Elaborar reporte de pruebas funcionales.','Entregable documentado en el repositorio del proyecto.','2026-10-20','completada_tarde','2026-10-16 00:00:00',100,'2026-10-23 00:00:00',NULL),
(5,14,'Dar seguimiento al monitoreo diario de equipos','Dar seguimiento al monitoreo diario de equipos.','Entregable documentado en el repositorio del proyecto.','2026-11-20','completada_a_tiempo','2026-10-01 00:00:00',100,'2026-11-03 00:00:00',NULL),
(6,14,'Reportar incidencias de hardware en laboratorios','Reportar incidencias de hardware en laboratorios.','Entregable documentado en el repositorio del proyecto.','2026-12-04','en_progreso','2026-10-01 00:00:00',50,NULL,NULL),
(7,14,'Actualizar inventario de equipo de cómputo','Actualizar inventario de equipo de cómputo.','Entregable documentado en el repositorio del proyecto.','2026-12-04','en_progreso','2026-10-01 00:00:00',55,NULL,NULL),
(8,14,'Capacitar a nuevos usuarios de los laboratorios de cómputo','Impartir una breve capacitación a los alumnos de nuevo ingreso sobre el uso correcto del equipo.','Lista de asistencia firmada y material de apoyo entregado.','2026-12-04','sin_comenzar','2026-10-01 00:00:00',0,NULL,NULL),
(9,14,'Depurar licencias de software vencidas','Depurar licencias de software vencidas.','Entregable documentado en el repositorio del proyecto.','2026-11-25','sin_comenzar','2026-10-01 00:00:00',0,NULL,'2026-11-12'),
(10,15,'Dar seguimiento continuo a la digitalización del archivo','Digitalizar, catalogar y respaldar los expedientes históricos del archivo escolar.','Avance acumulado del archivo digitalizado, con respaldo verificado.','2027-01-15','completada_a_tiempo','2026-06-01 00:00:00',100,'2026-12-10 00:00:00',NULL),
(11,16,'Dar seguimiento al rediseño de la plataforma de becas','Dar seguimiento al rediseño de la plataforma de becas.','Avance acumulado documentado y verificado.','2027-01-15','completada_a_tiempo','2026-06-01 00:00:00',100,'2026-12-10 00:00:00',NULL);
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
('2019630201',11,'5534567802','ISC',88.00,8,'fernanda.camacho.personal@gmail.com'),
('2019630501',14,'5567890105','ISC',80.00,8,'sofia.barrera.personal@gmail.com'),
('2019630801',17,'5590123408','ISC',84.00,8,'luis.guerrero.personal@gmail.com'),
('2019631101',20,'5523456711','ISC',87.00,8,'valeria.ibarra.personal@gmail.com'),
('2019631501',24,'5567891501','ISC',93.00,9,'itzel.fuentes.personal@gmail.com'),
('2020630101',10,'5523456701','IA',82.00,7,'diego.rosales.personal@gmail.com'),
('2020630301',12,'5545678903','LCD',91.00,9,'andres.briones.personal@gmail.com'),
('2020630601',15,'5578901206','ISC',77.00,7,'ricardo.estrada.personal@gmail.com'),
('2020630901',18,'5501234509','ISC',86.00,9,'daniela.maldonado.personal@gmail.com'),
('2020631201',21,'5534567812','ISC',83.00,9,'emiliano.pacheco.personal@gmail.com'),
('2020631401',23,'5556781401','IA',81.00,7,'gerardo.rangel.personal@gmail.com'),
('2020631601',25,'5578901601','ISC',88.00,9,'mariana.rosado.personal@gmail.com'),
('2021630401',13,'5556789004','ISC',95.00,8,'monica.quintero.personal@gmail.com'),
('2021630701',16,'5589012307','ISC',79.00,7,'paulina.nava.personal@gmail.com'),
('2021631001',19,'5512345610','LCD',90.00,8,'oscar.cervantes.personal@gmail.com'),
('2021631301',22,'5545678913','ISC',85.00,8,'alejandra.olvera.personal@gmail.com');
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
) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
INSERT INTO `bitacora` VALUES
(1,14,'2026-10-06 14:00:00','2026-10-06 18:00:00',4,'aprobada','2026-10-06',NULL,'2026-11-09 04:51:32',2),
(2,14,'2026-10-08 14:00:00','2026-10-08 18:00:00',4,'rechazada','2026-10-08','La evidencia adjunta no corresponde con el avance reportado.','2026-11-09 04:51:32',2),
(3,14,'2026-10-13 14:00:00','2026-10-13 18:00:00',4,'aprobada','2026-10-13',NULL,'2026-11-09 04:51:32',2),
(4,14,'2026-10-27 14:00:00','2026-10-27 18:00:00',4,'pendiente_revision','2026-10-27',NULL,NULL,NULL),
(5,14,'2026-10-20 14:00:00','2026-10-20 18:00:00',4,'aprobada','2026-10-20',NULL,'2026-11-09 04:51:32',2),
(6,14,'2026-11-03 14:00:00','2026-11-03 18:00:00',4,'aprobada','2026-11-03',NULL,'2026-11-09 04:51:32',2),
(7,15,'2026-06-01 14:00:00','2026-06-01 18:00:00',4,'aprobada','2026-06-01',NULL,'2026-06-01 00:00:00',NULL),
(8,15,'2026-06-02 14:00:00','2026-06-02 18:00:00',4,'aprobada','2026-06-02',NULL,'2026-06-02 00:00:00',NULL),
(9,15,'2026-06-03 14:00:00','2026-06-03 18:00:00',4,'aprobada','2026-06-03',NULL,'2026-06-03 00:00:00',NULL),
(10,15,'2026-06-04 14:00:00','2026-06-04 18:00:00',4,'aprobada','2026-06-04',NULL,'2026-06-04 00:00:00',NULL),
(11,15,'2026-06-05 14:00:00','2026-06-05 18:00:00',4,'aprobada','2026-06-05',NULL,'2026-06-05 00:00:00',NULL),
(12,15,'2026-06-08 14:00:00','2026-06-08 18:00:00',4,'aprobada','2026-06-08',NULL,'2026-06-08 00:00:00',NULL),
(13,15,'2026-06-09 14:00:00','2026-06-09 18:00:00',4,'aprobada','2026-06-09',NULL,'2026-06-09 00:00:00',NULL),
(14,15,'2026-06-10 14:00:00','2026-06-10 18:00:00',4,'aprobada','2026-06-10',NULL,'2026-06-10 00:00:00',NULL),
(15,15,'2026-06-11 14:00:00','2026-06-11 18:00:00',4,'aprobada','2026-06-11',NULL,'2026-06-11 00:00:00',NULL),
(16,15,'2026-06-12 14:00:00','2026-06-12 18:00:00',4,'aprobada','2026-06-12',NULL,'2026-06-12 00:00:00',NULL),
(17,15,'2026-06-15 14:00:00','2026-06-15 18:00:00',4,'aprobada','2026-06-15',NULL,'2026-06-15 00:00:00',NULL),
(18,15,'2026-06-16 14:00:00','2026-06-16 18:00:00',4,'aprobada','2026-06-16',NULL,'2026-06-16 00:00:00',NULL),
(19,15,'2026-06-17 14:00:00','2026-06-17 18:00:00',4,'aprobada','2026-06-17',NULL,'2026-06-17 00:00:00',NULL),
(20,15,'2026-06-18 14:00:00','2026-06-18 18:00:00',4,'aprobada','2026-06-18',NULL,'2026-06-18 00:00:00',NULL),
(21,15,'2026-06-19 14:00:00','2026-06-19 18:00:00',4,'aprobada','2026-06-19',NULL,'2026-06-19 00:00:00',NULL),
(22,15,'2026-06-22 14:00:00','2026-06-22 18:00:00',4,'aprobada','2026-06-22',NULL,'2026-06-22 00:00:00',NULL),
(23,15,'2026-06-23 14:00:00','2026-06-23 18:00:00',4,'aprobada','2026-06-23',NULL,'2026-06-23 00:00:00',NULL),
(24,15,'2026-06-24 14:00:00','2026-06-24 18:00:00',4,'aprobada','2026-06-24',NULL,'2026-06-24 00:00:00',NULL),
(25,15,'2026-06-25 14:00:00','2026-06-25 18:00:00',4,'aprobada','2026-06-25',NULL,'2026-06-25 00:00:00',NULL),
(26,15,'2026-06-26 14:00:00','2026-06-26 18:00:00',4,'aprobada','2026-06-26',NULL,'2026-06-26 00:00:00',NULL),
(27,15,'2026-06-29 14:00:00','2026-06-29 18:00:00',4,'aprobada','2026-06-29',NULL,'2026-06-29 00:00:00',NULL),
(28,15,'2026-06-30 14:00:00','2026-06-30 18:00:00',4,'aprobada','2026-06-30',NULL,'2026-06-30 00:00:00',NULL),
(29,15,'2026-07-01 14:00:00','2026-07-01 18:00:00',4,'aprobada','2026-07-01',NULL,'2026-07-01 00:00:00',NULL),
(30,15,'2026-07-02 14:00:00','2026-07-02 18:00:00',4,'aprobada','2026-07-02',NULL,'2026-07-02 00:00:00',NULL),
(31,15,'2026-07-03 14:00:00','2026-07-03 18:00:00',4,'aprobada','2026-07-03',NULL,'2026-07-03 00:00:00',NULL),
(32,15,'2026-07-06 14:00:00','2026-07-06 18:00:00',4,'aprobada','2026-07-06',NULL,'2026-07-06 00:00:00',NULL),
(33,15,'2026-07-07 14:00:00','2026-07-07 18:00:00',4,'aprobada','2026-07-07',NULL,'2026-07-07 00:00:00',NULL),
(34,15,'2026-07-08 14:00:00','2026-07-08 18:00:00',4,'aprobada','2026-07-08',NULL,'2026-07-08 00:00:00',NULL),
(35,15,'2026-07-09 14:00:00','2026-07-09 18:00:00',4,'aprobada','2026-07-09',NULL,'2026-07-09 00:00:00',NULL),
(36,15,'2026-07-10 14:00:00','2026-07-10 18:00:00',4,'aprobada','2026-07-10',NULL,'2026-07-10 00:00:00',NULL),
(37,15,'2026-07-13 14:00:00','2026-07-13 18:00:00',4,'aprobada','2026-07-13',NULL,'2026-07-13 00:00:00',NULL),
(38,15,'2026-07-14 14:00:00','2026-07-14 18:00:00',4,'aprobada','2026-07-14',NULL,'2026-07-14 00:00:00',NULL),
(39,15,'2026-07-15 14:00:00','2026-07-15 18:00:00',4,'aprobada','2026-07-15',NULL,'2026-07-15 00:00:00',NULL),
(40,15,'2026-07-16 14:00:00','2026-07-16 18:00:00',4,'aprobada','2026-07-16',NULL,'2026-07-16 00:00:00',NULL),
(41,15,'2026-07-17 14:00:00','2026-07-17 18:00:00',4,'aprobada','2026-07-17',NULL,'2026-07-17 00:00:00',NULL),
(42,15,'2026-07-20 14:00:00','2026-07-20 18:00:00',4,'aprobada','2026-07-20',NULL,'2026-07-20 00:00:00',NULL),
(43,15,'2026-07-21 14:00:00','2026-07-21 18:00:00',4,'aprobada','2026-07-21',NULL,'2026-07-21 00:00:00',NULL),
(44,15,'2026-07-22 14:00:00','2026-07-22 18:00:00',4,'aprobada','2026-07-22',NULL,'2026-07-22 00:00:00',NULL),
(45,15,'2026-07-23 14:00:00','2026-07-23 18:00:00',4,'aprobada','2026-07-23',NULL,'2026-07-23 00:00:00',NULL),
(46,15,'2026-07-24 14:00:00','2026-07-24 18:00:00',4,'aprobada','2026-07-24',NULL,'2026-07-24 00:00:00',NULL),
(47,15,'2026-07-27 14:00:00','2026-07-27 18:00:00',4,'aprobada','2026-07-27',NULL,'2026-07-27 00:00:00',NULL),
(48,15,'2026-07-28 14:00:00','2026-07-28 18:00:00',4,'aprobada','2026-07-28',NULL,'2026-07-28 00:00:00',NULL),
(49,15,'2026-07-29 14:00:00','2026-07-29 18:00:00',4,'aprobada','2026-07-29',NULL,'2026-07-29 00:00:00',NULL),
(50,15,'2026-07-30 14:00:00','2026-07-30 18:00:00',4,'aprobada','2026-07-30',NULL,'2026-07-30 00:00:00',NULL),
(51,15,'2026-07-31 14:00:00','2026-07-31 18:00:00',4,'aprobada','2026-07-31',NULL,'2026-07-31 00:00:00',NULL),
(52,15,'2026-08-24 14:00:00','2026-08-24 18:00:00',4,'aprobada','2026-08-24',NULL,'2026-08-24 00:00:00',NULL),
(53,15,'2026-08-25 14:00:00','2026-08-25 18:00:00',4,'aprobada','2026-08-25',NULL,'2026-08-25 00:00:00',NULL),
(54,15,'2026-08-26 14:00:00','2026-08-26 18:00:00',4,'aprobada','2026-08-26',NULL,'2026-08-26 00:00:00',NULL),
(55,15,'2026-08-27 14:00:00','2026-08-27 18:00:00',4,'aprobada','2026-08-27',NULL,'2026-08-27 00:00:00',NULL),
(56,15,'2026-08-28 14:00:00','2026-08-28 18:00:00',4,'aprobada','2026-08-28',NULL,'2026-08-28 00:00:00',NULL),
(57,15,'2026-08-31 14:00:00','2026-08-31 18:00:00',4,'aprobada','2026-08-31',NULL,'2026-08-31 00:00:00',NULL),
(58,15,'2026-09-01 14:00:00','2026-09-01 18:00:00',4,'aprobada','2026-09-01',NULL,'2026-09-01 00:00:00',NULL),
(59,15,'2026-09-02 14:00:00','2026-09-02 18:00:00',4,'aprobada','2026-09-02',NULL,'2026-09-02 00:00:00',NULL),
(60,15,'2026-09-03 14:00:00','2026-09-03 18:00:00',4,'aprobada','2026-09-03',NULL,'2026-09-03 00:00:00',NULL),
(61,15,'2026-09-04 14:00:00','2026-09-04 18:00:00',4,'aprobada','2026-09-04',NULL,'2026-09-04 00:00:00',NULL),
(62,15,'2026-09-07 14:00:00','2026-09-07 18:00:00',4,'aprobada','2026-09-07',NULL,'2026-09-07 00:00:00',NULL),
(63,15,'2026-09-08 14:00:00','2026-09-08 18:00:00',4,'aprobada','2026-09-08',NULL,'2026-09-08 00:00:00',NULL),
(64,15,'2026-09-09 14:00:00','2026-09-09 18:00:00',4,'aprobada','2026-09-09',NULL,'2026-09-09 00:00:00',NULL),
(65,15,'2026-09-10 14:00:00','2026-09-10 18:00:00',4,'aprobada','2026-09-10',NULL,'2026-09-10 00:00:00',NULL),
(66,15,'2026-09-11 14:00:00','2026-09-11 18:00:00',4,'aprobada','2026-09-11',NULL,'2026-09-11 00:00:00',NULL),
(67,15,'2026-09-14 14:00:00','2026-09-14 18:00:00',4,'aprobada','2026-09-14',NULL,'2026-09-14 00:00:00',NULL),
(68,15,'2026-09-15 14:00:00','2026-09-15 18:00:00',4,'aprobada','2026-09-15',NULL,'2026-09-15 00:00:00',NULL),
(69,15,'2026-09-17 14:00:00','2026-09-17 18:00:00',4,'aprobada','2026-09-17',NULL,'2026-09-17 00:00:00',NULL),
(70,15,'2026-09-18 14:00:00','2026-09-18 18:00:00',4,'aprobada','2026-09-18',NULL,'2026-09-18 00:00:00',NULL),
(71,15,'2026-09-21 14:00:00','2026-09-21 18:00:00',4,'aprobada','2026-09-21',NULL,'2026-09-21 00:00:00',NULL),
(72,15,'2026-09-22 14:00:00','2026-09-22 18:00:00',4,'aprobada','2026-09-22',NULL,'2026-09-22 00:00:00',NULL),
(73,15,'2026-09-23 14:00:00','2026-09-23 18:00:00',4,'aprobada','2026-09-23',NULL,'2026-09-23 00:00:00',NULL),
(74,15,'2026-09-24 14:00:00','2026-09-24 18:00:00',4,'aprobada','2026-09-24',NULL,'2026-09-24 00:00:00',NULL),
(75,15,'2026-09-25 14:00:00','2026-09-25 18:00:00',4,'aprobada','2026-09-25',NULL,'2026-09-25 00:00:00',NULL),
(76,15,'2026-09-28 14:00:00','2026-09-28 18:00:00',4,'aprobada','2026-09-28',NULL,'2026-09-28 00:00:00',NULL),
(77,15,'2026-09-29 14:00:00','2026-09-29 18:00:00',4,'aprobada','2026-09-29',NULL,'2026-09-29 00:00:00',NULL),
(78,15,'2026-09-30 14:00:00','2026-09-30 18:00:00',4,'aprobada','2026-09-30',NULL,'2026-09-30 00:00:00',NULL),
(79,15,'2026-10-01 14:00:00','2026-10-01 18:00:00',4,'aprobada','2026-10-01',NULL,'2026-10-01 00:00:00',NULL),
(80,15,'2026-10-02 14:00:00','2026-10-02 18:00:00',4,'aprobada','2026-10-02',NULL,'2026-10-02 00:00:00',NULL),
(81,15,'2026-10-05 14:00:00','2026-10-05 18:00:00',4,'aprobada','2026-10-05',NULL,'2026-10-05 00:00:00',NULL),
(82,15,'2026-10-06 14:00:00','2026-10-06 18:00:00',4,'aprobada','2026-10-06',NULL,'2026-10-06 00:00:00',NULL),
(83,15,'2026-10-07 14:00:00','2026-10-07 18:00:00',4,'aprobada','2026-10-07',NULL,'2026-10-07 00:00:00',NULL),
(84,15,'2026-10-09 14:00:00','2026-10-09 18:00:00',4,'aprobada','2026-10-09',NULL,'2026-10-09 00:00:00',NULL),
(85,15,'2026-10-12 14:00:00','2026-10-12 18:00:00',4,'aprobada','2026-10-12',NULL,'2026-10-12 00:00:00',NULL),
(86,15,'2026-10-13 14:00:00','2026-10-13 18:00:00',4,'aprobada','2026-10-13',NULL,'2026-10-13 00:00:00',NULL),
(87,15,'2026-10-14 14:00:00','2026-10-14 18:00:00',4,'aprobada','2026-10-14',NULL,'2026-10-14 00:00:00',NULL),
(88,15,'2026-10-15 14:00:00','2026-10-15 18:00:00',4,'aprobada','2026-10-15',NULL,'2026-10-15 00:00:00',NULL),
(89,15,'2026-10-16 14:00:00','2026-10-16 18:00:00',4,'aprobada','2026-10-16',NULL,'2026-10-16 00:00:00',NULL),
(90,15,'2026-10-19 14:00:00','2026-10-19 18:00:00',4,'aprobada','2026-10-19',NULL,'2026-10-19 00:00:00',NULL),
(91,15,'2026-10-20 14:00:00','2026-10-20 18:00:00',4,'aprobada','2026-10-20',NULL,'2026-10-20 00:00:00',NULL),
(92,15,'2026-10-21 14:00:00','2026-10-21 18:00:00',4,'aprobada','2026-10-21',NULL,'2026-10-21 00:00:00',NULL),
(93,15,'2026-10-23 14:00:00','2026-10-23 18:00:00',4,'aprobada','2026-10-23',NULL,'2026-10-23 00:00:00',NULL),
(94,15,'2026-10-26 14:00:00','2026-10-26 18:00:00',4,'aprobada','2026-10-26',NULL,'2026-10-26 00:00:00',NULL),
(95,15,'2026-10-27 14:00:00','2026-10-27 18:00:00',4,'aprobada','2026-10-27',NULL,'2026-10-27 00:00:00',NULL),
(96,15,'2026-10-28 14:00:00','2026-10-28 18:00:00',4,'aprobada','2026-10-28',NULL,'2026-10-28 00:00:00',NULL),
(97,15,'2026-10-29 14:00:00','2026-10-29 18:00:00',4,'aprobada','2026-10-29',NULL,'2026-10-29 00:00:00',NULL),
(98,15,'2026-10-30 14:00:00','2026-10-30 18:00:00',4,'aprobada','2026-10-30',NULL,'2026-10-30 00:00:00',NULL),
(99,15,'2026-11-02 14:00:00','2026-11-02 18:00:00',4,'aprobada','2026-11-02',NULL,'2026-11-02 00:00:00',NULL),
(100,15,'2026-11-03 14:00:00','2026-11-03 18:00:00',4,'aprobada','2026-11-03',NULL,'2026-11-03 00:00:00',NULL),
(101,15,'2026-11-04 14:00:00','2026-11-04 18:00:00',4,'aprobada','2026-11-04',NULL,'2026-11-04 00:00:00',NULL),
(102,15,'2026-11-05 14:00:00','2026-11-05 18:00:00',4,'aprobada','2026-11-05',NULL,'2026-11-05 00:00:00',NULL),
(103,15,'2026-11-06 14:00:00','2026-11-06 18:00:00',4,'aprobada','2026-11-06',NULL,'2026-11-06 00:00:00',NULL),
(104,15,'2026-11-09 14:00:00','2026-11-09 18:00:00',4,'aprobada','2026-11-09',NULL,'2026-11-09 00:00:00',NULL),
(105,15,'2026-11-10 14:00:00','2026-11-10 18:00:00',4,'aprobada','2026-11-10',NULL,'2026-11-10 00:00:00',NULL),
(106,15,'2026-11-11 14:00:00','2026-11-11 18:00:00',4,'aprobada','2026-11-11',NULL,'2026-11-11 00:00:00',NULL),
(107,15,'2026-11-12 14:00:00','2026-11-12 18:00:00',4,'aprobada','2026-11-12',NULL,'2026-11-12 00:00:00',NULL),
(108,15,'2026-11-13 14:00:00','2026-11-13 18:00:00',4,'aprobada','2026-11-13',NULL,'2026-11-13 00:00:00',NULL),
(109,15,'2026-11-17 14:00:00','2026-11-17 18:00:00',4,'aprobada','2026-11-17',NULL,'2026-11-17 00:00:00',NULL),
(110,15,'2026-11-18 14:00:00','2026-11-18 18:00:00',4,'aprobada','2026-11-18',NULL,'2026-11-18 00:00:00',NULL),
(111,15,'2026-11-19 14:00:00','2026-11-19 18:00:00',4,'aprobada','2026-11-19',NULL,'2026-11-19 00:00:00',NULL),
(112,15,'2026-11-20 14:00:00','2026-11-20 18:00:00',4,'aprobada','2026-11-20',NULL,'2026-11-20 00:00:00',NULL),
(113,15,'2026-11-23 14:00:00','2026-11-23 18:00:00',4,'aprobada','2026-11-23',NULL,'2026-11-23 00:00:00',NULL),
(114,15,'2026-11-24 14:00:00','2026-11-24 18:00:00',4,'aprobada','2026-11-24',NULL,'2026-11-24 00:00:00',NULL),
(115,15,'2026-11-25 14:00:00','2026-11-25 18:00:00',4,'aprobada','2026-11-25',NULL,'2026-11-25 00:00:00',NULL),
(116,15,'2026-11-26 14:00:00','2026-11-26 18:00:00',4,'aprobada','2026-11-26',NULL,'2026-11-26 00:00:00',NULL),
(117,15,'2026-11-27 14:00:00','2026-11-27 18:00:00',4,'aprobada','2026-11-27',NULL,'2026-11-27 00:00:00',NULL),
(118,15,'2026-11-30 14:00:00','2026-11-30 18:00:00',4,'aprobada','2026-11-30',NULL,'2026-11-30 00:00:00',NULL),
(119,15,'2026-12-01 14:00:00','2026-12-01 18:00:00',4,'aprobada','2026-12-01',NULL,'2026-12-01 00:00:00',NULL),
(120,15,'2026-12-02 14:00:00','2026-12-02 18:00:00',4,'aprobada','2026-12-02',NULL,'2026-12-02 00:00:00',NULL),
(121,15,'2026-12-03 14:00:00','2026-12-03 18:00:00',4,'aprobada','2026-12-03',NULL,'2026-12-03 00:00:00',NULL),
(122,15,'2026-12-04 14:00:00','2026-12-04 18:00:00',4,'aprobada','2026-12-04',NULL,'2026-12-04 00:00:00',NULL),
(123,15,'2026-12-07 14:00:00','2026-12-07 18:00:00',4,'aprobada','2026-12-07',NULL,'2026-12-07 00:00:00',NULL),
(124,15,'2026-12-08 14:00:00','2026-12-08 18:00:00',4,'aprobada','2026-12-08',NULL,'2026-12-08 00:00:00',NULL),
(125,15,'2026-12-09 14:00:00','2026-12-09 18:00:00',4,'aprobada','2026-12-09',NULL,'2026-12-09 00:00:00',NULL),
(126,15,'2026-12-10 14:00:00','2026-12-10 18:00:00',4,'aprobada','2026-12-10',NULL,'2026-12-10 00:00:00',NULL),
(127,16,'2026-06-01 14:00:00','2026-06-01 18:00:00',4,'aprobada','2026-06-01',NULL,'2026-06-01 00:00:00',NULL),
(128,16,'2026-06-02 14:00:00','2026-06-02 18:00:00',4,'aprobada','2026-06-02',NULL,'2026-06-02 00:00:00',NULL),
(129,16,'2026-06-03 14:00:00','2026-06-03 18:00:00',4,'aprobada','2026-06-03',NULL,'2026-06-03 00:00:00',NULL),
(130,16,'2026-06-04 14:00:00','2026-06-04 18:00:00',4,'aprobada','2026-06-04',NULL,'2026-06-04 00:00:00',NULL),
(131,16,'2026-06-05 14:00:00','2026-06-05 18:00:00',4,'aprobada','2026-06-05',NULL,'2026-06-05 00:00:00',NULL),
(132,16,'2026-06-08 14:00:00','2026-06-08 18:00:00',4,'aprobada','2026-06-08',NULL,'2026-06-08 00:00:00',NULL),
(133,16,'2026-06-09 14:00:00','2026-06-09 18:00:00',4,'aprobada','2026-06-09',NULL,'2026-06-09 00:00:00',NULL),
(134,16,'2026-06-10 14:00:00','2026-06-10 18:00:00',4,'aprobada','2026-06-10',NULL,'2026-06-10 00:00:00',NULL),
(135,16,'2026-06-11 14:00:00','2026-06-11 18:00:00',4,'aprobada','2026-06-11',NULL,'2026-06-11 00:00:00',NULL),
(136,16,'2026-06-12 14:00:00','2026-06-12 18:00:00',4,'aprobada','2026-06-12',NULL,'2026-06-12 00:00:00',NULL),
(137,16,'2026-06-15 14:00:00','2026-06-15 18:00:00',4,'aprobada','2026-06-15',NULL,'2026-06-15 00:00:00',NULL),
(138,16,'2026-06-16 14:00:00','2026-06-16 18:00:00',4,'aprobada','2026-06-16',NULL,'2026-06-16 00:00:00',NULL),
(139,16,'2026-06-17 14:00:00','2026-06-17 18:00:00',4,'aprobada','2026-06-17',NULL,'2026-06-17 00:00:00',NULL),
(140,16,'2026-06-18 14:00:00','2026-06-18 18:00:00',4,'aprobada','2026-06-18',NULL,'2026-06-18 00:00:00',NULL),
(141,16,'2026-06-19 14:00:00','2026-06-19 18:00:00',4,'aprobada','2026-06-19',NULL,'2026-06-19 00:00:00',NULL),
(142,16,'2026-06-22 14:00:00','2026-06-22 18:00:00',4,'aprobada','2026-06-22',NULL,'2026-06-22 00:00:00',NULL),
(143,16,'2026-06-23 14:00:00','2026-06-23 18:00:00',4,'aprobada','2026-06-23',NULL,'2026-06-23 00:00:00',NULL),
(144,16,'2026-06-24 14:00:00','2026-06-24 18:00:00',4,'aprobada','2026-06-24',NULL,'2026-06-24 00:00:00',NULL),
(145,16,'2026-06-25 14:00:00','2026-06-25 18:00:00',4,'aprobada','2026-06-25',NULL,'2026-06-25 00:00:00',NULL),
(146,16,'2026-06-26 14:00:00','2026-06-26 18:00:00',4,'aprobada','2026-06-26',NULL,'2026-06-26 00:00:00',NULL),
(147,16,'2026-06-29 14:00:00','2026-06-29 18:00:00',4,'aprobada','2026-06-29',NULL,'2026-06-29 00:00:00',NULL),
(148,16,'2026-06-30 14:00:00','2026-06-30 18:00:00',4,'aprobada','2026-06-30',NULL,'2026-06-30 00:00:00',NULL),
(149,16,'2026-07-01 14:00:00','2026-07-01 18:00:00',4,'aprobada','2026-07-01',NULL,'2026-07-01 00:00:00',NULL),
(150,16,'2026-07-02 14:00:00','2026-07-02 18:00:00',4,'aprobada','2026-07-02',NULL,'2026-07-02 00:00:00',NULL),
(151,16,'2026-07-03 14:00:00','2026-07-03 18:00:00',4,'aprobada','2026-07-03',NULL,'2026-07-03 00:00:00',NULL),
(152,16,'2026-07-06 14:00:00','2026-07-06 18:00:00',4,'aprobada','2026-07-06',NULL,'2026-07-06 00:00:00',NULL),
(153,16,'2026-07-07 14:00:00','2026-07-07 18:00:00',4,'aprobada','2026-07-07',NULL,'2026-07-07 00:00:00',NULL),
(154,16,'2026-07-08 14:00:00','2026-07-08 18:00:00',4,'aprobada','2026-07-08',NULL,'2026-07-08 00:00:00',NULL),
(155,16,'2026-07-09 14:00:00','2026-07-09 18:00:00',4,'aprobada','2026-07-09',NULL,'2026-07-09 00:00:00',NULL),
(156,16,'2026-07-10 14:00:00','2026-07-10 18:00:00',4,'aprobada','2026-07-10',NULL,'2026-07-10 00:00:00',NULL),
(157,16,'2026-07-13 14:00:00','2026-07-13 18:00:00',4,'aprobada','2026-07-13',NULL,'2026-07-13 00:00:00',NULL),
(158,16,'2026-07-14 14:00:00','2026-07-14 18:00:00',4,'aprobada','2026-07-14',NULL,'2026-07-14 00:00:00',NULL),
(159,16,'2026-07-15 14:00:00','2026-07-15 18:00:00',4,'aprobada','2026-07-15',NULL,'2026-07-15 00:00:00',NULL),
(160,16,'2026-07-16 14:00:00','2026-07-16 18:00:00',4,'aprobada','2026-07-16',NULL,'2026-07-16 00:00:00',NULL),
(161,16,'2026-07-17 14:00:00','2026-07-17 18:00:00',4,'aprobada','2026-07-17',NULL,'2026-07-17 00:00:00',NULL),
(162,16,'2026-07-20 14:00:00','2026-07-20 18:00:00',4,'aprobada','2026-07-20',NULL,'2026-07-20 00:00:00',NULL),
(163,16,'2026-07-21 14:00:00','2026-07-21 18:00:00',4,'aprobada','2026-07-21',NULL,'2026-07-21 00:00:00',NULL),
(164,16,'2026-07-22 14:00:00','2026-07-22 18:00:00',4,'aprobada','2026-07-22',NULL,'2026-07-22 00:00:00',NULL),
(165,16,'2026-07-23 14:00:00','2026-07-23 18:00:00',4,'aprobada','2026-07-23',NULL,'2026-07-23 00:00:00',NULL),
(166,16,'2026-07-24 14:00:00','2026-07-24 18:00:00',4,'aprobada','2026-07-24',NULL,'2026-07-24 00:00:00',NULL),
(167,16,'2026-07-27 14:00:00','2026-07-27 18:00:00',4,'aprobada','2026-07-27',NULL,'2026-07-27 00:00:00',NULL),
(168,16,'2026-07-28 14:00:00','2026-07-28 18:00:00',4,'aprobada','2026-07-28',NULL,'2026-07-28 00:00:00',NULL),
(169,16,'2026-07-29 14:00:00','2026-07-29 18:00:00',4,'aprobada','2026-07-29',NULL,'2026-07-29 00:00:00',NULL),
(170,16,'2026-07-30 14:00:00','2026-07-30 18:00:00',4,'aprobada','2026-07-30',NULL,'2026-07-30 00:00:00',NULL),
(171,16,'2026-07-31 14:00:00','2026-07-31 18:00:00',4,'aprobada','2026-07-31',NULL,'2026-07-31 00:00:00',NULL),
(172,16,'2026-08-24 14:00:00','2026-08-24 18:00:00',4,'aprobada','2026-08-24',NULL,'2026-08-24 00:00:00',NULL),
(173,16,'2026-08-25 14:00:00','2026-08-25 18:00:00',4,'aprobada','2026-08-25',NULL,'2026-08-25 00:00:00',NULL),
(174,16,'2026-08-26 14:00:00','2026-08-26 18:00:00',4,'aprobada','2026-08-26',NULL,'2026-08-26 00:00:00',NULL),
(175,16,'2026-08-27 14:00:00','2026-08-27 18:00:00',4,'aprobada','2026-08-27',NULL,'2026-08-27 00:00:00',NULL),
(176,16,'2026-08-28 14:00:00','2026-08-28 18:00:00',4,'aprobada','2026-08-28',NULL,'2026-08-28 00:00:00',NULL),
(177,16,'2026-08-31 14:00:00','2026-08-31 18:00:00',4,'aprobada','2026-08-31',NULL,'2026-08-31 00:00:00',NULL),
(178,16,'2026-09-01 14:00:00','2026-09-01 18:00:00',4,'aprobada','2026-09-01',NULL,'2026-09-01 00:00:00',NULL),
(179,16,'2026-09-02 14:00:00','2026-09-02 18:00:00',4,'aprobada','2026-09-02',NULL,'2026-09-02 00:00:00',NULL),
(180,16,'2026-09-03 14:00:00','2026-09-03 18:00:00',4,'aprobada','2026-09-03',NULL,'2026-09-03 00:00:00',NULL),
(181,16,'2026-09-04 14:00:00','2026-09-04 18:00:00',4,'aprobada','2026-09-04',NULL,'2026-09-04 00:00:00',NULL),
(182,16,'2026-09-07 14:00:00','2026-09-07 18:00:00',4,'aprobada','2026-09-07',NULL,'2026-09-07 00:00:00',NULL),
(183,16,'2026-09-08 14:00:00','2026-09-08 18:00:00',4,'aprobada','2026-09-08',NULL,'2026-09-08 00:00:00',NULL),
(184,16,'2026-09-09 14:00:00','2026-09-09 18:00:00',4,'aprobada','2026-09-09',NULL,'2026-09-09 00:00:00',NULL),
(185,16,'2026-09-10 14:00:00','2026-09-10 18:00:00',4,'aprobada','2026-09-10',NULL,'2026-09-10 00:00:00',NULL),
(186,16,'2026-09-11 14:00:00','2026-09-11 18:00:00',4,'aprobada','2026-09-11',NULL,'2026-09-11 00:00:00',NULL),
(187,16,'2026-09-14 14:00:00','2026-09-14 18:00:00',4,'aprobada','2026-09-14',NULL,'2026-09-14 00:00:00',NULL),
(188,16,'2026-09-15 14:00:00','2026-09-15 18:00:00',4,'aprobada','2026-09-15',NULL,'2026-09-15 00:00:00',NULL),
(189,16,'2026-09-17 14:00:00','2026-09-17 18:00:00',4,'aprobada','2026-09-17',NULL,'2026-09-17 00:00:00',NULL),
(190,16,'2026-09-18 14:00:00','2026-09-18 18:00:00',4,'aprobada','2026-09-18',NULL,'2026-09-18 00:00:00',NULL),
(191,16,'2026-09-21 14:00:00','2026-09-21 18:00:00',4,'aprobada','2026-09-21',NULL,'2026-09-21 00:00:00',NULL),
(192,16,'2026-09-22 14:00:00','2026-09-22 18:00:00',4,'aprobada','2026-09-22',NULL,'2026-09-22 00:00:00',NULL),
(193,16,'2026-09-23 14:00:00','2026-09-23 18:00:00',4,'aprobada','2026-09-23',NULL,'2026-09-23 00:00:00',NULL),
(194,16,'2026-09-24 14:00:00','2026-09-24 18:00:00',4,'aprobada','2026-09-24',NULL,'2026-09-24 00:00:00',NULL),
(195,16,'2026-09-25 14:00:00','2026-09-25 18:00:00',4,'aprobada','2026-09-25',NULL,'2026-09-25 00:00:00',NULL),
(196,16,'2026-09-28 14:00:00','2026-09-28 18:00:00',4,'aprobada','2026-09-28',NULL,'2026-09-28 00:00:00',NULL),
(197,16,'2026-09-29 14:00:00','2026-09-29 18:00:00',4,'aprobada','2026-09-29',NULL,'2026-09-29 00:00:00',NULL),
(198,16,'2026-09-30 14:00:00','2026-09-30 18:00:00',4,'aprobada','2026-09-30',NULL,'2026-09-30 00:00:00',NULL),
(199,16,'2026-10-01 14:00:00','2026-10-01 18:00:00',4,'aprobada','2026-10-01',NULL,'2026-10-01 00:00:00',NULL),
(200,16,'2026-10-02 14:00:00','2026-10-02 18:00:00',4,'aprobada','2026-10-02',NULL,'2026-10-02 00:00:00',NULL),
(201,16,'2026-10-05 14:00:00','2026-10-05 18:00:00',4,'aprobada','2026-10-05',NULL,'2026-10-05 00:00:00',NULL),
(202,16,'2026-10-06 14:00:00','2026-10-06 18:00:00',4,'aprobada','2026-10-06',NULL,'2026-10-06 00:00:00',NULL),
(203,16,'2026-10-07 14:00:00','2026-10-07 18:00:00',4,'aprobada','2026-10-07',NULL,'2026-10-07 00:00:00',NULL),
(204,16,'2026-10-09 14:00:00','2026-10-09 18:00:00',4,'aprobada','2026-10-09',NULL,'2026-10-09 00:00:00',NULL),
(205,16,'2026-10-12 14:00:00','2026-10-12 18:00:00',4,'aprobada','2026-10-12',NULL,'2026-10-12 00:00:00',NULL),
(206,16,'2026-10-13 14:00:00','2026-10-13 18:00:00',4,'aprobada','2026-10-13',NULL,'2026-10-13 00:00:00',NULL),
(207,16,'2026-10-14 14:00:00','2026-10-14 18:00:00',4,'aprobada','2026-10-14',NULL,'2026-10-14 00:00:00',NULL),
(208,16,'2026-10-15 14:00:00','2026-10-15 18:00:00',4,'aprobada','2026-10-15',NULL,'2026-10-15 00:00:00',NULL),
(209,16,'2026-10-16 14:00:00','2026-10-16 18:00:00',4,'aprobada','2026-10-16',NULL,'2026-10-16 00:00:00',NULL),
(210,16,'2026-10-19 14:00:00','2026-10-19 18:00:00',4,'aprobada','2026-10-19',NULL,'2026-10-19 00:00:00',NULL),
(211,16,'2026-10-20 14:00:00','2026-10-20 18:00:00',4,'aprobada','2026-10-20',NULL,'2026-10-20 00:00:00',NULL),
(212,16,'2026-10-21 14:00:00','2026-10-21 18:00:00',4,'aprobada','2026-10-21',NULL,'2026-10-21 00:00:00',NULL),
(213,16,'2026-10-23 14:00:00','2026-10-23 18:00:00',4,'aprobada','2026-10-23',NULL,'2026-10-23 00:00:00',NULL),
(214,16,'2026-10-26 14:00:00','2026-10-26 18:00:00',4,'aprobada','2026-10-26',NULL,'2026-10-26 00:00:00',NULL),
(215,16,'2026-10-27 14:00:00','2026-10-27 18:00:00',4,'aprobada','2026-10-27',NULL,'2026-10-27 00:00:00',NULL),
(216,16,'2026-10-28 14:00:00','2026-10-28 18:00:00',4,'aprobada','2026-10-28',NULL,'2026-10-28 00:00:00',NULL),
(217,16,'2026-10-29 14:00:00','2026-10-29 18:00:00',4,'aprobada','2026-10-29',NULL,'2026-10-29 00:00:00',NULL),
(218,16,'2026-10-30 14:00:00','2026-10-30 18:00:00',4,'aprobada','2026-10-30',NULL,'2026-10-30 00:00:00',NULL),
(219,16,'2026-11-02 14:00:00','2026-11-02 18:00:00',4,'aprobada','2026-11-02',NULL,'2026-11-02 00:00:00',NULL),
(220,16,'2026-11-03 14:00:00','2026-11-03 18:00:00',4,'aprobada','2026-11-03',NULL,'2026-11-03 00:00:00',NULL),
(221,16,'2026-11-04 14:00:00','2026-11-04 18:00:00',4,'aprobada','2026-11-04',NULL,'2026-11-04 00:00:00',NULL),
(222,16,'2026-11-05 14:00:00','2026-11-05 18:00:00',4,'aprobada','2026-11-05',NULL,'2026-11-05 00:00:00',NULL),
(223,16,'2026-11-06 14:00:00','2026-11-06 18:00:00',4,'aprobada','2026-11-06',NULL,'2026-11-06 00:00:00',NULL),
(224,16,'2026-11-09 14:00:00','2026-11-09 18:00:00',4,'aprobada','2026-11-09',NULL,'2026-11-09 00:00:00',NULL),
(225,16,'2026-11-10 14:00:00','2026-11-10 18:00:00',4,'aprobada','2026-11-10',NULL,'2026-11-10 00:00:00',NULL),
(226,16,'2026-11-11 14:00:00','2026-11-11 18:00:00',4,'aprobada','2026-11-11',NULL,'2026-11-11 00:00:00',NULL),
(227,16,'2026-11-12 14:00:00','2026-11-12 18:00:00',4,'aprobada','2026-11-12',NULL,'2026-11-12 00:00:00',NULL),
(228,16,'2026-11-13 14:00:00','2026-11-13 18:00:00',4,'aprobada','2026-11-13',NULL,'2026-11-13 00:00:00',NULL),
(229,16,'2026-11-17 14:00:00','2026-11-17 18:00:00',4,'aprobada','2026-11-17',NULL,'2026-11-17 00:00:00',NULL),
(230,16,'2026-11-18 14:00:00','2026-11-18 18:00:00',4,'aprobada','2026-11-18',NULL,'2026-11-18 00:00:00',NULL),
(231,16,'2026-11-19 14:00:00','2026-11-19 18:00:00',4,'aprobada','2026-11-19',NULL,'2026-11-19 00:00:00',NULL),
(232,16,'2026-11-20 14:00:00','2026-11-20 18:00:00',4,'aprobada','2026-11-20',NULL,'2026-11-20 00:00:00',NULL),
(233,16,'2026-11-23 14:00:00','2026-11-23 18:00:00',4,'aprobada','2026-11-23',NULL,'2026-11-23 00:00:00',NULL),
(234,16,'2026-11-24 14:00:00','2026-11-24 18:00:00',4,'aprobada','2026-11-24',NULL,'2026-11-24 00:00:00',NULL),
(235,16,'2026-11-25 14:00:00','2026-11-25 18:00:00',4,'aprobada','2026-11-25',NULL,'2026-11-25 00:00:00',NULL),
(236,16,'2026-11-26 14:00:00','2026-11-26 18:00:00',4,'aprobada','2026-11-26',NULL,'2026-11-26 00:00:00',NULL),
(237,16,'2026-11-27 14:00:00','2026-11-27 18:00:00',4,'aprobada','2026-11-27',NULL,'2026-11-27 00:00:00',NULL),
(238,16,'2026-11-30 14:00:00','2026-11-30 18:00:00',4,'aprobada','2026-11-30',NULL,'2026-11-30 00:00:00',NULL),
(239,16,'2026-12-01 14:00:00','2026-12-01 18:00:00',4,'aprobada','2026-12-01',NULL,'2026-12-01 00:00:00',NULL),
(240,16,'2026-12-02 14:00:00','2026-12-02 18:00:00',4,'aprobada','2026-12-02',NULL,'2026-12-02 00:00:00',NULL),
(241,16,'2026-12-03 14:00:00','2026-12-03 18:00:00',4,'aprobada','2026-12-03',NULL,'2026-12-03 00:00:00',NULL),
(242,16,'2026-12-04 14:00:00','2026-12-04 18:00:00',4,'aprobada','2026-12-04',NULL,'2026-12-04 00:00:00',NULL),
(243,16,'2026-12-07 14:00:00','2026-12-07 18:00:00',4,'aprobada','2026-12-07',NULL,'2026-12-07 00:00:00',NULL),
(244,16,'2026-12-08 14:00:00','2026-12-08 18:00:00',4,'aprobada','2026-12-08',NULL,'2026-12-08 00:00:00',NULL),
(245,16,'2026-12-09 14:00:00','2026-12-09 18:00:00',4,'aprobada','2026-12-09',NULL,'2026-12-09 00:00:00',NULL),
(246,16,'2026-12-10 14:00:00','2026-12-10 18:00:00',4,'aprobada','2026-12-10',NULL,'2026-12-10 00:00:00',NULL);
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
(1,1,'correo','servicio_social_escom@ipn.mx','2026-11-09 04:51:16'),
(2,1,'telefono','5557296000 ext. 52056','2026-11-09 04:51:16'),
(3,1,'ubicacion','En edificio central de la ESCOM, subiendo las escaleras del lado derecho','2026-11-09 04:51:16'),
(4,1,'horario','Lunes a viernes de 9:00 a 15:00 y de 17:00 a 20:00 horas','2026-11-09 04:51:16');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cumulo_horas_y_faltas`
--

LOCK TABLES `cumulo_horas_y_faltas` WRITE;
/*!40000 ALTER TABLE `cumulo_horas_y_faltas` DISABLE KEYS */;
INSERT INTO `cumulo_horas_y_faltas` VALUES
(1,'2019630501',0,0,0,0,'2026-12-01'),
(2,'2020631401',24,4,18,6,'2026-12-01'),
(3,'2019631501',480,0,0,0,'2026-12-01'),
(4,'2020631601',480,0,0,0,'2026-12-01'),
(5,'2021630401',0,0,0,0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deseo_de_carrera`
--

LOCK TABLES `deseo_de_carrera` WRITE;
/*!40000 ALTER TABLE `deseo_de_carrera` DISABLE KEYS */;
INSERT INTO `deseo_de_carrera` VALUES
(1,1,1),
(2,2,1),
(3,3,1),
(4,4,2),
(5,5,2),
(6,6,1),
(7,7,1),
(8,8,1),
(9,9,3),
(10,10,3),
(11,11,3),
(12,12,1),
(13,13,1),
(14,14,1),
(15,15,1),
(16,16,1),
(17,17,1),
(18,18,1);
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
(4,'2021630401',13,'carta_creditos','2026-11-09 04:51:30','aprobado','2021630401/f929f24c-d000-4ce6-b6fc-20b8474bc959.pdf',1,'2021630401_CARTA_CREDITOS.pdf'),
(5,'2021630401',13,'constancia_seguro_social','2026-11-09 04:51:30','aprobado','2021630401/ad5f8a7a-c7ec-43ba-bf90-97e72e62794d.pdf',1,'2021630401_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(6,'2021630401',13,'expediente','2026-11-09 04:51:30','aprobado','2021630401/4e04cd2b-1a3c-4666-8b73-6ea2596e480b.pdf',1,'QUINTERO_VEGA_MONICA_2021630401.pdf'),
(7,'2019630501',14,'carta_creditos','2026-11-09 04:51:30','aprobado','2019630501/338279fb-70a7-4035-9a16-f6f789bdec31.pdf',1,'2019630501_CARTA_CREDITOS.pdf'),
(8,'2019630501',14,'constancia_seguro_social','2026-11-09 04:51:30','aprobado','2019630501/de90e572-1927-4625-a5fb-e2f9d4eb5f3d.pdf',1,'2019630501_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(9,'2019630501',14,'expediente','2026-11-09 04:51:30','aprobado','2019630501/7f0c292d-c4e3-4734-b15d-da0bcd33c989.pdf',1,'BARRERA_LEON_SOFIA_2019630501.pdf'),
(10,'2019630801',17,'carta_creditos','2026-11-09 04:51:30','en_revision','2019630801/3cb59fa2-4b6d-499c-883e-c3f2e003566d.pdf',NULL,'2019630801_CARTA_CREDITOS.pdf'),
(11,'2019630801',17,'constancia_seguro_social','2026-11-09 04:51:30','en_revision','2019630801/49250757-f61d-4baf-ae40-1405b30da926.pdf',NULL,'2019630801_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(12,'2020630901',18,'carta_creditos','2026-11-09 04:51:31','en_revision','2020630901/5b86f028-dc8a-48af-a04a-7c7428ef73c1.pdf',NULL,'2020630901_CARTA_CREDITOS.pdf'),
(13,'2020630901',18,'constancia_seguro_social','2026-11-09 04:51:31','en_revision','2020630901/843342a5-8551-4bb6-abb5-c648f5ddebc5.pdf',NULL,'2020630901_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(14,'2021631001',19,'carta_creditos','2026-11-09 04:51:31','en_revision','2021631001/d5739fba-d07d-45ac-b81e-0faba4788f94.pdf',NULL,'2021631001_CARTA_CREDITOS.pdf'),
(15,'2021631001',19,'constancia_seguro_social','2026-11-09 04:51:31','en_revision','2021631001/07bfb674-9102-4e57-b031-5c2fb32646f2.pdf',NULL,'2021631001_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(16,'2019631101',20,'carta_creditos','2026-11-09 04:51:31','aprobado','2019631101/99dbf4bf-3247-4bed-aa3d-8b34915b3e87.pdf',1,'2019631101_CARTA_CREDITOS.pdf'),
(17,'2019631101',20,'constancia_seguro_social','2026-11-09 04:51:31','aprobado','2019631101/53c37d69-4af7-4149-8fd2-f4d377d8337f.pdf',1,'2019631101_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(18,'2019631101',20,'expediente','2026-11-09 04:51:31','con_correcciones','2019631101/01fc3001-0537-46d8-a840-b2a57519229a.pdf',NULL,'IBARRA_SOTO_VALERIA_2019631101.pdf'),
(19,'2020631201',21,'carta_creditos','2026-11-09 04:51:31','aprobado','2020631201/b273f1f6-0497-46ef-86a9-cfc52c0aa9cf.pdf',1,'2020631201_CARTA_CREDITOS.pdf'),
(20,'2020631201',21,'constancia_seguro_social','2026-11-09 04:51:31','aprobado','2020631201/7c04a025-5225-43c7-9542-0a5724a43fdb.pdf',1,'2020631201_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(21,'2020631201',21,'expediente','2026-11-09 04:51:31','en_revision','2020631201/fa62bf16-2926-421b-8366-fe71aa884777.pdf',NULL,'PACHECO_VERA_EMILIANO_2020631201.pdf'),
(22,'2021631301',22,'carta_creditos','2026-11-09 04:51:31','aprobado','2021631301/887c862f-8d7e-4e22-8b9a-864c07e7d154.pdf',1,'2021631301_CARTA_CREDITOS.pdf'),
(23,'2021631301',22,'constancia_seguro_social','2026-11-09 04:51:31','aprobado','2021631301/5af192e1-d5f2-46e7-bf57-a07d79f7c394.pdf',1,'2021631301_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(24,'2020631401',23,'carta_creditos','2026-11-09 04:51:32','aprobado','2020631401/e0095f14-d95a-4927-94b9-3b90e0fcf0f1.pdf',1,'2020631401_CARTA_CREDITOS.pdf'),
(25,'2020631401',23,'constancia_seguro_social','2026-11-09 04:51:32','aprobado','2020631401/647011bd-3cee-4ee7-bacb-e0d7613377b9.pdf',1,'2020631401_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(26,'2020631401',23,'expediente','2026-11-09 04:51:32','aprobado','2020631401/38020257-df59-46d5-bbba-75ef09a925cf.pdf',1,'RANGEL_OSORIO_GERARDO_2020631401.pdf'),
(27,'2019631501',24,'carta_creditos','2026-11-09 04:51:32','aprobado','2019631501/6b12e81a-2244-4e44-b807-a8e89c14d5b5.pdf',1,'2019631501_CARTA_CREDITOS.pdf'),
(28,'2019631501',24,'constancia_seguro_social','2026-11-09 04:51:32','aprobado','2019631501/f9f1f36a-5f28-46c1-84ba-d6665062f359.pdf',1,'2019631501_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(29,'2019631501',24,'expediente','2026-11-09 04:51:32','aprobado','2019631501/9613a46b-0b72-42ee-a341-6d7a8495e720.pdf',1,'FUENTES_MARTINEZ_ITZEL_2019631501.pdf'),
(30,'2019631501',24,'reporte_mensual','2026-08-09 00:00:00','vigente','2019631501/Reportes/7af13f4d-f8b9-4643-a3e5-b7f180a98190.pdf',NULL,NULL),
(31,'2019631501',24,'reporte_mensual','2026-09-09 00:00:00','vigente','2019631501/Reportes/bee3fc0e-67ba-491b-a4e5-21615ac38e4f.pdf',NULL,NULL),
(32,'2019631501',24,'reporte_mensual','2026-10-10 00:00:00','vigente','2019631501/Reportes/55a36588-0d1d-4414-9904-e03dd6f66beb.pdf',NULL,NULL),
(33,'2019631501',24,'reporte_mensual','2026-11-09 00:00:00','vigente','2019631501/Reportes/e6770e18-f7a5-475e-a2ef-53057fce394e.pdf',NULL,NULL),
(34,'2019631501',24,'reporte_mensual','2026-12-09 00:00:00','vigente','2019631501/Reportes/1f82508c-4746-4145-b619-e765c60d8fab.pdf',NULL,NULL),
(35,'2019631501',24,'reporte_mensual','2027-01-09 00:00:00','vigente','2019631501/Reportes/d81333ad-b73e-44b8-bf00-460088b4fa4c.pdf',NULL,NULL),
(36,'2019631501',24,'reporte_mensual','2027-02-09 00:00:00','vigente','2019631501/Reportes/75fb2f15-8d13-425a-bc47-4dd3dfd963f7.pdf',NULL,NULL),
(37,'2019631501',24,'reporte_global','2026-11-09 04:51:42','vigente','2019631501/Reportes/0b6c3417-90fe-43b3-b9b4-b37918e469ab.pdf',NULL,NULL),
(38,'2020631601',25,'carta_creditos','2026-11-09 04:51:43','aprobado','2020631601/4b1d7fba-90ba-42a6-8455-9b933e692d87.pdf',1,'2020631601_CARTA_CREDITOS.pdf'),
(39,'2020631601',25,'constancia_seguro_social','2026-11-09 04:51:43','aprobado','2020631601/3d806679-4831-4658-81c2-85d0678a6317.pdf',1,'2020631601_CONSTANCIA_SEGURO_SOCIAL.pdf'),
(40,'2020631601',25,'expediente','2026-11-09 04:51:43','aprobado','2020631601/1dc74e0c-b310-486b-be9b-77c91cc6841f.pdf',1,'ROSADO_NAVA_MARIANA_2020631601.pdf'),
(41,'2020631601',25,'reporte_mensual','2026-08-09 00:00:00','vigente','2020631601/Reportes/88617114-f115-4d1b-bf88-41ec82e99d8a.pdf',NULL,NULL),
(42,'2020631601',25,'reporte_mensual','2026-09-09 00:00:00','vigente','2020631601/Reportes/73ef2327-388c-419d-9292-79f1278442ab.pdf',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(58,1,'Servicio Social 2028-1 (inicio 17/08/2027)','Periodo','2027-08-17','2028-03-17',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `liberacion_proceso`
--

LOCK TABLES `liberacion_proceso` WRITE;
/*!40000 ALTER TABLE `liberacion_proceso` DISABLE KEYS */;
INSERT INTO `liberacion_proceso` VALUES
(1,15,'evaluacion_solicitada','2026-11-09 04:51:43',1,NULL,NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
INSERT INTO `notificacion` VALUES
(1,13,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',0,'2026-11-09 04:51:30',NULL),
(2,14,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',0,'2026-11-09 04:51:30',NULL),
(3,23,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',0,'2026-11-09 04:51:32',NULL),
(4,23,'info','Te han revisado una bitácora.','/alumno/historial?bitacora=6',0,'2026-11-09 04:51:32',NULL),
(5,23,'info','Se amplió la fecha límite de una de tus actividades.','/alumno/historial?actividad=9',0,'2026-11-09 04:51:32',NULL),
(6,24,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',0,'2026-11-09 04:51:32',NULL),
(7,24,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=1',0,'2026-11-09 04:51:34',NULL),
(8,24,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=1',0,'2026-11-09 04:51:35',NULL),
(9,24,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=2',0,'2026-11-09 04:51:36',NULL),
(10,24,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=2',0,'2026-11-09 04:51:36',NULL),
(11,24,'info','Tu profesor aprobó tu Reporte Mensual No. 3. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=3',0,'2026-11-09 04:51:37',NULL),
(12,24,'success','Coordinación validó tu Reporte Mensual No. 3.','/alumno/reportes?destacar=3',0,'2026-11-09 04:51:37',NULL),
(13,24,'info','Tu profesor aprobó tu Reporte Mensual No. 4. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=4',0,'2026-11-09 04:51:38',NULL),
(14,24,'success','Coordinación validó tu Reporte Mensual No. 4.','/alumno/reportes?destacar=4',0,'2026-11-09 04:51:39',NULL),
(15,24,'info','Tu profesor aprobó tu Reporte Mensual No. 5. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=5',0,'2026-11-09 04:51:39',NULL),
(16,24,'success','Coordinación validó tu Reporte Mensual No. 5.','/alumno/reportes?destacar=5',0,'2026-11-09 04:51:40',NULL),
(17,24,'info','Tu profesor aprobó tu Reporte Mensual No. 6. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=6',0,'2026-11-09 04:51:41',NULL),
(18,24,'success','Coordinación validó tu Reporte Mensual No. 6.','/alumno/reportes?destacar=6',0,'2026-11-09 04:51:41',NULL),
(19,24,'info','Tu profesor aprobó tu Reporte Mensual No. 7. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=7',0,'2026-11-09 04:51:42',NULL),
(20,24,'success','Coordinación validó tu Reporte Mensual No. 7.','/alumno/reportes?destacar=7',0,'2026-11-09 04:51:42',NULL),
(21,24,'info','Tu profesor aprobó tu Reporte Global. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=1&tipo=global',0,'2026-11-09 04:51:43',NULL),
(22,24,'success','Coordinación validó tu Reporte Global.','/alumno/reportes?destacar=1&tipo=global',0,'2026-11-09 04:51:43',NULL),
(23,25,'success','Coordinación validó tu expediente. Tus actividades permanecerán deshabilitadas hasta la fecha de inicio de tu periodo de servicio social.','MODAL_BIENVENIDA_ALUMNO_ASIGNADO',0,'2026-11-09 04:51:43',NULL),
(24,25,'info','Tu profesor aprobó tu Reporte Mensual No. 1. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=8',0,'2026-11-09 04:51:45',NULL),
(25,25,'success','Coordinación validó tu Reporte Mensual No. 1.','/alumno/reportes?destacar=8',0,'2026-11-09 04:51:45',NULL),
(26,25,'info','Tu profesor aprobó tu Reporte Mensual No. 2. Ahora está en revisión de Coordinación.','/alumno/reportes?destacar=9',0,'2026-11-09 04:51:46',NULL),
(27,25,'success','Coordinación validó tu Reporte Mensual No. 2.','/alumno/reportes?destacar=9',0,'2026-11-09 04:51:47',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oferta_servicio`
--

LOCK TABLES `oferta_servicio` WRITE;
/*!40000 ALTER TABLE `oferta_servicio` DISABLE KEYS */;
INSERT INTO `oferta_servicio` VALUES
(1,1,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Desarrollo de portal de trámites escolares','individual','El alumno apoyará en el desarrollo y seguimiento de \"Desarrollo de portal de trámites escolares\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(2,1,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Automatización de reportes de biblioteca','individual','El alumno apoyará en el desarrollo y seguimiento de \"Automatización de reportes de biblioteca\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(3,1,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Digitalización del archivo histórico escolar','individual','El alumno apoyará en el desarrollo y seguimiento de \"Digitalización del archivo histórico escolar\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(4,2,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Sistema de recomendación para tutorías académicas','individual','El alumno apoyará en el desarrollo y seguimiento de \"Sistema de recomendación para tutorías académicas\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(5,2,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Monitoreo de laboratorios de cómputo','individual','El alumno apoyará en el desarrollo y seguimiento de \"Monitoreo de laboratorios de cómputo\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(6,3,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Plataforma de seguimiento de prácticas profesionales','individual','El alumno apoyará en el desarrollo y seguimiento de \"Plataforma de seguimiento de prácticas profesionales\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(7,3,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Rediseño del catálogo de servicios estudiantiles','individual','El alumno apoyará en el desarrollo y seguimiento de \"Rediseño del catálogo de servicios estudiantiles\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(8,3,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Rediseño de la plataforma de becas (liberación)','individual','El alumno apoyará en el desarrollo y seguimiento de \"Rediseño de la plataforma de becas (liberación)\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(9,4,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Análisis de datos de deserción escolar','individual','El alumno apoyará en el desarrollo y seguimiento de \"Análisis de datos de deserción escolar\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(10,4,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Visualización de indicadores institucionales','individual','El alumno apoyará en el desarrollo y seguimiento de \"Visualización de indicadores institucionales\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(11,4,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Visualización de indicadores institucionales (liberación)','individual','El alumno apoyará en el desarrollo y seguimiento de \"Visualización de indicadores institucionales (liberación)\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(12,5,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Modernización del sistema de control escolar','individual','El alumno apoyará en el desarrollo y seguimiento de \"Modernización del sistema de control escolar\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(13,5,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Integración de firma electrónica en trámites internos','individual','El alumno apoyará en el desarrollo y seguimiento de \"Integración de firma electrónica en trámites internos\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(14,5,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Monitoreo de laboratorios de cómputo (liberación)','individual','El alumno apoyará en el desarrollo y seguimiento de \"Monitoreo de laboratorios de cómputo (liberación)\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(15,6,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Sistema de seguimiento académico','individual','El alumno apoyará en el desarrollo y seguimiento de \"Sistema de seguimiento académico\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(16,6,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Rediseño de la plataforma de becas','individual','El alumno apoyará en el desarrollo y seguimiento de \"Rediseño de la plataforma de becas\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(17,7,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Club de robótica — apoyo en talleres','individual','El alumno apoyará en el desarrollo y seguimiento de \"Club de robótica — apoyo en talleres\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,1,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL'),
(18,7,1,'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES','Difusión de actividades deportivas y culturales','individual','El alumno apoyará en el desarrollo y seguimiento de \"Difusión de actividades deportivas y culturales\", incluyendo captura de datos, pruebas funcionales y documentación.',NULL,0,'aprobada','2026-11-09 04:51:29',NULL,'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(38,58,'2028','01','2027-07-15');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesor`
--

LOCK TABLES `profesor` WRITE;
/*!40000 ALTER TABLE `profesor` DISABLE KEYS */;
INSERT INTO `profesor` VALUES
(1,3,'Sistemas Computacionales','5512345671','Lunes a viernes 09:00-11:00','ESCOM-101',3,NULL),
(2,4,'Inteligencia Artificial','5512345672','Lunes a viernes 10:00-12:00','ESCOM-102',4,1),
(3,5,'Ciencias Básicas','5512345673','Lunes a viernes 11:00-13:00','ESCOM-103',5,2),
(4,6,'Posgrado e Investigación','5512345674','Lunes a viernes 12:00-14:00','ESCOM-104',5,3),
(5,7,'Servicios Escolares','5512345675','Lunes a viernes 13:00-15:00','ESCOM-105',6,4),
(6,8,'Sistemas Computacionales','5512345676','Lunes a viernes 14:00-16:00','ESCOM-106',6,5),
(7,9,'Inteligencia Artificial','5512345677','Lunes a viernes 15:00-17:00','ESCOM-107',6,6);
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
(1,1,'Constancia de creditos IPN','https://forms.cloud.microsoft/pages/responsepage.aspx?id=2fRL-ZeAlEet9qVGbKKFY-JLdN8w-KlBnYjodQmtWMpUQVNQMjdMQVFGNkY3RzdZVUZZUFlVTTVBWi4u&route=shorturl','2026-11-09 04:51:16',NULL,'link_constancia_creditos'),
(2,1,'Plataforma SISS del IPN','https://serviciosocial.ipn.mx/','2026-11-09 04:51:16',NULL,'link_siss'),
(3,1,'Constancia de vigencia del seguro social IMSS','https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/vigencia','2026-11-09 04:51:16',NULL,'link_seguro_social');
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
) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_bitacora_actividades`
--

LOCK TABLES `registro_bitacora_actividades` WRITE;
/*!40000 ALTER TABLE `registro_bitacora_actividades` DISABLE KEYS */;
INSERT INTO `registro_bitacora_actividades` VALUES
(1,1,5,'Revisión general de equipos del laboratorio 1.',40,'https://drive.example.com/evidencia-oct06'),
(2,2,6,'Reporte de 3 equipos con falla en el laboratorio 2.',30,'https://drive.example.com/evidencia-oct08'),
(3,3,6,'Reporte de incidencias adicionales, laboratorio 3.',50,'https://drive.example.com/evidencia-oct13'),
(4,4,7,'Actualización del inventario de los laboratorios 1 y 2.',55,'https://drive.example.com/evidencia-oct27'),
(5,5,5,'Seguimiento de equipos reparados.',70,'https://drive.example.com/evidencia-oct20'),
(6,6,5,'Cierre del monitoreo mensual de equipos.',100,'https://drive.example.com/evidencia-nov03'),
(7,7,10,'Digitalización y catalogación de expedientes del día.',1,'https://drive.example.com/archivo-2026-06-01'),
(8,8,10,'Digitalización y catalogación de expedientes del día.',2,'https://drive.example.com/archivo-2026-06-02'),
(9,9,10,'Digitalización y catalogación de expedientes del día.',3,'https://drive.example.com/archivo-2026-06-03'),
(10,10,10,'Digitalización y catalogación de expedientes del día.',3,'https://drive.example.com/archivo-2026-06-04'),
(11,11,10,'Digitalización y catalogación de expedientes del día.',4,'https://drive.example.com/archivo-2026-06-05'),
(12,12,10,'Digitalización y catalogación de expedientes del día.',5,'https://drive.example.com/archivo-2026-06-08'),
(13,13,10,'Digitalización y catalogación de expedientes del día.',6,'https://drive.example.com/archivo-2026-06-09'),
(14,14,10,'Digitalización y catalogación de expedientes del día.',7,'https://drive.example.com/archivo-2026-06-10'),
(15,15,10,'Digitalización y catalogación de expedientes del día.',8,'https://drive.example.com/archivo-2026-06-11'),
(16,16,10,'Digitalización y catalogación de expedientes del día.',8,'https://drive.example.com/archivo-2026-06-12'),
(17,17,10,'Digitalización y catalogación de expedientes del día.',9,'https://drive.example.com/archivo-2026-06-15'),
(18,18,10,'Digitalización y catalogación de expedientes del día.',10,'https://drive.example.com/archivo-2026-06-16'),
(19,19,10,'Digitalización y catalogación de expedientes del día.',11,'https://drive.example.com/archivo-2026-06-17'),
(20,20,10,'Digitalización y catalogación de expedientes del día.',12,'https://drive.example.com/archivo-2026-06-18'),
(21,21,10,'Digitalización y catalogación de expedientes del día.',13,'https://drive.example.com/archivo-2026-06-19'),
(22,22,10,'Digitalización y catalogación de expedientes del día.',13,'https://drive.example.com/archivo-2026-06-22'),
(23,23,10,'Digitalización y catalogación de expedientes del día.',14,'https://drive.example.com/archivo-2026-06-23'),
(24,24,10,'Digitalización y catalogación de expedientes del día.',15,'https://drive.example.com/archivo-2026-06-24'),
(25,25,10,'Digitalización y catalogación de expedientes del día.',16,'https://drive.example.com/archivo-2026-06-25'),
(26,26,10,'Digitalización y catalogación de expedientes del día.',17,'https://drive.example.com/archivo-2026-06-26'),
(27,27,10,'Digitalización y catalogación de expedientes del día.',18,'https://drive.example.com/archivo-2026-06-29'),
(28,28,10,'Digitalización y catalogación de expedientes del día.',18,'https://drive.example.com/archivo-2026-06-30'),
(29,29,10,'Digitalización y catalogación de expedientes del día.',19,'https://drive.example.com/archivo-2026-07-01'),
(30,30,10,'Digitalización y catalogación de expedientes del día.',20,'https://drive.example.com/archivo-2026-07-02'),
(31,31,10,'Digitalización y catalogación de expedientes del día.',21,'https://drive.example.com/archivo-2026-07-03'),
(32,32,10,'Digitalización y catalogación de expedientes del día.',22,'https://drive.example.com/archivo-2026-07-06'),
(33,33,10,'Digitalización y catalogación de expedientes del día.',23,'https://drive.example.com/archivo-2026-07-07'),
(34,34,10,'Digitalización y catalogación de expedientes del día.',23,'https://drive.example.com/archivo-2026-07-08'),
(35,35,10,'Digitalización y catalogación de expedientes del día.',24,'https://drive.example.com/archivo-2026-07-09'),
(36,36,10,'Digitalización y catalogación de expedientes del día.',25,'https://drive.example.com/archivo-2026-07-10'),
(37,37,10,'Digitalización y catalogación de expedientes del día.',26,'https://drive.example.com/archivo-2026-07-13'),
(38,38,10,'Digitalización y catalogación de expedientes del día.',27,'https://drive.example.com/archivo-2026-07-14'),
(39,39,10,'Digitalización y catalogación de expedientes del día.',28,'https://drive.example.com/archivo-2026-07-15'),
(40,40,10,'Digitalización y catalogación de expedientes del día.',28,'https://drive.example.com/archivo-2026-07-16'),
(41,41,10,'Digitalización y catalogación de expedientes del día.',29,'https://drive.example.com/archivo-2026-07-17'),
(42,42,10,'Digitalización y catalogación de expedientes del día.',30,'https://drive.example.com/archivo-2026-07-20'),
(43,43,10,'Digitalización y catalogación de expedientes del día.',31,'https://drive.example.com/archivo-2026-07-21'),
(44,44,10,'Digitalización y catalogación de expedientes del día.',32,'https://drive.example.com/archivo-2026-07-22'),
(45,45,10,'Digitalización y catalogación de expedientes del día.',33,'https://drive.example.com/archivo-2026-07-23'),
(46,46,10,'Digitalización y catalogación de expedientes del día.',33,'https://drive.example.com/archivo-2026-07-24'),
(47,47,10,'Digitalización y catalogación de expedientes del día.',34,'https://drive.example.com/archivo-2026-07-27'),
(48,48,10,'Digitalización y catalogación de expedientes del día.',35,'https://drive.example.com/archivo-2026-07-28'),
(49,49,10,'Digitalización y catalogación de expedientes del día.',36,'https://drive.example.com/archivo-2026-07-29'),
(50,50,10,'Digitalización y catalogación de expedientes del día.',37,'https://drive.example.com/archivo-2026-07-30'),
(51,51,10,'Digitalización y catalogación de expedientes del día.',38,'https://drive.example.com/archivo-2026-07-31'),
(52,52,10,'Digitalización y catalogación de expedientes del día.',38,'https://drive.example.com/archivo-2026-08-24'),
(53,53,10,'Digitalización y catalogación de expedientes del día.',39,'https://drive.example.com/archivo-2026-08-25'),
(54,54,10,'Digitalización y catalogación de expedientes del día.',40,'https://drive.example.com/archivo-2026-08-26'),
(55,55,10,'Digitalización y catalogación de expedientes del día.',41,'https://drive.example.com/archivo-2026-08-27'),
(56,56,10,'Digitalización y catalogación de expedientes del día.',42,'https://drive.example.com/archivo-2026-08-28'),
(57,57,10,'Digitalización y catalogación de expedientes del día.',43,'https://drive.example.com/archivo-2026-08-31'),
(58,58,10,'Digitalización y catalogación de expedientes del día.',43,'https://drive.example.com/archivo-2026-09-01'),
(59,59,10,'Digitalización y catalogación de expedientes del día.',44,'https://drive.example.com/archivo-2026-09-02'),
(60,60,10,'Digitalización y catalogación de expedientes del día.',45,'https://drive.example.com/archivo-2026-09-03'),
(61,61,10,'Digitalización y catalogación de expedientes del día.',46,'https://drive.example.com/archivo-2026-09-04'),
(62,62,10,'Digitalización y catalogación de expedientes del día.',47,'https://drive.example.com/archivo-2026-09-07'),
(63,63,10,'Digitalización y catalogación de expedientes del día.',48,'https://drive.example.com/archivo-2026-09-08'),
(64,64,10,'Digitalización y catalogación de expedientes del día.',48,'https://drive.example.com/archivo-2026-09-09'),
(65,65,10,'Digitalización y catalogación de expedientes del día.',49,'https://drive.example.com/archivo-2026-09-10'),
(66,66,10,'Digitalización y catalogación de expedientes del día.',50,'https://drive.example.com/archivo-2026-09-11'),
(67,67,10,'Digitalización y catalogación de expedientes del día.',51,'https://drive.example.com/archivo-2026-09-14'),
(68,68,10,'Digitalización y catalogación de expedientes del día.',52,'https://drive.example.com/archivo-2026-09-15'),
(69,69,10,'Digitalización y catalogación de expedientes del día.',53,'https://drive.example.com/archivo-2026-09-17'),
(70,70,10,'Digitalización y catalogación de expedientes del día.',53,'https://drive.example.com/archivo-2026-09-18'),
(71,71,10,'Digitalización y catalogación de expedientes del día.',54,'https://drive.example.com/archivo-2026-09-21'),
(72,72,10,'Digitalización y catalogación de expedientes del día.',55,'https://drive.example.com/archivo-2026-09-22'),
(73,73,10,'Digitalización y catalogación de expedientes del día.',56,'https://drive.example.com/archivo-2026-09-23'),
(74,74,10,'Digitalización y catalogación de expedientes del día.',57,'https://drive.example.com/archivo-2026-09-24'),
(75,75,10,'Digitalización y catalogación de expedientes del día.',57,'https://drive.example.com/archivo-2026-09-25'),
(76,76,10,'Digitalización y catalogación de expedientes del día.',58,'https://drive.example.com/archivo-2026-09-28'),
(77,77,10,'Digitalización y catalogación de expedientes del día.',59,'https://drive.example.com/archivo-2026-09-29'),
(78,78,10,'Digitalización y catalogación de expedientes del día.',60,'https://drive.example.com/archivo-2026-09-30'),
(79,79,10,'Digitalización y catalogación de expedientes del día.',61,'https://drive.example.com/archivo-2026-10-01'),
(80,80,10,'Digitalización y catalogación de expedientes del día.',62,'https://drive.example.com/archivo-2026-10-02'),
(81,81,10,'Digitalización y catalogación de expedientes del día.',63,'https://drive.example.com/archivo-2026-10-05'),
(82,82,10,'Digitalización y catalogación de expedientes del día.',63,'https://drive.example.com/archivo-2026-10-06'),
(83,83,10,'Digitalización y catalogación de expedientes del día.',64,'https://drive.example.com/archivo-2026-10-07'),
(84,84,10,'Digitalización y catalogación de expedientes del día.',65,'https://drive.example.com/archivo-2026-10-09'),
(85,85,10,'Digitalización y catalogación de expedientes del día.',66,'https://drive.example.com/archivo-2026-10-12'),
(86,86,10,'Digitalización y catalogación de expedientes del día.',67,'https://drive.example.com/archivo-2026-10-13'),
(87,87,10,'Digitalización y catalogación de expedientes del día.',68,'https://drive.example.com/archivo-2026-10-14'),
(88,88,10,'Digitalización y catalogación de expedientes del día.',68,'https://drive.example.com/archivo-2026-10-15'),
(89,89,10,'Digitalización y catalogación de expedientes del día.',69,'https://drive.example.com/archivo-2026-10-16'),
(90,90,10,'Digitalización y catalogación de expedientes del día.',70,'https://drive.example.com/archivo-2026-10-19'),
(91,91,10,'Digitalización y catalogación de expedientes del día.',71,'https://drive.example.com/archivo-2026-10-20'),
(92,92,10,'Digitalización y catalogación de expedientes del día.',72,'https://drive.example.com/archivo-2026-10-21'),
(93,93,10,'Digitalización y catalogación de expedientes del día.',73,'https://drive.example.com/archivo-2026-10-23'),
(94,94,10,'Digitalización y catalogación de expedientes del día.',73,'https://drive.example.com/archivo-2026-10-26'),
(95,95,10,'Digitalización y catalogación de expedientes del día.',74,'https://drive.example.com/archivo-2026-10-27'),
(96,96,10,'Digitalización y catalogación de expedientes del día.',75,'https://drive.example.com/archivo-2026-10-28'),
(97,97,10,'Digitalización y catalogación de expedientes del día.',76,'https://drive.example.com/archivo-2026-10-29'),
(98,98,10,'Digitalización y catalogación de expedientes del día.',77,'https://drive.example.com/archivo-2026-10-30'),
(99,99,10,'Digitalización y catalogación de expedientes del día.',78,'https://drive.example.com/archivo-2026-11-02'),
(100,100,10,'Digitalización y catalogación de expedientes del día.',78,'https://drive.example.com/archivo-2026-11-03'),
(101,101,10,'Digitalización y catalogación de expedientes del día.',79,'https://drive.example.com/archivo-2026-11-04'),
(102,102,10,'Digitalización y catalogación de expedientes del día.',80,'https://drive.example.com/archivo-2026-11-05'),
(103,103,10,'Digitalización y catalogación de expedientes del día.',81,'https://drive.example.com/archivo-2026-11-06'),
(104,104,10,'Digitalización y catalogación de expedientes del día.',82,'https://drive.example.com/archivo-2026-11-09'),
(105,105,10,'Digitalización y catalogación de expedientes del día.',83,'https://drive.example.com/archivo-2026-11-10'),
(106,106,10,'Digitalización y catalogación de expedientes del día.',83,'https://drive.example.com/archivo-2026-11-11'),
(107,107,10,'Digitalización y catalogación de expedientes del día.',84,'https://drive.example.com/archivo-2026-11-12'),
(108,108,10,'Digitalización y catalogación de expedientes del día.',85,'https://drive.example.com/archivo-2026-11-13'),
(109,109,10,'Digitalización y catalogación de expedientes del día.',86,'https://drive.example.com/archivo-2026-11-17'),
(110,110,10,'Digitalización y catalogación de expedientes del día.',87,'https://drive.example.com/archivo-2026-11-18'),
(111,111,10,'Digitalización y catalogación de expedientes del día.',88,'https://drive.example.com/archivo-2026-11-19'),
(112,112,10,'Digitalización y catalogación de expedientes del día.',88,'https://drive.example.com/archivo-2026-11-20'),
(113,113,10,'Digitalización y catalogación de expedientes del día.',89,'https://drive.example.com/archivo-2026-11-23'),
(114,114,10,'Digitalización y catalogación de expedientes del día.',90,'https://drive.example.com/archivo-2026-11-24'),
(115,115,10,'Digitalización y catalogación de expedientes del día.',91,'https://drive.example.com/archivo-2026-11-25'),
(116,116,10,'Digitalización y catalogación de expedientes del día.',92,'https://drive.example.com/archivo-2026-11-26'),
(117,117,10,'Digitalización y catalogación de expedientes del día.',93,'https://drive.example.com/archivo-2026-11-27'),
(118,118,10,'Digitalización y catalogación de expedientes del día.',93,'https://drive.example.com/archivo-2026-11-30'),
(119,119,10,'Digitalización y catalogación de expedientes del día.',94,'https://drive.example.com/archivo-2026-12-01'),
(120,120,10,'Digitalización y catalogación de expedientes del día.',95,'https://drive.example.com/archivo-2026-12-02'),
(121,121,10,'Digitalización y catalogación de expedientes del día.',96,'https://drive.example.com/archivo-2026-12-03'),
(122,122,10,'Digitalización y catalogación de expedientes del día.',97,'https://drive.example.com/archivo-2026-12-04'),
(123,123,10,'Digitalización y catalogación de expedientes del día.',98,'https://drive.example.com/archivo-2026-12-07'),
(124,124,10,'Digitalización y catalogación de expedientes del día.',98,'https://drive.example.com/archivo-2026-12-08'),
(125,125,10,'Digitalización y catalogación de expedientes del día.',99,'https://drive.example.com/archivo-2026-12-09'),
(126,126,10,'Digitalización y catalogación de expedientes del día.',100,'https://drive.example.com/archivo-2026-12-10'),
(127,127,11,'Avance diario documentado.',1,'https://drive.example.com/evidencia-2026-06-01'),
(128,128,11,'Avance diario documentado.',2,'https://drive.example.com/evidencia-2026-06-02'),
(129,129,11,'Avance diario documentado.',3,'https://drive.example.com/evidencia-2026-06-03'),
(130,130,11,'Avance diario documentado.',3,'https://drive.example.com/evidencia-2026-06-04'),
(131,131,11,'Avance diario documentado.',4,'https://drive.example.com/evidencia-2026-06-05'),
(132,132,11,'Avance diario documentado.',5,'https://drive.example.com/evidencia-2026-06-08'),
(133,133,11,'Avance diario documentado.',6,'https://drive.example.com/evidencia-2026-06-09'),
(134,134,11,'Avance diario documentado.',7,'https://drive.example.com/evidencia-2026-06-10'),
(135,135,11,'Avance diario documentado.',8,'https://drive.example.com/evidencia-2026-06-11'),
(136,136,11,'Avance diario documentado.',8,'https://drive.example.com/evidencia-2026-06-12'),
(137,137,11,'Avance diario documentado.',9,'https://drive.example.com/evidencia-2026-06-15'),
(138,138,11,'Avance diario documentado.',10,'https://drive.example.com/evidencia-2026-06-16'),
(139,139,11,'Avance diario documentado.',11,'https://drive.example.com/evidencia-2026-06-17'),
(140,140,11,'Avance diario documentado.',12,'https://drive.example.com/evidencia-2026-06-18'),
(141,141,11,'Avance diario documentado.',13,'https://drive.example.com/evidencia-2026-06-19'),
(142,142,11,'Avance diario documentado.',13,'https://drive.example.com/evidencia-2026-06-22'),
(143,143,11,'Avance diario documentado.',14,'https://drive.example.com/evidencia-2026-06-23'),
(144,144,11,'Avance diario documentado.',15,'https://drive.example.com/evidencia-2026-06-24'),
(145,145,11,'Avance diario documentado.',16,'https://drive.example.com/evidencia-2026-06-25'),
(146,146,11,'Avance diario documentado.',17,'https://drive.example.com/evidencia-2026-06-26'),
(147,147,11,'Avance diario documentado.',18,'https://drive.example.com/evidencia-2026-06-29'),
(148,148,11,'Avance diario documentado.',18,'https://drive.example.com/evidencia-2026-06-30'),
(149,149,11,'Avance diario documentado.',19,'https://drive.example.com/evidencia-2026-07-01'),
(150,150,11,'Avance diario documentado.',20,'https://drive.example.com/evidencia-2026-07-02'),
(151,151,11,'Avance diario documentado.',21,'https://drive.example.com/evidencia-2026-07-03'),
(152,152,11,'Avance diario documentado.',22,'https://drive.example.com/evidencia-2026-07-06'),
(153,153,11,'Avance diario documentado.',23,'https://drive.example.com/evidencia-2026-07-07'),
(154,154,11,'Avance diario documentado.',23,'https://drive.example.com/evidencia-2026-07-08'),
(155,155,11,'Avance diario documentado.',24,'https://drive.example.com/evidencia-2026-07-09'),
(156,156,11,'Avance diario documentado.',25,'https://drive.example.com/evidencia-2026-07-10'),
(157,157,11,'Avance diario documentado.',26,'https://drive.example.com/evidencia-2026-07-13'),
(158,158,11,'Avance diario documentado.',27,'https://drive.example.com/evidencia-2026-07-14'),
(159,159,11,'Avance diario documentado.',28,'https://drive.example.com/evidencia-2026-07-15'),
(160,160,11,'Avance diario documentado.',28,'https://drive.example.com/evidencia-2026-07-16'),
(161,161,11,'Avance diario documentado.',29,'https://drive.example.com/evidencia-2026-07-17'),
(162,162,11,'Avance diario documentado.',30,'https://drive.example.com/evidencia-2026-07-20'),
(163,163,11,'Avance diario documentado.',31,'https://drive.example.com/evidencia-2026-07-21'),
(164,164,11,'Avance diario documentado.',32,'https://drive.example.com/evidencia-2026-07-22'),
(165,165,11,'Avance diario documentado.',33,'https://drive.example.com/evidencia-2026-07-23'),
(166,166,11,'Avance diario documentado.',33,'https://drive.example.com/evidencia-2026-07-24'),
(167,167,11,'Avance diario documentado.',34,'https://drive.example.com/evidencia-2026-07-27'),
(168,168,11,'Avance diario documentado.',35,'https://drive.example.com/evidencia-2026-07-28'),
(169,169,11,'Avance diario documentado.',36,'https://drive.example.com/evidencia-2026-07-29'),
(170,170,11,'Avance diario documentado.',37,'https://drive.example.com/evidencia-2026-07-30'),
(171,171,11,'Avance diario documentado.',38,'https://drive.example.com/evidencia-2026-07-31'),
(172,172,11,'Avance diario documentado.',38,'https://drive.example.com/evidencia-2026-08-24'),
(173,173,11,'Avance diario documentado.',39,'https://drive.example.com/evidencia-2026-08-25'),
(174,174,11,'Avance diario documentado.',40,'https://drive.example.com/evidencia-2026-08-26'),
(175,175,11,'Avance diario documentado.',41,'https://drive.example.com/evidencia-2026-08-27'),
(176,176,11,'Avance diario documentado.',42,'https://drive.example.com/evidencia-2026-08-28'),
(177,177,11,'Avance diario documentado.',43,'https://drive.example.com/evidencia-2026-08-31'),
(178,178,11,'Avance diario documentado.',43,'https://drive.example.com/evidencia-2026-09-01'),
(179,179,11,'Avance diario documentado.',44,'https://drive.example.com/evidencia-2026-09-02'),
(180,180,11,'Avance diario documentado.',45,'https://drive.example.com/evidencia-2026-09-03'),
(181,181,11,'Avance diario documentado.',46,'https://drive.example.com/evidencia-2026-09-04'),
(182,182,11,'Avance diario documentado.',47,'https://drive.example.com/evidencia-2026-09-07'),
(183,183,11,'Avance diario documentado.',48,'https://drive.example.com/evidencia-2026-09-08'),
(184,184,11,'Avance diario documentado.',48,'https://drive.example.com/evidencia-2026-09-09'),
(185,185,11,'Avance diario documentado.',49,'https://drive.example.com/evidencia-2026-09-10'),
(186,186,11,'Avance diario documentado.',50,'https://drive.example.com/evidencia-2026-09-11'),
(187,187,11,'Avance diario documentado.',51,'https://drive.example.com/evidencia-2026-09-14'),
(188,188,11,'Avance diario documentado.',52,'https://drive.example.com/evidencia-2026-09-15'),
(189,189,11,'Avance diario documentado.',53,'https://drive.example.com/evidencia-2026-09-17'),
(190,190,11,'Avance diario documentado.',53,'https://drive.example.com/evidencia-2026-09-18'),
(191,191,11,'Avance diario documentado.',54,'https://drive.example.com/evidencia-2026-09-21'),
(192,192,11,'Avance diario documentado.',55,'https://drive.example.com/evidencia-2026-09-22'),
(193,193,11,'Avance diario documentado.',56,'https://drive.example.com/evidencia-2026-09-23'),
(194,194,11,'Avance diario documentado.',57,'https://drive.example.com/evidencia-2026-09-24'),
(195,195,11,'Avance diario documentado.',57,'https://drive.example.com/evidencia-2026-09-25'),
(196,196,11,'Avance diario documentado.',58,'https://drive.example.com/evidencia-2026-09-28'),
(197,197,11,'Avance diario documentado.',59,'https://drive.example.com/evidencia-2026-09-29'),
(198,198,11,'Avance diario documentado.',60,'https://drive.example.com/evidencia-2026-09-30'),
(199,199,11,'Avance diario documentado.',61,'https://drive.example.com/evidencia-2026-10-01'),
(200,200,11,'Avance diario documentado.',62,'https://drive.example.com/evidencia-2026-10-02'),
(201,201,11,'Avance diario documentado.',63,'https://drive.example.com/evidencia-2026-10-05'),
(202,202,11,'Avance diario documentado.',63,'https://drive.example.com/evidencia-2026-10-06'),
(203,203,11,'Avance diario documentado.',64,'https://drive.example.com/evidencia-2026-10-07'),
(204,204,11,'Avance diario documentado.',65,'https://drive.example.com/evidencia-2026-10-09'),
(205,205,11,'Avance diario documentado.',66,'https://drive.example.com/evidencia-2026-10-12'),
(206,206,11,'Avance diario documentado.',67,'https://drive.example.com/evidencia-2026-10-13'),
(207,207,11,'Avance diario documentado.',68,'https://drive.example.com/evidencia-2026-10-14'),
(208,208,11,'Avance diario documentado.',68,'https://drive.example.com/evidencia-2026-10-15'),
(209,209,11,'Avance diario documentado.',69,'https://drive.example.com/evidencia-2026-10-16'),
(210,210,11,'Avance diario documentado.',70,'https://drive.example.com/evidencia-2026-10-19'),
(211,211,11,'Avance diario documentado.',71,'https://drive.example.com/evidencia-2026-10-20'),
(212,212,11,'Avance diario documentado.',72,'https://drive.example.com/evidencia-2026-10-21'),
(213,213,11,'Avance diario documentado.',73,'https://drive.example.com/evidencia-2026-10-23'),
(214,214,11,'Avance diario documentado.',73,'https://drive.example.com/evidencia-2026-10-26'),
(215,215,11,'Avance diario documentado.',74,'https://drive.example.com/evidencia-2026-10-27'),
(216,216,11,'Avance diario documentado.',75,'https://drive.example.com/evidencia-2026-10-28'),
(217,217,11,'Avance diario documentado.',76,'https://drive.example.com/evidencia-2026-10-29'),
(218,218,11,'Avance diario documentado.',77,'https://drive.example.com/evidencia-2026-10-30'),
(219,219,11,'Avance diario documentado.',78,'https://drive.example.com/evidencia-2026-11-02'),
(220,220,11,'Avance diario documentado.',78,'https://drive.example.com/evidencia-2026-11-03'),
(221,221,11,'Avance diario documentado.',79,'https://drive.example.com/evidencia-2026-11-04'),
(222,222,11,'Avance diario documentado.',80,'https://drive.example.com/evidencia-2026-11-05'),
(223,223,11,'Avance diario documentado.',81,'https://drive.example.com/evidencia-2026-11-06'),
(224,224,11,'Avance diario documentado.',82,'https://drive.example.com/evidencia-2026-11-09'),
(225,225,11,'Avance diario documentado.',83,'https://drive.example.com/evidencia-2026-11-10'),
(226,226,11,'Avance diario documentado.',83,'https://drive.example.com/evidencia-2026-11-11'),
(227,227,11,'Avance diario documentado.',84,'https://drive.example.com/evidencia-2026-11-12'),
(228,228,11,'Avance diario documentado.',85,'https://drive.example.com/evidencia-2026-11-13'),
(229,229,11,'Avance diario documentado.',86,'https://drive.example.com/evidencia-2026-11-17'),
(230,230,11,'Avance diario documentado.',87,'https://drive.example.com/evidencia-2026-11-18'),
(231,231,11,'Avance diario documentado.',88,'https://drive.example.com/evidencia-2026-11-19'),
(232,232,11,'Avance diario documentado.',88,'https://drive.example.com/evidencia-2026-11-20'),
(233,233,11,'Avance diario documentado.',89,'https://drive.example.com/evidencia-2026-11-23'),
(234,234,11,'Avance diario documentado.',90,'https://drive.example.com/evidencia-2026-11-24'),
(235,235,11,'Avance diario documentado.',91,'https://drive.example.com/evidencia-2026-11-25'),
(236,236,11,'Avance diario documentado.',92,'https://drive.example.com/evidencia-2026-11-26'),
(237,237,11,'Avance diario documentado.',93,'https://drive.example.com/evidencia-2026-11-27'),
(238,238,11,'Avance diario documentado.',93,'https://drive.example.com/evidencia-2026-11-30'),
(239,239,11,'Avance diario documentado.',94,'https://drive.example.com/evidencia-2026-12-01'),
(240,240,11,'Avance diario documentado.',95,'https://drive.example.com/evidencia-2026-12-02'),
(241,241,11,'Avance diario documentado.',96,'https://drive.example.com/evidencia-2026-12-03'),
(242,242,11,'Avance diario documentado.',97,'https://drive.example.com/evidencia-2026-12-04'),
(243,243,11,'Avance diario documentado.',98,'https://drive.example.com/evidencia-2026-12-07'),
(244,244,11,'Avance diario documentado.',98,'https://drive.example.com/evidencia-2026-12-08'),
(245,245,11,'Avance diario documentado.',99,'https://drive.example.com/evidencia-2026-12-09'),
(246,246,11,'Avance diario documentado.',100,'https://drive.example.com/evidencia-2026-12-10');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_global`
--

LOCK TABLES `reporte_global` WRITE;
/*!40000 ALTER TABLE `reporte_global` DISABLE KEYS */;
INSERT INTO `reporte_global` VALUES
(1,15,37,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_mensual`
--

LOCK TABLES `reporte_mensual` WRITE;
/*!40000 ALTER TABLE `reporte_mensual` DISABLE KEYS */;
INSERT INTO `reporte_mensual` VALUES
(1,15,30,1,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',22,88),
(2,15,31,2,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',23,92),
(3,15,32,3,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',6,24),
(4,15,33,4,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',21,84),
(5,15,34,5,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',20,80),
(6,15,35,6,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',20,80),
(7,15,36,7,'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.','aprobado_coordinador',8,32),
(8,16,41,1,'Avance documentado conforme a lo registrado en bitácora.','aprobado_coordinador',22,88),
(9,16,42,2,'Avance documentado conforme a lo registrado en bitácora.','aprobado_coordinador',23,92);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_global`
--

LOCK TABLES `revision_reporte_global` WRITE;
/*!40000 ALTER TABLE `revision_reporte_global` DISABLE KEYS */;
INSERT INTO `revision_reporte_global` VALUES
(1,1,24,'alumno','aprobado',NULL,'c586069c625963e64595a0ecf056bbe44f7c9ac426a2387bee1ea3a5112a0320',NULL,'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','2026-11-09 04:51:42','2019631501/Reportes/d6c89efd-bf4f-4c56-b4ae-4ec87405b0f4.pdf'),
(2,1,3,'profesor','aprobado',NULL,'cd28f4ad08b15f71ae87ab17d1d40047025db8393403d4d12e0832c5c844ea80',NULL,'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','2026-11-09 04:51:42','2019631501/Reportes/2dfe12bb-751d-4a03-a493-3ff936f71e6c.pdf'),
(3,1,1,'coordinador','aprobado',NULL,'e95a6d28e0447bdb9015c73db1ef41fa9167537cdf68472901c768e78531d6f3',NULL,'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','2026-11-09 04:51:42','2019631501/Reportes/0b6c3417-90fe-43b3-b9b4-b37918e469ab.pdf');
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_reporte_mensual`
--

LOCK TABLES `revision_reporte_mensual` WRITE;
/*!40000 ALTER TABLE `revision_reporte_mensual` DISABLE KEYS */;
INSERT INTO `revision_reporte_mensual` VALUES
(1,1,24,'alumno','aprobado',NULL,'abc56a6367486e6a161db93e7f7c5a41fbf51851082791b9f596065506777085',NULL,'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','2026-08-09 00:00:00','2019631501/Reportes/c4b73b27-0273-4655-bca0-4f4d473101ad.pdf'),
(2,1,3,'profesor','aprobado',NULL,'54aed36b8991946443d75d1faa74f5d69126fe67a665993389f1bd3cbc98c9fc',NULL,'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','2026-08-09 00:00:00','2019631501/Reportes/5abfc3e2-b544-4a31-9938-e47c93e2ee68.pdf'),
(3,1,1,'coordinador','aprobado',NULL,'c0d3a5f3f390556642d8843d3853308e82773389580896372cca2ae3c9a75553',NULL,'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','2026-08-09 00:00:00','2019631501/Reportes/7af13f4d-f8b9-4643-a3e5-b7f180a98190.pdf'),
(4,2,24,'alumno','aprobado',NULL,'efcd13c7405e46275fe362e782c51e271938bd0970df64d0c839071b06870418',NULL,'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','2026-09-09 00:00:00','2019631501/Reportes/de400eb6-8653-44b9-beda-4cbac9eb15ce.pdf'),
(5,2,3,'profesor','aprobado',NULL,'1c7fa4f7d8cae11a70a79aa813468e25869405446744c3f563c15154275cbaca',NULL,'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','2026-09-09 00:00:00','2019631501/Reportes/e82d4f78-bdd0-47b1-8f13-1051de1f3078.pdf'),
(6,2,1,'coordinador','aprobado',NULL,'c75acd247b5f056230e7393336f0b0add1e7f5d305fc5ad7dc8ef9f67b84510b',NULL,'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','2026-09-09 00:00:00','2019631501/Reportes/bee3fc0e-67ba-491b-a4e5-21615ac38e4f.pdf'),
(7,3,24,'alumno','aprobado',NULL,'27f769e2f0e446771d14eecffdbc91a590c04d90571505996715054881d1442c',NULL,'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','2026-10-10 00:00:00','2019631501/Reportes/53c58889-ccbe-4589-80f0-2ba455c8137e.pdf'),
(8,3,3,'profesor','aprobado',NULL,'fc5b28cf044a1a83e7bd4b13f598c3be35aaa8a3ba0a039d0a402329944bdd4e',NULL,'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','2026-10-10 00:00:00','2019631501/Reportes/ac51bdd0-c5e7-418b-86f8-8d1d3654f414.pdf'),
(9,3,1,'coordinador','aprobado',NULL,'4d458fb70e29c274bd3963179a65855b4ec2df23caf0a12556972ca0de7fca7e',NULL,'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','2026-10-10 00:00:00','2019631501/Reportes/55a36588-0d1d-4414-9904-e03dd6f66beb.pdf'),
(10,4,24,'alumno','aprobado',NULL,'4e3f61a3a0ac221263f04001b8f4508e6617b9dfafbd5ae1c0efe7268b2f6b8a',NULL,'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','2026-11-09 00:00:00','2019631501/Reportes/ffc9ab75-b55e-4489-b07e-5b64ada64713.pdf'),
(11,4,3,'profesor','aprobado',NULL,'6467f077b06a9e6ce1cff4d0b6f8ea203ddf6ef48e12197c1cf04ebe3fd17257',NULL,'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','2026-11-09 00:00:00','2019631501/Reportes/f780cdfd-eb9d-45cd-91cc-fdbe21ad9ee8.pdf'),
(12,4,1,'coordinador','aprobado',NULL,'327cbb582932924304d019fb7620ac8b729545979c09ff162a265bdbda507602',NULL,'MIISHzADAgEAMIISFgYJKoZIhvcNAQcCoIISBzCCEgMCAQMxDzANBglghkgBZQMEAgMFADCCAZAGCyqGSIb3DQEJEAEEoIIBfwSCAXswggF3AgEBBgQqAwQBMDEwDQYJYIZIAWUDBAIBBQAEIDJ8u1gpMpJDBNAZ+3YgrItylUWXnAn/FiomW9vaUHYCAgQJ3bFRGA8yMDI2MTEwOTA0NTEzOVoBAf8CCCOlHF0zqalooIIBE6SCAQ8wggELMREwDwYDVQQKDAhGcmVlIFRTQTEMMAoGA1UECwwDVFNBMXYwdAYDVQQNDG1UaGlzIGNlcnRpZmljYXRlIGRpZ2l0YWxseSBzaWducyBkb2N1bWVudHMgYW5kIHRpbWUgc3RhbXAgcmVxdWVzdHMgbWFkZSB1c2luZyB0aGUgZnJlZXRzYS5vcmcgb25saW5lIHNlcnZpY2VzMRgwFgYDVQQDDA93d3cuZnJlZXRzYS5vcmcxJDAiBgkqhkiG9w0BCQEWFWJ1c2lsZXphc0BtYWlsYm94Lm9yZzESMBAGA1UEBwwJV3VlcnpidXJnMQswCQYDVQQGEwJERTEPMA0GA1UECAwGQmF5ZXJuoIIOZzCCBmAwggRIoAMCAQICCQDC6YYWDajpzTANBgkqhkiG9w0BAQ0FADCBlTERMA8GA1UEChMIRnJlZSBUU0ExEDAOBgNVBAsTB1Jvb3QgQ0ExGDAWBgNVBAMTD3d3dy5mcmVldHNhLm9yZzEiMCAGCSqGSIb3DQEJARYTYnVzaWxlemFzQGdtYWlsLmNvbTESMBAGA1UEBxMJV3VlcnpidXJnMQ8wDQYDVQQIEwZCYXllcm4xCzAJBgNVBAYTAkRFMB4XDTI2MDIxNTE5NDQyMloXDTQwMDIwMjE5NDQyMlowggELMREwDwYDVQQKDAhGcmVlIFRTQTEMMAoGA1UECwwDVFNBMXYwdAYDVQQNDG1UaGlzIGNlcnRpZmljYXRlIGRpZ2l0YWxseSBzaWducyBkb2N1bWVudHMgYW5kIHRpbWUgc3RhbXAgcmVxdWVzdHMgbWFkZSB1c2luZyB0aGUgZnJlZXRzYS5vcmcgb25saW5lIHNlcnZpY2VzMRgwFgYDVQQDDA93d3cuZnJlZXRzYS5vcmcxJDAiBgkqhkiG9w0BCQEWFWJ1c2lsZXphc0BtYWlsYm94Lm9yZzESMBAGA1UEBwwJV3VlcnpidXJnMQswCQYDVQQGEwJERTEPMA0GA1UECAwGQmF5ZXJuMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEohXhobLWy4cYsdKOFALpjUsB1FJTntwwb7PH2LOfNMAA1ufaKhkgsdeW6etU0pl5MC5tSVuPF52yy4sz+mbY3L7IVdx/bs9m0ud7IA14YNcC2yIQLa2gvnxwsrR3rlWro4IB5jCCAeIwCQYDVR0TBAIwADAdBgNVHQ4EFgQUFcC9JuvUXYLRXZMmMS/vcLKLRl4wHwYDVR0jBBgwFoAU+lUNjDRmUUNM9+ezp2yVr3rmpJcwCwYDVR0PBAQDAgbAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMGwGCCsGAQUFBwEBBGAwXjAzBggrBgEFBQcwAoYnaHR0cDovL3d3dy5mcmVldHNhLm9yZy9maWxlcy9jYWNlcnQucGVtMCcGCCsGAQUFBzABhhtodHRwOi8vd3d3LmZyZWV0c2Eub3JnOjI1NjAwNwYDVR0fBDAwLjAsoCqgKIYmaHR0cDovL3d3dy5mcmVldHNhLm9yZy9jcmwvcm9vdF9jYS5jcmwwgcgGA1UdIASBwDCBvTCBugYDKwUIMIGyMDMGCCsGAQUFBwIBFidodHRwOi8vd3d3LmZyZWV0c2Eub3JnL2ZyZWV0c2FfY3BzLmh0bWwwMgYIKwYBBQUHAgEWJmh0dHA6Ly93d3cuZnJlZXRzYS5vcmcvZnJlZXRzYV9jcHMucGRmMEcGCCsGAQUFBwICMDsaOUZyZWVUU0EgdHJ1c3RlZCB0aW1lc3RhbXBpbmcgU29mdHdhcmUgYXMgYSBTZXJ2aWNlIChTYWFTKTANBgkqhkiG9w0BAQ0FAAOCAgEAazFUv2H53zK9M4mZ3rAVDqwzUazTYLdyIDDQ8DYcJeqClh1SIZWJzP+W6JY326WUwG6r8RyN87U9P7MMUDqk2reagSUQGP1R9Z/0+DPbg40rrt6n4dGR+Ty/RDaqFVuOIuTU/850Hr9jBlzgB8M/ZGcMM8/TBV+oWxoQalmvp5QKm+2O9ihc4995tTlR8VdlpeGA/X/dW2UxaVBBluCrW5JsaX/4hiD2n+Fh6aAVvzuhM6HzCmJc+Ml8hAYdMEUVcl5bS64/jBR6oXvj7DAZZav3QmjuFvxfgLhxJbu2lGFjAEnpaYVgCYlLDTK+RwKHgkkoIpan9QkqFgvpOnuN9+BcpviMuHLDHsfjxuK0nalyVUPgFhHUWo0jyoe8g36TZHZzusqkCf7UnddV0OXC9DPY1rgg9cx5YAPrvkdnK8t8qNt4w+6kxi4WalL1wslooB99P0P0V44w8K3OAyYkPoEWNBYXU2Kpb4DAT6+C3CSpzZLIr3Y/pG8+21Um6wQM0YmsyvZfONf+VzLT/Qbw9ISgqUBbz/T0oAgvBEJyqoEntuhUiQWgEHAOU5yvDReI5GxJQcX/88oez9yIx7KN+Y7YFFg9f4rYPQSVm2FMCeLXyC6QdhdMG5NRnGQwg2aMlt1397awKc/2Xfd4Bd46HPR4fURb3ikc1kO3XVLd3oEwggf/MIIF56ADAgECAgkAwemGFg2o6YAwDQYJKoZIhvcNAQENBQAwgZUxETAPBgNVBAoTCEZyZWUgVFNBMRAwDgYDVQQLEwdSb290IENBMRgwFgYDVQQDEw93d3cuZnJlZXRzYS5vcmcxIjAgBgkqhkiG9w0BCQEWE2J1c2lsZXphc0BnbWFpbC5jb20xEjAQBgNVBAcTCVd1ZXJ6YnVyZzEPMA0GA1UECBMGQmF5ZXJuMQswCQYDVQQGEwJERTAeFw0xNjAzMTMwMTUyMTNaFw00MTAzMDcwMTUyMTNaMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREUwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQC2Ao4OMDLxERDZZM2pS50CeOGUKukTqqWZB82ml5OZW9msfjO62f43BNocAamNIa/j9ZGlnXBncFFnmY9QFnIuCrRish9DkXHSz8xFk/NzWveUpasxH2wBDHiY3jPXXEUQ7nb0vR0UmM8X0wPwal3Z95bMbKm2V6Vv4+pP77585rahjT41owzuX/Fw0c85ozPT/aiWTSLbaFsp5WG+iQ8KqEWHOy6Eqyarg5/+j63p0juzHmHSc8ybiAZJGF+r7PoFNGAKupAbYU4uhUWC3qIib8Gc199SvtUNh3fNmYjAU6P8fcMoegaKT/ErcTzZgDZm6VU4VFb/OPgCmM9rk4VukiR3SmbPHN0Rwvjv2FID10WLJWZLE+1jnN7U/4ET1sxTU9JylHPDwwcVfHIqpbXdC/stbDixuTdJyIHsYAJtCJUbOCS9cbrLzkc669Y28LkYtKLI/0aU8HRXry1vHPglVNF3D9ef9dMU3NEEzdyryUE4BW388Bfn64Vy/VL3AUTxiNoF9YI/WN0GKX5zh77S13LBPagmZgEEX+QS3XCYbAyYe6c0S5A3OHUW0ljniFtR+JaLfyYBITvEy0yF+P8LhK9qmIM3zfuBho9+zzHcpnFtfsLdgCwWcmKeXABSyzV90pqvxD9hWzsf+dThzgjHHHPh/rt9xWozYhMp6e1sIwIDAQABo4ICTjCCAkowDAYDVR0TBAUwAwEB/zAOBgNVHQ8BAf8EBAMCAcYwHQYDVR0OBBYEFPpVDYw0ZlFDTPfns6dsla965qSXMIHKBgNVHSMEgcIwgb+AFPpVDYw0ZlFDTPfns6dsla965qSXoYGbpIGYMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREWCCQDB6YYWDajpgDAzBgNVHR8ELDAqMCigJqAkhiJodHRwOi8vd3d3LmZyZWV0c2Eub3JnL3Jvb3RfY2EuY3JsMIHPBgNVHSAEgccwgcQwgcEGCisGAQQBgfIkAQEwgbIwMwYIKwYBBQUHAgEWJ2h0dHA6Ly93d3cuZnJlZXRzYS5vcmcvZnJlZXRzYV9jcHMuaHRtbDAyBggrBgEFBQcCARYmaHR0cDovL3d3dy5mcmVldHNhLm9yZy9mcmVldHNhX2Nwcy5wZGYwRwYIKwYBBQUHAgIwOxo5RnJlZVRTQSB0cnVzdGVkIHRpbWVzdGFtcGluZyBTb2Z0d2FyZSBhcyBhIFNlcnZpY2UgKFNhYVMpMDcGCCsGAQUFBwEBBCswKTAnBggrBgEFBQcwAYYbaHR0cDovL3d3dy5mcmVldHNhLm9yZzoyNTYwMA0GCSqGSIb3DQEBDQUAA4ICAQBor36/k4Vi70zrO1gL4vr2zDWiZ3KWLz2VkB+lYwyH0JGYmEzooGoz+KnCgu2fHLEaxsI+FxCO5O/Ob7KU3pXBMyYiVXJVIsphlx1KO394JQ37jUruwPsZWbFkEAUgucEOZMYmYuStTQq64imPyUj8Tpno2ea4/b5EBBIex8FCLqyyydcyjgc5bmC087uAOtSlVcgP77U/hed2SgqftK/DmfTNL1+/WHEFxggc89BTN7a7fRsBC3SfSIjJEvNpa6G2kC13t9/ARsBKDMHsT40YXi2lXft7wqIDbGIZJGpPmd27bx+Ck5jzuAPcCtkNy1m+9MJ8d0BLmQQ7eCcYZ5kRUsOZ8Sy/xMYlrcCWNVrkTjQhAOxRelAuLwb5QLjUNZm7wRVPiudhoLDVVftKE5HU80IK+NvxLy1925133OFTeAQHSvF15PLW1Vs0tdb33L3TFzCvVkgNTAz/FD+eg7wVGGbQug8LvcR/4nhkF2u9bBq4XfMl7fd3iJvERxvz+nPlbMWR6LFgzaeweGoewErDsk+i4o1dGeXkgATV4WaoPILsb9VPs4Xrr3EzqFtS3kbbUkThw0ro025xL5/ODUk9fT7dWGxhmOPsPm6WNG9BesnyIeCv8zqPagse9MAjYwt2raqNkUM4JezEHEmluYsYHH2jDpl6uVTHPCzYBa/amTGCAewwggHoAgEBMIGjMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREUCCQDC6YYWDajpzTANBglghkgBZQMEAgMFAKCBuDAaBgkqhkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwHAYJKoZIhvcNAQkFMQ8XDTI2MTEwOTA0NTEzOVowKwYLKoZIhvcNAQkQAgwxHDAaMBgwFgQUSB/VPFNNOEGAwChlGaA2+YhUR2YwTwYJKoZIhvcNAQkEMUIEQFk+CKiwUhA6NHYvqmLwidkymp1VYk2K5zftNXuiGcv7L+oO7AN+GjbcqSHbgpSgDyx9EtTJUQnlJyPf7YxpOhAwCgYIKoZIzj0EAwQEZzBlAjEA9t1q9rkw0xWAFFCG+ORjFqrf1jjfTBPT2Yuw0IlgsHSc9kqx6928vbZClWRyXpyyAjAf1vUKn/sWrOtUEVBkK7n3RHtHgGiTSfCfVJNVBaT8Z102LroHcDLoeWJuniMTqmk=','2026-11-09 00:00:00','2019631501/Reportes/e6770e18-f7a5-475e-a2ef-53057fce394e.pdf'),
(13,5,24,'alumno','aprobado',NULL,'edbb34d05aa9d448b21094228556c7c0204173fddb090e14c11d4dd52db1cc1b',NULL,'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','2026-12-09 00:00:00','2019631501/Reportes/955175b9-28fe-45d3-b3cf-a345afc39815.pdf'),
(14,5,3,'profesor','aprobado',NULL,'c00173ac1a5d0687edf6694885b9767bf15be3e811b38aa7b1cf502849cca73e',NULL,'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','2026-12-09 00:00:00','2019631501/Reportes/d80c35df-df2a-4797-9421-9736e6ae9e60.pdf'),
(15,5,1,'coordinador','aprobado',NULL,'b5f2b0495850ddeaea7d627f0cb2c467a3c54b1b8bca27b7b31e922e26a5bb3a',NULL,'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','2026-12-09 00:00:00','2019631501/Reportes/1f82508c-4746-4145-b619-e765c60d8fab.pdf'),
(16,6,24,'alumno','aprobado',NULL,'0751f6bf4ef8afccfb1c45634ddd3ba53a89a0ca6057a5da24ef477809ab558f',NULL,'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','2027-01-09 00:00:00','2019631501/Reportes/6d7ba904-a526-4ec0-887a-550ac2b60881.pdf'),
(17,6,3,'profesor','aprobado',NULL,'7b28e6d68b7b2ee6a901e9835e0a993626209ecb16ca3aba81c4cec374bb47d0',NULL,'MIISHjADAgEAMIISFQYJKoZIhvcNAQcCoIISBjCCEgICAQMxDzANBglghkgBZQMEAgMFADCCAZAGCyqGSIb3DQEJEAEEoIIBfwSCAXswggF3AgEBBgQqAwQBMDEwDQYJYIZIAWUDBAIBBQAEIHso5taLey7mqQHpg14KmTYmIJ7LFso6uoHEzsN0u0fQAgQJ3bFeGA8yMDI2MTEwOTA0NTE0MFoBAf8CCHPKnMr1QBOjoIIBE6SCAQ8wggELMREwDwYDVQQKDAhGcmVlIFRTQTEMMAoGA1UECwwDVFNBMXYwdAYDVQQNDG1UaGlzIGNlcnRpZmljYXRlIGRpZ2l0YWxseSBzaWducyBkb2N1bWVudHMgYW5kIHRpbWUgc3RhbXAgcmVxdWVzdHMgbWFkZSB1c2luZyB0aGUgZnJlZXRzYS5vcmcgb25saW5lIHNlcnZpY2VzMRgwFgYDVQQDDA93d3cuZnJlZXRzYS5vcmcxJDAiBgkqhkiG9w0BCQEWFWJ1c2lsZXphc0BtYWlsYm94Lm9yZzESMBAGA1UEBwwJV3VlcnpidXJnMQswCQYDVQQGEwJERTEPMA0GA1UECAwGQmF5ZXJuoIIOZzCCBmAwggRIoAMCAQICCQDC6YYWDajpzTANBgkqhkiG9w0BAQ0FADCBlTERMA8GA1UEChMIRnJlZSBUU0ExEDAOBgNVBAsTB1Jvb3QgQ0ExGDAWBgNVBAMTD3d3dy5mcmVldHNhLm9yZzEiMCAGCSqGSIb3DQEJARYTYnVzaWxlemFzQGdtYWlsLmNvbTESMBAGA1UEBxMJV3VlcnpidXJnMQ8wDQYDVQQIEwZCYXllcm4xCzAJBgNVBAYTAkRFMB4XDTI2MDIxNTE5NDQyMloXDTQwMDIwMjE5NDQyMlowggELMREwDwYDVQQKDAhGcmVlIFRTQTEMMAoGA1UECwwDVFNBMXYwdAYDVQQNDG1UaGlzIGNlcnRpZmljYXRlIGRpZ2l0YWxseSBzaWducyBkb2N1bWVudHMgYW5kIHRpbWUgc3RhbXAgcmVxdWVzdHMgbWFkZSB1c2luZyB0aGUgZnJlZXRzYS5vcmcgb25saW5lIHNlcnZpY2VzMRgwFgYDVQQDDA93d3cuZnJlZXRzYS5vcmcxJDAiBgkqhkiG9w0BCQEWFWJ1c2lsZXphc0BtYWlsYm94Lm9yZzESMBAGA1UEBwwJV3VlcnpidXJnMQswCQYDVQQGEwJERTEPMA0GA1UECAwGQmF5ZXJuMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEohXhobLWy4cYsdKOFALpjUsB1FJTntwwb7PH2LOfNMAA1ufaKhkgsdeW6etU0pl5MC5tSVuPF52yy4sz+mbY3L7IVdx/bs9m0ud7IA14YNcC2yIQLa2gvnxwsrR3rlWro4IB5jCCAeIwCQYDVR0TBAIwADAdBgNVHQ4EFgQUFcC9JuvUXYLRXZMmMS/vcLKLRl4wHwYDVR0jBBgwFoAU+lUNjDRmUUNM9+ezp2yVr3rmpJcwCwYDVR0PBAQDAgbAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMGwGCCsGAQUFBwEBBGAwXjAzBggrBgEFBQcwAoYnaHR0cDovL3d3dy5mcmVldHNhLm9yZy9maWxlcy9jYWNlcnQucGVtMCcGCCsGAQUFBzABhhtodHRwOi8vd3d3LmZyZWV0c2Eub3JnOjI1NjAwNwYDVR0fBDAwLjAsoCqgKIYmaHR0cDovL3d3dy5mcmVldHNhLm9yZy9jcmwvcm9vdF9jYS5jcmwwgcgGA1UdIASBwDCBvTCBugYDKwUIMIGyMDMGCCsGAQUFBwIBFidodHRwOi8vd3d3LmZyZWV0c2Eub3JnL2ZyZWV0c2FfY3BzLmh0bWwwMgYIKwYBBQUHAgEWJmh0dHA6Ly93d3cuZnJlZXRzYS5vcmcvZnJlZXRzYV9jcHMucGRmMEcGCCsGAQUFBwICMDsaOUZyZWVUU0EgdHJ1c3RlZCB0aW1lc3RhbXBpbmcgU29mdHdhcmUgYXMgYSBTZXJ2aWNlIChTYWFTKTANBgkqhkiG9w0BAQ0FAAOCAgEAazFUv2H53zK9M4mZ3rAVDqwzUazTYLdyIDDQ8DYcJeqClh1SIZWJzP+W6JY326WUwG6r8RyN87U9P7MMUDqk2reagSUQGP1R9Z/0+DPbg40rrt6n4dGR+Ty/RDaqFVuOIuTU/850Hr9jBlzgB8M/ZGcMM8/TBV+oWxoQalmvp5QKm+2O9ihc4995tTlR8VdlpeGA/X/dW2UxaVBBluCrW5JsaX/4hiD2n+Fh6aAVvzuhM6HzCmJc+Ml8hAYdMEUVcl5bS64/jBR6oXvj7DAZZav3QmjuFvxfgLhxJbu2lGFjAEnpaYVgCYlLDTK+RwKHgkkoIpan9QkqFgvpOnuN9+BcpviMuHLDHsfjxuK0nalyVUPgFhHUWo0jyoe8g36TZHZzusqkCf7UnddV0OXC9DPY1rgg9cx5YAPrvkdnK8t8qNt4w+6kxi4WalL1wslooB99P0P0V44w8K3OAyYkPoEWNBYXU2Kpb4DAT6+C3CSpzZLIr3Y/pG8+21Um6wQM0YmsyvZfONf+VzLT/Qbw9ISgqUBbz/T0oAgvBEJyqoEntuhUiQWgEHAOU5yvDReI5GxJQcX/88oez9yIx7KN+Y7YFFg9f4rYPQSVm2FMCeLXyC6QdhdMG5NRnGQwg2aMlt1397awKc/2Xfd4Bd46HPR4fURb3ikc1kO3XVLd3oEwggf/MIIF56ADAgECAgkAwemGFg2o6YAwDQYJKoZIhvcNAQENBQAwgZUxETAPBgNVBAoTCEZyZWUgVFNBMRAwDgYDVQQLEwdSb290IENBMRgwFgYDVQQDEw93d3cuZnJlZXRzYS5vcmcxIjAgBgkqhkiG9w0BCQEWE2J1c2lsZXphc0BnbWFpbC5jb20xEjAQBgNVBAcTCVd1ZXJ6YnVyZzEPMA0GA1UECBMGQmF5ZXJuMQswCQYDVQQGEwJERTAeFw0xNjAzMTMwMTUyMTNaFw00MTAzMDcwMTUyMTNaMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREUwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQC2Ao4OMDLxERDZZM2pS50CeOGUKukTqqWZB82ml5OZW9msfjO62f43BNocAamNIa/j9ZGlnXBncFFnmY9QFnIuCrRish9DkXHSz8xFk/NzWveUpasxH2wBDHiY3jPXXEUQ7nb0vR0UmM8X0wPwal3Z95bMbKm2V6Vv4+pP77585rahjT41owzuX/Fw0c85ozPT/aiWTSLbaFsp5WG+iQ8KqEWHOy6Eqyarg5/+j63p0juzHmHSc8ybiAZJGF+r7PoFNGAKupAbYU4uhUWC3qIib8Gc199SvtUNh3fNmYjAU6P8fcMoegaKT/ErcTzZgDZm6VU4VFb/OPgCmM9rk4VukiR3SmbPHN0Rwvjv2FID10WLJWZLE+1jnN7U/4ET1sxTU9JylHPDwwcVfHIqpbXdC/stbDixuTdJyIHsYAJtCJUbOCS9cbrLzkc669Y28LkYtKLI/0aU8HRXry1vHPglVNF3D9ef9dMU3NEEzdyryUE4BW388Bfn64Vy/VL3AUTxiNoF9YI/WN0GKX5zh77S13LBPagmZgEEX+QS3XCYbAyYe6c0S5A3OHUW0ljniFtR+JaLfyYBITvEy0yF+P8LhK9qmIM3zfuBho9+zzHcpnFtfsLdgCwWcmKeXABSyzV90pqvxD9hWzsf+dThzgjHHHPh/rt9xWozYhMp6e1sIwIDAQABo4ICTjCCAkowDAYDVR0TBAUwAwEB/zAOBgNVHQ8BAf8EBAMCAcYwHQYDVR0OBBYEFPpVDYw0ZlFDTPfns6dsla965qSXMIHKBgNVHSMEgcIwgb+AFPpVDYw0ZlFDTPfns6dsla965qSXoYGbpIGYMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREWCCQDB6YYWDajpgDAzBgNVHR8ELDAqMCigJqAkhiJodHRwOi8vd3d3LmZyZWV0c2Eub3JnL3Jvb3RfY2EuY3JsMIHPBgNVHSAEgccwgcQwgcEGCisGAQQBgfIkAQEwgbIwMwYIKwYBBQUHAgEWJ2h0dHA6Ly93d3cuZnJlZXRzYS5vcmcvZnJlZXRzYV9jcHMuaHRtbDAyBggrBgEFBQcCARYmaHR0cDovL3d3dy5mcmVldHNhLm9yZy9mcmVldHNhX2Nwcy5wZGYwRwYIKwYBBQUHAgIwOxo5RnJlZVRTQSB0cnVzdGVkIHRpbWVzdGFtcGluZyBTb2Z0d2FyZSBhcyBhIFNlcnZpY2UgKFNhYVMpMDcGCCsGAQUFBwEBBCswKTAnBggrBgEFBQcwAYYbaHR0cDovL3d3dy5mcmVldHNhLm9yZzoyNTYwMA0GCSqGSIb3DQEBDQUAA4ICAQBor36/k4Vi70zrO1gL4vr2zDWiZ3KWLz2VkB+lYwyH0JGYmEzooGoz+KnCgu2fHLEaxsI+FxCO5O/Ob7KU3pXBMyYiVXJVIsphlx1KO394JQ37jUruwPsZWbFkEAUgucEOZMYmYuStTQq64imPyUj8Tpno2ea4/b5EBBIex8FCLqyyydcyjgc5bmC087uAOtSlVcgP77U/hed2SgqftK/DmfTNL1+/WHEFxggc89BTN7a7fRsBC3SfSIjJEvNpa6G2kC13t9/ARsBKDMHsT40YXi2lXft7wqIDbGIZJGpPmd27bx+Ck5jzuAPcCtkNy1m+9MJ8d0BLmQQ7eCcYZ5kRUsOZ8Sy/xMYlrcCWNVrkTjQhAOxRelAuLwb5QLjUNZm7wRVPiudhoLDVVftKE5HU80IK+NvxLy1925133OFTeAQHSvF15PLW1Vs0tdb33L3TFzCvVkgNTAz/FD+eg7wVGGbQug8LvcR/4nhkF2u9bBq4XfMl7fd3iJvERxvz+nPlbMWR6LFgzaeweGoewErDsk+i4o1dGeXkgATV4WaoPILsb9VPs4Xrr3EzqFtS3kbbUkThw0ro025xL5/ODUk9fT7dWGxhmOPsPm6WNG9BesnyIeCv8zqPagse9MAjYwt2raqNkUM4JezEHEmluYsYHH2jDpl6uVTHPCzYBa/amTGCAeswggHnAgEBMIGjMIGVMREwDwYDVQQKEwhGcmVlIFRTQTEQMA4GA1UECxMHUm9vdCBDQTEYMBYGA1UEAxMPd3d3LmZyZWV0c2Eub3JnMSIwIAYJKoZIhvcNAQkBFhNidXNpbGV6YXNAZ21haWwuY29tMRIwEAYDVQQHEwlXdWVyemJ1cmcxDzANBgNVBAgTBkJheWVybjELMAkGA1UEBhMCREUCCQDC6YYWDajpzTANBglghkgBZQMEAgMFAKCBuDAaBgkqhkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwHAYJKoZIhvcNAQkFMQ8XDTI2MTEwOTA0NTE0MFowKwYLKoZIhvcNAQkQAgwxHDAaMBgwFgQUSB/VPFNNOEGAwChlGaA2+YhUR2YwTwYJKoZIhvcNAQkEMUIEQI4N+3fRTF2bltnjkDpd1CCPeVdKMtuInyEkUGQBA2KJVwTtPauARYJ+7Tu/3Ah0JDHZZkjDg58wiip3goaF4hIwCgYIKoZIzj0EAwQEZjBkAjBMbKEs+uyTpzxQca/Uku68Dh86ulaj6hYgimFrA/HVDT/BinYuKl3keGEEXNEEctACMCb4hSBaUTmM0pIbAWaVWhAq4vfEW7mrAz/Vn3u97a0R03novFHQsJoo/iO7XT23vw==','2027-01-09 00:00:00','2019631501/Reportes/2ce183fe-0cd2-4689-a8f8-04e230133efd.pdf'),
(18,6,1,'coordinador','aprobado',NULL,'b7ed028e9038079f582d1f25c8a4897c4f62fa9328abe458c1de70ccd4edb51c',NULL,'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','2027-01-09 00:00:00','2019631501/Reportes/d81333ad-b73e-44b8-bf00-460088b4fa4c.pdf'),
(19,7,24,'alumno','aprobado',NULL,'68be3a0dc71d198f7b00ba67d5f13ac574dce15c15abf6f50e9696ac37136b5f',NULL,'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','2027-02-09 00:00:00','2019631501/Reportes/b1796710-91c6-4084-a4fa-5c5853f51d52.pdf'),
(20,7,3,'profesor','aprobado',NULL,'8d35e7607b81692f922f3ae5f3df2b133207af3ccb55dcd9d1105dd406625094',NULL,'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','2027-02-09 00:00:00','2019631501/Reportes/6b20176d-a9b1-4488-8bc2-503b1b130309.pdf'),
(21,7,1,'coordinador','aprobado',NULL,'5711192c84fb7b8773d69927b79316384f7d32666ad0cbef123eccb569bf5e96',NULL,'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','2027-02-09 00:00:00','2019631501/Reportes/75fb2f15-8d13-425a-bc47-4dd3dfd963f7.pdf'),
(22,8,25,'alumno','aprobado',NULL,'290a367307fcb2f94cffa477216b6cda81193ea62406e5e6ad3ca8d3a961e4c9',NULL,'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','2026-08-09 00:00:00','2020631601/Reportes/06b13560-d5b9-43fe-9fa5-c4f75f36cbbc.pdf'),
(23,8,5,'profesor','aprobado',NULL,'295344188d723275cfac808da85877f23bb992c9bbf353796fda9aa4966710fe',NULL,'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','2026-08-09 00:00:00','2020631601/Reportes/cbb2c7f6-c203-456a-8bec-ec8f22de919a.pdf'),
(24,8,1,'coordinador','aprobado',NULL,'546bca74a0c7258a046c3bb091abd2153734e34b86df1156c20e4d4ed0fc6865',NULL,'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','2026-08-09 00:00:00','2020631601/Reportes/88617114-f115-4d1b-bf88-41ec82e99d8a.pdf'),
(25,9,25,'alumno','aprobado',NULL,'96180f0913e39d7e1f64116e4b468873ec56f9029ec393233feca7290b9d5bf5',NULL,'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','2026-09-09 00:00:00','2020631601/Reportes/f4c858e9-7624-4172-9fd2-da07bd359ca3.pdf'),
(26,9,5,'profesor','aprobado',NULL,'5007c2a09649684feb97c4e47e404cb00894c0b5bf9f64e954dd3d057dcd9fc8',NULL,'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','2026-09-09 00:00:00','2020631601/Reportes/67c87917-8aed-4ed8-9c7a-3c357bc341e1.pdf'),
(27,9,1,'coordinador','aprobado',NULL,'a6965decec95eaf176344211c7dc07cd5a2aa27bf066f1bfc333fb8c8934ad30',NULL,'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','2026-09-09 00:00:00','2020631601/Reportes/73ef2327-388c-419d-9292-79f1278442ab.pdf');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_registro`
--

LOCK TABLES `solicitud_registro` WRITE;
/*!40000 ALTER TABLE `solicitud_registro` DISABLE KEYS */;
INSERT INTO `solicitud_registro` VALUES
(1,'2020630101',2,NULL,25,4,'Me interesa aplicar lo que he aprendido de modelos de recomendación en un proyecto real de la escuela.','espera_respuesta_de_profesor',NULL,'2026-11-09 04:51:29',NULL,NULL,0,0,0,0,NULL),
(2,'2019630201',1,NULL,23,NULL,NULL,'rechazada_definitivamente','espera_respuesta_de_profesor','2026-11-09 04:51:30','definitivo','Plazo de envío de expediente vencido',0,0,0,0,NULL),
(3,'2020630301',3,NULL,22,NULL,NULL,'rechazada_definitivamente','expediente_pendiente_revision','2026-11-09 04:51:30','definitivo','Tu periodo de servicio social inició sin que tu expediente quedara aprobado',0,0,0,0,'2026-11-09 04:51:30'),
(4,'2021630401',1,NULL,24,12,'Participar en la modernización del sistema de control escolar es justo la experiencia que busco para mi servicio.','alumno_asignado','expediente_pendiente_revision','2026-11-09 04:51:30',NULL,NULL,1,1,1,1,'2026-11-09 04:51:30'),
(5,'2019630501',1,NULL,21,15,'Me gustaría dar seguimiento al sistema de seguimiento académico que ya usamos como alumnos todos los días.','alumno_asignado','expediente_pendiente_revision','2026-11-09 04:51:30',NULL,NULL,1,1,1,1,'2026-11-09 04:51:30'),
(6,'2020630601',1,NULL,25,17,'Participé en el club de robótica como alumno y me gustaría apoyar ahora desde el otro lado.','espera_respuesta_de_profesor',NULL,'2026-11-09 04:51:30',NULL,NULL,0,0,0,0,NULL),
(7,'2021630701',1,NULL,25,17,'El club de robótica me parece una forma muy concreta de aplicar lo que he visto en mis materias.','espera_respuesta_de_profesor',NULL,'2026-11-09 04:51:30',NULL,NULL,0,0,0,0,NULL),
(8,'2019630801',1,NULL,25,2,'Me gustaría apoyar en la automatización de reportes de la biblioteca de la escuela.','SISS_y_documentacion_pendiente','adjuntar_documentacion_inicial','2026-11-09 04:51:30',NULL,NULL,1,1,0,0,NULL),
(9,'2020630901',1,NULL,25,7,'El rediseño del catálogo de servicios estudiantiles me interesa porque lo usamos todos a diario.','SISS_y_documentacion_pendiente','adjuntar_documentacion_inicial','2026-11-09 04:51:31',NULL,NULL,1,1,0,0,NULL),
(10,'2021631001',3,NULL,25,10,'Me gustaría trabajar en la visualización de indicadores institucionales para apoyar la toma de decisiones.','SISS_y_documentacion_pendiente','adjuntar_documentacion_inicial','2026-11-09 04:51:31',NULL,NULL,1,1,0,0,NULL),
(11,'2019631101',1,NULL,24,13,'La integración de firma electrónica en trámites internos me parece un proyecto muy aplicable hoy en día.','expediente_con_correcciones','expediente_pendiente_revision','2026-11-09 04:51:31','corregible','Falta la firma del alumno en la carta compromiso escaneada.',1,1,1,1,'2026-11-09 04:51:31'),
(12,'2020631201',1,NULL,24,16,'Quiero apoyar en el rediseño de la plataforma de becas porque yo mismo la he usado como alumno.','expediente_pendiente_revision','adjuntar_expediente','2026-11-09 04:51:31',NULL,NULL,1,1,1,1,'2026-11-09 04:51:31'),
(13,'2021631301',1,NULL,25,18,'Me gustaría apoyar en la difusión de actividades deportivas y culturales de la escuela.','espera_confirmacion_carta_compromiso','descargar_carta_compromiso','2026-11-09 04:51:31',NULL,NULL,1,1,0,0,NULL),
(14,'2020631401',2,NULL,20,5,'Me interesa apoyar en el monitoreo de los laboratorios de cómputo porque ya conozco bien el equipo como usuario frecuente.','alumno_asignado','expediente_pendiente_revision','2026-11-09 04:51:31',NULL,NULL,1,1,1,1,'2026-11-09 04:51:32'),
(15,'2019631501',1,NULL,15,3,'Quiero apoyar en la digitalización del archivo histórico escolar, un proyecto largo donde puedo aportar continuamente.','alumno_asignado','expediente_pendiente_revision','2026-11-09 04:51:32',NULL,NULL,1,1,1,1,'2026-11-09 04:51:32'),
(16,'2020631601',1,NULL,15,8,'Me interesa apoyar en el rediseño de la plataforma de becas, un proyecto donde ya conozco el sistema como alumna.','alumno_asignado','expediente_pendiente_revision','2026-11-09 04:51:43',NULL,NULL,1,1,1,1,'2026-11-09 04:51:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_contrasena`
--

LOCK TABLES `token_contrasena` WRITE;
/*!40000 ALTER TABLE `token_contrasena` DISABLE KEYS */;
INSERT INTO `token_contrasena` VALUES
(1,3,'3f94d93bd9240325ee0a49c6ed1c0f36761103b87bf6e2851ee6ac6b3003e357','2026-11-09 05:21:19',1),
(2,4,'c32ca3b49cbead7d8d2d7e6f44287ec597e2bfad4c4265c005e62aac4132bee4','2026-11-09 05:21:20',1),
(3,5,'2326c6a7b342cfc7817c30df0062975863813807788d75dc24fe50e470153265','2026-11-09 05:21:22',1),
(4,6,'3d14c20d78c3e3cb65a8af4966cd3199c80e2b13435db92c61e634aaef7871f7','2026-11-09 05:21:23',1),
(5,7,'9147c0b39fae56bb9dcd7121b3734d22c2b5d0bf44144fd636ad51bb9630b8a0','2026-11-09 05:21:25',1),
(6,8,'915d4bba578d1ff77c7dd984146bed8e76e1ee80f313faa811e72e51d5318859','2026-11-09 05:21:26',1),
(7,9,'b444ea0ff6764d266351e33d322b2ea4be8404c417ffdc10c57610acc7cf4047','2026-11-09 05:21:28',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES
(1,'coordinador','coordinadorherrera@ipn.mx','GABRIELA','HERRERA SOTELO','$2b$10$Obtd5isuwW7hrqvPbn7FI.5rYlPP7HhgDMpK2rxeNVbEALb1cFWNC',NULL,NULL,NULL,'2026-11-09 04:51:15',1,NULL,NULL,NULL),
(2,'coordinador','coordinadorvillagran@ipn.mx','OMAR','VILLAGRAN CASTRO','$2b$10$Obtd5isuwW7hrqvPbn7FI.5rYlPP7HhgDMpK2rxeNVbEALb1cFWNC',NULL,NULL,NULL,'2026-11-09 04:51:15',1,NULL,NULL,NULL),
(3,'profesor','profesorcastillo@ipn.mx','MARIANA','CASTILLO REYES','$2b$10$5DPGvh3FKSsWvit9kYK96eKU7Q8oVf17R1WWqnwmZZuUH9tEL1F/S',NULL,NULL,NULL,'2026-11-09 04:51:19',1,'profesorcastillo@ipn.mx/Rubrica/rubrica.enc','127.0.0.1','2026-11-09 04:51:33'),
(4,'profesor','profesorvaldez@ipn.mx','JORGE','VALDEZ MONTES','$2b$10$loOrW.8hvHon8mv3zpYmDOaMqlEqv4RfRnHB7HY5my193fKjfaYzi',NULL,NULL,NULL,'2026-11-09 04:51:20',1,NULL,NULL,NULL),
(5,'profesor','profesorromero@ipn.mx','PATRICIA','ROMERO AGUILAR','$2b$10$/NTjLK.fJCEik2cFqNtoEObBheNCGMNuARTiljUj4DxdKcAlpQV.a',NULL,NULL,NULL,'2026-11-09 04:51:22',1,'profesorromero@ipn.mx/Rubrica/rubrica.enc','127.0.0.1','2026-11-09 04:51:44'),
(6,'profesor','profesorochoa@ipn.mx','FERNANDO','OCHOA DELGADO','$2b$10$eLFRfu87fE3TIzM7IRjcjOUON4gCmTZCA5w7XyjwVAs4AnyM6CWnS',NULL,NULL,NULL,'2026-11-09 04:51:23',1,NULL,NULL,NULL),
(7,'profesor','profesorsandoval@ipn.mx','LAURA','SANDOVAL PRIETO','$2b$10$dcVwcUxGcJn56DCnlDX1z.rli85p56la2GCMzwLMOgpPf/t./UhWO',NULL,NULL,NULL,'2026-11-09 04:51:25',1,NULL,NULL,NULL),
(8,'profesor','profesorfigueroa@ipn.mx','ALEJANDRO','FIGUEROA LUNA','$2b$10$dxaLTKRzK0rMbelYXYDvku3QyQU/zhCTBas4MpDUeUn00AlTDL0Yi',NULL,NULL,NULL,'2026-11-09 04:51:26',1,NULL,NULL,NULL),
(9,'profesor','profesorvega@ipn.mx','CAROLINA','VEGA SOLIS','$2b$10$NL92OhZm2Sdfh6Mwy8851.zTjwD3IKrlHz/xU0fe0CmT6SlHhhnDm',NULL,NULL,NULL,'2026-11-09 04:51:28',1,NULL,NULL,NULL),
(10,'alumno_sin_asignar','rosales0101@alumno.ipn.mx','DIEGO','ROSALES PEÑA','$2b$10$sgBXhX5hdFeKhljweiv4iehnmsrNEfg1ygijaEqdB6PS6pW02ZXAa',NULL,NULL,NULL,'2026-11-09 04:51:29',NULL,NULL,NULL,NULL),
(11,'alumno_sin_asignar','camacho0201@alumno.ipn.mx','FERNANDA','CAMACHO RUIZ','$2b$10$pbHK4FT7FczT7Neu7QBMHutRN5mwf974itReZ8W/sJuvi7wqfzg6u',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(12,'alumno_sin_asignar','briones0301@alumno.ipn.mx','ANDRES','BRIONES SALAS','$2b$10$8YyI.wN39GpvJ7.zpC/TIOBGzT9khJ7CEH8ryR.Yhf8MHu8qhspSq',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(13,'alumno_asignado','quintero0401@alumno.ipn.mx','MONICA','QUINTERO VEGA','$2b$10$GrkG3PpI7Is4YHDKEiR8aOAAWH4/kCa3..MygV3r56Yvyfwerdqvi',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(14,'alumno_asignado','barrera0501@alumno.ipn.mx','SOFIA','BARRERA LEON','$2b$10$ddCNEOEdEImSZeYyOrZR8OP2RMhvAHbSI9qqqRvFpwOJQRRDnjzkG',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(15,'alumno_sin_asignar','estrada0601@alumno.ipn.mx','RICARDO','ESTRADA MORA','$2b$10$DknlYnqNY41CJ6ZarJTgZuwECWzWq3bHvfny0hw5U6r9A7eA/5AJi',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(16,'alumno_sin_asignar','nava0701@alumno.ipn.mx','PAULINA','NAVA CORTES','$2b$10$C/EmCBw3/8AFRyd..dK1c.3t5XtNEniZ3CNQmA86qBcA3smV5nlvG',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(17,'alumno_sin_asignar','guerrero0801@alumno.ipn.mx','LUIS','GUERRERO PACHECO','$2b$10$uQ2DzqTa7fZrlX/UPcpaGeakxIFy.1E8./Xt3F0L7HzBaQn8xk9OG',NULL,NULL,NULL,'2026-11-09 04:51:30',NULL,NULL,NULL,NULL),
(18,'alumno_sin_asignar','maldonado0901@alumno.ipn.mx','DANIELA','MALDONADO RIOS','$2b$10$zBNZiXjrlES.S0z0lnM3QO/SEifsJru36OuljF.8Kw3ofUiFh.X6u',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(19,'alumno_sin_asignar','cervantes1001@alumno.ipn.mx','OSCAR','CERVANTES DUARTE','$2b$10$LAmfLlNFHvueM5KR4Oh28erwa0KBfRSifVrMHYY/aSQf4m44cE7PO',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(20,'alumno_sin_asignar','ibarra1101@alumno.ipn.mx','VALERIA','IBARRA SOTO','$2b$10$rPjBLtsY0A4ueUfm8WObZeI0qz.UyAOoJ0sYN45zHgMc.bH2Pwmci',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(21,'alumno_sin_asignar','pacheco1201@alumno.ipn.mx','EMILIANO','PACHECO VERA','$2b$10$iiu7wzG7WVfNk7rrgPhu0.zwSEcn8lOxMfVlZx2CuDvIJShr..jBC',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(22,'alumno_sin_asignar','olvera1301@alumno.ipn.mx','ALEJANDRA','OLVERA FRANCO','$2b$10$JBGTpVhyeM858M2gZRmiP.SvtPJph9RnqDFl7aiSJjNDk/L9fC4FO',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(23,'alumno_asignado','rangel1401@alumno.ipn.mx','GERARDO','RANGEL OSORIO','$2b$10$Y8Z4IeI2S1ixPPmbdaqivebEjFaBfdWzvRUaK18NpPH4pdVKnlo7G',NULL,NULL,NULL,'2026-11-09 04:51:31',NULL,NULL,NULL,NULL),
(24,'alumno_asignado','fuentes1501@alumno.ipn.mx','ITZEL','FUENTES MARTINEZ','$2b$10$3eXoy5qIVXgsRFHo0YReqO7FFmwK3BFMOZyzVmLHcs4QoiyWT3Eui',NULL,NULL,NULL,'2026-11-09 04:51:32',NULL,'2019631501/Rubrica/rubrica.enc','127.0.0.1','2026-11-09 04:51:33'),
(25,'alumno_asignado','rosado1601@alumno.ipn.mx','MARIANA','ROSADO NAVA','$2b$10$269VvMLs.c0uFO5buQmHg.rclPh2ou8nDaRzYVbbEdsVhYkBm5KY.',NULL,NULL,NULL,'2026-11-09 04:51:43',NULL,'2020631601/Rubrica/rubrica.enc','127.0.0.1','2026-11-09 04:51:44');
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

-- Dump completed on 2026-11-09  0:01:31
