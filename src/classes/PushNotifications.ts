/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import firebaseAdmin from 'firebase-admin';
import webPush from "web-push";
import {ApiGlobal} from "../types/global";
import {PushTelegram} from "./PushTelegram";
import {PushWebPush} from "./PushWebPush";
import {PushFCM} from "./PushFCM";
import {Telegraf} from "telegraf";

declare const global: ApiGlobal;


export class PushNotifications {
    public pushTelegram: PushTelegram;
    public pushWebPush: PushWebPush;
    public pushFCM: PushFCM;

    constructor() {
        this.pushWebPush = new PushWebPush();
        this.pushFCM = new PushFCM();

        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(require(global.config.pushFrameWorks.firebaseCertificatePath)),
            databaseURL: "https://fir-plan-194f7.firebaseio.com"
        });

        webPush.setVapidDetails(
            "https://splan.nils-witt.de",
            global.config.pushFrameWorks.vapidKeyPublic,
            global.config.pushFrameWorks.vapidKeyPrivate
        );
        this.pushTelegram = new PushTelegram(new Telegraf(global.config.pushFrameWorks.telegramBotToken));
    }

    /**
     * Handler for all push subscriptions. Determines with service handles message
     * @param type
     * @param deviceInfo
     * @param title
     * @param message
     * @returns Promise resolves when push is send
     */
    send(type: any, deviceInfo: any, title: any, message: any): Promise<void> {
        let pushFCM = this.pushFCM;
        let pushWebPush = this.pushWebPush;
        let pushTelegram = this.pushTelegram;
        return new Promise(async (resolve, reject) => {
            try {

                if (type === "FCM") {
                    try {
                        await pushFCM.sendPush(deviceInfo, title, message);
                        resolve();
                    } catch (e) {
                        reject();
                    }
                } else if (type === "WP") {
                    try {
                        await pushWebPush.sendPush(JSON.parse(deviceInfo), title, message);
                        resolve();
                    } catch (e) {
                        if (e.statusCode === 410 || e.statusCode === 403) {
                            await pushWebPush.deleteSubscription(e.endpoint);
                            resolve();
                            return;
                        }
                        reject(e);
                    }
                } else if (type === "TG") {
                    try {
                        await pushTelegram.sendPush(deviceInfo, title + ": " + message);
                        resolve();
                    } catch (e) {
                        reject();
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    //TODO add jDoc
    sendBulk(devices: any, title: any, message: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                for (let id in devices) {
                    if (devices.hasOwnProperty(id)) {
                        let device = devices[id];
                        let type = device.platform;
                        let deviceInfo = device.device;
                        try {
                            await this.send(type, deviceInfo, title, message);
                        } catch (e) {
                            console.log(e);
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