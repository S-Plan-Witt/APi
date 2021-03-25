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
import {PushNotifications} from '../classes/external/PushNotifications';
import {ApiGlobal} from "../types/global";
import {Course} from "../classes/Course";
import {Announcement} from "../classes/Announcement";
import path from "path";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.announcements) {
        next();
        return;
    }
    return res.sendStatus(401);
});

/**
 * Adds a new Announcement
 * @route POST /announcements/
 * @group Announcements
 * @param {Announcement.model} Announcement.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/', async (req, res) => {
    let body: { course: Course, content: string, date: string, global: boolean } = req.body;
    try {
        let course = await Course.getByFields(body.course.subject, body.course.grade, body.course.group)

        let announcement = new Announcement(course, req.decoded.userId, req.decoded.userId, body.content, body.date, null);
        if (body.global) {
            announcement.isGlobal = true;
        }
        await announcement.create();

        let devices = await announcement.course.getStudentDevices();
        let push = new PushNotifications();
        await push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Hinzugefügt: " + announcement.content + " Datum: " + announcement.date);

        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        global.logger.log({
            level: 'error',
            label: 'announcementsRouter',
            message: 'Error while processing request ' + JSON.stringify(e),
            file: path.basename(__filename)
        });

        res.sendStatus(500);
    }
});

/**
 * Lists all Announcements
 * @route GET /announcements/
 * @group Announcements
 * @returns {Array.<Announcement>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/', async (req, res) => {

    await res.json(await Announcement.getAll());
});

/**
 * Updates Announcement {id}
 * @route PUT /announcements/id/{id}
 * @group Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.put('/id/:id', async (req, res) => {
    let body = req.body;
    let id: number = parseInt(req.params.id);
    let announcement: Announcement = await Announcement.getById(id);

    announcement.course = new Course(body["course"]["grade"], body["course"]["subject"], body["course"]["group"], false);
    announcement.content = body["content"];
    announcement.date = body["date"];

    await announcement.update();

    let devices = await announcement.course.getStudentDevices();
    let push = new PushNotifications();
    await push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Geändert: " + announcement.content + " Datum: " + announcement.date);

    res.sendStatus(200);
});

/**
 * Returns Announcement {id}
 * @route GET /announcements/id/{id}
 * @group Announcements - Management functions for Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/id/:id', async (req, res) => {
    let id = parseInt(req.params.id);
    let announcement = await Announcement.getById(id);
    res.json(announcement)
});

/**
 * Deletes Announcement {id}
 * @route DELETE /announcements/id/{id}
 * @group Announcements - Management functions for Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/id/:id', async (req, res) => {
    try {
        let id = parseInt(req.params.id);
        let announcement: Announcement = await Announcement.getById(id);

        if (!req.decoded.admin) {
            if (!req.user.isTeacherOf(announcement.course)) {
                return res.sendStatus(401);
            }
        }

        await announcement.delete();
        let devices = await announcement.course.getStudentDevices();
        let push = new PushNotifications();
        await push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Entfernt Datum: " + announcement.date);

        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});