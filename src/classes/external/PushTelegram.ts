/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Telegram} from "./Telegram";
import {ApiGlobal} from "../../types/global";
import {Context, Telegraf} from "telegraf";
import path from "path";
import {Device} from "../Device";

declare const global: ApiGlobal;

export class PushTelegram {
    public bot: Telegraf<any>;

    constructor(bot: Telegraf<any>) {
        this.bot = bot;
    }

    /**
     * Connects to the telegram api and starts all listeners
     */
    startTelegramBot() {
        //TODO promise return
        //Set replay to /start command from TG
        this.bot.start(async (ctx: Context) => {
            let senderId = undefined;
            if ("message" in ctx.update) {
                senderId = ctx.update?.message?.from?.id;
            }
            if (senderId != undefined) {
                let token = await Telegram.createRequest(senderId);
                let messageText = "Logge dich mit diesem Link ein, um deinen Account zu verknüpfen: " + global.config.pushFrameWorks.telegram.validationUrl + "?token=" + token;
                await ctx.reply(messageText);
                global.logger.log({
                    level: 'silly',
                    label: 'TelegramBot',
                    message: 'created Linking token id:' + senderId + " token: " + token,
                    file: path.basename(__filename)
                });
            }
        });

        this.bot.command('stop', async (ctx: Context) => {

            await ctx.reply("Gerät wird gelöscht--->---> ");

            let senderId: number | undefined
            if ("message" in ctx.update) {
                senderId = ctx.update.message?.from?.id;
            }
            try {
                if (senderId != undefined) {
                    await Device.removeDevice(senderId.toString());
                    await ctx.reply("Abgeschlossen");
                    global.logger.log({
                        level: 'silly',
                        label: 'TelegramBot',
                        message: 'deleted Device: ' + senderId,
                        file: path.basename(__filename)
                    });
                }

            } catch (e) {
                await ctx.reply("Es ist ein Fehler aufgetreten");

                global.logger.log({
                    level: 'silly',
                    label: 'TelegramBot',
                    message: 'Error while deleting Device: ' + senderId + ' e: ' + e,
                    file: path.basename(__filename)
                });
            }
        });

        //Launch TG replay bot
        this.bot.launch().then(() => {
            global.logger.log({
                level: 'silly',
                label: 'TelegramBot',
                message: 'started',
                file: path.basename(__filename)
            });
        });
    }


    /**
     * Send a message with Telegram to a device
     * @param chatID
     * @param body
     * @returns Promise resolves on successful send message
     */
    sendPush(chatID: number, body: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.bot.telegram.sendMessage(chatID, body);
                global.logger.log({
                    level: 'silly',
                    label: 'TelegramPush',
                    message: 'sent message: ' + body + " ;to: " + chatID,
                    file: path.basename(__filename)
                });
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'warn',
                    label: 'TelegramPush',
                    message: 'sent message: ' + body + " ;to: " + chatID + ' Error: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            }
        });
    }
}
