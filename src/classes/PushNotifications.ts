import firebaseAdmin from 'firebase-admin';
import webPush from "web-push";
import Telegraf from 'telegraf';
import {ApiGlobal} from "../types/global";
import {PushTelegram} from "./PushTelegram";
import {PushWebPush} from "./PushWebPush";
import {PushFCM} from "./PushFCM";

declare const global: ApiGlobal;


export class PushNotifications {
    pushTelegram: PushTelegram;
    pushWebPush: PushWebPush;
    pushFCM: PushFCM;


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