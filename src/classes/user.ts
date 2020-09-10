/*
 * Copyright (c) 2020. Nils Witt
 */

import {Course} from "./timeTable";

import {Ldap} from './ldap';
import {EMail} from './eMail';
import {Jwt} from './jwt';

import {ApiGlobal} from "../types/global";
import {Moodle} from "./moodle";
import {Device} from "./device";


declare const global: ApiGlobal;


export class User {
    displayName: string = "";
    lastName: string;
    active: boolean;
    firstName: string;
    username: string;
    type: number;
    devices: any;
    mails: any;
    id: number;
    courses: Course[];
    secondFactor: number | null;
    permissions: Permissions;
    moodleUID: number |null;


    /**
     *
     * @param firstName {String}
     * @param lastName {String}
     * @param username {String}
     * @param id {Integer}
     * @param type {number}
     * @param courses
     * @param active
     * @param mails
     * @param devices
     * @param secondFactor
     * @param permissions
     * @param moodleUID
     */
    constructor(firstName: string = "", lastName: string = "", username: string = "", id: number = -1, type: number = 0, courses: Course[] = [], active = false, mails = null, devices = null, secondFactor: number | null = null, permissions: Permissions = Permissions.getDefault(), moodleUID: number | null = null) {
        this.active = active;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.type = type;
        this.courses = courses;
        this.mails = mails;
        this.devices = devices;
        this.secondFactor = secondFactor;
        this.permissions = permissions;
        this.moodleUID = moodleUID;

    }

    static getUserByUsername(username: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[];
                rows = await conn.query("SELECT * FROM users WHERE `username`= ?", [username]);
                if (rows.length > 0) {
                    global.logger.log({
                        level: 'silly',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): found'
                    });
                    let loadedUser: User = await User.fromSqlUser(rows[0]);
                    global.logger.log({
                        level: 'silly',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): loaded'
                    });
                    resolve(loadedUser);
                } else {
                    global.logger.log({
                        level: 'error',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): no user found'
                    });
                    reject("User not found");
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getUserByUsername(' + username + '): ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getUserById(id: number) : Promise<User> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[];
                rows = await conn.query("SELECT * FROM users LEFT JOIN moodle_mapping ON users.idusers = moodle_mapping.userid WHERE `idusers`= ?", [id]);
                if (rows.length > 0) {
                    let loadedUser = await User.fromSqlUser(rows[0]);
                    resolve(loadedUser);
                } else {
                    //TODO add logger
                    reject();
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getUserById: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static async fromSqlUser(sql: any): Promise<User> {
        return new Promise(async (resolve, reject) => {
            resolve(new User(sql["firstname"], sql["lastname"], sql["username"], sql["idusers"], parseInt(sql["type"]), await User.getCoursesByUser(sql["idusers"], parseInt(sql["type"])), sql["active"], await User.getEMails(sql["idusers"]), await User.getDevices(sql["idusers"]), sql["twoFactor"], await Permissions.getByUID(parseInt(sql["idusers"])), sql["moodleid"]))
        });
    }

    /**
     * Create user with userdata from AD server
     * @param username {String}
     * @returns Promise resolves if user is created
     */
     static createUserFromLdap(username: string) {
        return new Promise(async (resolve, reject) => {
            let user: User = await Ldap.getUserByUsername(username);

            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `users` (`username`, `firstname`, `lastname`, `type`, `displayname`) VALUES (?, ?, ?, '1', ?);", [username.toLowerCase(), user.firstName, user.lastName, user.displayName]);
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: createUserFromLdap: ' + JSON.stringify(e)
                });                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get courses associated with user
     * @param userId {Integer}
     * @param userType
     * @returns Promise {courses}
     */
    static getCoursesByUser(userId: number, userType: number): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let courses: Course[] = [];
                if (userType == 1) {
                    const rows = await conn.query("SELECT data_courses.*, student_courses.displayKlausuren FROM student_courses LEFT JOIN data_courses ON student_courses.courseId = data_courses.iddata_courses WHERE `user_id`= ?;", [userId]);
                    await conn.end();
                    rows.forEach((row: any) => {
                        let exams = false;
                        if (row.displayKlausuren == 1) {
                            exams = true;
                        }
                        courses.push(new Course(row.grade, row.subject, row.group, exams, row.iddata_courses));
                    });
                } else if (userType == 2) {
                    const rows = await conn.query("SELECT * FROM data_courses WHERE `teacherId` = ?;", [userId]);
                    rows.forEach((row: any) => {
                        courses.push(new Course(row.grade, row.subject, row.group, false, row.iddata_courses, row.teacherId));
                    });
                }
                global.logger.log({
                    level: 'silly',
                    label: 'User',
                    message: 'Class: User; Function: getCourses: loaded'
                });
                resolve(courses);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getCourses: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getEMails(userId: number): any{
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let mails: EMail[] = [];
                const rows = await conn.query("SELECT * FROM users_mails WHERE `userid`= ?;", [userId]);
                rows.forEach((row: any) => {
                    let confirmed = false;
                    let primary = false;
                    if (row["confirmed"] == 1) {
                        confirmed = true;
                    }
                    if(row["primary"] == 1){
                        primary  = true;
                    }


                    mails.push(new EMail(userId, row["mail"],confirmed, row["added"],primary));
                });
                global.logger.log({
                    level: 'silly',
                    label: 'User',
                    message: 'Class: User; Function: getMails: loaded'
                });
                resolve(mails);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getEmails: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get all student devices associated with course
     * @param course {Course}
     * @returns Promise {device}
     */
    static getStudentDevicesByCourse(course: Course){
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT student_courses.*, devices.* FROM student_courses LEFT JOIN devices ON student_courses.user_id = devices.userID WHERE (`courseId`=? )", [course.id]);

                let devices: any = [];
                rows.forEach((row: any) => {
                    if (row.deviceID != null) {
                        devices.push({"device": row.deviceID, "platform": row.plattform});
                    }
                });
                resolve(devices);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getStudentDevicesByCourse: ' + JSON.stringify(e)
                })
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Find user by supplied parameters
     * @returns Promise {user}
     * @param filter {UserFilter}
     */
    static find(filter: UserFilter) {
        return new Promise(async (resolve, reject) => {
            try {
                let list = await Ldap.searchUser(filter);
                resolve(list);
            } catch (e) {
                global.logger.log({
                    level: 'warn',
                    label: 'User',
                    message: 'Error while getting user list from ldap : user.find (' + filter.firstName + "," + filter.lastName + "," + filter.birthday + ")"
                });
                reject(e);
            }
        });
    }

    /**
     * Get all users from database
     * @returns Promise({user})
     */
    static getAllUsers() {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM users");
                resolve(rows);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getAllUsers: ' + JSON.stringify(e)
                });
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get devices related to user
     * @returns Promise({devices})
     * @param userId
     */
    static getDevices(userId: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM devices WHERE `userID`= ?;", [userId]);
                let devices: Device[] = [];
                rows.forEach((row: any) => {
                    if (row.deviceID != null) {
                        devices.push(new Device(row.plattform, row.deviceID, row.userId, row.added));
                    }
                });
                global.logger.log({
                    level: 'silly',
                    label: 'User',
                    message: 'Class: User; Function: getDevices: loaded'
                });
                resolve(devices);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getDevices: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end()
            }
        });
    }

    /**
     * Remove device from Database
     * @param deviceId {String}
     * @returns Promise
     */
    static removeDevice(deviceId: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `devices` WHERE `deviceID` = ?", [deviceId]);
                resolve();
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end()
            }
        });
    }

    /**
     * Get username for Calender token
     * @param token {String}
     * @returns {Promise(username)}
     */
    static getUserByCalToken(token: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM token_calendar WHERE `calendar_token`= ? ", [token]);
                if (rows.length === 1) {
                    resolve(await User.getUserById(rows[0].user_id));
                } else {
                    //TODO add logger
                    reject();
                }
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getUsersByType(type: any) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM users WHERE `type`= ? ", [type]);
                resolve(rows);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     *
     */
    static getAllStudentsLDAP(): Promise<Student[]> {
        return new Promise(async (resolve, reject) => {
            try {
                let users: Student[] = await Ldap.getAllStudents();
                resolve(users);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    createToDB() {
        let firstName = this.firstName;
        let lastName = this.lastName;
        let username = this.username;
        let type = this.type;
        let displayName = this.displayName;
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let result = await conn.query("INSERT INTO users ( username, firstname, lastname, type, displayname) VALUES (?, ?, ?, ?, ?)", [username, firstName, lastName, type, displayName]);
                resolve(result);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: createToDB: ' + JSON.stringify(e)
                });
                console.log(e);
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     *
     * @param needle {Course}
     */
    isTeacherOf(needle: Course) {
        if (this.courses != null) {
            for (let i = 0; i < this.courses.length; i++) {
                let course = this.courses[i];

                if (course.grade == needle.grade && course.subject == needle.subject && course.group == needle.group) {
                    console.log("Found");
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Creates a JWT for user
     * @returns Promise {String} token
     */
    generateToken() {
        let type = this.type;
        let id = this.id;
        return new Promise(async (resolve, reject) => {
            let tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            try {
                if (id != null) {
                    let typeString = "";
                    if (type === 1) typeString = "student";
                    if (type === 2) typeString = "teacher";
                    resolve(await Jwt.createJWT(id, typeString, tokenId));
                }
                reject("NAN UID")
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: generateToken: ' + JSON.stringify(e)
                });
                reject(e);
            }

        });
    }

    /**
     * Verifies password and username
     * @param password {String}
     * @returns Promise resolves if password is correct
     */
    verifyPassword(password: string) {
        let username = this.username;
        return new Promise(async (resolve, reject) => {
            try {
                await Ldap.checkPassword(username, password);
                resolve("Ldap")
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: verifyPassword: ' + JSON.stringify(e)
                });
                reject(e);
            }
        });
    }

    /**
     *
     * @param username {String}
     * @returns Promise resolves if user is in database
     */
    userInDB(username: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM users WHERE username=?", [username.toLowerCase()]);
                if (rows.length === 1) {
                    let type = null;
                    let row = rows[0];
                    if (row.type === "1") {
                        type = "student";
                    } else if (row.type === "2") {
                        type = "teacher";
                    }
                    resolve({"username": rows[0].username, "type": type});
                } else {
                    //TODO add logger
                    reject();
                }

            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: userInDB: ' + JSON.stringify(e)
                });
                reject();
                console.log(e)
            } finally {
                await conn.end();
            }
        });
    }

    getAnnouncements() {
        let userId: number;
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let announcements: any = [];
                const rows = await conn.query("SELECT * FROM student_courses WHERE `user_id`= ?;", [userId]);
                rows.forEach((row: any) => {
                    announcements.push({
                        "subject": row.subject,
                        "grade": row.grade,
                        "group": row.group,
                        "displayKlausuren": row.displayKlausuren
                    });
                });


                resolve(announcements);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getAnnouncements: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Associate courses with user
     * @param courses {Course[]}
     * @returns Promise
     */
    addCourse(courses: Course[]) {
        let userId = this.id;
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                for (const course of courses) {
                    try {
                        await conn.query("INSERT INTO `student_courses` (`user_id`, `courseId`,`displayKlausuren`) VALUES (?, ?, ?)", [userId, course.id, course.exams]);
                    } catch (e) {
                        global.logger.log({
                            level: 'error',
                            label: 'User',
                            message: 'Class: User; Function: addCourse(Mysql): ' + JSON.stringify(e)
                        })
                        console.log(e)
                    }
                }
                resolve()
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: addCourse: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Delete all course associations from user
     * @returns Promise
     */
    deleteCourses() {
        let username = this.username;
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM users WHERE `username`= ? AND `type`= 1;", [username]);
                if (rows.length !== 0) {
                    let userId = rows[0].idusers;
                    await conn.query("DELETE FROM student_courses WHERE `user_id`= ? ", [userId]);
                }
                resolve()
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: deleteCourse: ' + JSON.stringify(e)
                })
                console.log(e);
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Add device to user
     * @param device {String}
     * @param platform {String}
     * @returns Promise
     */
    addDevice(device: string, platform: string) {
        let username = this.username;
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                console.log(device)
                let rows = await conn.query("SELECT * FROM devices WHERE `deviceID`= ?;", [device]);
                if (rows.length !== 0) {
                    //TODO add new handler
                    resolve(false);
                    return
                }
                await conn.query("INSERT INTO `devices` (`userID`, `deviceID`, `plattform`) VALUES ((SELECT idusers FROM users WHERE username = ?), ?, ?)", [username, device, platform]);
                resolve(true);
            } catch (e) {
                reject(e);
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: addDevice: ' + JSON.stringify(e)
                })
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Remove all Devices related to specified user
     * @param userId {Integer}
     * @returns Promise
     */
    removeAllDevicesByUser(userId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `devices` WHERE `userID` = ?", [userId]);
                resolve();
            } catch (e) {
                reject(e);
                //TODO add logger
            } finally {
                await conn.end()
            }
        });
    }

    /**
     * Create Token for preAuthorization
     * @returns Promise(token)
     * @param userId
     */
    createPreAuthToken(userId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await conn.query("INSERT INTO `preAuth_Token` (`token`, `userId`) VALUES (?, ?);", [token, userId]);

                resolve(token);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<boolean>}
     */
    isActive(){
        let active = this.active;
        return new Promise(async (resolve, reject) => {
            if (active) {
                resolve(true);
            } else {
                reject("disabled");
            }
        });
    }

    /**
     *
     */
    enableMoodleAccount(){
        let uid = this.id;
        let username: string = this.username;
        let firstname: string = this.firstName;
        let lastname: string = this.lastName;
        let mail: string;
        if (this.mails.length == 0){
            mail = this.username + "@netman.lokal";
        }else {
            mail = this.mails[0];
        }
        return new Promise(async (resolve, reject) => {
            let muid = null;
            try {
                muid = await Moodle.createUser(username, firstname, lastname, mail);
                console.log(muid)
            } catch (e) {
                reject(e);
            }
            if (muid != null) {
                let conn;
                try {
                    conn = await global.mySQLPool.getConnection();
                    let result = await conn.query("INSERT INTO `moodle_mapping` (`userid`, `moodleid`) VALUES (?, ?);",[uid,muid]);
                    console.log(result);
                    resolve(muid);
                }catch (e) {
                    console.log(e);
                } finally {
                    await conn.end();
                }
            }
        });
    }

    disableMoodleAccount(){
        let mUID: number | null = this.moodleUID;
        let uid: number | null = this.id;
        return new Promise(async (resolve, reject) => {
            if (mUID != null) {
                let conn;
                try {
                    await Moodle.deleteUserById(mUID);

                    conn = await global.mySQLPool.getConnection();
                    let result = await conn.query("DELETE FROM `moodle_mapping` WHERE `userid` = ?", [uid]);
                    await conn.end();
                    console.log(result);
                    resolve(mUID);
                }catch (e) {
                    console.log(e);
                }
            }else {
                console.log("NO account");
            }
        });
    }
}

export class Student extends User {
    _grade: string;
    birthday: string;


    constructor(firstName = "", lastName = "", displayName: string, username = "", id = 0, grade = "", birthday: string,) {
        super(firstName, lastName, username, id, 1, [], false, null, null, 0, Permissions.getDefault());
        this._grade = grade;
        this.birthday = birthday;
        this.displayName = displayName;
    }
}

export class Teacher extends User {

    constructor(firstName = "", lastName = "", username = "", displayName: string = "", id = 0) {
        super(firstName, lastName, username, id, 2, [], false, null, null, 0, Permissions.getDefault());
        this.displayName = displayName;
    }
}

export class Permissions {
    users: boolean;
    usersAdmin: boolean;
    replacementLessons: boolean;
    replacementLessonsAdmin: boolean;
    announcements: boolean;
    announcementsAdmin: boolean;
    timeTable: boolean;
    timeTableAdmin: boolean;
    moodle: boolean;
    moodleAdmin: boolean;
    globalAdmin: boolean;


    constructor(users: boolean, usersAdmin: boolean, replacementLessons: boolean, replacementLessonsAdmin: boolean, announcements: boolean, announcementsAdmin: boolean, timeTable: boolean, timeTableAdmin: boolean, moodle: boolean, moodleAdmin: boolean, globalAdmin: boolean) {
        this.users = users;
        this.usersAdmin = usersAdmin;
        this.replacementLessons = replacementLessons;
        this.replacementLessonsAdmin = replacementLessonsAdmin;
        this.announcements = announcements;
        this.announcementsAdmin = announcementsAdmin;
        this.timeTable = timeTable;
        this.timeTableAdmin = timeTableAdmin;
        this.moodle = moodle;
        this.moodleAdmin = moodleAdmin;
        this.globalAdmin = globalAdmin;
    }

    static getDefault(){
        return new Permissions(false, false, true, false, true,false, true, false, true, false, false);
    }

    static getByUID(userId: number): Promise<Permissions> {
        return new Promise(async (resolve, reject) => {
            let conn;

            try {
                conn = await global.mySQLPool.getConnection();
                let result = await conn.query("SELECT * FROM permissions WHERE userId = ?", [userId]);
                if (result.length == 1) {
                    let uResult = result[0];
                    let permissions: Permissions = new Permissions(false, false, false, false, false, false, false, false, false, false, false);

                    if (uResult["users"] == 2) {
                        permissions.usersAdmin = true;
                        permissions.users = true;
                    }else if(uResult["users"] == 1){
                        permissions.users = true;
                    }

                    if(uResult["replacementLessons"] == 2){
                        permissions.replacementLessonsAdmin = true;
                        permissions.replacementLessons = true;
                    }else if(uResult["replacementLessons"] == 1){
                        permissions.replacementLessons = true;
                    }

                    if(uResult["announcements"] == 2){
                        permissions.announcementsAdmin = true;
                        permissions.announcements = true;
                    }else if(uResult["announcements"] == 1){
                        permissions.announcementsAdmin = true;
                    }

                    if(uResult["timeTable"] == 2){
                        permissions.timeTableAdmin = true;
                        permissions.timeTable = true;
                    }else if(uResult["timeTable"] == 1){
                        permissions.timeTable = true;
                    }

                    if(uResult["moodle"] == 2){
                        permissions.moodleAdmin = true;
                        permissions.moodle = true;
                    }else if(uResult["moodle"] == 1){
                        permissions.moodle = true;
                    }

                    if(uResult["globalAdmin"] == 1){
                        permissions = new Permissions(true, true, true, true, true, true, true, true, true, true, true);
                    }
                    global.logger.log({
                        level: 'silly',
                        label: 'Permissions',
                        message: 'Class: Permissions; Function: getByUID: loaded'
                    });
                    resolve(permissions);
                }else {
                    //TODO error
                    let permissions: Permissions = new Permissions(false, false, false, false, false, false, false, false, false, false, false);

                    resolve(permissions);
                }
            }catch (e) {
                console.log(e);
            }  finally {
                if (conn) await conn.end();
            }
        });
    }
}
export class UserFilter {
    username: string;
    firstName: string;
    lastName: string;
    birthday: string;

    constructor(username: string, firstName: string, lastName: string, birthday: string) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthday = birthday;
    }
}