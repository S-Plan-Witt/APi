/*
 *  Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import {ApiGlobal} from "../types/global";
import express, {Request, Response} from "express";
import {Course} from "../classes/Course";
import {TimeTable} from "../classes/TimeTable";
import path from "path";
import {Moodle} from "../classes/Moodle";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.timeTable) {
        next();
        return;
    }
    global.logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.decoded.userId}`,
        file: path.basename(__filename)
    });
    return res.sendStatus(401);
});

/**
 * Returns all courses
 * @route GET /courses
 * @group Courses
 * @returns {Array.<Course>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/', async (req, res) => {
    res.json(await Course.getAll())
});

/**
 * Searches for Courses
 * @route POST /courses/find/
 * @group Courses
 * @param {CourseSearch.model} CourseSearch.body.required
 * @returns {Array.<Course>} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/find/', async (req: Request, res: Response) => {
    try {
        let courses = await TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);

        res.json(courses);
    } catch (e) {
        res.sendStatus(500);
    }
});


/**
 * Deletes all courses
 * @route DELETE /courses/
 * @group Courses
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/', async (req, res) => {
    try {
        let courses = await Course.getAll();

        for (let i = 0; i < courses.length; i++) {
            await courses[i].delete();
        }
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Returns the given course
 * @route GET /courses/id/:id
 * @group Courses
 * @returns {Course.model} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/id/:id', async (req, res) => {
    try {
        let course = await Course.getById(parseInt(req.params.id));
        res.json(course);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Deletes the given course
 * @route DELETE /courses/id/:id
 * @group Courses
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/id/:id', async (req, res) => {
    try {
        let course = await Course.getById(parseInt(req.params.id));
        await course.delete();
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Triggers a sync of all courses with moodle
 * @route GET /courses/moodle/sync
 * @group Courses
 * @returns {Object} 200- Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/moodle/sync', async (req, res) => {
    try {
        await Moodle.sync();
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});