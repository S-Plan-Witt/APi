/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "./types/global";
import {Logger} from "./classes/Logger";
import path from "path";
import * as dot from "dotenv";
import {Config} from "./classes/config/Config";
import {Express} from "express";
import {ExpressServer} from "./classes/ExpressServer";
import mySQL from "mariadb";
import {PushNotifications} from "./classes/external/PushNotifications";
import {Ldap} from "./classes/external/Ldap";

declare const global: ApiGlobal;

export class Starter {

    static  full() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starter: FULL BEGIN");
                this.logger();
                this.globalExceptionHandler();
                this.config();
                await this.externalServers();
                this.express();
                console.log("Starter: FULL END");
            } catch (e) {
                reject(e);
            }
        });
    }

    static logger() {
        Logger.init();

        global.logger.log({
            level: 'silly',
            label: 'Express',
            message: 'Logger init success',
            file: path.basename(__filename)
        });
    }

    static config() {
        /**
         * Load Env file to environment if exists
         */
        dot.config({path: "./.env"});

        /**
         * Load config from environment
         */
        global.config = Config.loadFromEnv();

        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'ENV loaded',
            file: path.basename(__filename)
        });
    }

    static externalServers() :Promise<void>{
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starter: ExSERVER BEGIN");
                this.mysql();
                await this.ldap();
                console.log("Starter: ExSERVER END");
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    static mysql() {
        console.log("Starter: MYSQL BEGIN");
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

        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'MySql Connected',
            file: path.basename(__filename)
        });
        console.log("Starter: MYSQL END");
    }

    /**
     * Connection test if connection is enabled else stop startup.
     */
    static ldap(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starter: LDAP BEGIN");
                await Ldap.bindTest();
                console.log("Starter: LDAP TEST SUCCESS");
                console.log("Starter: LDAP END");
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    static pushNotifications() {
        global.pushNotifications = new PushNotifications();
        if (global.config.pushFrameWorks.telegram.enabled) {
            if (global.pushNotifications.pushTelegram) {
                global.pushNotifications.pushTelegram.startTelegramBot();
            }
        }
    }

    static express() {
        console.log("Starter: EXPRESS BEGIN");
        ExpressServer.launch();
        console.log("Starter: LDAP END");
    }

    static swagger() {
        console.log("Starter: SWAGGER BEGIN");
        if (global.express == null) {
            this.express();
        }
        if (global.config.webServerConfig.apiDocumentation) {
            /**
             * Generate and display Api documentation under host/api-docs/
             */
            const expressSwagger = require('express-swagger-generator')(global.express.expressApp);

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
                message: 'Api documentation available at http://' + global.config.webServerConfig.url + ':' + global.config.webServerConfig.port + '/api-docs/'
            });
        }
        console.log("Starter: SWAGGER END");
    }

    static globalExceptionHandler() {
        process.on('uncaughtException', function (err) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: 'Unhandled Exception trace: ' + err.stack,
                file: path.basename(__filename)
            });
        });
    }

}