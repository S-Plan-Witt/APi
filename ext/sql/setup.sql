create table if not exists data_announcements
(
    iddata_announcements int auto_increment
        primary key,
    content              text                               not null,
    shownOnDisplay       tinyint                            null,
    displayColor         varchar(45)                        null,
    displayOrder         int                                null,
    created              datetime default CURRENT_TIMESTAMP null,
    author               varchar(45)                        not null,
    edited               datetime default CURRENT_TIMESTAMP null,
    editedBy             varchar(45)                        null,
    grade                varchar(45)                        not null,
    subject              varchar(45)                        null,
    `group`              varchar(45)                        null,
    date                 date                               null
)
    collate = latin1_german2_ci;

create table if not exists data_aufsichten
(
    iddata_aufsichten int auto_increment
        primary key,
    time              varchar(45) not null,
    date              date        not null,
    teacher           varchar(45) not null,
    location          varchar(45) not null
)
    collate = latin1_german2_ci;

create table if not exists data_courses
(
    iddata_courses int auto_increment
        primary key,
    grade          varchar(45) not null,
    subject        varchar(45) not null,
    `group`        varchar(45) not null,
    coursename     varchar(45) as (concat(`grade`, '/', `subject`, '-', `group`)),
    teacher        varchar(15) null
);

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
    room              varchar(45) not null,
    `from`            time        null,
    `to`              time        null,
    date              date        null
)
    collate = latin1_german2_ci;

create table if not exists data_klausuren
(
    iddata_klausuren int auto_increment
        primary key,
    date             date        not null,
    subject          varchar(45) not null,
    grade            varchar(45) not null,
    `group`          varchar(45) not null,
    visibleOnDisplay tinyint     null,
    `from`           time        not null,
    `to`             time        not null,
    teacher          varchar(45) not null,
    students         int         not null,
    uniqueIdentifier varchar(45) as (concat(`grade`, '-', `group`, '-', `subject`, '-', `date`)),
    roomLink         int         null,
    constraint FK_RoomLink
        foreign key (roomLink) references data_exam_rooms (iddata_exam_rooms)
)
    collate = latin1_german2_ci;

create index FK_RoomLink_idx
    on data_klausuren (roomLink);

create table if not exists data_stundenplan
(
    iddata_stundenplan int auto_increment
        primary key,
    subject            varchar(45) not null,
    teacher            varchar(45) not null,
    grade              varchar(45) not null,
    `group`            varchar(45) not null,
    room               varchar(45) not null,
    coursename         varchar(45) as (concat(`subject`, '-', `group`)),
    lesson             int         not null,
    weekday            int         not null,
    identifier         varchar(45) as (concat(`grade`, '-', `coursename`, '-', `lesson`, '-', `weekday`)),
    constraint identifier_UNIQUE
        unique (identifier)
)
    collate = latin1_german2_ci;

create table if not exists data_vertretungen
(
    iddata_vertretungen int auto_increment
        primary key,
    date                date        not null,
    lesson              int         not null,
    changedSubject      varchar(45) null,
    changedTeacher      varchar(45) null,
    changedRoom         varchar(45) null,
    info                varchar(45) null,
    grade               varchar(45) not null,
    subject             varchar(45) not null,
    `group`             varchar(45) not null,
    weekday             int         not null,
    vertretungsID       varchar(100) as (concat(`grade`, '-', `subject`, '-', `group`, '-', `lesson`, '-', `weekday`,
                                                '-', `date`)),
    constraint VertretungsID_UNIQUE
        unique (vertretungsID)
)
    collate = latin1_german2_ci;

create table if not exists devices
(
    idDevices int auto_increment
        primary key,
    userID    int         null,
    deviceID  longtext    null,
    plattform varchar(45) null
)
    collate = utf8mb4_bin;

create table if not exists jwt_Token
(
    idjwt_Token     int auto_increment
        primary key,
    tokenIdentifier varchar(45)                         null,
    userid          varchar(45)                         null,
    timestamp       timestamp default CURRENT_TIMESTAMP null
);

create table if not exists lessons_teacher
(
    idlessons_teacher int auto_increment
        primary key,
    lessonId          varchar(45) not null,
    teacher           varchar(45) not null
)
    collate = latin1_german2_ci;

create table if not exists preAuth_Token
(
    idpreAuth_Token int auto_increment
        primary key,
    token           varchar(100) not null,
    username        varchar(45)  not null
)
    collate = latin1_german2_ci;

create table if not exists telegramLinks
(
    idtelegramLinks int auto_increment
        primary key,
    telegramId      int         not null,
    token           varchar(45) not null,
    constraint telegramLinks_telegramId_uindex
        unique (telegramId),
    constraint telegramLinks_token_uindex
        unique (token)
)
    collate = latin1_german2_ci;

create table if not exists token_calendar
(
    idtoken_calendar int auto_increment
        primary key,
    user_id          int(100)     not null,
    calendar_Token   varchar(100) not null
)
    collate = latin1_german2_ci;

create table if not exists users
(
    idusers     int auto_increment
        primary key,
    username    varchar(45)      not null,
    firstname   varchar(45)      null,
    lastname    varchar(45)      null,
    type        varchar(45)      null,
    lastlogon   varchar(45)      null,
    displayname varchar(45)      null,
    active      int(2) default 1 null,
    twoFactor   int    default 0 null,
    constraint users_username_uindex
        unique (username)
)
    collate = latin1_german2_ci;

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

create table if not exists moodle_mapping
(
    idmoodle_mapping int auto_increment
        primary key,
    userid           int not null,
    moodleid         int not null,
    constraint moodle_mapping_users_idusers_fk
        foreign key (userid) references users (idusers)
);

create table if not exists student_courses
(
    idstudent_courses int auto_increment
        primary key,
    subject           varchar(45)          not null,
    user_id           int                  not null,
    grade             varchar(45)          null,
    `group`           varchar(45)          null,
    displayKlausuren  tinyint(1) default 0 null,
    constraint userid
        foreign key (user_id) references users (idusers)
)
    collate = latin1_german2_ci;

create table if not exists totp
(
    id_totp  int auto_increment
        primary key,
    user_id  int                                not null,
    totp_key varchar(100)                       not null,
    verified int(1)   default 0                 not null,
    alias    varchar(45)                        null,
    added    datetime default CURRENT_TIMESTAMP null,
    constraint totp_key_UNIQUE
        unique (totp_key),
    constraint totp_user_fk
        foreign key (user_id) references users (idusers)
);

create index totp_user_fk_idx
    on totp (user_id);

create table if not exists users_mails
(
    idusers_mails int auto_increment
        primary key,
    mail          varchar(45)                        not null,
    added         datetime default CURRENT_TIMESTAMP null,
    confirmed     int      default 0                 null,
    token         varchar(50)                        null,
    userid        int                                null,
    constraint users_mails_mail_uindex
        unique (mail),
    constraint users_mails_token_uindex
        unique (token),
    constraint users_mails_users_idusers_fk
        foreign key (userid) references users (idusers)
)
    collate = latin1_german2_ci;

create table if not exists users_parents
(
    idusers_parentes int auto_increment
        primary key
)
    collate = utf8mb4_bin;

create table if not exists users_students
(
    idusers_students int auto_increment
        primary key
)
    collate = utf8mb4_bin;

create table if not exists users_teachers
(
    idusers_teachers int auto_increment
        primary key
)
    collate = utf8mb4_bin;

