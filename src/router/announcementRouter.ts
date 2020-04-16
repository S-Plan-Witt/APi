import {Course} from "../classes/timeTable";

import express from 'express';
import winston from 'winston';
import {Announcements,Announcement} from '../classes/announcements';
import {User,Student,Teacher,Parent, UserFilter}   from '../classes/user';
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

router.post('/', async function(req,res){


    let body = req.body;
    let author = req.decoded.username;
    try {
        let course = new Course(body["course"]["grade"],body["course"]["subject"],body["course"]["group"],null);


        if(!req.decoded.admin){
            let user = await User.getUserByUsername(req.decoded.username);
            if(!user.isTeacherOf(course)){
                return res.sendStatus(401);
            }
        }

        let announcement = new Announcement(course,author,body["content"],body["date"]);
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

router.get('/', async function (req,res){

    let rows = await Announcements.getAll();
    await res.json(rows);
});

//TODO jDoc
router.put('/id/:id', async function(req,res){
    let body = req.body;
    let id = parseInt(req.params.id);
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

//TODO jDoc
router.get('/id/:id', async function(req,res){
    let id = parseInt(req.params.id);
    let announcement = await Announcements.getById(id);

    res.json(announcement)
});

//TODO jDoc


//TODO jDoc
router.delete('/id/:id', async function (req,res){

    try {
        let id = parseInt(req.params.id);
        let announcement: Announcement = await Announcements.getById(id);

        if(!req.decoded.admin){
            let user: User = await User.getUserByUsername(req.decoded.username);
            if(!user.isTeacherOf(announcement.course)){
                return res.sendStatus(401);
            }
        }

        await announcement.delete();
        let devices = await User.getStudentDevicesByCourse(announcement.course);
        let push = new PushNotifications();
        push.sendBulk(devices,"Aushang: " + announcement.course.subject," Entfernt Datum: " + announcement.date);

        await res.sendStatus(200);
    }catch (e) {
        //TODO add logger
        console.log(e);
        await res.sendStatus(500);
    }
});