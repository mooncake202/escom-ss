-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: escom_ss
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alumnos`
--

DROP TABLE IF EXISTS `alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `boleta` varchar(50) DEFAULT NULL,
  `carrera` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo_personal` varchar(255) DEFAULT NULL,
  `creditos` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `boleta` (`boleta`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumnos`
--

LOCK TABLES `alumnos` WRITE;
/*!40000 ALTER TABLE `alumnos` DISABLE KEYS */;
INSERT INTO `alumnos` VALUES (1,14,'DAVID','SIXTOS REYES','2022630667','ISC','7441818888','a@g.g',78),(2,15,'ANA  KAREN','LAAGARZA ORTEGA','2022632222','ISC','7777777777','k@q.c',79),(3,16,'ANA KAREN','LAGARZA ORTEGA','2022634444','LCD','7777777777','k@g.c',70),(4,17,'RAFA','REYES MORENO','2022633333','IA','7441888888','r@g.c',79),(5,18,'AJKAJ A','KDI D','2022635556','IA','7444444444','i@g.c',79),(6,19,'AWIDJ DI','JIDJI D','2022637777','IA','7222222222','ijd@ff.c',78),(7,20,'AJA','AJA J','2022635555','ISC','5555555555','fq@f.c',79);
/*!40000 ALTER TABLE `alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ofertas_servicio`
--

DROP TABLE IF EXISTS `ofertas_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ofertas_servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesor_id` int(11) DEFAULT NULL,
  `tipo` enum('proyecto','individual') DEFAULT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `cupos` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profesor_id` (`profesor_id`),
  CONSTRAINT `1` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`),
  CONSTRAINT `check_cupos_individual` CHECK (`tipo` = 'individual' and `cupos` between 0 and 1 or `tipo` <> 'individual'),
  CONSTRAINT `check_cupos_no_negativos` CHECK (`cupos` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ofertas_servicio`
--

LOCK TABLES `ofertas_servicio` WRITE;
/*!40000 ALTER TABLE `ofertas_servicio` DISABLE KEYS */;
INSERT INTO `ofertas_servicio` VALUES (1,1,'proyecto','Sistema Web','Desarrollo de sistema web usando React y Node',7),(2,1,'individual','Investigaci├│n IA','Investigaci├│n sobre modelos de aprendizaje autom├ítico',0),(3,2,'proyecto','An├ílisis de Datos','Procesamiento de datos cientÔö£┬íficos',0),(4,3,'proyecto','Aplicaci├│n m├│vil','Desarrollo de app institucional',0);
/*!40000 ALTER TABLE `ofertas_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodos`
--

DROP TABLE IF EXISTS `periodos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodos`
--

LOCK TABLES `periodos` WRITE;
/*!40000 ALTER TABLE `periodos` DISABLE KEYS */;
INSERT INTO `periodos` VALUES (1,'2025-10-01','2026-04-30',1),(2,'2025-10-16','2026-05-14',1),(3,'2025-11-03','2026-06-03',1),(4,'2025-11-18','2026-06-18',1),(5,'2025-12-01','2026-07-01',1),(6,'2026-01-05','2026-07-17',1),(7,'2026-02-03','2026-09-03',1),(8,'2026-03-02','2026-10-02',1),(9,'2026-05-04','2026-12-04',1),(10,'2026-06-01','2027-01-01',1);
/*!40000 ALTER TABLE `periodos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesores`
--

DROP TABLE IF EXISTS `profesores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `departamento` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesores`
--

LOCK TABLES `profesores` WRITE;
/*!40000 ALTER TABLE `profesores` DISABLE KEYS */;
INSERT INTO `profesores` VALUES (1,1,'Dr. L├│pez','5512345678','Sistemas'),(2,2,'Dra. Hern├índez','5598765432','Datos'),(3,3,'Dr. Garc├¡a','5511122233','Inteligencia Artificial');
/*!40000 ALTER TABLE `profesores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_id` int(11) DEFAULT NULL,
  `oferta_id` int(11) DEFAULT NULL,
  `creditos` int(11) DEFAULT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `motivacion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `alumno_id` (`alumno_id`),
  KEY `oferta_id` (`oferta_id`),
  CONSTRAINT `1` FOREIGN KEY (`alumno_id`) REFERENCES `alumnos` (`id`),
  CONSTRAINT `2` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas_servicio` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (1,1,1,78,'9','PendienteProfesor','ddddddddddddddddddddddddddddd'),(2,2,3,79,'9','PendienteProfesor','rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr'),(3,3,2,70,'9','PendienteProfesor','YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY'),(4,4,1,79,'10','PendienteProfesor','nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn nnnnnnnnnnnnnnnnnnnnnnn'),(5,5,2,79,'9','PendienteProfesor','yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy y'),(6,6,1,78,'10','PendienteProfesor','nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn n'),(7,7,1,79,'9','PendienteProfesor','h jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjgjgj');
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `correoInst` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correoInst` (`correoInst`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'lopez@ipn.mx','1234','profesor'),(2,'hernandez@ipn.mx','1234','profesor'),(3,'garcia@ipn.mx','1234','profesor'),(4,'a1111@alumno.ipn.mx','$2b$10$9wZCSLltVbRtrI8670GTfuv2cD1iLA/BfD.4p/c/Wchs48glBByoS','alumno'),(5,'aaaa2222@alumno.ipn.mx','$2b$10$W2fJ.r3Z3LkFrtCnPqX3VeqA.Q1t9sSG5C1kwiRxTY/Zb3WVIZtKq','alumno'),(11,'aaaa2232@alumno.ipn.mx','$2b$10$yCLs7waewgZnUkvndMtoH.q3jVVxReQgYtc2OXd5f/I/4YLrT.EWe','alumno'),(12,'s1111@alumno.ipn.mx','$2b$10$f9k0eX88etZfdpPCN4tw6OsfYuhixklZmYc8EWuow6F/Hrweu47Y.','alumno'),(13,'y5555@alumno.ipn.mx','$2b$10$pdSn/bHv8XsnDS2GZWKiV.LL/3on752Kt6chwHa.fz/B3g1ZYJVfG','alumno'),(14,'aaa1111@alumno.ipn.mx','$2b$10$QHzMtnb1A0arCpaANlAPWOut9qBcqrgjTuMxxNQ8UqnI5eZH8pGSW','AlumnoSinAsignar'),(15,'b2222@alumno.ipn.mx','$2b$10$QeVCt0g7ez4vOFNNqCQLpOpBuE/IWGR.FCsUj06R/vyub.qE3yFU6','AlumnoSinAsignar'),(16,'d4444@alumno.ipn.mx','$2b$10$GYWjAGexMp9FNkQEd0t9C.noaYALcgNsWwhTgKFyNnFB6tdtqqzc.','AlumnoSinAsignar'),(17,'c3333@alumno.ipn.mx','$2b$10$lj0F8b1tyy3uI6M2OENLCOwXUozSNYoDdajiXq/iXEF2iMbimLYee','AlumnoSinAsignar'),(18,'rrr0000@alumno.ipn.mx','$2b$10$mDhhEhd5hQNMZzDT1bGsCeggjIbPzRWXo8UGhnZ9.3g1rC8MaDH.e','AlumnoSinAsignar'),(19,'fwef4545@alumno.ipn.mx','$2b$10$ODCIXuaGDRO7WEzMPYXQUOJnAhpx.fov7uSWX84v2d34WszVh9G9W','AlumnoSinAsignar'),(20,'a2222@alumno.ipn.mx','$2b$10$PrOBStXC64LuTYwW1I1.XedYGSKS.QsIvrQ/D5ICMe8SxoWGM0lp.','AlumnoSinAsignar');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-26 15:29:36
