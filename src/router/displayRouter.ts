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
import express from "express";
import path from "path";
import {Exam} from "../classes/Exam";
import {ReplacementLesson} from "../classes/ReplacementLesson";
import {Announcement} from "../classes/Announcement";
import {UserType} from "../classes/user/User";
import {Display} from "../classes/Display";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.user.type == UserType.DISPLAY || req.user.permissions?.globalAdmin) {
        next();
        return;
    }
    global.logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.user.id}`,
        file: path.basename(__filename)
    });
    return res.sendStatus(401);
});

router.get('/id/:id/data', async (req, res) => {
    try {
        let display: Display = await Display.getById(parseInt(req.params.id));

        let data: DisplayDataSet = {
            replacementLessons: await display.getReplacementLessons(),
            announcements: await display.getAnnouncements(),
            exams: await display.getExams()
        }

        res.json(data);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }


});

router.get('/id/:id/config', async (req, res) => {
    try {
        let display: Display = await Display.getById(parseInt(req.params.id));

        res.json(display);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

type DisplayDataSet = {
    replacementLessons: ReplacementLesson[];
    announcements: Announcement[];
    exams: Exam[];
}