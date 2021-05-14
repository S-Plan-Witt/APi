/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {JWTInterface} from '../classes/JWTInterface';
import express, {Request, Response} from 'express';
import {User, UserStatus, UserType} from '../classes/user/User';
import {Ldap} from "../classes/external/Ldap";
import assert from "assert";
import {ApiGlobal} from "../types/global";
import {ReplacementLesson} from "../classes/ReplacementLesson";
import {Exam} from "../classes/Exam";
import {Announcement} from "../classes/Announcement";
import path from "path";
import {Device, DeviceType} from "../classes/Device";
import {Course} from "../classes/Course";
import {Lesson} from "../classes/Lesson";
import {TOTP} from "../classes/secondFactor/TOTP";
import {Telegram} from "../classes/external/Telegram";

declare const global: ApiGlobal;

export let router = express.Router();
router.use("/totp", require('./userTOTProuter').router);
/**
 * Return the current user
 * @route GET /user/
 * @group User
 * @returns {User.model} 200
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.get('/', async (req, res) => {
    try {
        await res.json(req.user);
    } catch (e) {
        await res.sendStatus(500)
    }
});

/**
 * Return the JWT to access the Api
 * @sum Login
 * @route POST /user/login
 * @group User
 * @consumes application/json
 * @param {LoginRequest.model} LoginRequest.body.required - username
 * @returns {LoginResponse.model} 200
 * @returns {Error} 602 - missing secondFactor
 * @returns {Error} 401 - Wrong Bearer
 */
router.post('/login', async (req, res) => {

    let username = req.body.username.toLowerCase();
    let password = req.body.password;

    if (username != null && password != null) {
        username = username.toLowerCase();

    } else {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login : No method provided ',
            file: path.basename(__filename)
        });
        res.sendStatus(601);
        return;
    }
    let user: User | null = null;
    try {
        user = await User.getByUsername(username);
    } catch (e) {
    }

    if (user == null) {
        try {
            user = await Ldap.getUserByUsername(username);
            await User.createFromLdap(username);
            user = await User.getByUsername(username);
        } catch (e) {
            res.sendStatus(401);
            global.logger.log({
                level: 'error',
                label: 'User',
                message: ' Login: /user/login : user not found (' + username + ') e:' + JSON.stringify(e),
                file: path.basename(__filename)
            });
            res.send("User not available");
            return;
        }
    }

    try {
        assert(user.status == UserStatus.ENABLED, "User not enabled");
        try {
            await user.verifyPassword(password);
        } catch (e) {
            res.sendStatus(401);
            return;
        }
        if (user.secondFactor === 1) {
            if (req.body.hasOwnProperty("code")) {
                try {
                    let registration = await TOTP.getByUID(user.id);
                    await registration.validateCode(req.body.code);

                } catch (e) {
                    res.sendStatus(401);
                    global.logger.log({
                        level: 'info',
                        label: 'Login',
                        message: 'SecondFactor failed : ' + username,
                        file: path.basename(__filename)
                    });
                    return;
                }
            } else {
                res.sendStatus(602);
                global.logger.log({
                    level: 'info',
                    label: 'Login',
                    message: 'Further information required : ' + username,
                    file: path.basename(__filename)
                });
                return;
            }
        }

        let token = await user.generateToken();
        res.json({"token": token, "userType": user.type});
        global.logger.log({
            level: 'info',
            label: 'Login',
            message: 'Loggedin : ' + username,
            file: path.basename(__filename)
        });
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login/ ; ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
        res.sendStatus(601);
    }

});

/**
 * List all courses for the user
 * @route GET /user/courses
 * @group User
 * @returns {Array.<Course>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/courses', async (req, res) => {
    let user = req.user;
    let courses;
    try {
        if (req.user.type == UserType.STUDENT) {
            courses = req.user.courses;
            await res.json(courses);
        } else if (req.user.type == UserType.TEACHER) {
            courses = user.courses;
            await res.json(courses);
        } else {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: 'Routing: /user/courses : invalid usertype: ' + req.user.type,
                file: path.basename(__filename)
            });
            res.sendStatus(401);
        }
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/courses ; ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});


/**
 * List all lessons for the user
 * @route GET /user/lessons
 * @group User
 * @consumes application/json
 * @returns {Array.<Lesson>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/lessons', async (req, res) => {
    let response: any = [];

    try {
        let courses = req.user.courses;
        if (courses != null) {
            for (let coursePrototype of courses) {
                let course = await Course.getByFields(coursePrototype.subject, coursePrototype.grade, coursePrototype.group);
                try {
                    let lessons: Lesson[] = await course.getLessons();
                    lessons.forEach((lesson) => {
                        response.push(lesson);
                    });
                } catch (e) {
                    global.logger.log({
                        level: 'error',
                        label: 'Express',
                        message: 'Routing: /user/lessons : processinf courses: ' + JSON.stringify(e),
                        file: path.basename(__filename)
                    });
                }
            }
        }
        res.json(response);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/lessons : ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
        res.sendStatus(500);
    }
});

//TODO swagger
/**
 * List all replacement lessons for the user
 * @route GET /user/replacementlessons
 * @group User
 * @consumes application/json
 * @returns {Array.<ReplacementLesson>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/replacementlessons', async (req, res) => {

    //Generate date of today
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    //create day string
    let dateToday = yyyy + '-' + mm + '-' + dd;
    //Generate date of today + 6 days
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);
    dd = String(endDate.getDate()).padStart(2, '0');
    mm = String(endDate.getMonth() + 1).padStart(2, '0');
    yyyy = endDate.getFullYear();
    let dateEnd = yyyy + '-' + mm + '-' + dd;

    try {
        let courses;
        let response: any = [];
        if (req.user.type == UserType.STUDENT || req.user.type == UserType.TEACHER) {
            courses = req.user.courses;
        } else {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: 'Routing: /user/replacementlessons : rej (503)(' + req.user.type + ')',
                file: path.basename(__filename)
            });

            res.sendStatus(503);
            return;
        }

        for (const course of courses) {
            let lessons: Lesson[] = await course.getLessons();
            for (const lesson of lessons) {
                let data: ReplacementLesson[] = await ReplacementLesson.getByLesson(lesson);
                data.forEach((replacementLesson) => {
                    console.log(replacementLesson.lesson)
                    let dataset = {id: replacementLesson.id, courseId: replacementLesson.course.id, lessonId: replacementLesson.lesson.id, room: replacementLesson.room, subject: replacementLesson.subject, info: replacementLesson.info, date: replacementLesson.date}
                    response.push(dataset);
                });
            }
        }
        if (req.user.type == UserType.TEACHER) {
            assert(req.user.id != null)
            let data: ReplacementLesson[] = await ReplacementLesson.getByTeacher(req.user.id, dateToday, dateEnd);
            data.forEach((replacementLesson) => {
                let dataset = {id: replacementLesson.id, courseId: replacementLesson.course.id, lessonId: replacementLesson.lesson.id, room: replacementLesson.room, subject: replacementLesson.subject, teacherId: replacementLesson.teacherId, info: replacementLesson.info, date: replacementLesson.date}
                response.push(dataset);
            });
        }

        await res.json(response);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

//TODO swagger
/**
 * Lists all Announcements for the user
 * @route GET /user/announcements
 * @group User
 * @consumes application/json
 * @returns {Array.<Announcement>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/announcements', async (req: Request, res: Response) => {
    let courses = req.user.courses;
    let response: any = [];
    for (const course of courses) {
        try {
            let data: Announcement[] = await Announcement.getByCourse(course);
            for (let i = 0; i < data.length; i++) {
                let announcement = data[i];
                response.push({courseId: announcement.course.id, authorId: announcement.authorId, editorId: announcement.editorId, date: announcement.date, id: announcement.id, content: announcement.content})
            }

        } catch (e) {
            console.log(e);
        }
    }

    res.json(response);
});

/**
 * Lists all exams for the user or if teacher, for his courses
 * @route GET /user/exams
 * @group User
 * @consumes application/json
 * @returns {Array.<Exam>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/exams', async (req, res) => {
    try {
        let response: Exam[] = [];
        if (req.user.type == UserType.STUDENT) {
            let courses = req.user.courses;
            console.log(courses)
            for (const course of courses) {
                try {
                    //if user should see exams in this course
                    if (course.exams) {
                        //Get exams by course
                        let data = await Exam.getByCourse(course);
                        data.forEach(exam => {
                            response.push(exam);
                        });
                    }
                } catch (e) {
                    console.log(e)
                }
            }

        } else if (req.user.type == UserType.TEACHER) {
            response = await Exam.getByTeacher(req.user.username);
        }
        res.json(response);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});


/**
 * Lists all devices for the user
 * @route GET /user/devices
 * @group User
 * @consumes application/json
 * @returns {Array.<Device>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/devices', async (req, res) => {
    try {
        let data = req.user.devices;
        res.json(data);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});


/**
 * Sends a test message to all devices
 * @route GET /user/devices/test
 * @group User
 * @consumes application/json
 * @returns {Object} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/devices/test', async (req, res) => {
    try {
        let devices = req.user.devices;
        await global.pushNotifications.sendBulk(devices, "TEST", "Test message")
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Adds a new device to the user
 * @route POST /user/devices
 * @group User
 * @consumes application/json
 * @param {Device.model} Device.body
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/devices', async (req: Request, res: Response) => {
    let deviceIdentifier = req.body.deviceIdentifier;
    let requestId = req.body.requestId;
    let platform = req.body.platform;

    try {
        let device: Device;
        if (platform === DeviceType.TELEGRAM) {
            let telegramId: number;
            try {
                telegramId = await Telegram.validateRequestToken(requestId);
                await Telegram.revokeRequest(requestId);
            } catch (e) {
                res.sendStatus(500);
                return;
            }
            device = new Device(DeviceType.TELEGRAM, null, req.user.id, Date.now().toString(), telegramId.toString());
        } else {
            device = new Device(parseInt(platform), null, req.user.id, Date.now().toString(), deviceIdentifier);
        }

        if (await device.save()) {
            res.sendStatus(200);
        } else {
            res.sendStatus(200);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Removes a device from the user account
 * @route DELETE /user/devices/deviceId/{id}
 * @group User
 * @consumes application/json
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.delete('/devices/deviceId/:id', async (req, res) => {
    let deviceId = req.params.id;
    try {
        await Device.removeDevice(deviceId);
        res.sendStatus(200)
    } catch (e) {
        console.log(e);
        res.sendStatus(500)
    }
});

/**
 * Deletes access jwt
 * @route DELETE /user/jwt
 * @group User
 * @returns {object} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.delete('/jwt', async (req, res) => {
    try {
        await JWTInterface.revokeById(req.jwtId);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Enables the Moodle user account
 * @route GET /user/moodle/enable
 * @group User
 * @returns {Object} 200 - OK
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/moodle/enable', async (req, res) => {
    try {
        console.log(await req.user.enableMoodle());
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Disables the Moodle user account
 * @route GET /user/moodle/disable
 * @group User
 * @returns {Object} 200 - OK
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/moodle/disable', async (req, res) => {
    try {
        await req.user.disableMoodle();
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

router.get('/dump',async (req, res) => {
    res.json(req.user);
});