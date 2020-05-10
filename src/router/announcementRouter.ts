import {Course} from "../classes/timeTable";

import express from 'express';
import winston from 'winston';
import {Announcements,Announcement} from '../classes/announcements';
import {User}   from '../classes/user';
import {PushNotifications}          from '../classes/pushNotifications';
const logger = winston.loggers.get('main');
export let router = express.Router();

router.use((req, res, next) =>{
    if(req.decoded.admin){
        next();
        return ;
    }else if(req.decoded.userType == 'teacher'){
        next();
        return;
    }
    return res.sendStatus(401);
});

/**
 * Lists all Announcements
 * @route POST /announcements/
 * @group Announcements - Management functions for Announcements
 * @param {Announcement.model} Announcement.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */

router.post('/', async function(req,res){

    let body = req.body;
    let author = req.decoded.username;
    try {
        let course = new Course(body["course"]["grade"],body["course"]["subject"],body["course"]["group"],null);


        if(!req.decoded.admin){
            if(!req.user.isTeacherOf(course)){
                return res.sendStatus(401);
            }
        }

        let announcement = new Announcement(course, author, body["content"], body["date"]);
        await announcement.create();

        let devices = await User.getStudentDevicesByCourse(course);
        let push = new PushNotifications();
        push.sendBulk(devices,"Aushang: " + announcement.course.subject," Hinzugefügt: " + announcement.content + " Datum: " + announcement.date);

        res.sendStatus(200);
    }catch (e) {
        console.log(e);
        logger.log({
            level: 'error',
            label: 'announcementsRouter',
            message: 'Error while processing request ' + JSON.stringify(e)
        });

        res.sendStatus(500);
    }
});
/**
 * Lists all Announcements
 * @route GET /announcements/
 * @group Announcements - Management functions for Announcements
 * @returns {Array.<Announcement>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/', async function (req,res){

    await res.json(await Announcements.getAll());
});

/**
 * Updates Announcement {id}
 * @route PUT /announcements/id/{id}
 * @group Announcements - Management functions for Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.put('/id/:id', async function(req,res){
    let body = req.body;
    let id: number = parseInt(req.params.id);
    let announcement: Announcement = await Announcements.getById(id);

    announcement.course = new Course(body["course"]["grade"], body["course"]["subject"], body["course"]["group"],null);
    announcement.content = body["content"];
    announcement.date = body["date"];

    await announcement.update();

    let devices = await User.getStudentDevicesByCourse(announcement.course);
    let push = new PushNotifications();
    push.sendBulk(devices,"Aushang: " + announcement.course.subject," Geändert: " + announcement.content + " Datum: " + announcement.date);

    res.sendStatus(200);
});

/**
 * Returns Announcement {id}
 * @route GET /announcements/id/{id}
 * @group Announcements - Management functions for Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/id/:id', async function(req,res){
    let id = parseInt(req.params.id);
    let announcement = await Announcements.getById(id);

    res.json(announcement)
});

/**
 * Deletes Announcement {id}
 * @route DELETE /announcements/id/{id}
 * @group Announcements - Management functions for Announcements
 * @returns {Error} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.delete('/id/:id', async function (req,res){

    try {
        let id = parseInt(req.params.id);
        let announcement: Announcement = await Announcements.getById(id);

        if(!req.decoded.admin){
            if(!req.user.isTeacherOf(announcement.course)){
                return res.sendStatus(401);
            }
        }

        await announcement.delete();
        let devices = await User.getStudentDevicesByCourse(announcement.course);
        let push = new PushNotifications();
        push.sendBulk(devices,"Aushang: " + announcement.course.subject," Entfernt Datum: " + announcement.date);

        res.sendStatus(200);
    }catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});