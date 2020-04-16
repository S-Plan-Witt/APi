import express from 'express';
import winston from 'winston';

import {ReplacementLessons} from '../classes/replacementLessons';
import {TimeTable} from '../classes/timeTable';

const logger = winston.loggers.get('main');
export let router = express.Router();


router.post('/lessons', async function (req,res){
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }

    let body = req.body;
    for(let i = 0; i < body.length; i++){
        let lesson = body[i];
        try {
            await TimeTable.addLesson(lesson);
        } catch(e){
            console.log(e);
            //TODO add logger
            //Add handler
        }
    }
    res.sendStatus(200);
});

router.post('/find/course', async (req, res) => {
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }

    try{
        let courses = await TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);

        res.json(courses);
    }catch(e){
        //TODO add logger
        res.sendStatus(500);
    }


});

router.get('/grades', async function (req,res){
    if(!req.decoded.permissions.all){
        return res.sendStatus(401);
    }
});

router.get('/courses', async function (req,res){

    if(!req.decoded.permissions.all){
        return res.sendStatus(401);
    }
    res.json(await TimeTable.getAllCourses())
});

router.get('/rebuild', async (req, res) => {
    await TimeTable.rebuildCourseList();

    res.status(200);
});