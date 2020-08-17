import {Course} from  "../classes/timeTable";

import express from 'express';
import winston from 'winston';

import {Exams,Exam,Supervisors} from '../classes/exams';

const logger = winston.loggers.get('main');
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
router.post('/', async function(req,res){

    try {
        let body = req.body;

        for (let i = 0; i < body.length; i++) {
            try {
                let element = body[i];
                let exam = new Exam(false, element["date"], new Course(element["grade"], element["subject"], element["group"]), element["from"], element["to"], element["teacher"], element["students"], null, element["id"], "");
                exam.room = element["room"];
                await exam.save();
            } catch (e) {
                console.log(e);
            }
        }
        res.sendStatus(200);
    } catch (e) {
        logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e)
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
router.get('/', async function (req,res){

    let rows = await Exams.getAll();
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
router.put('/:id', async function (req,res){
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
router.delete('/id/:id', async function (req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }
    //TODO add Delete
    res.sendStatus(605);
});

//TODO determine correct router for endpoint
router.get('/exams/supervisors/:id', async function (req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    try {
        let data = await Supervisors.getById(parseInt(req.params.id));
        await res.json(data);
    } catch(e){
        logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});