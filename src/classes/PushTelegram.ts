import Telegraf from "telegraf";
import {Telegram} from "./Telegram";
import {User} from "./User";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class PushTelegram {
    bot: Telegraf<any>;


    constructor(bot: Telegraf<any>) {
        this.bot = bot;
    }

    startTelegramBot() {
        //Set replay to /start command from TG
        this.bot.start(async (ctx) => {
            let token = await Telegram.createRequest(ctx.update.message.from.id);
            await ctx.reply("Logge dich mit diesem Link ein, um deinen Account zu verknüpfen: https://splan.nils-witt.de/pages/linkTelegram.html?token=" + token);
            global.logger.log({
                level: 'silly',
                label: 'TelegramBot',
                message: 'created Linking token'
            });
        });

        this.bot.command('stop', async (ctx) => {

            await ctx.reply("Gerät wird gelöscht--->---> ");
            try {

                await User.removeDevice(ctx.update.message.from.id.toString());
                await ctx.reply("Abgeschlossen");
                global.logger.log({
                    level: 'silly',
                    label: 'TelegramBot',
                    message: 'deleted Device: ' + ctx.update.message.from.id
                });
            } catch (e) {
                console.log(e);
                await ctx.reply("Es ist ein Fehler aufgetreten");

                global.logger.log({
                    level: 'silly',
                    label: 'TelegramBot',
                    message: 'Error while deleting Device: ' + ctx.update.message.from.id
                });
            }
        });

        //Launch TG replay bot
        this.bot.launch().then(() => {
            global.logger.log({
                level: 'silly',
                label: 'TelegramBot',
                message: 'started'
            });
        });
    }


    /**
     * Send a message with Telegram to a device
     * @param chatID
     * @param body
     * @returns Promise resolves on successful send message
     */
    sendPush(chatID: number, body: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.bot.telegram.sendMessage(chatID, body);
                global.logger.log({
                    level: 'silly',
                    label: 'TelegramPush',
                    message: 'sent message: ' + body + " ;to: " + chatID
                });
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'warn',
                    label: 'TelegramPush',
                    message: 'sent message: ' + body + " ;to: " + chatID + ' Error: ' + JSON.stringify(e)
                });
                reject(e);
            }
        });
    }
}
