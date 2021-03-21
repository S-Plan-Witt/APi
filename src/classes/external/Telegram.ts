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
import path from "path";

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
                let rows = await conn.query("SELECT * FROM user_device_verification WHERE `token`= ? ", [token]);
                if (rows.length === 1) {
                    resolve(rows[0].deviceId);
                } else {
                    reject("Token Invalid");
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Telegram',
                    message: '(validateRequestToken) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Revokes a telegram activation token
     * @param token
     * @returns Promise
     */
    static revokeRequest(token: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `user_device_verification` WHERE (`token` = ?);", [token]);
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Telegram',
                    message: '(revokeRequest) error: ' + e,
                    file: path.basename(__filename)
                });
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
                await conn.query("INSERT INTO `user_device_verification` (`deviceId`, `token`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `token`=?;", [telegramId, tokenId, tokenId]);
                resolve(tokenId);
            } catch (e) {
                reject(e)
            } finally {
                await conn.end();
            }
        });
    }
}

module.exports.Telegram = Telegram;