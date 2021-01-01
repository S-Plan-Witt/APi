/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

create table if not exists TelegramMessages
(
    idTelegramMessages int auto_increment
        primary key,
    chatId             int  null,
    message            text null,
    direction          text null
)
    collate = latin1_german2_ci;

create table if not exists data_announcements
(
    iddata_announcements int auto_increment
        primary key,
    content              text                               not null,
    created              datetime default CURRENT_TIMESTAMP null,
    edited               datetime default CURRENT_TIMESTAMP null,
    date                 date                               null,
    authorId             int                                null,
    editorId             int                                null,
    courseId             int                                null
)
    collate = latin1_german2_ci;

create index announcements_authorId_fk_idx
    on data_announcements (authorId, editorId);

create table if not exists data_aufsichten
(
    iddata_aufsichten int auto_increment
        primary key,
    time              varchar(45) charset latin1 not null,
    date              date                       not null,
    teacher           varchar(45) charset latin1 not null,
    location          varchar(45) charset latin1 not null
)
    collate = latin1_german2_ci;

create table if not exists data_entschuldigungen
(
    iddata_entschuldigungen int auto_increment
        primary key
)
    collate = latin1_german2_ci;

create table if not exists data_exam_rooms
(
    iddata_exam_rooms int auto_increment
        primary key,
    room              varchar(45) charset latin1 not null,
    `from`            time                       null,
    `to`              time                       null,
    date              date                       null
)
    collate = latin1_german2_ci;

create table if not exists data_exams
(
    iddata_klausuren int auto_increment
        primary key,
    date             date                       not null,
    subject          varchar(45) charset latin1 not null,
    grade            varchar(45) charset latin1 not null,
    `group`          varchar(45) charset latin1 not null,
    visibleOnDisplay tinyint                    null,
    `from`           time                       not null,
    `to`             time                       not null,
    teacher          varchar(45) charset latin1 not null,
    students         int                        not null,
    uniqueIdentifier varchar(45) as (concat(`grade`, _latin1'-', `group`, _latin1'-', `subject`, _latin1'-', `date`)),
    roomLink         int                        null,
    constraint FK_RoomLink
        foreign key (roomLink) references data_exam_rooms (iddata_exam_rooms)
)
    collate = latin1_german2_ci;

create index FK_RoomLink_idx
    on data_exams (roomLink);

create table if not exists data_lessons
(
    idlessons  int auto_increment,
    room       varchar(45) charset latin1 not null,
    lesson     int                        not null,
    weekday    int                        null,
    identifier varchar(45) as (concat(`courseId`, _utf8mb4'-', `weekday`, _utf8mb4'-', `lesson`)),
    courseId   int                        null,
    constraint identifier_UNIQUE
        unique (identifier),
    constraint idlessons_UNIQUE
        unique (idlessons)
)
    collate = latin1_german2_ci;

alter table data_lessons
    add primary key (idlessons);

create table if not exists telegramLinks
(
    idtelegramLinks int auto_increment
        primary key,
    telegramId      int                                 not null,
    token           varchar(45) charset latin1          not null,
    created         timestamp default CURRENT_TIMESTAMP null,
    constraint telegramLinks_telegramId_uindex
        unique (telegramId),
    constraint telegramLinks_token_uindex
        unique (token)
)
    collate = latin1_german2_ci;

create table if not exists users
(
    idusers     int auto_increment
        primary key,
    username    varchar(45) charset latin1 not null,
    firstname   varchar(45) charset latin1 null,
    lastname    varchar(45) charset latin1 null,
    type        varchar(45) charset latin1 null,
    lastlogon   varchar(45) charset latin1 null,
    displayname varchar(45) charset latin1 null,
    active      int default 1              null,
    twoFactor   int default 0              null,
    constraint users_username_uindex
        unique (username)
)
    collate = latin1_german2_ci;

create table if not exists data_courses
(
    iddata_courses int auto_increment
        primary key,
    grade          varchar(45) not null,
    subject        varchar(45) not null,
    `group`        varchar(45) not null,
    coursename     varchar(45) as (concat(`grade`, _latin1'/', `subject`, _latin1'-', `group`)),
    teacher        varchar(15) null,
    teacherId      int         null,
    constraint courses_teacherId_fk
        foreign key (teacherId) references users (idusers)
)
    charset = latin1;

create index courses_teacherId_fk_idx
    on data_courses (teacherId);

create table if not exists data_exam_supervisors
(
    supervisorId int auto_increment
        primary key,
    RoomLink     int  null,
    TeacherId    int  null,
    `from`       time null,
    `to`         time null,
    constraint FK_RoomLinkSV
        foreign key (RoomLink) references data_exam_rooms (iddata_exam_rooms),
    constraint FK_UserID
        foreign key (TeacherId) references users (idusers)
)
    collate = latin1_german2_ci;

create index FK_RoomLinkSV_idx
    on data_exam_supervisors (RoomLink);

create index FK_RoomLink_idx
    on data_exam_supervisors (RoomLink);

create index FK_UserID_idx
    on data_exam_supervisors (TeacherId);

create table if not exists data_replacementlessons
(
    iddata_vertretungen int auto_increment
        primary key,
    date                date                       not null,
    subject             varchar(45) charset latin1 null,
    room                varchar(45) charset latin1 null,
    info                varchar(45) charset latin1 null,
    lessonId            int                        null,
    teacherId           int                        null,
    replacementId       varchar(45) as (concat(`date`, _utf8mb4'-', `lessonId`)),
    constraint replacementId_UNIQUE
        unique (replacementId),
    constraint replacementLesson_teacherid_fk
        foreign key (teacherId) references users (idusers)
)
    collate = latin1_german2_ci;

create index replacementLesson_teacherid_fk_idx
    on data_replacementlessons (teacherId);

create table if not exists devices
(
    idDevices int auto_increment
        primary key,
    userId    int                                 null,
    deviceID  longtext charset utf8mb4            null,
    plattform varchar(45) charset utf8mb4         null,
    added     timestamp default CURRENT_TIMESTAMP null,
    constraint devices_uid_fk
        foreign key (userId) references users (idusers)
)
    collate = latin1_german2_ci;

create index devices_uid_fk_idx
    on devices (userId);

create table if not exists jwt_Token
(
    idjwt_Token     int auto_increment
        primary key,
    tokenIdentifier varchar(45)                         null,
    userid          int                                 null,
    timestamp       timestamp default CURRENT_TIMESTAMP null,
    constraint user_mails_uid_fk
        foreign key (userid) references users (idusers)
)
    collate = latin1_german2_ci;

create index user_mails_uid_fk_idx
    on jwt_Token (userid);

create table if not exists lessons_teacher
(
    idlessons_teacher int auto_increment
        primary key,
    teacher           varchar(45) charset latin1 not null,
    teacherId         int                        null,
    lessonId          int                        null,
    constraint lessons_teacher_teacherid_Fk
        foreign key (teacherId) references users (idusers)
)
    collate = latin1_german2_ci;

create index lessons_teacher_teacherid_Fk_idx
    on lessons_teacher (teacherId);

create table if not exists moodle_mapping
(
    userid   int unsigned not null,
    moodleid int unsigned not null,
    uid      int          not null,
    constraint moodle_mapping_users_idusers_fk
        unique (userid),
    constraint moodlemapping_uid_fk
        foreign key (uid) references users (idusers)
)
    collate = latin1_german2_ci;

create index moodlemapping_uid_fk_idx
    on moodle_mapping (uid);

create table if not exists permissions
(
    idpermissions      int auto_increment
        primary key,
    userId             int           not null,
    users              int default 0 not null,
    replacementLessons int default 0 not null,
    announcements      int default 0 not null,
    timeTable          int default 0 not null,
    moodle             int default 0 not null,
    globalAdmin        int default 0 not null,
    constraint userId_UNIQUE
        unique (userId),
    constraint fk_permissions_uid
        foreign key (userId) references users (idusers)
)
    collate = latin1_german2_ci;

create index userTable_uid_permissions_idx
    on permissions (userId);

create table if not exists preAuth_Token
(
    idpreAuth_Token int auto_increment
        primary key,
    userId          int                         null,
    token           varchar(100) charset latin1 not null,
    constraint preauthToken_uid_fk
        foreign key (userId) references users (idusers)
)
    collate = latin1_german2_ci;

create index preauthToken_uid_fk_idx
    on preAuth_Token (userId);

create table if not exists student_courses
(
    idstudent_courses int auto_increment
        primary key,
    user_id           int                  not null,
    courseId          int                  null,
    displayKlausuren  tinyint(1) default 0 null,
    constraint userid
        foreign key (user_id) references users (idusers)
)
    collate = latin1_german2_ci;

create table if not exists token_calendar
(
    idtoken_calendar int auto_increment
        primary key,
    userid           int                         null,
    calendar_Token   varchar(100) charset latin1 not null,
    constraint tokencalender_uid_fk
        foreign key (userid) references users (idusers)
)
    collate = latin1_german2_ci;

create index tokencalender_uid_fk_idx
    on token_calendar (userid);

create table if not exists totp
(
    id_totp  int auto_increment
        primary key,
    user_id  int                                not null,
    totp_key varchar(100)                       not null,
    verified int      default 0                 not null,
    alias    varchar(45)                        null,
    added    datetime default CURRENT_TIMESTAMP null,
    constraint totp_key_UNIQUE
        unique (totp_key),
    constraint totp_user_fk
        foreign key (user_id) references users (idusers)
)
    collate = latin1_german2_ci;

create index totp_user_fk_idx
    on totp (user_id);

create table if not exists users_mails
(
    idusers_mails int auto_increment
        primary key,
    mail          varchar(45) charset latin1         not null,
    added         datetime default CURRENT_TIMESTAMP null,
    confirmed     int      default 0                 null,
    token         varchar(50) charset latin1         null,
    userid        int                                null,
    `primary`     int                                null,
    constraint users_mails_mail_uindex
        unique (mail),
    constraint users_mails_token_uindex
        unique (token),
    constraint users_mails_users_idusers_fk
        foreign key (userid) references users (idusers)
)
    collate = latin1_german2_ci;

