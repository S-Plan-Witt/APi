import express, {Request, Response} from 'express';
import winston from 'winston';

import {ReplacementLesson, ReplacementLessons} from '../classes/replacementLessons';
import {User} from '../classes/user';
import {PushNotifications} from '../classes/pushNotifications';
import {Course, Lesson, TimeTable} from "../classes/timeTable";
import assert from "assert";

const logger = winston.loggers.get('main');
export let router = express.Router();

/**
 * Adds an ReplacementLesson
 * @route POST /replacementLessons/
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @param {ReplacementLesson.model} ReplacementLesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.post('/', async function (req,res){
    /*
    let lessons: any = [];
    let allLessons: Lesson[] = await TimeTable.getAllLessons();
    for (let i = 0; i < allLessons.length; i++) {
        let lesson = allLessons[i];
        if(!lessons.hasOwnProperty(lesson.course.grade)){
            lessons[lesson.course.grade] = [];
        }
        if(!lessons[lesson.course.grade].hasOwnProperty(lesson.course.subject)){
            lessons[lesson.course.grade][lesson.course.subject] = [];
        }
        if(!lessons[lesson.course.grade][lesson.course.subject].hasOwnProperty(lesson.course.group)){
            lessons[lesson.course.grade][lesson.course.subject][lesson.course.group] = [];
        }
        if(!lessons[lesson.course.grade][lesson.course.subject][lesson.course.group].hasOwnProperty(lesson.day)){
            lessons[lesson.course.grade][lesson.course.subject][lesson.course.group][lesson.day] = [];
        }
        lessons[lesson.course.grade][lesson.course.subject][lesson.course.group][lesson.day][lesson.lesson] = lesson;
    }

     */
    for(let i= 0; i < req.body.length;i++){
        let postDataSet: any = req.body[i];
        if(postDataSet.hasOwnProperty("lessonId")){
            console.log(postDataSet.lessonId)
        }else if(postDataSet.hasOwnProperty("lesson")){

        }

        console.log(postDataSet)
        let replacementLesson: ReplacementLesson | undefined = undefined;
        let course: Course = await TimeTable.getCourseByFields(postDataSet["course"]["subject"],postDataSet["course"]["grade"],postDataSet["course"]["group"]);
        let teacher: User | null = null;
        if(postDataSet["teacher"] != "---"){
            teacher = await User.getUserByUsername(postDataSet["teacher"]);
        }
        if (teacher == null || teacher.id != null){
            try {
                let teacherId: number | null = null;
                if(teacher != null){
                    if (teacher.id != null){
                        teacherId = teacher.id;
                    }
                }
                replacementLesson = new ReplacementLesson(null, course,await TimeTable.getLessonsByCourseAndLesson(course,postDataSet["lessonNumber"]), teacherId, postDataSet["room"], postDataSet["subject"], postDataSet["info"], postDataSet["date"]);
            } catch (e) {
                console.log(e)
            }
        }
        console.log(replacementLesson)
        try {
            assert(replacementLesson != null, "RL null")
            let status = await ReplacementLessons.add(replacementLesson);
            console.log(status)
/*
            let devices = await User.getStudentDevicesByCourse(replacementLesson.course);
            //devices = devices.concat(await user.getDevicesByUsername("bad"));
            console.log(status)
            let pushNotifis = new PushNotifications();

             */

            /*
            if(status === "added"){
                pushNotifis.sendBulk(devices,"Hinzugefügt: " + replacementLesson.course.subject," Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }else if(status === "updated"){
                pushNotifis.sendBulk(devices,"Aktualisiert: " + replacementLesson.course.subject," Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }
            */


        } catch(e){
            console.log(e);
            logger.log({
                level: 'warn',
                label: 'ReplacementLessons',
                message: 'Error while processing post ' + e
            });
            //add handler
        }
    }
    res.sendStatus(200);
});

/**
 * Returns all ReplacementLessons
 * @route GET /replacementLessons/
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {Array.<ReplacementLesson>} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/', async function (req,res){
    try{
        await res.json(await ReplacementLessons.getAll());
    }catch(e){
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
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/date/:date', async function (req,res){
    try {
        let date = req.params.date;
        let result = await ReplacementLessons.getByDate(date);
        await res.json(result);
    } catch(e){
        console.log(e);
        res.sendStatus(500)
    }
});

/**
 * Gets a ReplacementLesson by id
 * @route GET /replacementLessons/id/{id}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {ReplacementLesson.model} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/id/:id', async function (req,res){
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }
    let id = parseInt(req.params.id);
    try{
        let lesson = await ReplacementLessons.getById(id);
        res.json(lesson);
    } catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }

});

router.post('/find', async function (req: Request, res: Response) {
    let info = req.body.info;
    try{
        let lessons = await ReplacementLessons.search(info);
        res.json(lessons);
    } catch(e){
        //TODO add logger
        res.sendStatus(500);
    }

});

/**
 * Deletes an ReplacementLesson by replacement-id
 * @route DELETE /replacementLessons/id/{id}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.delete('/id/:id', async function (req,res){
    let id = req.params.id;
    console.log(id)
    try{
        let replacementLesson: any = await ReplacementLessons.deleteById(id.toString());
        /*
        let push = new PushNotifications();
        let devices: any = await User.getStudentDevicesByCourse(replacementLesson);
        for (const id in devices) {
            if (devices.hasOwnProperty(id)) {
                const device = devices[id];
                await push.send(device.platform, device.device, "Entfernt: " + replacementLesson.subject, "Entfernt: " + replacementLesson.subject + "Datum: " + replacementLesson.date)
            }
        }

         */
        res.sendStatus(200);
    } catch(e){
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});