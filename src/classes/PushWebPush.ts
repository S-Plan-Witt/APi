import webPush from "web-push";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class PushWebPush {

    /**
     * Send a message with WebPush to a device
     * @param subscription
     * @param title
     * @param body
     * @returns Promise resolves on successful send message
     */
    sendPush(subscription: any, title: string, body: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await webPush.sendNotification(subscription, JSON.stringify({title: title, body: body}), {});
                global.logger.log({
                    level: 'silly',
                    label: 'WebPush',
                    message: 'sent message: ' + JSON.stringify({
                        title: title,
                        body: body
                    }) + " ;to: " + JSON.stringify(subscription)
                });
                resolve();
            } catch (e) {
                //TODO add logger
                reject(e);
            }
        });
    }

    /**
     * Delete a subscription from DB
     * @param endpoint
     * @returns Promise resolves true if deleted
     */
    deleteSubscription(endpoint: any) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `devices` WHERE (`deviceID` LIKE ?);", ['%' + endpoint + '%']);
                //TODO add logger
                resolve();
            } catch (e) {
                //TODO add logger
                reject();
            } finally {
                await conn.end();
            }
        });
    }
}