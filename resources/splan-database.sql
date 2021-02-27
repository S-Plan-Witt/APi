-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 10.200.1.1    Database: splan
-- ------------------------------------------------------
-- Server version	8.0.22

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
-- Table structure for table `TelegramMessages`
--

DROP TABLE IF EXISTS `TelegramMessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TelegramMessages` (
                                    `idTelegramMessages` int NOT NULL AUTO_INCREMENT,
                                    `chatId` int DEFAULT NULL,
                                    `message` text COLLATE latin1_german2_ci,
                                    `direction` text COLLATE latin1_german2_ci,
                                    PRIMARY KEY (`idTelegramMessages`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_announcements`
--

DROP TABLE IF EXISTS `data_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_announcements` (
                                      `iddata_announcements` int NOT NULL AUTO_INCREMENT,
                                      `content` text COLLATE latin1_german2_ci NOT NULL,
                                      `created` datetime DEFAULT CURRENT_TIMESTAMP,
                                      `edited` datetime DEFAULT CURRENT_TIMESTAMP,
                                      `date` date DEFAULT NULL,
                                      `authorId` int DEFAULT NULL,
                                      `editorId` int DEFAULT NULL,
                                      `courseId` int DEFAULT NULL,
                                      PRIMARY KEY (`iddata_announcements`),
                                      KEY `announcements_authorId_fk_idx` (`authorId`,`editorId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_aufsichten`
--

DROP TABLE IF EXISTS `data_aufsichten`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_aufsichten` (
                                   `iddata_aufsichten` int NOT NULL AUTO_INCREMENT,
                                   `time` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                   `date` date NOT NULL,
                                   `teacher` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                   `location` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                   PRIMARY KEY (`iddata_aufsichten`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_courses`
--

DROP TABLE IF EXISTS `data_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_courses` (
                                `iddata_courses` int NOT NULL AUTO_INCREMENT,
                                `grade` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                `subject` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                `group` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                `coursename` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci GENERATED ALWAYS AS (concat(`grade`,_latin1'/',`subject`,_latin1'-',`group`)) VIRTUAL,
                                `teacher` varchar(15) DEFAULT NULL,
                                `teacherId` int DEFAULT NULL,
                                PRIMARY KEY (`iddata_courses`),
                                KEY `courses_teacherId_fk_idx` (`teacherId`),
                                CONSTRAINT `courses_teacherId_fk` FOREIGN KEY (`teacherId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_entschuldigungen`
--

DROP TABLE IF EXISTS `data_entschuldigungen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_entschuldigungen` (
                                         `iddata_entschuldigungen` int NOT NULL AUTO_INCREMENT,
                                         PRIMARY KEY (`iddata_entschuldigungen`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_exam_rooms`
--

DROP TABLE IF EXISTS `data_exam_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_exam_rooms` (
                                   `iddata_exam_rooms` int NOT NULL AUTO_INCREMENT,
                                   `room` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                   `from` time DEFAULT NULL,
                                   `to` time DEFAULT NULL,
                                   `date` date DEFAULT NULL,
                                   PRIMARY KEY (`iddata_exam_rooms`)
) ENGINE=InnoDB AUTO_INCREMENT=5235 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_exam_supervisors`
--

DROP TABLE IF EXISTS `data_exam_supervisors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_exam_supervisors` (
                                         `supervisorId` int NOT NULL AUTO_INCREMENT,
                                         `RoomLink` int DEFAULT NULL,
                                         `TeacherId` int DEFAULT NULL,
                                         `from` time DEFAULT NULL,
                                         `to` time DEFAULT NULL,
                                         PRIMARY KEY (`supervisorId`),
                                         KEY `FK_RoomLinkSV_idx` (`RoomLink`),
                                         KEY `FK_RoomLink_idx` (`RoomLink`),
                                         KEY `FK_UserID_idx` (`TeacherId`),
                                         CONSTRAINT `FK_RoomLinkSV` FOREIGN KEY (`RoomLink`) REFERENCES `data_exam_rooms` (`iddata_exam_rooms`),
                                         CONSTRAINT `FK_UserID` FOREIGN KEY (`TeacherId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_exams`
--

DROP TABLE IF EXISTS `data_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_exams` (
                              `iddata_klausuren` int NOT NULL AUTO_INCREMENT,
                              `date` date NOT NULL,
                              `subject` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                              `grade` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                              `group` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                              `visibleOnDisplay` tinyint DEFAULT NULL,
                              `from` time NOT NULL,
                              `to` time NOT NULL,
                              `teacher` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                              `students` int NOT NULL,
                              `uniqueIdentifier` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci GENERATED ALWAYS AS (concat(`grade`,_latin1'-',`group`,_latin1'-',`subject`,_latin1'-',`date`)) VIRTUAL,
                              `roomLink` int DEFAULT NULL,
                              PRIMARY KEY (`iddata_klausuren`),
                              KEY `FK_RoomLink_idx` (`roomLink`),
                              CONSTRAINT `FK_RoomLink` FOREIGN KEY (`roomLink`) REFERENCES `data_exam_rooms` (`iddata_exam_rooms`)
) ENGINE=InnoDB AUTO_INCREMENT=258 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_lessons`
--

DROP TABLE IF EXISTS `data_lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_lessons` (
                                `idlessons` int NOT NULL AUTO_INCREMENT,
                                `room` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                `lesson` int NOT NULL,
                                `weekday` int DEFAULT NULL,
                                `identifier` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci GENERATED ALWAYS AS (concat(`courseId`,_utf8mb4'-',`weekday`,_utf8mb4'-',`lesson`)) VIRTUAL,
                                `courseId` int DEFAULT NULL,
                                PRIMARY KEY (`idlessons`),
                                UNIQUE KEY `idlessons_UNIQUE` (`idlessons`),
                                UNIQUE KEY `identifier_UNIQUE` (`identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=1365 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `data_replacementlessons`
--

DROP TABLE IF EXISTS `data_replacementlessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_replacementlessons` (
                                           `iddata_vertretungen` int NOT NULL AUTO_INCREMENT,
                                           `date` date NOT NULL,
                                           `subject` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                                           `room` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                                           `info` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                                           `lessonId` int DEFAULT NULL,
                                           `teacherId` int DEFAULT NULL,
                                           `replacementId` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci GENERATED ALWAYS AS (concat(`date`,_utf8mb4'-',`lessonId`)) VIRTUAL,
                                           PRIMARY KEY (`iddata_vertretungen`),
                                           UNIQUE KEY `replacementId_UNIQUE` (`replacementId`),
                                           KEY `replacementLesson_teacherid_fk_idx` (`teacherId`),
                                           CONSTRAINT `replacementLesson_teacherid_fk` FOREIGN KEY (`teacherId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
                           `idDevices` int NOT NULL AUTO_INCREMENT,
                           `userId` int DEFAULT NULL,
                           `deviceID` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
                           `platform` int DEFAULT NULL,
                           `added` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (`idDevices`),
                           KEY `devices_uid_fk_idx` (`userId`),
                           CONSTRAINT `devices_uid_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jwt_Token`
--

DROP TABLE IF EXISTS `jwt_Token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jwt_Token` (
                             `idjwt_Token` int NOT NULL AUTO_INCREMENT,
                             `tokenIdentifier` varchar(45) COLLATE latin1_german2_ci DEFAULT NULL,
                             `userid` int DEFAULT NULL,
                             `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                             PRIMARY KEY (`idjwt_Token`),
                             KEY `user_mails_uid_fk_idx` (`userid`),
                             CONSTRAINT `user_mails_uid_fk` FOREIGN KEY (`userid`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=268 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lessons_teacher`
--

DROP TABLE IF EXISTS `lessons_teacher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons_teacher` (
                                   `idlessons_teacher` int NOT NULL AUTO_INCREMENT,
                                   `teacher` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                   `teacherId` int DEFAULT NULL,
                                   `lessonId` int DEFAULT NULL,
                                   PRIMARY KEY (`idlessons_teacher`),
                                   KEY `lessons_teacher_teacherid_Fk_idx` (`teacherId`),
                                   CONSTRAINT `lessons_teacher_teacherid_Fk` FOREIGN KEY (`teacherId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `moodle_mapping`
--

DROP TABLE IF EXISTS `moodle_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moodle_mapping` (
                                  `userid` int unsigned NOT NULL,
                                  `moodleid` int unsigned NOT NULL,
                                  `uid` int NOT NULL,
                                  UNIQUE KEY `moodle_mapping_users_idusers_fk` (`userid`),
                                  KEY `moodlemapping_uid_fk_idx` (`uid`),
                                  CONSTRAINT `moodlemapping_uid_fk` FOREIGN KEY (`uid`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `new_view`
--

DROP TABLE IF EXISTS `new_view`;
/*!50001 DROP VIEW IF EXISTS `new_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `new_view` AS SELECT
                                       1 AS `idjwt_Token`,
                                       1 AS `tokenIdentifier`,
                                       1 AS `userid`,
                                       1 AS `timestamp`,
                                       1 AS `idusers`,
                                       1 AS `username`,
                                       1 AS `firstname`,
                                       1 AS `lastname`,
                                       1 AS `type`,
                                       1 AS `lastlogon`,
                                       1 AS `displayname`,
                                       1 AS `active`,
                                       1 AS `twoFactor`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
                               `idpermissions` int NOT NULL AUTO_INCREMENT,
                               `userId` int NOT NULL,
                               `users` int NOT NULL DEFAULT '0',
                               `replacementLessons` int NOT NULL DEFAULT '0',
                               `announcements` int NOT NULL DEFAULT '0',
                               `timeTable` int NOT NULL DEFAULT '0',
                               `moodle` int NOT NULL DEFAULT '0',
                               `globalAdmin` int NOT NULL DEFAULT '0',
                               PRIMARY KEY (`idpermissions`),
                               UNIQUE KEY `userId_UNIQUE` (`userId`),
                               KEY `userTable_uid_permissions_idx` (`userId`),
                               CONSTRAINT `fk_permissions_uid` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preAuth_Token`
--

DROP TABLE IF EXISTS `preAuth_Token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preAuth_Token` (
                                 `idpreAuth_Token` int NOT NULL AUTO_INCREMENT,
                                 `userId` int DEFAULT NULL,
                                 `token` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                 PRIMARY KEY (`idpreAuth_Token`),
                                 KEY `preauthToken_uid_fk_idx` (`userId`),
                                 CONSTRAINT `preauthToken_uid_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_courses`
--

DROP TABLE IF EXISTS `student_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_courses` (
                                   `idstudent_courses` int NOT NULL AUTO_INCREMENT,
                                   `user_id` int NOT NULL,
                                   `courseId` int DEFAULT NULL,
                                   `displayKlausuren` tinyint(1) DEFAULT '0',
                                   PRIMARY KEY (`idstudent_courses`),
                                   KEY `userid` (`user_id`),
                                   CONSTRAINT `userid` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=3486 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `telegramLinks`
--

DROP TABLE IF EXISTS `telegramLinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `telegramLinks` (
                                 `idtelegramLinks` int NOT NULL AUTO_INCREMENT,
                                 `telegramId` int NOT NULL,
                                 `token` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                 `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                                 PRIMARY KEY (`idtelegramLinks`),
                                 UNIQUE KEY `telegramLinks_telegramId_uindex` (`telegramId`),
                                 UNIQUE KEY `telegramLinks_token_uindex` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `token_calendar`
--

DROP TABLE IF EXISTS `token_calendar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_calendar` (
                                  `idtoken_calendar` int NOT NULL AUTO_INCREMENT,
                                  `userid` int DEFAULT NULL,
                                  `calendar_Token` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                                  PRIMARY KEY (`idtoken_calendar`),
                                  KEY `tokencalender_uid_fk_idx` (`userid`),
                                  CONSTRAINT `tokencalender_uid_fk` FOREIGN KEY (`userid`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_calendar`
--

LOCK TABLES `token_calendar` WRITE;
/*!40000 ALTER TABLE `token_calendar` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_calendar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `totp`
--

DROP TABLE IF EXISTS `totp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `totp` (
                        `id_totp` int NOT NULL AUTO_INCREMENT,
                        `user_id` int NOT NULL,
                        `totp_key` varchar(100) COLLATE latin1_german2_ci NOT NULL,
                        `verified` int NOT NULL DEFAULT '0',
                        `alias` varchar(45) COLLATE latin1_german2_ci DEFAULT NULL,
                        `added` datetime DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (`id_totp`),
                        UNIQUE KEY `totp_key_UNIQUE` (`totp_key`),
                        KEY `totp_user_fk_idx` (`user_id`),
                        CONSTRAINT `totp_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `totp`
--

LOCK TABLES `totp` WRITE;
/*!40000 ALTER TABLE `totp` DISABLE KEYS */;
/*!40000 ALTER TABLE `totp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
                         `idusers` int NOT NULL AUTO_INCREMENT,
                         `username` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                         `firstname` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                         `lastname` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                         `type` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                         `lastlogon` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                         `displayname` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                         `active` int DEFAULT '1',
                         `twoFactor` int DEFAULT '0',
                         `hashedpassword` varchar(100) COLLATE latin1_german2_ci DEFAULT NULL,
                         PRIMARY KEY (`idusers`),
                         UNIQUE KEY `users_username_uindex` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2063 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_mails`
--

DROP TABLE IF EXISTS `users_mails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_mails` (
                               `idusers_mails` int NOT NULL AUTO_INCREMENT,
                               `mail` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
                               `added` datetime DEFAULT CURRENT_TIMESTAMP,
                               `confirmed` int DEFAULT '0',
                               `token` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
                               `userid` int DEFAULT NULL,
                               `primary` int DEFAULT NULL,
                               PRIMARY KEY (`idusers_mails`),
                               UNIQUE KEY `users_mails_mail_uindex` (`mail`),
                               UNIQUE KEY `users_mails_token_uindex` (`token`),
                               KEY `users_mails_users_idusers_fk` (`userid`),
                               CONSTRAINT `users_mails_users_idusers_fk` FOREIGN KEY (`userid`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `new_view`
--

/*!50001 DROP VIEW IF EXISTS `new_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
    /*!50013 DEFINER=`nilswitt`@`%` SQL SECURITY DEFINER */
    /*!50001 VIEW `new_view` AS select `jwt_Token`.`idjwt_Token` AS `idjwt_Token`,`jwt_Token`.`tokenIdentifier` AS `tokenIdentifier`,`jwt_Token`.`userid` AS `userid`,`jwt_Token`.`timestamp` AS `timestamp`,`users`.`idusers` AS `idusers`,`users`.`username` AS `username`,`users`.`firstname` AS `firstname`,`users`.`lastname` AS `lastname`,`users`.`type` AS `type`,`users`.`lastlogon` AS `lastlogon`,`users`.`displayname` AS `displayname`,`users`.`active` AS `active`,`users`.`twoFactor` AS `twoFactor` from (`jwt_Token` left join `users` on((`users`.`idusers` = `jwt_Token`.`userid`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-02-27 11:23:42