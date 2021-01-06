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

import {User} from '../classes/User';
import {PushNotifications} from '../classes/PushNotifications';
import {TimeTable} from "../classes/TimeTable";
import {ApiGlobal} from "../types/global";
import {ReplacementLesson} from "../classes/ReplacementLesson";
import {Course} from "../classes/Course";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Adds an ReplacementLesson
 * @route POST /replacementLessons/
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @param {ReplacementLesson.model} ReplacementLesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/', async (req, res) => {

    for (let i = 0; i < req.body.length; i++) {
        let postDataSet: any = req.body[i];

        let replacementLesson: ReplacementLesson | undefined = undefined;
        let course: Course = await TimeTable.getCourseByFields(postDataSet["course"]["subject"], postDataSet["course"]["grade"], postDataSet["course"]["group"]);
        let teacher: User | null = null;
        if (postDataSet["teacher"] !== "---") {
            try {
                teacher = await User.getUserByUsername(postDataSet["teacher"]);
            } catch (e) {
                console.log("TNF")
            }
        }
        if (teacher == null || teacher.id != null) {
            try {
                let teacherId: number | null = null;
                if (teacher != null) {
                    if (teacher.id != null) {
                        teacherId = teacher.id;
                    }
                }
                let date = new Date(postDataSet["date"]);
                let weekday = date.getDay();
                replacementLesson = new ReplacementLesson(null, course, await TimeTable.getLessonsByCourseAndLessonAndDay(course, postDataSet["lessonNumber"], weekday), teacherId, postDataSet["room"], postDataSet["subject"], postDataSet["info"], postDataSet["date"]);
            } catch (e) {
                console.log(e)
            }
        }
        try {

            if (replacementLesson != null) {

                let status = await ReplacementLessons.add(replacementLesson);
                let devices = await User.getStudentDevicesByCourse(replacementLesson.course);
                console.log(status + ":" + JSON.stringify(replacementLesson))
                let pushNotifications = new PushNotifications();
                if (status === "added") {
                    await pushNotifications.sendBulk(devices, "Hinzugefügt: " + replacementLesson.course.subject, " Stunde: " + replacementLesson.lesson.lessonNumber + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
                } else if (status === "updated") {
                    await pushNotifications.sendBulk(devices, "Aktualisiert: " + replacementLesson.course.subject, " Stunde: " + replacementLesson.lesson.lessonNumber + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
                }
            }

        } catch (e) {
            global.logger.log({
                level: 'warn',
                label: 'ReplacementLessons',
                message: 'Error while processing post ' + e + '; at: ' + JSON.stringify(postDataSet)
            });
        }
    }
    res.sendStatus(200);
});

/**
 * Returns all ReplacementLessons
 * @route GET /replacementLessons/
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/', async (req, res) => {
    try {
        await res.json(await ReplacementLessons.getAll());
    } catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }

});

/**
 * Returns all ReplacementLessons on specific date
 * @route GET /replacementLessons/date/{date}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/date/:date', async (req, res) => {
    try {
        let date = req.params.date;
        let data: ReplacementLesson[] = await ReplacementLessons.getByDate(date);
        let response: any[] = [];
        data.forEach((replacementLesson: any) => {
            let dataset = {
                id: replacementLesson.id,
                courseId: replacementLesson.course.id,
                lessonId: replacementLesson.lesson.id,
                room: replacementLesson.room,
                subject: replacementLesson.subject,
                teacherId: replacementLesson.teacherId,
                info: replacementLesson.info,
                date: replacementLesson.date
            }
            response.push(dataset);
        });
        await res.json(response);
    } catch (e) {
        console.log(e);
        res.sendStatus(500)
    }
});

/**
 * Gets a ReplacementLesson by id
 * @route GET /replacementLessons/id/{id}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {ReplacementLesson.model} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/id/:id', async (req, res) => {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    let id = parseInt(req.params.id);
    try {
        let lesson = await ReplacementLessons.getById(id);
        res.json(lesson);
    } catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/find', async (req, res) => {
    let info = req.body.info;
    try {
        let lessons = await ReplacementLessons.search(info);
        res.json(lessons);
    } catch (e) {
        //TODO add logger
        res.sendStatus(500);
    }

});

/**
 * Deletes an ReplacementLesson by replacement-id
 * @route DELETE /replacementLessons/id/{id}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/id/:id', async (req, res) => {
    let id = req.params.id;
    console.log(id)
    try {
        let replacementLesson: ReplacementLesson = await ReplacementLessons.deleteById(id.toString());

        let push = new PushNotifications();
        let devices: any = await User.getStudentDevicesByCourse(replacementLesson.course);
        console.log(devices)
        for (const id in devices) {
            if (devices.hasOwnProperty(id)) {
                const device = devices[id];
                await push.send(device.platform, device.device, "Entfernt: " + replacementLesson.course.subject, "Entfernt: " + replacementLesson.course.subject + "Datum: " + replacementLesson.date)
            }
        }
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});