import Global = NodeJS.Global;
import {Logger} from "winston";
import {Config} from "../classes/config/Config";
import {PushNotifications} from "../classes/PushNotifications";

export interface ApiGlobal extends Global {
    mySQLPool: any,
    logger: Logger,
    config: Config,
    pushNotifications: PushNotifications;
}