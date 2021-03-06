/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import webPush from "web-push";
import {ApiGlobal} from "../../types/global";

declare const global: ApiGlobal;

export class PushWebPush {

    constructor() {
        webPush.setVapidDetails(
            global.config.pushFrameWorks.webPush.vapid_subject,
            global.config.pushFrameWorks.webPush.vapid_public,
            global.config.pushFrameWorks.webPush.vapid_private
        );
    }

    /**
     * Send a message with WebPush to a device
     * @param subscription
     * @param title
     * @param body
     * @returns Promise resolves on successful send message
     */
    sendPush(subscription: any, title: string, body: string): Promise<void> {
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
                reject(e);
            }
        });
    }

    /**
     * Delete a subscription from DB
     * @param endpoint
     * @returns Promise resolves true if deleted
     */
    deleteSubscription(endpoint: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `devices` WHERE (deviceIdentifier LIKE ?);", ['%' + endpoint + '%']);
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}