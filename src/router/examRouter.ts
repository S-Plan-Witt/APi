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
import {Course} from "../classes/Course";
import {Exam} from "../classes/Exam";
import {Supervisor} from "../classes/user/Supervisor";
import path from "path";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Adds a new Exam
 * @route POST /exams/
 * @group Exams - Management functions for Exams
 * @param {Exam.model} Exam.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/', async (req, res) => {

    try {
        let body = req.body;

        for (let i = 0; i < body.length; i++) {
            try {
                let element = body[i];
                let exam = new Exam(false, element["date"], new Course(element["grade"], element["subject"], element["group"]), element["from"], element["to"], element["teacher"], element["students"], null, element["id"], "");
                exam.room = element["room"];
                await exam.save();
            } catch (e) {
                if (e !== "row exists") {
                    console.log(e);
                }
            }
        }
        res.sendStatus(200);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns all Exams
 * @route GET /exams/
 * @group Exams - Management functions for Exams
 * @param {Exam.model} Exam.body.required
 * @returns {Array.<Exam>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/', async (req, res) => {

    let rows = await Exam.getAll();
    await res.json(rows);
});

/**
 * Updates a Exam
 * @route PUT /exams/{id}
 * @group Exams - Management functions for Exams
 * @param {Exam.model} Exam.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.put('/:id', async (req, res) => {
    req.params.id;

    //TODO add exam update
    res.sendStatus(605);
});

/**
 * Deletes an Exam
 * @route DELETE /exams/{id}
 * @group Exams - Management functions for Exams
 * @param {Exam.model} Exam.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/id/:id', async (req, res) => {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    //TODO add Delete
    res.sendStatus(605);
});

//TODO determine correct router for endpoint
router.get('/exams/supervisors/:id', async (req, res) => {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }

    try {
        let data = await Supervisor.getById(parseInt(req.params.id));
        await res.json(data);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
        res.sendStatus(500);
    }
});