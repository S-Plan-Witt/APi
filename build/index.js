"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mariadb_1 = __importDefault(require("mariadb"));
//++ Logger
const winston_1 = require("winston");
const winston_2 = __importDefault(require("winston"));
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = winston_1.format;
//Create all 6 hours a new file
// @ts-ignore
const rotateFile = new (winston_2.default.transports.DailyRotateFile)({
    filename: 'log/splan/splan-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '20m',
    level: 'silly',
    format: winston_2.default.format.json(),
    frequency: '6h'
});
//Logger output format
// @ts-ignore
const myFormat = printf(({ level, message, label, timestamp: timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
//Add Logger to global logger scope
winston_2.default.loggers.add('main', {
    format: combine(timestamp(), myFormat),
    transports: [
        rotateFile,
        new winston_1.transports.Console({ level: 'silly' }),
    ]
});
const logger = winston_2.default.loggers.get('main');
//-- Logger
logger.log({
    level: 'debug',
    label: 'Express',
    message: 'Logger init success'
});
//++ ENV
const dot = __importStar(require("dotenv"));
dot.config({ path: "./.env" });
logger.log({
    level: 'debug',
    label: 'Express',
    message: 'ENV loaded'
});
//-- ENV
let sqlPort;
sqlPort = process.env.SQL_PORT;
//++ Mysql Pool
global["mySQLPool"] = mariadb_1.default.createPool({
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
const express_1 = __importDefault(require("express"));
//Request data parser
const body_parser_1 = __importDefault(require("body-parser"));
//Auth File
const jwt_1 = require("./classes/jwt");
//Users File
const user_1 = require("./classes/user");
//ReplacementLessons
//Timetable
const timeTable_1 = require("./classes/timeTable");
const telegram_1 = require("./classes/telegram");
const pushNotifications_1 = require("./classes/pushNotifications");
//Creating Web-Server
const app = express_1.default();
//Setting headers for WI
const header = function (req, res, next) {
    res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.ORIGIN,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'
    });
    next();
};
let reqLogger = function (req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Received request to ' + req.path + ' By ' + token
    });
    next();
};
const TGBot = new pushNotifications_1.PushTelegram();
TGBot.startTelegramBot();
//++ HTTP
app.use(header);
app.use(reqLogger);
//add parser to webServer for json payload
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
//Validation of request auth tokens 
app.use(jwt_1.Jwt.checkToken);
/*
Send status 200 OK if options from JS are requestsd
 */
app.options('*', async (req, res) => {
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
app.post('/students/find', async function (req, res) {
    //Validate if requesting user is admin
    if (!req.decoded.admin) {
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/find'
        });
        return res.sendStatus(401);
    }
    let filter = new user_1.UserFilter("", "", "", "");
    if (req.body.hasOwnProperty("firstname")) {
        filter.firstName = req.body.firstname;
    }
    if (req.body.hasOwnProperty("lastname")) {
        filter.lastName = req.body.lastname;
    }
    if (req.body.hasOwnProperty("birthday")) {
        filter.birthday = req.body.birthday;
    }
    try {
        let users = await user_1.User.find(filter);
        await res.json(users);
    }
    catch (e) {
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
app.post('/students/:username/courses', async function (req, res) {
    if (!req.decoded.admin) {
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/' + req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }
    //Convert username to lowerCase
    //TODO not null req.
    let user = await user_1.User.getUserByUsername(req.params.username.toLowerCase());
    try {
        //Delete Courses for user from database
        await user.deleteCourses();
        //Added Courses to Database. Supplied by request payload
        let courses = [];
        for (const courseData of req.body) {
            courses.push(new timeTable_1.Course(courseData["grade"], courseData["subject"], courseData["group"], courseData["exams"]));
        }
        await user.addCourse(courses);
        res.sendStatus(200);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Returns all Students from LDAP
 */
app.get('/students/ldap/', async function (req, res) {
    if (!req.decoded.admin) {
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/ldap/'
        });
        return res.sendStatus(401);
    }
    try {
        let data = await user_1.User.getAllStudentsLDAP();
        await res.json(data);
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});
//------------ACCESSTOKEN MGM
app.get('/jwt/all', async (req, res) => {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    let tokens = await jwt_1.Jwt.getAll();
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
app.get('/telegram/confirm/:token', async function (req, res) {
    let token = req.params.token;
    let username = req.decoded.username;
    try {
        let tgId;
        tgId = await telegram_1.Telegram.validateRequestToken(token);
        let user = await user_1.User.getUserByUsername(username);
        await user.addDevice(tgId.toString(), "TG");
        await telegram_1.Telegram.revokeRequest(token);
        let pushNot = new pushNotifications_1.PushNotifications();
        await pushNot.send("TG", tgId, "Connected to user", username);
        res.sendStatus(200);
    }
    catch (e) {
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
