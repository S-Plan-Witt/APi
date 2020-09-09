import Global = NodeJS.Global;
import {Logger} from "winston";
import {Config} from "../classes/config/Config";

export interface ApiGlobal extends Global {
    mySQLPool: any,
    logger: Logger,
    config: Config
}