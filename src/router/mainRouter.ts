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