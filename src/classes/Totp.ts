/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

import {ApiGlobal} from "../types/global";
import speakeasy from "speakeasy";
import path from "path";

declare const global: ApiGlobal;


export class Totp {

    //TODO add jDoc
    static async saveTokenForUser(token: string, userId: number, alias: string) {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let res = await conn.query("INSERT INTO `totp` (`user_id`, `totp_key`, alias) VALUES (?, ?, ?);", [userId, token, alias]);
                await conn.query("UPDATE users SET twoFactor = 1 WHERE idusers = ?", [userId]);
                if (res.warningStatus === 0) {
                    resolve(res.insertId);
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: '(saveTokenForUser) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });

    }

    //TODO add jDoc
    static async verifyKey(tokenId: number, code: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE id_totp = ?;", [tokenId]);
                if (rows.length !== 1) {

                    reject("Key is not available");
                } else {
                    let key = rows[0]["totp_key"];
                    let valid = speakeasy.totp.verify({
                        secret: key,
                        encoding: 'base32',
                        token: code
                    });

                    if (!valid) {
                        reject("Invalid code");
                        return;
                    }
                    await conn.query("UPDATE totp SET verified = 1 WHERE id_totp = ?", [tokenId]);
                    resolve();
                }

            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: '(verifyKey) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    //TODO add jDoc
    static checkKeyCode(key: string, code: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                speakeasy.totp.verify({token: code.toString(), secret: key});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    //TODO add jDoc
    static verifyUserCode(code: number, userId: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE user_id = ?;", [userId]);
                for (let i = 0; i < rows.length; i++) {
                    if (rows.hasOwnProperty(i)) {
                        let valid = speakeasy.totp.verify({
                            secret: rows[i]["totp_key"],
                            encoding: 'base32',
                            token: code.toString()
                        });
                        if (valid) {
                            resolve();
                            return;
                        }
                    }
                }
                reject();
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    //TODO add jDoc
    static removeById(id: number, userId: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE id_totp = ?;", [id]);
                if (rows.length > 0) {
                    await conn.query("DELETE FROM totp WHERE id_totp = ?", [id]);
                    rows = await conn.query("SELECT * FROM totp WHERE user_id = ?;", [userId]);
                    if (rows.length < 1) {
                        await conn.query("UPDATE users SET twoFactor = 0 WHERE idusers = ?", [userId]);
                    }
                }
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }
}