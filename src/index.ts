import {ApiGlobal} from "./types/global";
declare const global: ApiGlobal;

import mySQL from  "mariadb";

//++ Logger
import { format, transports } from 'winston';
import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf } = format;


//Create all 6 hours a new file
const rotateFile = new (winston.transports.DailyRotateFile)({
    filename: 'log/%DATE%.log',
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
    level: 'silly',
    label: 'Express',
    message: 'Logger init success'
});

//++ ENV
import * as dot from 'dotenv';

dot.config({path:"./.env"});
//console.log(process.env);

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'ENV loaded'
});
//-- ENV

let sqlPort : number = 3306;
if(process.env.SQL_PORT != undefined){
    sqlPort = parseInt(process.env.SQL_PORT);
}


//++ Mysql Pool
global["mySQLPool"] = mySQL.createPool({
    host: process.env.SQL_HOST,
    port: sqlPort,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    connectionLimit: 30,
    collation: "latin1_german2_ci"
});

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'MySql Connected'
});

//Webservice
import express, {NextFunction, Request, Response, Express} from "express";
import bodyParser from "body-parser";
import {Jwt} from './classes/jwt';
import {Permissions, Teacher, User, UserFilter} from './classes/user';
import {Course} from './classes/timeTable';
import {Telegram} from './classes/telegram';
import {PushNotifications, PushTelegram} from './classes/pushNotifications';
import {Ldap} from "./classes/ldap";
/*
(async () => {
    let user : User = await User.getUserById(1630)
    console.log(user)
    await user.enableMoodleAccount();
    //user = await User.getUserById(1630)
    //user.disableMoodleAccount()
})();

 */





//Creating Web-Server
const app = express();
if(process.env.APIDOC == "true"){
    const expressSwagger = require('express-swagger-generator')(app);

    let options = {
        swaggerDefinition: {
            info: {
                description: 'SIKS',
                title: 'SIKS',
                version: '1.0.2',
            },
            host: 'localhost:3000',
            basePath: '',
            produces: [
                "application/json"
            ],
            schemes: ['http','https'],
            securityDefinitions: {
                JWT: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                    description: "",
                }
            }
        },
        basedir: __dirname, //app absolute path
        files: ['./router/*.js'] //Path to the API handle folder
    };
    expressSwagger(options)
}


//Setting headers for WI
const header = (req : Request, res : Response, next : NextFunction) => {
    res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin' : process.env.ORIGIN,
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'
    });
    next();
};

let reqLogger = (req : Request, res : Response, next : NextFunction) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Received request to '+ req.path + ' By ' + token
    });
    next();
};

const TGBot = new PushTelegram();
if(process.env.TGBot != "false"){
    TGBot.startTelegramBot();
}


//++ HTTP
app.use(header);
app.use(reqLogger);

//add parser to webServer for json payload
app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded({limit: '50mb'}));

//Validation of request auth tokens 
app.use(Jwt.checkToken);

/*
Send status 200 OK if options from JS are requested
 */
app.options('*', (req: Request, res: Response) => {
    res.sendStatus(200);
});

//++++ Router
app.use("/", require('./router/mainRouter').router);


//---- Router

/**
 * Deletes all existing Courses for req. user and adds supplied ones.
 *
 * Payload from Request with courses array
 * returns SC 200
 */
app.post('/students/:username/courses', async (req: Request, res: Response) => {
    if(!req.decoded.permissions.usersAdmin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/'+ req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }

    try {
        await req.user.deleteCourses();
        let courses = [];
        for (const courseData of req.body){
            courses.push(new Course(courseData["grade"],courseData["subject"], courseData["group"], courseData["exams"]));
        }
        await req.user.addCourse(courses);
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
app.get('/students/ldap/', async (req: Request, res: Response) => {
    if(!req.decoded.permissions.users){
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

app.get('/jwt/all', async (req: Request, res: Response) => {
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let tokens = await Jwt.getAll();
    res.json(tokens);
});
/*
app.get('/jwt/user/:user', function(req: Request, res: Response){
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


app.delete('/jwt', async function(req: Request, res: Response){
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
app.delete('/jwt/token/:token', function(req: Request, res: Response){
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
app.post('/aufsichten', async function(req: Request, res: Response){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let body = req.body;
    await body.forEach(aufsicht => {
        aufsichten.add(aufsicht);
    });

    res.sendStatus(200);
});



app.put('/aufsichten/id/:id', async function(req: Request, res: Response){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let body = req.body;
    await aufsichten.set(req.params.id,body);

    res.sendStatus(200);
});

app.get('/aufsichten', async function (req: Request, res: Response){
    if(!req.decoded.admin){
        return res.sendStatus(401);
    }

    let rows = await aufsichten.getAll();
    await res.json(rows);
});

app.delete('/aufsichten/id/:id', async function (req: Request, res: Response){
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

app.get('/telegram/confirm/:token', async (req: Request, res: Response) => {
    let token = req.params.token;
    try{
        let tgId: number;
        tgId = await Telegram.validateRequestToken(token);
        await req.user.addDevice(tgId.toString(), "TG");
        await Telegram.revokeRequest(token);
        let pushNot = new PushNotifications();
        await pushNot.send("TG", tgId, "Connected to user", req.user.username);
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});
/*
app.get('/webcal/:id', async (req: Request, res: Response) => {
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
 *
 */
async function clearDB(){
    let tablesToTruncate = ["data_exams","data_exam_supervisors","users_mails","permissions","student_courses","totp","moodle_mapping","token_calendar","preAuth_Token","data_announcements","data_courses","jwt_Token","devices","lessons_teacher","data_vertretungen","data_lessons","data_aufsichten","telegramLinks","data_entschuldigungen","users","data_exam_rooms"];
    let pool = global.mySQLPool;
    let conn;

    try {
        conn = await pool.getConnection();
        for(let i = 0; i < tablesToTruncate.length; i++) {
            let tableName = tablesToTruncate[i];
            let result = await conn.query(`DELETE FROM splan.${tableName}`);
            console.log(result);
        }
    }catch (e) {
        console.log(e);
    } finally {
        if (conn) conn.end();
    }

}

//clearDB();

(async () => {
    let teachers: Teacher[] = await Ldap.loadTeacher()
    for (const teacherkey in teachers) {
        let teacher = teachers[teacherkey];
        console.log(teacher)
        try {
            await teacher.createToDB();
        }catch (e) {
            console.log(e)
        }

    }
})();


/**
 * start webserver to serve requests
 */
app.listen(process.env.PORT, () => {
    logger.log({
        level: 'silly',
        label: 'Express',
        message: 'Listening on port: ' + process.env.PORT
    });
});
