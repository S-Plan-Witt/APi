import express, {Request, Response} from 'express';
import winston from 'winston';

import {ReplacementLesson, ReplacementLessons} from '../classes/replacementLessons';
import {User} from '../classes/user';
import {PushNotifications} from '../classes/pushNotifications';
import {Course} from "../classes/timeTable";

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
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    for(let i= 0; i < req.body.length;i++){
        let replacementLesson: ReplacementLesson = req.body[i];
        try {
            let status = await ReplacementLessons.add(replacementLesson);

            let devices = await User.getStudentDevicesByCourse(replacementLesson.course);
            //devices = devices.concat(await user.getDevicesByUsername("bad"));
            console.log(status)
            let pushNotifis = new PushNotifications();

            if(status === "added"){
                pushNotifis.sendBulk(devices,"Hinzugefügt: " + replacementLesson.course.subject," Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }else if(status === "updated"){
                pushNotifis.sendBulk(devices,"Aktualisiert: " + replacementLesson.course.subject," Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }


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
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }
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
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }
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
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }
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
 * Deletes an ReplacementLesson by id
 * @route DELETE /replacementLessons/id/{id}
 * @group ReplacementLesson - Management functions for ReplacementLesson
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.delete('/id/:id', async function (req,res){
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }
    let id = parseInt(req.params.id);
    try{
        let replacementLesson: any = await ReplacementLessons.deleteById(id);
        let push = new PushNotifications();
        let devices: any = await User.getStudentDevicesByCourse(replacementLesson);
        for (const id in devices) {
            if (devices.hasOwnProperty(id)) {
                const device = devices[id];
                await push.send(device.platform, device.device, "Entfernt: " + replacementLesson.subject, "Entfernt: " + replacementLesson.subject + "Datum: " + replacementLesson.date)
            }
        }
        res.sendStatus(200);
    } catch(e){
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});