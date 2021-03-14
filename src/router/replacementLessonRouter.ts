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

import {User} from '../classes/user/User';
import {PushNotifications} from '../classes/external/PushNotifications';
import {TimeTable} from "../classes/TimeTable";
import {ApiGlobal} from "../types/global";
import {ReplacementLesson} from "../classes/ReplacementLesson";
import {Course} from "../classes/Course";
import path from "path";
import {Lesson} from "../classes/Lesson";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Adds an ReplacementLesson
 * @route POST /replacementLessons/
 * @group ReplacementLesson
 * @param {ReplacementLesson.model} ReplacementLesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/', async (req, res) => {

    for (let i = 0; i < req.body.length; i++) {
        let postDataSet: any = req.body[i];

        let replacementLesson: ReplacementLesson | undefined = undefined;
        let course: Course = await Course.getByFields(postDataSet["course"]["subject"], postDataSet["course"]["grade"], postDataSet["course"]["group"]);
        let teacher: User | null = null;
        if (postDataSet["teacher"] !== "---") {
            try {
                teacher = await User.getByUsername(postDataSet["teacher"]);
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
                replacementLesson = new ReplacementLesson(null, course, await Lesson.getByCourseAndLessonAndDay(course, postDataSet["lessonNumber"], weekday), teacherId, postDataSet["room"], postDataSet["subject"], postDataSet["info"], postDataSet["date"]);
            } catch (e) {
                console.log(e)
            }
        }
        try {

            if (replacementLesson != null) {

                let status = await ReplacementLesson.add(replacementLesson);
                let devices = await replacementLesson.course.getStudentDevices();
                console.log(status + ":" + JSON.stringify(replacementLesson))
                if (status === "added") {
                    await global.pushNotifications.sendBulk(devices, "Hinzugefügt: " + replacementLesson.course.subject, " Stunde: " + replacementLesson.lesson.lessonNumber + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
                } else if (status === "updated") {
                    await global.pushNotifications.sendBulk(devices, "Aktualisiert: " + replacementLesson.course.subject, " Stunde: " + replacementLesson.lesson.lessonNumber + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
                }
            }

        } catch (e) {
            global.logger.log({
                level: 'warn',
                label: 'ReplacementLessons',
                message: 'Error while processing post ' + e + '; at: ' + JSON.stringify(postDataSet),
                file: path.basename(__filename)
            });
        }
    }
    res.sendStatus(200);
});

/**
 * Returns all ReplacementLessons
 * @route GET /replacementLessons/
 * @group ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/', async (req, res) => {
    try {
        await res.json(await ReplacementLesson.getAll());
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }

});

/**
 * Returns all ReplacementLessons on specific date
 * @route GET /replacementLessons/date/{date}
 * @group ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/date/:date', async (req, res) => {
    try {
        let date = req.params.date;
        let data: ReplacementLesson[] = await ReplacementLesson.getByDate(date);
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
 * @group ReplacementLesson
 * @returns {ReplacementLesson.model} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/id/:id', async (req, res) => {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    try {
        let lesson = await ReplacementLesson.getById(req.params.id);
        res.json(lesson);
    } catch (e) {
        if (e === "Not found") {
            res.sendStatus(404);
        } else {
            console.log(e);
            res.sendStatus(500);
        }
    }

});

/**
 * Returns lessons matching the info field
 * @route DELETE /replacementLessons/id/{id}
 * @group ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/find', async (req, res) => {
    let info = req.body.info;
    try {
        let lessons = await ReplacementLesson.search(info);
        res.json(lessons);
    } catch (e) {
        res.sendStatus(500);
    }

});

/**
 * Deletes an ReplacementLesson by id
 * @route DELETE /replacementLessons/id/{id}
 * @group ReplacementLesson
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.delete('/id/:id', async (req, res) => {
    let id = req.params.id;
    try {
        let replacementLesson: ReplacementLesson = await ReplacementLesson.getById(id);
        await replacementLesson.delete();

        let push = new PushNotifications();
        let devices: any = await replacementLesson.course.getStudentDevices();
        for (const id in devices) {
            if (devices.hasOwnProperty(id)) {
                const device = devices[id];
                await push.send(device, "Entfernt: " + replacementLesson.course.subject, "Entfernt: " + replacementLesson.course.subject + "Datum: " + replacementLesson.date)
            }
        }
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});