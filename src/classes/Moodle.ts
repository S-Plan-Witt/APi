/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import https from 'https';
import {User, UserType} from "./user/User";
import {ApiGlobal} from "../types/global";
import {Course} from "./Course";

declare const global: ApiGlobal;

export class Moodle {

    static apiRequest(mFunction: string, parameters: any): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let options = {
                'method': 'GET',
                'hostname': global.config.moodleConfig.host,
                'path': global.config.moodleConfig.path + '/webservice/rest/server.php?wstoken=' + global.config.moodleConfig.token + '&wsfunction=' + mFunction + '&moodlewsrestformat=json&' + parameters,
                'headers': {}
            };

            let req = https.request(options, (res) => {
                let chunks: any = [];

                res.on("data", (chunk: any) => {
                    chunks.push(chunk);
                });

                res.on("end", (chunk: any) => {
                    let body = Buffer.concat(chunks);
                    let res = "";
                    try {
                        res = JSON.parse(body.toString())
                    } catch (e) {
                    }
                    resolve(res);
                });

                res.on("error", (error: Error) => {
                    console.error(error);
                    reject(error);
                });
            });

            req.end();
        });
    }

    static sync(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let courses = await Course.getAll();
            for (const coursesKey in courses) {
                let course = courses[coursesKey];
                await Moodle.createCourse(course);
                await Moodle.updateCourseUsers(course);
                resolve();
            }
        })
    }

    static createUser(user: User): Promise<MoodleCreateResponse> {
        return new Promise(async (resolve, reject) => {
            let params = `users[0][username]=${user.username}&users[0][auth]=ldap&users[0][firstname]=${encodeURI(user.firstName)}&users[0][lastname]=${encodeURI(user.lastName)}&users[0][email]=${user.username}@netman.lokal`
            let res: MoodleResponse = <any>await this.apiRequest(MoodleFunctions.CREATE_USER, params);
            if (!res.exception) {
                let mUser: MoodleCreateResponse = (<any>res)[0];
                try {
                    await this.saveMapping(user.id, mUser.id)
                } catch (e) {
                    reject("Error: " + e);
                }

                resolve(mUser);
            } else {
                reject("Error: " + res.exception);
            }
        });
    }

    static delete(mUID: number) {
        return new Promise(async (resolve, reject) => {
            let params = `userids[0]=${mUID}`
            let res = await this.apiRequest(MoodleFunctions.DELETE_USER, params);

            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("UPDATE users SET moodleId =null WHERE moodleId = ?", [mUID]);
                resolve(res);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static find(username: string) {
        return new Promise(async (resolve, reject) => {
            let params = `field=username&values[0]=${username}`

            let res: MoodleUser[] | MoodleResponse = <any>await this.apiRequest(MoodleFunctions.SEARCH_USER, params);
            if (res.hasOwnProperty('exception')) {
                reject("Error: " + res);
            } else {
                resolve(res);
            }

        });
    }

    static saveMapping(userId: number, moodleId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("UPDATE users SET moodleId = ? WHERE id_users = ?", [moodleId, userId]);
                resolve("Saved");
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static createCourse(course: Course) {
        return new Promise(async (resolve, reject) => {
            let name = course.grade + "/" + course.subject + "-" + course.group;
            let categoryId = 1;
            let params = `courses[0][fullname]=${name}&courses[0][shortname]=${name}&courses[0][categoryid]=${categoryId}`

            let res: any = <any>await this.apiRequest(MoodleFunctions.CREATE_COURSE, params);
            if (!res.exception) {
                let conn = await global.mySQLPool.getConnection();
                try {
                    await conn.query("UPDATE courses SET moodleId = ? WHERE id_courses = ?", [res[0].id, course.id]);
                    course.moodleId = res[0].id;
                    await this.updateCourseUsers(course);
                    resolve("Saved");
                } catch (e) {
                    reject(e);
                } finally {
                    await conn.end();
                }
                resolve("");
            } else {
                if (res.errorcode == "shortnametaken") {
                    await this.updateCourseUsers(course);
                    resolve("exists");
                } else {
                    reject("Error: " + res.exception);
                }
            }
        });
    }

    static updateCourseUsers(course: Course) {
        return new Promise(async (resolve, reject) => {
            let mUsers: MoodleUser[] = <any>await Moodle.getCourseUsers(course);
            let localUsers = await course.getUsers();

            for (let i = 0; i < mUsers.length; i++) {
                let user = mUsers[i];
                let found = false;
                for (let j = 0; j < localUsers.length; j++) {
                    if (localUsers[j].username == user.username) {
                        found = true;
                    }
                }
                if (!found) {
                    await this.unEnrolUser(course, user.id);
                }
            }

            for (let i = 0; i < localUsers.length; i++) {
                let user = localUsers[i];
                let found = false;
                for (let j = 0; j < mUsers.length; j++) {
                    if (mUsers[j].username == user.username) {
                        found = true;
                    }
                }
                if (!found) {
                    let userType = MoodleRoles.STUDENT;
                    if (user.type == UserType.TEACHER) {
                        userType = MoodleRoles.TEACHER;
                    }
                    if (user.moodleUID != null) {
                        await this.enrolUser(course, user, userType);
                    }

                }
            }
            resolve("Done")
        });
    }

    static getCourseUsers(course: Course) {
        return new Promise(async (resolve, reject) => {
            let params = `courseid=${course.moodleId}`;

            let res: any = <any>await this.apiRequest(MoodleFunctions.GET_COURSE_USERS, params);
            if (!res.hasOwnProperty('exception')) {
                resolve(res);
            } else {
                reject("Error: " + res.exception);
            }
        });
    }

    static getCourses(): Promise<MoodleCourse[]> {
        return new Promise(async (resolve, reject) => {
            let params = ``

            let res: any = <any>await this.apiRequest(MoodleFunctions.GET_COURSES, params);
            if (!res.hasOwnProperty('exception')) {
                resolve(res);
            } else {
                reject("Error: " + res.exception);
            }
        });
    }

    static enrolUser(course: Course, user: User, role: MoodleRoles) {
        return new Promise(async (resolve, reject) => {
            if (user.moodleUID == null || course.moodleId == null) {
                resolve("NV");
                return;
            }
            let params = `enrolments[0][roleid]=${role}&enrolments[0][userid]=${user.moodleUID}&enrolments[0][courseid]=${course.moodleId}`

            let res: MoodleResponse = <any>await this.apiRequest(MoodleFunctions.ENROL_USER, params);
            if (res == null) {
                resolve("");
            } else {
                reject("Error: " + res.exception);
            }
        });
    }

    static unEnrolUser(course: Course, moodleUserId: number) {
        return new Promise(async (resolve, reject) => {
            if (moodleUserId == null || course.moodleId == null) {
                resolve("NV");
                return;
            }
            let params = `enrolments[0][userid]=${moodleUserId}&enrolments[0][courseid]=${course.moodleId}`

            let res: MoodleResponse = <any>await this.apiRequest(MoodleFunctions.UNENROL_USER, params);
            if (res == null) {
                resolve("");
            } else {
                reject("Error: " + res.exception);
            }
        });
    }
}

enum MoodleFunctions {
    CREATE_USER = "core_user_create_users",
    SEARCH_USER = "core_user_get_users_by_field",
    DELETE_USER = "core_user_delete_users",
    CREATE_COURSE = "core_course_create_courses",
    ENROL_USER = "enrol_manual_enrol_users",
    UNENROL_USER = "enrol_manual_unenrol_users",
    GET_COURSES = "core_course_get_courses",
    GET_COURSE_USERS = "core_enrol_get_enrolled_users"
}

enum MoodleRoles {
    NONE,
    MANAGER,
    COURSE_CREATOR,
    TEACHER,
    NON_EDITING_TEACHER,
    STUDENT,
    GUEST
}

export class MoodleResponse {
    exception: string = "";
    errorcode: string = "";
    message: string = "";
    debuginfo: string = ""
}

export class MoodleCreateResponse extends MoodleResponse {
    username: string = "";
    id: number = 0;
}

export class MoodleUser extends MoodleResponse {
    username: string = "";
    id: number = 0;
    auth: string = "";
}

export class MoodleCourse {
    id: number = -1;
    shortname: string = "";
    categoryId: number = -1;
    fullname: string = "";
    displayname: string = "";

}