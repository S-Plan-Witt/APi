-- MySQL dump 10.13  Distrib 8.0.23, for osx10.16 (x86_64)
--
-- Host: 10.200.1.1    Database: splan
-- ------------------------------------------------------
-- Server version	8.0.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS = @@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION = @@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE = @@TIME_ZONE */;
/*!40103 SET TIME_ZONE = '+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES = @@SQL_NOTES, SQL_NOTES = 0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements`
(
    `id_announcements` int                             NOT NULL AUTO_INCREMENT,
    `content`          text COLLATE utf8mb4_german2_ci NOT NULL,
    `created`          datetime DEFAULT CURRENT_TIMESTAMP,
    `edited`           datetime DEFAULT CURRENT_TIMESTAMP,
    `date`             date     DEFAULT NULL,
    `authorId`         int      DEFAULT NULL,
    `editorId`         int      DEFAULT NULL,
    `courseId`         int      DEFAULT NULL,
    PRIMARY KEY (`id_announcements`),
    KEY `announcements_authorId_fk_idx` (`authorId`, `editorId`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 3
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses`
(
    `id_courses` int                                    NOT NULL AUTO_INCREMENT,
    `grade`      varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `subject`    varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `group`      varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `coursename` varchar(45) COLLATE utf8mb4_german2_ci GENERATED ALWAYS AS (concat(`grade`, _utf8mb4'/', `subject`, _utf8mb4'-', `group`)) VIRTUAL,
    `teacherId`  int                                    NOT NULL,
    PRIMARY KEY (`id_courses`),
    KEY `courses_teacherId_fk_idx` (`teacherId`),
    CONSTRAINT `courses_teacherId_fk` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 3
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `courses`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices`
(
    `id_devices` int                                 NOT NULL AUTO_INCREMENT,
    `userId`     int                                 NOT NULL,
    `deviceID`   longtext COLLATE utf8mb4_german2_ci NOT NULL,
    `platform`   int                                 NOT NULL,
    `added`      timestamp                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_devices`),
    KEY `FK_devices_users_idx` (`userId`),
    CONSTRAINT `FK_devices_users` FOREIGN KEY (`userId`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 19
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `devices`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams`
(
    `id_exam`          int                                    NOT NULL AUTO_INCREMENT,
    `date`             date                                   NOT NULL,
    `visibleOnDisplay` tinyint                                NOT NULL,
    `from`             time                                   NOT NULL,
    `to`               time                                   NOT NULL,
    `teacher`          varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `students`         int                                    NOT NULL,
    `uniqueIdentifier` varchar(45) COLLATE utf8mb4_german2_ci GENERATED ALWAYS AS (concat(`teacher`, _utf8mb4'-', `date`)) VIRTUAL,
    `roomLink`         int                                    NOT NULL,
    `courseId`         int                                    NOT NULL,
    PRIMARY KEY (`id_exam`),
    KEY `FK_exams_roomLink_idx` (`roomLink`),
    KEY `FK_exams_courses_idx` (`courseId`),
    CONSTRAINT `FK_exams_courses` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id_courses`),
    CONSTRAINT `FK_exams_roomLink` FOREIGN KEY (`roomLink`) REFERENCES `exams_rooms` (`id_exam_rooms`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `exams`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams_rooms`
--

DROP TABLE IF EXISTS `exams_rooms`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams_rooms`
(
    `id_exam_rooms` int                                    NOT NULL AUTO_INCREMENT,
    `room`          varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `from`          time                                   NOT NULL,
    `to`            time                                   NOT NULL,
    `date`          date                                   NOT NULL,
    PRIMARY KEY (`id_exam_rooms`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 5236
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams_rooms`
--

LOCK TABLES `exams_rooms` WRITE;
/*!40000 ALTER TABLE `exams_rooms`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `exams_rooms`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams_supervisors`
--

DROP TABLE IF EXISTS `exams_supervisors`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams_supervisors`
(
    `id_exam_supervisor` int  NOT NULL AUTO_INCREMENT,
    `RoomLink`           int  NOT NULL,
    `teacherId`          int  NOT NULL,
    `from`               time NOT NULL,
    `to`                 time NOT NULL,
    PRIMARY KEY (`id_exam_supervisor`),
    KEY `FK_RoomLinkSV_idx` (`RoomLink`),
    KEY `FK_RoomLink_idx` (`RoomLink`),
    KEY `FK_UserID_idx` (`teacherId`),
    CONSTRAINT `FK_RoomLinkSV` FOREIGN KEY (`RoomLink`) REFERENCES `exams_rooms` (`id_exam_rooms`),
    CONSTRAINT `FK_UserID` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams_supervisors`
--

LOCK TABLES `exams_supervisors` WRITE;
/*!40000 ALTER TABLE `exams_supervisors`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `exams_supervisors`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons`
(
    `id_lessons` int                                    NOT NULL AUTO_INCREMENT,
    `room`       varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `lesson`     int                                    NOT NULL,
    `weekday`    int DEFAULT NULL,
    `identifier` varchar(45) COLLATE utf8mb4_german2_ci GENERATED ALWAYS AS (concat(`courseId`, _utf8mb4'-', `weekday`, _utf8mb4'-', `lesson`)) VIRTUAL,
    `courseId`   int                                    NOT NULL,
    PRIMARY KEY (`id_lessons`),
    UNIQUE KEY `identifier_UNIQUE` (`identifier`),
    KEY `FK_lessons_courses_idx` (`courseId`),
    CONSTRAINT `FK_lessons_courses` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id_courses`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1365
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `lessons`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `replacementlessons`
--

DROP TABLE IF EXISTS `replacementlessons`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `replacementlessons`
(
    `id_replacementlessons` int                                    NOT NULL AUTO_INCREMENT,
    `date`                  date                                   NOT NULL,
    `subject`               varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `room`                  varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `info`                  varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `lessonId`              int                                    NOT NULL,
    `teacherId`             int                                    NOT NULL,
    `replacementId`         varchar(45) COLLATE utf8mb4_german2_ci GENERATED ALWAYS AS (concat(`date`, _utf8mb4'-', `lessonId`)) VIRTUAL,
    PRIMARY KEY (`id_replacementlessons`),
    UNIQUE KEY `replacementId_UNIQUE` (`replacementId`),
    KEY `replacementLesson_teacherid_fk_idx` (`teacherId`),
    KEY `FK_replacementlessons_lessons_idx` (`lessonId`),
    CONSTRAINT `FK_replacementlessons_lessons` FOREIGN KEY (`lessonId`) REFERENCES `lessons` (`id_lessons`),
    CONSTRAINT `replacementLesson_teacherid_fk` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 32
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `replacementlessons`
--

LOCK TABLES `replacementlessons` WRITE;
/*!40000 ALTER TABLE `replacementlessons`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `replacementlessons`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_device_verification`
--

DROP TABLE IF EXISTS `user_device_verification`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_device_verification`
(
    `id_user_device_verifications` int                                    NOT NULL AUTO_INCREMENT,
    `deviceId`                     int                                    NOT NULL,
    `token`                        varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `created`                      timestamp                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_user_device_verifications`),
    UNIQUE KEY `telegramLinks_telegramId_uindex` (`deviceId`),
    UNIQUE KEY `telegramLinks_token_uindex` (`token`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 19
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_device_verification`
--

LOCK TABLES `user_device_verification` WRITE;
/*!40000 ALTER TABLE `user_device_verification`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_device_verification`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_mail`
--

DROP TABLE IF EXISTS `user_mail`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_mail`
(
    `id_user_mails` int                                    NOT NULL AUTO_INCREMENT,
    `mail`          varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `added`         datetime                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `confirmed`     int                                    NOT NULL DEFAULT '0',
    `token`         varchar(50) COLLATE utf8mb4_german2_ci          DEFAULT NULL,
    `userid`        int                                    NOT NULL,
    `primary`       int                                             DEFAULT NULL,
    PRIMARY KEY (`id_user_mails`),
    UNIQUE KEY `users_mails_mail_uindex` (`mail`),
    UNIQUE KEY `users_mails_token_uindex` (`token`),
    KEY `users_mails_users_idusers_fk` (`userid`),
    CONSTRAINT `users_mails_users_idusers_fk` FOREIGN KEY (`userid`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 6
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_mail`
--

LOCK TABLES `user_mail` WRITE;
/*!40000 ALTER TABLE `user_mail`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_mail`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_moodleaccounts`
--

DROP TABLE IF EXISTS `user_moodleaccounts`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_moodleaccounts`
(
    `userid`   int unsigned NOT NULL,
    `moodleid` int unsigned NOT NULL,
    `uid`      int          NOT NULL,
    UNIQUE KEY `moodle_mapping_users_idusers_fk` (`userid`),
    KEY `moodlemapping_uid_fk_idx` (`uid`),
    CONSTRAINT `moodlemapping_uid_fk` FOREIGN KEY (`uid`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_moodleaccounts`
--

LOCK TABLES `user_moodleaccounts` WRITE;
/*!40000 ALTER TABLE `user_moodleaccounts`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_moodleaccounts`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions`
(
    `id_permissions`     int NOT NULL AUTO_INCREMENT,
    `userId`             int NOT NULL,
    `users`              int NOT NULL DEFAULT '0',
    `replacementLessons` int NOT NULL DEFAULT '0',
    `announcements`      int NOT NULL DEFAULT '0',
    `timeTable`          int NOT NULL DEFAULT '0',
    `moodle`             int NOT NULL DEFAULT '0',
    `globalAdmin`        int NOT NULL DEFAULT '0',
    PRIMARY KEY (`id_permissions`),
    UNIQUE KEY `userId_UNIQUE` (`userId`),
    KEY `userTable_uid_permissions_idx` (`userId`),
    CONSTRAINT `fk_permissions_uid` FOREIGN KEY (`userId`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 6
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_student_courses`
--

DROP TABLE IF EXISTS `user_student_courses`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_student_courses`
(
    `id_user_student_courses` int        NOT NULL AUTO_INCREMENT,
    `user_id`                 int        NOT NULL,
    `courseId`                int        NOT NULL,
    `displayKlausuren`        tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id_user_student_courses`),
    KEY `userid` (`user_id`),
    CONSTRAINT `userid` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 3486
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_student_courses`
--

LOCK TABLES `user_student_courses` WRITE;
/*!40000 ALTER TABLE `user_student_courses`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_student_courses`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_token`
--

DROP TABLE IF EXISTS `user_token`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_token`
(
    `id_user_token`   int                                    NOT NULL AUTO_INCREMENT,
    `tokenIdentifier` varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `userid`          int                                    NOT NULL,
    `timestamp`       timestamp                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_user_token`),
    UNIQUE KEY `jwt_Token_tokenIdentifier_uindex` (`tokenIdentifier`),
    KEY `user_mails_uid_fk_idx` (`userid`),
    CONSTRAINT `user_mails_uid_fk` FOREIGN KEY (`userid`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 53
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_token`
--

LOCK TABLES `user_token` WRITE;
/*!40000 ALTER TABLE `user_token`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_token`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_totp`
--

DROP TABLE IF EXISTS `user_totp`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_totp`
(
    `id_totp`  int                                     NOT NULL AUTO_INCREMENT,
    `user_id`  int                                     NOT NULL,
    `totp_key` varchar(100) COLLATE utf8mb4_german2_ci NOT NULL,
    `verified` int                                     NOT NULL DEFAULT '0',
    `alias`    varchar(45) COLLATE utf8mb4_german2_ci  NOT NULL DEFAULT '',
    `added`    datetime                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_totp`),
    UNIQUE KEY `totp_key_UNIQUE` (`totp_key`),
    KEY `totp_user_fk_idx` (`user_id`),
    CONSTRAINT `totp_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_users`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 2
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_totp`
--

LOCK TABLES `user_totp` WRITE;
/*!40000 ALTER TABLE `user_totp`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `user_totp`
    ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users`
(
    `id_users`       int                                    NOT NULL AUTO_INCREMENT,
    `username`       varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `firstname`      varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `lastname`       varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `type`           varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `lastlogon`      varchar(45) COLLATE utf8mb4_german2_ci                      DEFAULT NULL,
    `displayname`    varchar(45) COLLATE utf8mb4_german2_ci NOT NULL,
    `active`         int                                    NOT NULL             DEFAULT '1',
    `twoFactor`      int                                    NOT NULL             DEFAULT '0',
    `hashedpassword` varchar(100) CHARACTER SET latin1 COLLATE latin1_german2_ci DEFAULT NULL,
    PRIMARY KEY (`id_users`),
    UNIQUE KEY `users_username_uindex` (`username`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 2064
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_german2_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users`
    DISABLE KEYS */;
/*!40000 ALTER TABLE `users`
    ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE = @OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE = @OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS = @OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION = @OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES = @OLD_SQL_NOTES */;

-- Dump completed on 2021-03-04 21:11:32
