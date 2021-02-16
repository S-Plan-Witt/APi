/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "./types/global";
import mySQL from "mariadb";
import winston, {format, transports} from 'winston';
import 'winston-daily-rotate-file';
import * as dot from 'dotenv';
import {Config} from "./classes/config/Config";
import express, {Express, NextFunction, Request, Response} from "express";
import {JWTInterface} from './classes/JWTInterface';
import {Telegram} from './classes/Telegram';
import {PushNotifications} from './classes/PushNotifications';
import path from "path";

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
const myFormat = printf(({level, message, label, timestamp: timestamp}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});


/**
 * Creates a global Logger
 */
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
    message: 'Logger init success',
    file: path.basename(__filename)
});

/**
 * Load Env file to environment if exists
 */
dot.config({path: "./.env"});

/**
 * Load config from environment
 */
global.config = Config.loadFromEnv();

logger.log({
    level: 'debug',
    label: 'Express',
    message: 'ENV loaded',
    file: path.basename(__filename)
});
//-- ENV

global.pushNotifications = new PushNotifications();

/**
 * Exception handler
 */
process.on('uncaughtException', function (err) {
    logger.log({
        level: 'error',
        label: 'Express',
        message: 'Unhandled Exception trace: ' + err.stack,
        file: path.basename(__filename)
    });
});

/**
 * Initiate mysql connection
 */
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
    message: 'MySql Connected',
    file: path.basename(__filename)
});

/**
 * creating Http Server
 */
const app = express();
if (global.config.webServerConfig.apiDocumentation) {
    /**
     * Generate and display Api documentation under host/api-docs/
     */
    const expressSwagger = require('express-swagger-generator')(app);

    let options = {
        swaggerDefinition: {
            info: {
                description: 'S-Plan',
                title: 'S-Plan',
                version: '1.0.2',
            },
            host: 'localhost:3000',
            basePath: '',
            produces: [
                "application/json"
            ],
            schemes: ['http', 'https'],
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
        message: 'Api documentation available at http://localhost:' + global.config.webServerConfig.port + '/api-docs/'
    });
}


/**
 * Function to set on a response headers for compatibility with client JS
 * @param req
 * @param res
 * @param next
 */
const header = (req: Request, res: Response, next: NextFunction) => {
    res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': global.config.pwaConfig.url,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'
    });
    next();
};

/**
 * Function to log a request to the logger
 * @param req
 * @param res
 * @param next
 */
let reqLogger = (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    global.logger.log({
        level: 'debug',
        label: 'Express',
        message: 'Received request to ' + req.path + ' By ' + token,
        file: path.basename(__filename)
    });
    next();
};

if (global.config.pushFrameWorks.telegram.enabled) {
    if (global.pushNotifications.pushTelegram) {
        global.pushNotifications.pushTelegram.startTelegramBot();
    }
}

/**
 * Enable middleware for headers and logging
 */
app.use(header);
app.use(reqLogger);

/**
 * Add parser for request payload in json format with a max size of 50mb
 */
app.use(express.json({limit: '50mb'}));

/**
 * Add Function to validate request auth Headers
 */
app.use(JWTInterface.checkToken);

/**
 * Response with a 200 OK status if it is a options preflight request
 */
app.options('*', (req: Request, res: Response) => {
    res.sendStatus(200);
});

/**
 * Loading the main router
 */
app.use("/", require('./router/mainRouter').router);

//TODO move to router
app.get('/telegram/confirm/:token', async (req: Request, res: Response) => {
    let token = req.params.token;

    let tgId: number = 0;

    try {
        tgId = await Telegram.validateRequestToken(token);
    } catch (e) {
        res.sendStatus(200);
        return;
    }

    try {
        await req.user.addDevice(tgId.toString(), "TG");
        await Telegram.revokeRequest(token);
        if (global.pushNotifications.pushTelegram) {
            await global.pushNotifications.pushTelegram.sendPush(tgId, "Connected to user " + req.user.username);
        }
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Start HTTP Server to listen for in-bound requests
 */
app.listen(global.config.webServerConfig.port, () => {
    global.logger.log({
        level: 'silly',
        label: 'Express',
        message: 'Listening on port: ' + global.config.webServerConfig.port,
        file: path.basename(__filename)
    });
});
