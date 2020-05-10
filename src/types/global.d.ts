import Global = NodeJS.Global;
import {Logger} from "winston";
export interface ApiGlobal extends Global {
    mySQLPool: any,
    logger: Logger
}