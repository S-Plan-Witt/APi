/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import firebaseAdmin from "firebase-admin";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class PushFCM {


    constructor() {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(require(global.config.pushFrameWorks.fcm.certPath)),
            databaseURL: global.config.pushFrameWorks.fcm.host
        });
    }

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