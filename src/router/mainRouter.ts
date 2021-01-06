/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import express from 'express';
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export let router = express.Router();
router.use("/users", require('./usersRouter').router);
router.use("/user", require('./userRouter').router);
router.use("/timetable", require('./timeTableRouter').router);
router.use("/exams", require('./examRouter').router);
router.use("/announcements", require('./announcementRouter').router);
router.use("/timetable", require('./timeTableRouter').router);
router.use("/replacementLessons", require('./replacementLessonRouter').router);


/**
 * @typedef Announcement
 * @property {Course.model} course.required
 * @property {string} author.required
 * @property {string} content.required
 * @property {string} date.required
 * @property {number} id
 */

/**
 * @typedef LoginResponse
 * @property {string} token.required
 * @property {string} userType.required
 */
class LoginResponse {
    token: string;
    userType: string;

    constructor(token: string, userType: string) {
        this.token = token;
        this.userType = userType;
    }
}

/**
 * @typedef LoginRequest
 * @property {string} username.required
 * @property {string} password.required
 * @property {string} secondFactor
 */
class LoginRequest {
    username: string;
    password: string;
    secondFactor: string;

    constructor(username: string, password: string, secondFactor: string) {
        this.username = username;
        this.password = password;
        this.secondFactor = secondFactor;
    }
}

/**
 * @typedef Course
 * @property {string} grade.required
 * @property {string} subject.required
 * @property {string} group.required
 * @property {string} exams
 */

/**
 * @typedef Exam
 * @property {string} display.required
 * @property {string} date.required
 * @property {Course.model} course.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} teacher.required
 * @property {string} students.required
 * @property {RoomLink.model} roomLink
 * @property {string} room.required
 * @property {string} uniqueIdentifier
 * @property {number} id
 */

/**
 * @typedef RoomLink
 * @property {string} date.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} room.required
 * @property {number} id
 */

/**
 * @typedef User
 * @property {string} displayName.required
 * @property {string} lastName.required
 * @property {string} firstName.required
 * @property {string} username.required
 * @property {string} type.required
 * @property {string} devices
 * @property {string} mails
 * @property {Array.<Course>} courses
 * @property {string} secondFactor
 * @property {Permissions.model} permissions
 * @property {number} id
 */
/**
 * @typedef Supervisor
 * @property {string} displayName.required
 * @property {string} lastName.required
 * @property {string} firstName.required
 * @property {string} username.required
 * @property {RoomLink.model} roomLink.required
 * @property {number} id
 */

/**
 * @typedef Lesson
 * @property {number} id
 * @property {Course.model} course.required
 * @property {string} teacher.required
 * @property {string} room.required
 * @property {number} lesson.required
 * @property {number} weekday.required
 */

/**
 * @typedef ReplacementLesson
 * @property {number} id
 * @property {Course.model} course.required
 * @property {Lesson.model} lesson.required
 * @property {string} newTeacher.required
 * @property {string} newRoom.required
 */

/**
 * @typedef EMail
 * @property {number} userId.required
 * @property {string} address.required
 * @property {boolean} verified.required
 * @property {Date} dateAdded.required
 * @property {boolean} primary
 */

/**
 * @typedef Device
 * @property {number} id
 * @property {string} userId.required
 * @property {string} platform.required
 * @property {number} device.required
 */
class Device {
    id: number;
    userId: number;
    platform: string;
    deviceIdentifier: string;

    constructor(id: number, userId: number, platform: string, deviceIdentifier: string) {
        this.id = id;
        this.userId = userId;
        this.platform = platform;
        this.deviceIdentifier = deviceIdentifier;
    }
}

/**
 * @typedef TotpAddRequest
 * @property {string} password.required
 * @property {string} key.required
 * @property {string} alias.required
 */

class TotpAddRequest {
    password: string;
    key: string;
    alias: string;


    constructor(password: string, key: string, alias: string) {
        this.password = password;
        this.key = key;
        this.alias = alias;
    }
}

/**
 * @typedef TotpVerifyRequest
 * @property {number} keyId.required
 * @property {number} code.required
 */

class TotpVerifyRequest {
    keyId: number;
    code: number;

    constructor(keyId: number, code: number) {
        this.keyId = keyId;
        this.code = code;
    }
}

/**
 * @typedef Permissions
 * @property {number} userId.required
 */

/**
 * @typedef Grade
 */
interface Grade {

}

/**
 * @typedef UserFilter
 * @property {string} username
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} birthday
 */