import {Course} from  "../classes/timeTable";

import express from 'express';
import winston from 'winston';

import {Exams,Exam,Supervisors, Supervisor} from '../classes/exams';

const logger = winston.loggers.get('main');
export let router = express.Router();


router.post('/', async function(req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    try {
        let body = req.body;

        for (let i = 0; i < body.length; i++) {
            let element = body[i];
            let exam = new Exam(element["date"], element["from"], element["to"],new Course(element["grade"], element["subject"], element["group"]), element["teacher"], element["students"], element["room"],false,element["id"]);
            await exam.save();
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

router.get('/', async function (req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let rows = await Exams.getAll();
    await res.json(rows);
});

router.put('/:id', async function (req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }
    let id = req.params.id;

    //TODO add exam update
    res.sendStatus(605);
});

router.delete('/id/:id', async function (req,res){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    //TODO add Delete
    res.sendStatus(605);
});

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