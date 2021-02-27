import winston, {format, transports} from "winston";
import {ApiGlobal} from "../types/global";
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

    static init() {
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
    }

}