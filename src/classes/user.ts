import {Course} from "./timeTable";

import {Ldap, LdapSearch}from './ldap';
import {SendGrid, EMails, EMail} from './eMail';
import {Jwt} from './jwt';

import winston from 'winston';
const logger = winston.loggers.get('main');

import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class User {
    displayName: string = "";
    lastName: string;
    active: any;
    firstName: string;
    username: string;
    type: string;
    devices: any;
    mails: any;
    id: number;
    courses: Course[];
    secondFactor: number;
    permissions: Permissions;


    /**
     *
     * @param firstName {String}
     * @param lastName {String}
     * @param username {String}
     * @param id {Integer}
     * @param type {String}
     * @param courses
     * @param active
     * @param mails
     * @param devices
     * @param secondFactor
     * @param permissions
     */                                                                                                                                                                                                                                                                     
    constructor(firstName = "", lastName = "", username= "" , id = 0, type = "", courses: Course[], active = null, mails = null, devices = null, secondFactor = 0, permissions = new Permissions()) {
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
    }

    static getUserByUsername(username: string): Promise<User> {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = [];
                rows = await conn.query("SELECT * FROM splan.users WHERE `username`= ?", [username]);
                await conn.end();
                if (rows.length > 0) {
                    let loadedUser: User = await User.fromSqlUser(rows[0]);
                    resolve(loadedUser);
                } else {
                    //TODO add logger
                    reject();
                }
            } catch (e) {
                //TODO add logger
                conn.end();
                reject(e);
            }
        });
    }

    static getUserById(id: number) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = [];
                rows = await conn.query("SELECT * FROM splan.users WHERE `idusers`= ?", [id]);
                await conn.end();
                if (rows.length > 0) {
                    let loadedUser = await User.fromSqlUser(rows[0]);
                    resolve(loadedUser);
                } else {
                    //TODO add logger
                    reject();
                }
            } catch (e) {
                //TODO add logger
                conn.end();
                reject(e);
            }
        });
    }

    static async fromSqlUser(sql: any): Promise<User> {
        return new Promise(async function (resolve, reject) {
            let type: string = "";
            switch (sql["type"]) {
                case "1":
                    type = "student";
                    break;
                case "2":
                    type = "teacher";
                    break;

                default:
                    break;
            }
            resolve( new User(sql["firstname"], sql["lastname"], sql["username"], sql["idusers"], type, await User.getCourses(sql["idusers"], type, sql["username"]),sql["active"], await User.getEMails(sql["idusers"]), await User.getDevices(sql["idusers"]),sql["twoFactor"]))
        });
    }

    /**
     * Create user with userdata from AD server
     * @param username {String}
     * @returns Promise resolves if user is created
     */
     createUserFromLdap(username: string) {
        return new Promise(async function (resolve, reject) {
            let user: User = await Ldap.getUserByUsername(username);

            let conn = await pool.getConnection();
            try {
                await conn.query("INSERT INTO `splan`.`users` (`username`, `firstname`, `lastname`, `type`, `displayname`) VALUES (?, ?, ?, '1', ?);", [username.toLowerCase(), user.firstName, user.lastName, user.displayName]);
                resolve();
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Creates a JWT for user
     * @returns Promise {String} token
     */
    generateToken(){
        let username = this.username;
        let type = this.type;
        return new Promise(async function (resolve, reject) {
            let tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            try {
                resolve(await Jwt.createJWT(username, type, tokenId));
            } catch (e) {
                //TODO add logger
                reject(e);
            }

        });
    }

    /**
     * Verifies password and username
     * @param password {String}
     * @returns Promise resolves if password is correct
     */
    verifyPassword(password: string){
        let username = this.username;
        return new Promise(async function (resolve, reject) {
            try {
                await Ldap.checkPassword(username, password);
                resolve("Ldap")
            } catch (err) {
                //TODO add logger
                reject();
            }
        });
    }

    /**
     *
     * @param username {String}
     * @returns Promise resolves if user is in database
     */
    userInDB(username: string) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.users WHERE username=?", [username.toLowerCase()]);
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
                //TODO add logger
                reject();
                console.log(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get courses associated with user
     * @param userId {Integer}
     * @param userType
     * @param username
     * @returns Promise {courses}
     */
    static getCourses(userId: number, userType: string, username: string): Promise<Course[]>{
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let courses: Course[] = [];
                if(userType == "student"){
                    const rows = await conn.query("SELECT * FROM splan.student_courses WHERE `user_id`= ?;", [userId]);
                    await conn.end();
                    rows.forEach((row: any) => {
                        courses.push(new Course(row.grade,row.subject,row.group, row.exams));
                    });
                }else if(userType == "teacher"){
                    const rows = await conn.query("SELECT * FROM splan.data_courses WHERE `teacher` LIKE ?;", ['%'+username+'%']);
                    await conn.end();
                    rows.forEach((row: any) => {
                        courses.push({
                            "subject": row.subject,
                            "grade": row.grade,
                            "group": row.group,
                            "exams":""
                        });
                    });
                }
                resolve(courses);
            } catch (err) {
                await conn.end();
                //TODO add logger
                reject(err);
            }
        });
    }

    static getEMails(userId: number): any{
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let mails: EMail[] = [];
                const rows = await conn.query("SELECT * FROM splan.users_mails WHERE `userid`= ?;", [userId]);
                await conn.end();
                rows.forEach((row: any) => {
                    mails.push(new EMail(userId, row["mail"],row["confirmed"], row["added"]));
                });

                resolve(mails);
            } catch (err) {
                await conn.end();
                //TODO add logger
                reject(err);
            }
        });
    }

    getAnnouncements(){
        let userId: number;
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let announcements : any = [];
                const rows = await conn.query("SELECT * FROM splan.student_courses WHERE `user_id`= ?;", [userId]);
                rows.forEach((row: any) => {
                    announcements.push({
                        "subject": row.subject,
                        "grade": row.grade,
                        "group": row.group,
                        "displayKlausuren": row.displayKlausuren
                    });
                });


                resolve(announcements);
            } catch (err) {
                //TODO add logger
                reject(err);
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
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT splan.student_courses.*, splan.devices.* FROM splan.student_courses " +
                    "LEFT JOIN splan.devices ON student_courses.user_id = splan.devices.userID " +
                    "WHERE (`grade`=? && `subject`=? && `group`=?)"
                    , [course.grade, course.subject, course.group]);

                let devices: any = [];
                rows.forEach((row: any) => {
                    if (row.deviceID != null) {
                        devices.push({"device": row.deviceID, "platform": row.plattform});
                    }
                });
                resolve(devices);
            } catch (err) {
                //TODO add logger
                reject(err);
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
        return new Promise(async function (resolve, reject) {
            try {
                let list = await Ldap.searchUser(filter);
                resolve(list);
            } catch (e) {
                logger.log({
                    level: 'warn',
                    label: 'User',
                    message: 'Error while getting user list from ldap : user.find (' + filter.firstName + "," + filter.lastName + "," + filter.birthday +")"
                });
                reject(e);
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
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                for (const course of courses) {
                    try {
                        console.log(course);
                        await conn.query("INSERT INTO `splan`.`student_courses` (`subject`, `user_id`, `grade`, `group`,`displayKlausuren`) VALUES (?, ?, ?, ?, ?)", [course.subject, userId, course.grade, course.group, course.exams]);
                    } catch (e) {
                        //TODO add logger
                        console.log(e)
                    }
                }
                resolve()
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Delete all course associations from user
     * @param username {String}
     * @returns Promise
     */
    deleteCourses() {
        let username = this.username;
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.users WHERE `username`= ? AND `type`= 1;", [username]);
                if (rows.length !== 0) {
                    let userId = rows[0].idusers;
                    await conn.query("DELETE FROM splan.student_courses WHERE `user_id`= ? ", [userId]);
                }
                resolve()
            } catch (e) {
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
    isTeacherOf(needle: Course){
        for (let i = 0; i < this.courses.length; i++) {
            let course = this.courses[i];

            if(course.grade == needle.grade && course.subject == needle.subject && course.group == needle.group){
                console.log("Found");
                return true;
            }
        }
        return false;
    }


    /**
     * Get all users from database
     * @returns Promise({user})
     */
    static getAllUsers(){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.users");
                resolve(rows);
            } catch (e) {
                //TODO add logger
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
    static getDevices(userId: number): any {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                const rows = await conn.query("SELECT * FROM splan.devices WHERE `userID`= ?;", [userId]);
                let devices: any = [];
                rows.forEach((row: any) => {
                    //TODO [""]
                    if (row.deviceID != null) {
                        devices.push({"device": row.deviceID, "platform": row.plattform});
                    }
                });
                resolve(devices);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end()
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
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                console.log(device)
                let rows = await conn.query("SELECT * FROM splan.devices WHERE `deviceID`= ?;", [device]);
                if (rows.length !== 0) {
                    //TODO add new handler
                    resolve(false);
                    return
                }
                await conn.query("INSERT INTO `splan`.`devices` (`userID`, `deviceID`, `plattform`) VALUES ((SELECT idusers FROM splan.users WHERE username = ?), ?, ?)", [username, device, platform]);
                resolve(true);
            } catch (e) {
                reject(e);
                //TODO add logger
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Remove device from Database
     * @param deviceId {String}
     * @returns Promise
     */
    static removeDevice(deviceId: string) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                await conn.query("DELETE FROM `splan`.`devices` WHERE `deviceID` = ?", [deviceId]);
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
     * Remove all Devices related to specified user
     * @param userId {Integer}
     * @returns Promise
     */
    removeAllDevicesByUser(userId: number) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                await conn.query("DELETE FROM `splan`.`devices` WHERE `userID` = ?", [userId]);
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
     * @param username {String}
     * @returns Promise(token)
     */
    createPreAuthToken(username: string) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await conn.query("INSERT INTO `splan`.`preAuth_Token` (`token`, `username`) VALUES (?, ?);", [token, username]);

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
     * Get username for Calender token
     * @param token {String}
     * @returns {Promise(username)}
     */
    static getUserByCalToken(token: string){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.token_calendar WHERE `calendar_token`= ? ", [token]);
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

    static getUsersByType(type: any){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.users WHERE `type`= ? ", [type]);
                resolve(rows);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getAllStudentsLDAP(){
        return new Promise(async function (resolve, reject) {
            try{
                let users = await Ldap.getAllStudents();
                resolve(users);
            }catch(e){
                console.log(e);
                reject(e);
            }
        });
    }

    isActive(){
        let active = this.active;
        return new Promise(async function (resolve, reject) {
            if(active == "1"){
                resolve();
            }else {
                reject("disabled")
            }
        });
    }
}

export class Student extends User {
    _grade: string;

    constructor(firstName = "", lastName = "", username = "", id = 0, grade = "", birthday = null, active = null) {
        super(firstName , lastName, username, id, "student", [], active, null, null, 0, new Permissions());
        this._grade = grade;
    }
}

export class Teacher extends User {

    constructor(firstName = "", lastName = "", username = "", id = 0) {
        super(firstName , lastName, username, id, "student", [], null, null, null, 0, new Permissions());    }
}

export class Parent extends User {
    constructor(firstName = "", lastName = "", username = "", id = 0) {
        super(firstName , lastName, username, id, "student", [], null, null, null, 0, new Permissions());    }
}

export class Permissions {
    users = 0;
    replacementLessons = 0;
    announcements = 0;
    timeTable = 0;
    moodle = 0;
    all: boolean = false;

    /**
     *
     * @param users {int}
     * @param replacementLessons {int}
     * @param announcements {int}
     * @param timeTable {int}
     * @param moodle {int}
     */
    constructor(users = 0, replacementLessons = 0, announcements = 0, timeTable = 0, moodle = 0) {
        this.users = users;
        this.replacementLessons = replacementLessons;
        this.announcements = announcements;
        this.timeTable = timeTable;
        this.moodle = moodle;
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