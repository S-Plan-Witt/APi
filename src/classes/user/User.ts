/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Ldap} from '../external/Ldap';
import {JWTInterface} from '../JWTInterface';
import {ApiGlobal} from "../../types/global";
import {Moodle} from "../Moodle";
import {Device, DeviceType} from "../Device";
import {Permissions} from "../Permissions";
import {Student} from "./Student";
import {Course} from "../Course";
import path from "path";
import {UserFilter} from "./UserFilter";

const bcrypt = require('bcrypt');

declare const global: ApiGlobal;

/**
 * @typedef User
 * @property {string} id.required
 * @property {string} moodleUID
 * @property {string} username.required
 * @property {string} firstName.required
 * @property {string} lastName.required
 * @property {string} displayName.required
 * @property {string} status.required
 * @property {UserType} type.required
 * @property {Array.<Device>} devices
 * @property {Array.<Course>} courses
 * @property {number} secondFactor
 * @property {Permissions.model} permissions
 */
export class User {
    public id: number;
    public moodleUID: number | null;
    public username: string;
    public firstName: string;
    public lastName: string;
    public displayName: string;
    public status: UserStatus;
    public type: UserType;
    public devices: Device[];
    public courses: Course[];
    public secondFactor: number | null;
    public permissions: Permissions | null;

    /**
     *
     * @param firstName {string}
     * @param lastName {string}
     * @param displayname {string}
     * @param username {string}
     * @param id {number}
     * @param type {UserType}
     * @param courses {Course[]}
     * @param status {UserStatus}
     * @param devices {Device[]}
     * @param secondFactor {number}
     * @param permissions {Permissions}
     * @param moodleUID {number}
     */
    constructor(firstName: string, lastName: string, displayname: string, username: string, id: number = -1, type: UserType, courses: Course[] = [], status: UserStatus = UserStatus.DISABLED, devices: Device[] = [], secondFactor: number | null = null, permissions: Permissions | null, moodleUID: number | null = null) {
        this.status = status;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.displayName = displayname;
        this.username = username;
        this.type = type;
        this.courses = courses;
        this.devices = devices;
        this.secondFactor = secondFactor;
        this.permissions = permissions;
        this.moodleUID = moodleUID;

    }

    /**
     * Searches in the database for a user with the given username (no wildcards)
     * @param username
     */
    static getByUsername(username: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[];
                rows = await conn.query("SELECT * FROM users WHERE `username`= ?", [username]);
                if (rows.length > 0) {
                    global.logger.log({
                        level: 'silly',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): found',
                        file: path.basename(__filename)
                    });
                    let loadedUser: User = await User.fromSqlUser(rows[0]);
                    await loadedUser.populateUser();
                    global.logger.log({
                        level: 'silly',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): loaded',
                        file: path.basename(__filename)
                    });
                    resolve(loadedUser);
                } else {
                    global.logger.log({
                        level: 'error',
                        label: 'User',
                        message: 'Class: User; Function: getUserByUsername(' + username + '): no user found',
                        file: path.basename(__filename)
                    });
                    reject("User not found");
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getUserByUsername(' + username + '): ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns a User with the given id or rejects
     * @param id {number}
     */
    static getById(id: number): Promise<User> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[];
                rows = await conn.query("SELECT * FROM users LEFT JOIN user_moodleaccounts ON users.id_users = user_moodleaccounts.userid WHERE id_users= ?", [id]);
                if (rows.length > 0) {
                    let loadedUser = await User.fromSqlUser(rows[0]);
                    await loadedUser.populateUser();
                    resolve(loadedUser);
                } else {
                    reject("Internal error");
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getUserById: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Converts a database dataset to a user object
     * @param sql
     */
    static async fromSqlUser(sql: any): Promise<User> {
        return new Promise(async (resolve, eject) => {
            resolve(new User(sql["firstname"], sql["lastname"], sql["displayname"], sql["username"], sql["id_users"], parseInt(sql["type"]), [], sql["active"], [], sql["twoFactor"], null, sql["moodleid"]))
        });
    }

    /**
     * Create user with userdata from AD server
     * @param username {String}
     * @returns Promise resolves if user is created
     */
    static createFromLdap(username: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let user: User = await Ldap.getUserByUsername(username);

            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `users` (`username`, `firstname`, `lastname`, `type`, `displayname`) VALUES (?, ?, ?, ?, ?);", [username.toLowerCase(), user.firstName, user.lastName, user.type, user.displayName]);
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: createUserFromLdap: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * returns the emailaddresses by the given userid
     * @param userId
     */
    static getEMails(userId: number): Promise<Device[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            console.log(userId)
            try {
                let mails: Device[] = [];
                const rows = await conn.query("SELECT * FROM devices WHERE `userid`= ? AND platform ='4';", [userId]);
                rows.forEach((row: any) => {
                    let device = new Device(DeviceType.MAIL, row['idDevices'], userId, row['added'], row['deviceID'])
                    if (row["confirmed"] !== 1) {
                        device.verified = false;
                    }
                    mails.push(device);
                });
                global.logger.log({
                    level: 'silly',
                    label: 'User',
                    message: 'Class: User; Function: getMails: loaded',
                    file: path.basename(__filename)
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
                    message: 'Class: User; Function: getAllUsers: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns all users with the given type
     * @param type
     */
    static getUsersByType(type: any) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM users WHERE `type`= ? ", [type]);
                resolve(rows);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Load all students from ldap directory
     */
    static getAllStudentsLDAP(): Promise<Student[]> {
        return new Promise(async (resolve, reject) => {
            try {
                let users: Student[] = await Ldap.getAllStudents();
                resolve(users);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: '(saveTokenForUser) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            }
        });
    }

    /**
     *
     */
    static search(filter: UserFilter): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            try {
                let users: User[] = [];
                //Mysql Search
                let conn = await global.mySQLPool.getConnection();
                try {
                    let firstname = filter.firstName;
                    let lastname = filter.lastName;
                    let username = filter.username;
                    if (firstname === null) {
                        firstname = "%"
                    }
                    if (lastname === null) {
                        lastname = "%"
                    }
                    if (username === null) {
                        username = "%"
                    }
                    console.log(filter)
                    let result = await conn.query("SELECT * FROM users WHERE `firstname` LIKE ? AND lastname LIKE ?", [firstname, lastname])
                    for (let i = 0; i < result.length; i++) {
                        let user: User = await User.fromSqlUser(result[i]);
                        users.push(user);

                    }

                } catch (e) {
                    reject(e);
                } finally {
                    await conn.end()
                }

                if (global.config.ldapConfig.enabled) {
                    let ldapUsers = await Ldap.searchUsers(filter);
                    users.push();
                }

                resolve(users);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: '(saveTokenForUser) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            }
        });
    }

    /**
     * Get courses associated with user
     * @returns Promise {courses}
     */
    getCourses(): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let courses: Course[] = [];
                if (this.type == UserType.STUDENT) {
                    const rows = await conn.query("SELECT user_student_courses.* FROM user_student_courses WHERE `user_id`= ?;", [this.id]);
                    await conn.end();
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i];
                        let course = await Course.getById(parseInt(row.courseId));
                        if (row.displayKlausuren === 1) {
                            course.exams = true;
                        }
                        courses.push(course);
                    }
                } else if (this.type == UserType.TEACHER) {
                    const rows = await conn.query("SELECT * FROM courses WHERE `teacherId` = ?;", [this.id]);
                    await conn.end();
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i];
                        courses.push(await Course.getById(parseInt(row.courseId)));
                    }
                }
                global.logger.log({
                    level: 'silly',
                    label: 'User',
                    message: 'Class: User; Function: getCourses: loaded',
                    file: path.basename(__filename)
                });
                resolve(courses);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getCourses: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Loads complete profile
     */
    populateUser(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this.courses = await this.getCourses();
            this.devices = await Device.getByUID(this.id);
            this.permissions = await Permissions.getByUID(this.id)
            resolve();
        });
    }

    /**
     * creates the user in the database if not exists
     */
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
                if (e.code === "ER_DUP_ENTRY") {
                    resolve("Done");
                    return
                }
                console.log(e)
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: createToDB: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Checks if the given user is a teacher of the given course
     * @param needle {Course}
     */
    isTeacherOf(needle: Course) {
        if (this.courses != null) {
            for (let i = 0; i < this.courses.length; i++) {
                let course = this.courses[i];
                if (course.grade === needle.grade && course.subject === needle.subject && course.group === needle.group) {
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
                    resolve(await JWTInterface.createJWT(id, type, tokenId));
                }
                //TOD update description
                reject("NAN UID")
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: generateToken: ' + JSON.stringify(e),
                    file: path.basename(__filename)
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
    verifyPassword(password: string): Promise<void> {
        let username = this.username;
        return new Promise(async (resolve, reject) => {
            try {
                if (global.config.ldapConfig.enabled) {
                    await Ldap.checkPassword(username, password);

                    let hash = bcrypt.hashSync(password, global.config.bCrypt.rounds);
                    resolve();

                    let conn;
                    try {
                        conn = await global.mySQLPool.getConnection();
                        await conn.query("UPDATE users SET hashedpassword = ? WHERE id_users = ?", [hash, this.id]);
                    } catch (e) {
                        global.logger.log({
                            level: 'error',
                            label: 'User',
                            message: 'Class: User; Function: verifyPassword: hashtoDB: ' + JSON.stringify(e),
                            file: path.basename(__filename)
                        });
                    } finally {
                        await conn.end();
                    }

                } else {
                    global.logger.log({
                        level: 'debug',
                        label: 'User auth',
                        message: 'Class: User; Function: verifyPassword: using cache',
                        file: path.basename(__filename)
                    });

                    let hashedpassword;
                    let conn;
                    try {
                        conn = await global.mySQLPool.getConnection();
                        let res = await conn.query("SELECT hashedpassword FROM users WHERE id_users = ?", [this.id]);
                        hashedpassword = res[0]["hashedpassword"];
                    } catch (e) {
                        global.logger.log({
                            level: 'error',
                            label: 'User',
                            message: 'Class: User; Function: verifyPassword: hashtoDB: ' + JSON.stringify(e),
                            file: path.basename(__filename)
                        });
                    } finally {
                        await conn.end();
                    }

                    if (bcrypt.compareSync(password, hashedpassword)) {
                        resolve()
                    } else {
                        reject("Failed")
                    }
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: verifyPassword: ' + JSON.stringify(e),
                    file: path.basename(__filename)
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
    addCourses(courses: Course[]): Promise<void> {
        let userId = this.id;
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                for (const course of courses) {
                    try {
                        await conn.query("INSERT INTO `user_student_courses` (`user_id`, `courseId`,`displayKlausuren`) VALUES (?, ?, ?)", [userId, course.id, course.exams]);
                    } catch (e) {
                        global.logger.log({
                            level: 'error',
                            label: 'User',
                            message: 'Class: User; Function: addCourse(Mysql): ' + JSON.stringify(e),
                            file: path.basename(__filename)
                        });
                        reject(e);
                        return;
                    }
                }
                resolve()
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: addCourse: ' + JSON.stringify(e),
                    file: path.basename(__filename)
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
    clearCourses(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM user_student_courses WHERE `user_id`= ? ", [this.id]);
                resolve()
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: deleteCourse: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                })
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Planned feature
     */
    enableMoodleAccount() {
        let uid = this.id;
        let username: string = this.username;
        let firstname: string = this.firstName;
        let lastname: string = this.lastName;
        let mail: string = this.username + "@netman.lokal";
        return new Promise(async (resolve, reject) => {
            let muid = null;
            try {
                muid = await Moodle.createUser(username, firstname, lastname, mail);
            } catch (e) {
                reject(e);
            }
            if (muid != null) {
                let conn;
                try {
                    conn = await global.mySQLPool.getConnection();
                    let result = await conn.query("INSERT INTO `user_moodleaccounts` (`userid`, `moodleid`) VALUES (?, ?);", [uid, muid]);
                    resolve(muid);
                } catch (e) {
                    console.log(e);
                } finally {
                    await conn.end();
                }
            }
        });
    }

    /**
     * Planned feature
     */
    disableMoodleAccount() {
        let mUID: number | null = this.moodleUID;
        let uid: number | null = this.id;
        return new Promise(async (resolve, reject) => {
            if (mUID != null) {
                let conn;
                try {
                    await Moodle.deleteUserById(mUID);

                    conn = await global.mySQLPool.getConnection();
                    let result = await conn.query("DELETE FROM `user_moodleaccounts` WHERE `userid` = ?", [uid]);
                    await conn.end();
                    resolve(mUID);
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.log("NO account");
            }
        });
    }
}

export enum UserStatus {
    DISABLED,
    ENABLED,
    BLOCKED,
    DELETED
}

export enum UserType {
    STUDENT,
    TEACHER
}