import {ApiGlobal} from "./types/global";
declare const global: ApiGlobal;

import mySQL from  "mariadb";

//++ Logger
import { format, transports } from 'winston';
import winston from 'winston';
require('winston-daily-rotate-file');

const { combine, timestamp, printf } = format;


//Create all 6 hours a new file
// @ts-ignore
const rotateFile = new (winston.transports.DailyRotateFile)({
    filename: 'log/splan/splan-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '20m',
    level: 'silly',
    format: winston.format.json(),
    frequency: '6h'
});
//Logger output format
// @ts-ignore
const myFormat = printf(({ level, message, label, timestamp: timestamp}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});


//Add Logger to global logger scope
winston.loggers.add('main', {
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        rotateFile,
        new transports.Console({ level: 'silly' }),
    ]
});

const logger = winston.loggers.get('main');

//-- Logger
logger.log({
    level: 'debug',
    label: 'Express',
    message: 'Logger init success'
});

//++ ENV
import * as dot from 'dotenv';

dot.config({path:"./.env"});

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'ENV loaded'
});
//-- ENV

let sqlPort : any;
sqlPort = process.env.SQL_PORT;

//++ Mysql Pool
global["mySQLPool"] = mySQL.createPool({
    host: process.env.SQL_HOST,
    port: sqlPort,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    connectionLimit: 20,
    collation: "latin1_german2_ci"
});
logger.log({
    level: 'debug',
    label: 'Express',
    message: 'MySql Connected'
});

//-- Mysql

//Webservice
import express from "express";
//Request data parser
import bodyParser from "body-parser";
//Auth File
import {Jwt} from './classes/jwt';
//Users File
import {User,Student,Teacher,Parent, UserFilter} from './classes/user';
//ReplacementLessons
//Timetable
import {Course} from './classes/timeTable';

import {Exams,Exam,Supervisors,RoomLink,RoomLinks} from './classes/exams';

import {Telegram} from './classes/telegram';
import {Database} from './classes/database';

import {PushNotifications, PushTelegram} from './classes/pushNotifications';

//Creating Web-Server
const app = express();


//Setting headers for WI
const header = function (req : any, res : any, next : any) {
    res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin' : process.env.ORIGIN,
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'
    });
    next();
};

let reqLogger = function (req : any, res : any, next : any) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Received request to '+ req.path + ' By ' + token
    });
    next();
};


const TGBot = new PushTelegram();
TGBot.startTelegramBot();




//++ HTTP
app.use(header);
app.use(reqLogger);

//add parser to webServer for json payload
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Validation of request auth tokens 
app.use(Jwt.checkToken);

/*
Send status 200 OK if options from JS are requestsd
 */
app.options('*', async (req: any, res: any) => {

    res.sendStatus(200);
});

//++++ Router
app.use("/users", require('./router/usersRouter').router);
app.use("/user", require('./router/userRouter').router);
app.use("/timetable", require('./router/timeTableRouter').router);
app.use("/exams", require('./router/examRouter').router);
app.use("/announcements", require('./router/announcementRouter').router);
app.use("/timetable", require('./router/timeTableRouter').router);
app.use("/replacementLessons", require('./router/replacementLessonRouter').router);


//---- Router
/**
 * Payload from Request with min one key of firstname, lastname, birthdate
 * Gives all matching users back
 */
app.post('/students/find', async function (req: any, res: any) {
    //Validate if requesting user is admin
    if(!req.decoded.admin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/find'
        });
        return res.sendStatus(401);
    }

    let filter = new UserFilter("","","","");

    if(req.body.hasOwnProperty("firstname")){
        filter.firstName = req.body.firstname;
    }
    if(req.body.hasOwnProperty("lastname")){
        filter.lastName = req.body.lastname;
    }
    if(req.body.hasOwnProperty("birthday")){
        filter.birthday = req.body.birthday;
    }

    try {
        let users = await User.find(filter);
        await res.json(users);
    } catch (e){
        logger.log({
            level: 'warn',
            label: 'Express',
            message: 'Error while executing callback : /students/find : ' + e
        });
        res.sendStatus(500);
    }
});

/**
 * Deletes all existing Courses for req. user and adds supplied ones.
 *
 * Payload from Request with courses array
 * returns SC 200
 */
app.post('/students/:username/courses', async function(req: any, res: any) {
    if(!req.decoded.admin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/'+ req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }

    //Convert username to lowerCase
    //TODO not null req.
    let user = await User.getUserByUsername(req.params.username.toLowerCase());


    try {
        //Delete Courses for user from database
        await user.deleteCourses();
        //Added Courses to Database. Supplied by request payload
        let courses = [];
        for (const courseData of req.body){
            courses.push(new Course(courseData["grade"],courseData["subject"], courseData["group"], courseData["exams"]));
        }


        await user.addCourse(courses);
        res.sendStatus(200);
    } catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Returns all Students from LDAP
 */
app.get('/students/ldap/', async function(req: any, res: any){
    if(!req.decoded.admin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/ldap/'
        });
        return res.sendStatus(401);
    }

    try {
        let data = await User.getAllStudentsLDAP();
        await res.json(data);
    } catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//------------ACCESSTOKEN MGM

app.get('/jwt/all', async (req: any, res: any) => {
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let tokens = await Jwt.getAll();
    res.json(tokens);
});
/*
app.get('/jwt/user/:user', function(req: any, res: any){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    //TODO async
    Jwt.getUser(req.params.user,function(err: any,tokens: any){
        res.json(tokens);
    })
});

 */
/*


app.delete('/jwt', async function(req: any, res: any){
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }

    let token = req.decoded.session;

    try{
        await Jwt.revokeToken(token);
        res.sendStatus(200);
    } catch(e){
        //TODO add logger
        res.sendStatus(500);
    }
});
*/
/*
app.delete('/jwt/token/:token', function(req: any, res: any){
    if(!req.decoded.admin){
        //TODO add logger
        return res.sendStatus(401);
    }

    let token = req.params.token;

    Jwt.revokeToken(token,function(err: any,success: any){
        if(success){
            res.sendStatus(200);
        }else{
            //TODO add logger
            res.sendStatus(500);
        }
    })
});

 */
/*
app.post('/aufsichten', async function(req: any, res: any){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let body = req.body;
    await body.forEach(aufsicht => {
        aufsichten.add(aufsicht);
    });

    res.sendStatus(200);
});



app.put('/aufsichten/id/:id', async function(req: any, res: any){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let body = req.body;
    await aufsichten.set(req.params.id,body);

    res.sendStatus(200);
});

app.get('/aufsichten', async function (req: any, res: any){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let rows = await aufsichten.getAll();
    await res.json(rows);
});

app.delete('/aufsichten/id/:id', async function (req: any, res: any){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let id = req.params.id;
    const suc = await aufsichten.delete(id);
    if(suc){
        res.sendStatus(200);
    }else{
        //TODO add logger
        res.sendStatus(500);
    }
});
 */

app.get('/telegram/confirm/:token', async function (req: any, res: any){
    let token = req.params.token;
    let username = req.decoded.username;
    try{
        let tgId: number;
        tgId = await Telegram.validateRequestToken(token);
        let user = await User.getUserByUsername(username);
        await user.addDevice(tgId.toString(), "TG");
        await Telegram.revokeRequest(token);
        let pushNot = new PushNotifications();
        await pushNot.send("TG", tgId, "Connected to user", username);
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});
/*
app.get('/webcal/:id', async (req: any, res: any) => {
    let user;
    try{
        user = await User.getUserByCalToken(req.params.id);
        let courses = user.courses;
        let response: { begin: string; end: string; summary: any; description: any; }[] = [];
        for(const course of courses){
            try{
                if(course.displayKlausuren){
                    let data = await Exams.getByCourse(course);
                    data.forEach(element => {
                        element = JSON.stringify(element);
                        element = JSON.parse(element);

                        let begin = element.date.substring(0,11) + " " + element.from + ".000Z";
                        let end = element.date.substring(0,11) + " " + element.to + ".000Z";

                        response.push({"begin":begin,"end":end,"summary":element.subject,"description": element.subject})
                    });
                }
            } catch(e){
                console.log(e);
                //TODO add logger
                //TODO add handler
            }
        }
        let responseText = await calender.generateICS(response);
        res.send(responseText);
    } catch(e){
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});

 */


/**
 * start webserver to serve requests
 */
app.listen(process.env.PORT, () => {
    logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Listening on port: ' + process.env.PORT
    });
});
