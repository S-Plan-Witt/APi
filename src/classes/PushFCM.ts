import firebaseAdmin from "firebase-admin";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class PushFCM {
    /**
     * Send a message with FCM to a device
     * @param deviceId
     * @param title
     * @param body
     * @returns Promise resolves on successful send message
     */
    sendPush(deviceId: number, title: string, body: string) {
        return new Promise(async (resolve, reject) => {
            let message: any = {
                notification: {
                    title: title,
                    body: body
                },
                token: deviceId
            };
            try {
                let response = await firebaseAdmin.messaging().send(message);
                global.logger.log({
                    level: 'silly',
                    label: 'FCM',
                    message: 'Successfully send message: ' + JSON.stringify(response)
                });
                resolve(response);
            } catch (e) {
                if (e.code === "messaging/registration-token-not-registered") {
                    //TODO add FCM delete registration
                }
                global.logger.log({
                    level: 'error',
                    label: 'FCM',
                    message: 'Error sending message: ' + JSON.stringify(e)
                });
                reject(e);
            }
        });
    }
}