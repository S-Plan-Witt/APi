import {ApiGlobal} from "./types/global";
import mySQL from "mariadb";
import winston, {format, transports} from 'winston';
import 'winston-daily-rotate-file';
import * as dot from 'dotenv';
import {Config} from "./classes/config/Config";
import express, {Express, NextFunction, Request, Response} from "express";
import {Jwt} from './classes/jwt';
import {Telegram} from './classes/telegram';
import {SearchOptions} from "ldapjs";
import {PushNotifications, PushTelegram} from './classes/pushNotifications';
import {Ldap} from "./classes/ldap";

declare const global: ApiGlobal;

const {combine, timestamp, printf} = format;


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
const myFormat = printf(({ level, message, label, timestamp: timestamp}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});


//Add Logger to global logger scope
let logger = winston.createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        rotateFile,
        new transports.Console({level: 'silly'}),
    ]
});
global.logger = logger;

//-- Logger
logger.log({
    level: 'silly',
    label: 'Express',
    message: 'Logger init success'
});

dot.config({path: "./.env"});
global.config = Config.loadFromEnv();

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'ENV loaded'
});
//-- ENV


//init Push Frameworks
PushNotifications.initFrameworks();

//++ Mysql Pool
global.mySQLPool = mySQL.createPool({
    host: global.config.mysqlConfig.hostname,
    port: global.config.mysqlConfig.port,
    user: global.config.mysqlConfig.username,
    password: global.config.mysqlConfig.password,
    connectionLimit: 30,
    collation: "latin1_german2_ci",
    database: global.config.mysqlConfig.database
});

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'MySql Connected'
});

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
    global.logger.log({
        level: 'debug',
        label: 'Api-docs',
        message: 'Api documentation available at http://localhost:' + process.env.PORT + '/api-docs/'
    });
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
    global.logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Received request to ' + req.path + ' By ' + token
    });
    next();
};

const TGBot = new PushTelegram();
if (process.env.TGBot != "false") {
    TGBot.startTelegramBot();
}

(async () => {
    let opts: SearchOptions = {};
    //console.log(await Ldap.searchUsers(opts,"OU=Q2a,OU=Students,DC=netman,DC=lokal"));
    //console.log(await Ldap.bindLDAPAsUser("wittnil1611","l8keGMqB*3"));
    //console.log(await Ldap.bindLDAP());
})();


//++ HTTP
app.use(header);
app.use(reqLogger);

//add parser to webServer for json payload
app.use(express.json({limit: '50mb'}));

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
        res.sendStatus(500);
    }
});

async function clearDB(){
    let tablesToTruncate = ["data_exams","data_exam_supervisors","users_mails","permissions","student_courses","totp","moodle_mapping","token_calendar","preAuth_Token","data_announcements","data_courses","jwt_Token","devices","lessons_teacher","data_vertretungen","data_lessons","data_aufsichten","telegramLinks","data_entschuldigungen","users","data_exam_rooms"];

    let conn;
    try {
        conn = await global.mySQLPool.getConnection();
        for(let i = 0; i < tablesToTruncate.length; i++) {
            let tableName = tablesToTruncate[i];
            let result = await conn.query(`DELETE FROM ${tableName}`);
            console.log(result);
        }
    } catch (e) {
        console.log(e);
    } finally {
        if (conn) conn.end();
    }

}

(async () => {
    try {
        console.log(await Ldap.checkPassword("wittnil1611", "l8keGMqB*3"));
    } catch (e) {
        console.log(e);
    }
})()


app.listen(process.env.PORT, () => {
    global.logger.log({
        level: 'silly',
        label: 'Express',
        message: 'Listening on port: ' + process.env.PORT
    });
});
