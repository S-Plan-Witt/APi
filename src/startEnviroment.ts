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
import {PushNotifications} from "./classes/external/PushNotifications";
import {Ldap} from "./classes/external/Ldap";
import {Database} from "./classes/external/Database";

declare const global: ApiGlobal;

export class Starter {

    /**
     * Starts all necessary services
     */
    static full() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starter: FULL BEGIN");
                this.logger();
                this.config();
                await this.externalServers();
                this.express();
                this.pushNotifications();
                this.globalExceptionHandler();
                console.log("Starter: FULL END");
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Creates the global logger.
     */
    static logger() {
        Logger.init();

        global.logger.log({
            level: 'silly',
            label: 'Express',
            message: 'Logger init success',
            file: path.basename(__filename)
        });
    }

    /**
     * Loads the config
     */
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

    /**
     * Connects all external servers
     */
    static externalServers(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starter: ExSERVER BEGIN");
                this.mysql();
                if(global.config.ldapConfig.enabled){
                    await this.ldap();
                }
                console.log("Starter: ExSERVER END");
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Connects the global mysql connection pool
     */
    static mysql() {
        console.log("Starter: MYSQL BEGIN");
        Database.connect();
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

    /**
     * Starts the push notification services
     */
    static pushNotifications() {
        console.log("Starter: PUSH BEGIN");
        global.pushNotifications = new PushNotifications();
        if (global.config.pushFrameWorks.telegram.enabled) {
            global.pushNotifications.pushTelegram?.startTelegramBot();
        }
        console.log("Starter: PUSH END");
    }

    /**
     * Launches the HTTP Server with the ExpressServer launch method.
     */
    static express() {
        console.log("Starter: EXPRESS BEGIN");
        ExpressServer.init();
        console.log("Starter: EXPRESS INIT DONE");
        this.swagger();
        console.log("Starter: EXPRESS swagger DONE");
        ExpressServer.launch();
        console.log("Starter: EXPRESS END");
    }

    /**
     * Generate and display Api documentation under host/api-docs/
     */
    static swagger() {
        console.log("Starter: SWAGGER BEGIN");
        if (global.config.webServerConfig.apiDocumentation) {

            const expressSwagger = require('express-swagger-generator')(global.express.expressApp);
            let options = {
                swaggerDefinition: {
                    info: {
                        description: 'S-Plan',
                        title: 'S-Plan',
                        version: '2.0.0',
                        author: "Nils WItt"
                    },
                    host: 'localhost:3000',
                    basePath: '',
                    produces: [
                        "application/json"
                    ],
                    schemes: ['https'],
                    securityDefinitions: {
                        JWT: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'Authorization',
                            description: "",
                        }
                    }
                },
                basedir: __dirname,
                files: ['./router/*.js']
            };
            expressSwagger(options)
            global.logger.log({
                level: 'debug',
                label: 'Api-docs',
                message: 'Api documentation available at ' + global.config.webServerConfig.url + ':' + global.config.webServerConfig.port + '/api-docs/'
            });
        }
        console.log("Starter: SWAGGER END");
    }

    /**
     * Starts the global exception handler.
     */
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