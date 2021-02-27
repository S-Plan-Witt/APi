/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "../../types/global";
import {PushTelegram} from "./PushTelegram";
import {PushWebPush} from "./PushWebPush";
import {PushFCM} from "./PushFCM";
import {Telegraf} from "telegraf";
import path from "path";
import {Device, DeviceType} from "../Device";
import {PushSendGrid} from "./PushSendGrid";

declare const global: ApiGlobal;


export class PushNotifications {
    public pushTelegram: PushTelegram | undefined;
    public pushWebPush: PushWebPush | undefined;
    public pushFCM: PushFCM | undefined;
    public pushSendGrid: PushSendGrid | undefined;

    constructor() {
        if (global.config.pushFrameWorks.fcm.enabled) {
            this.pushFCM = new PushFCM();
        }
        if (global.config.pushFrameWorks.telegram.enabled) {
            this.pushTelegram = new PushTelegram(new Telegraf(global.config.pushFrameWorks.telegram.key));
        }
        if (global.config.pushFrameWorks.webPush.enabled) {
            this.pushWebPush = new PushWebPush();
        }
        if (global.config.pushFrameWorks.sendGrid.enabled) {
            this.pushSendGrid = new PushSendGrid();
        }
    }

    /**
     * Handler for all push subscriptions. Determines with service handles message
     * @param endpoint {Device}
     * @param title
     * @param message
     * @returns Promise resolves when push is send
     */
    send(endpoint: Device, title: any, message: any): Promise<void> {
        let pushFCM = this.pushFCM;
        let pushWebPush = this.pushWebPush;
        let pushTelegram = this.pushTelegram;
        return new Promise(async (resolve, reject) => {
            try {

                if (endpoint.platform === DeviceType.FIREBASE) {
                    try {
                        if (pushFCM != undefined) {
                            await pushFCM.sendPush(parseInt(endpoint.deviceIdentifier), title, message);
                            resolve();
                        } else {
                            console.log("FCM offline - no push")
                            resolve();
                        }

                    } catch (e) {
                        console.log(e)
                        reject(e);
                    }
                } else if (endpoint.platform === DeviceType.WEBPUSH) {
                    try {
                        if (pushWebPush != undefined) {
                            await pushWebPush.sendPush(JSON.parse(endpoint.deviceIdentifier), title, message);
                        } else {
                            console.log("WebPush offline - no push")
                        }
                        resolve();
                    } catch (e) {
                        if (e.statusCode === 410 || e.statusCode === 403) {
                            if (pushWebPush != undefined) {
                                await pushWebPush.deleteSubscription(e.endpoint);
                                resolve();
                            } else {
                                reject("WP Push Offline")
                            }
                            return;
                        }
                        console.log(e)
                        reject(e);
                    }
                } else if (endpoint.platform === DeviceType.TELEGRAM) {
                    try {
                        if (pushTelegram != undefined) {
                            await pushTelegram.sendPush(parseInt(endpoint.deviceIdentifier), title + ": " + message);
                            resolve();
                        } else {
                            console.log("TelegramBot offline - no push")
                            resolve();
                        }
                    } catch (e) {
                        console.log(e)
                        reject();
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Similar to send() but accepts a Array of recipient devices
     * @param devices
     * @param title
     * @param message
     */
    sendBulk(devices: any, title: any, message: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                for (let id in devices) {
                    if (devices.hasOwnProperty(id)) {

                        let device = devices[id];
                        try {
                            await this.send(device, title, message);
                        } catch (e) {
                            global.logger.log({
                                level: 'error',
                                label: 'PushNotifications',
                                message: '(sendBulk) error: ' + e,
                                file: path.basename(__filename)
                            });
                        }
                    }
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
}