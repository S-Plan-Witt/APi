/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import express, {Express, NextFunction, Request, Response} from "express";
import {ApiGlobal} from "../types/global";
import path from "path";
import {JWTInterface} from "./JWTInterface";
import {router} from "../router/mainRouter";

declare const global: ApiGlobal;

/**
 * Class ExpressServer: Handles all http- server functionality.
 */
export class ExpressServer {
    expressApp: Express;
    static instance : ExpressServer;

    constructor() {
        this.expressApp = express();
        this.startUp();
    }

    static init() {
        this.instance = new ExpressServer();
    }

    static launch(){
        this.instance.exposeServer();
    }

    /**
     * Initialises and exposes the server
     */
    startUp() {
        global.express = this;
        this.initHeaders();
        this.initMiddleware();
        this.initRouter();

    }

    /**
     * Loads all router scripts
     */
    initRouter() {

        this.expressApp.use("/", require('../router/mainRouter').router);
    }

    /**
     * Sets the response header
     */
    initHeaders() {
        this.expressApp.use(header);
    }

    /**
     * Loads all global middleware
     */
    initMiddleware() {

        this.expressApp.use(reqLogger);
        /**
         * Add Function to validate request auth Headers
         */
        this.expressApp.use(JWTInterface.checkToken);
        /**
         * Add parser for request payload in json format with a max size of 50mb
         */
        this.expressApp.use(express.json({limit: '50mb'}));
    }

    /**
     * Exposes the server
     */
    exposeServer(){
        /**
         * Start HTTP Server to listen for in-bound requests
         */
        this.expressApp.listen(global.config.webServerConfig.port, () => {
            global.logger.log({
                level: 'silly',
                label: 'Express',
                message: 'Listening on port: ' + global.config.webServerConfig.port,
                file: path.basename(__filename)
            });
        });
    }
}

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

/**
 * Function to set on a response headers for compatibility with client JS
 * @param req
 * @param res
 * @param next
 */
const header = (req: Request, res: Response, next: NextFunction) => {
    let origin = global.config.pwaConfig.url;

    if(req.header("Origin") == global.config.displayConfig.url){
        origin = global.config.displayConfig.url;
    }

    res.set({
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'
    });
    next();
};