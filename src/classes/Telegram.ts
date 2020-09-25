import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;


export class Telegram {
    /**
     * Validates a telegram activation token and returns telegram id
     * @param token {String}
     * @returns Promise {Integer} telegram id
     */

    static validateRequestToken(token: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM telegramLinks WHERE `token`= ? ", [token]);
                if (rows.length === 1) {
                    resolve(rows[0].telegramId);
                } else {
                    reject("Token Invalid");
                }
            } catch (e) {
                console.log(e);
                //TODO add logger
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * revokes a telegram activation token
     * @param token
     * @returns Promise
     */
    static revokeRequest(token: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `telegramLinks` WHERE (`token` = ?);", [token]);
                resolve();
            } catch (e) {
                console.log(e);
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Creates a telegram activation token
     * @param telegramId {Integer} telegram userId
     * @returns Promise {String} token
     */
    static createRequest(telegramId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await conn.query("INSERT INTO `telegramLinks` (`telegramId`, `token`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `token`=?;", [telegramId, tokenId, tokenId]);
                //TODO unique link creation
                resolve(tokenId);
            } catch (e) {
                //TODO add logger
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    static logMessage(chatId: number, message: string, direction: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `TelegramMessages` (`chatId`, `message`, `direction`) VALUES (?, ?, ?)", [chatId, message, direction]);
                resolve();
            } catch (e) {
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }
}



module.exports.Telegram = Telegram;