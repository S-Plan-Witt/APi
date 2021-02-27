/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import winston, {format, transports} from "winston";
import {ApiGlobal} from "../types/global";
import 'winston-daily-rotate-file';

const {combine, timestamp, printf} = format;
import 'winston-daily-rotate-file';

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

declare const global: ApiGlobal;
export class Logger {

    /**
     * creates a logger and sets it into global.logger
     */
    static init() {
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
    }

}