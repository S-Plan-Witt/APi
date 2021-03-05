/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {User} from "../user/User";
import path from "path";
import {ApiGlobal} from "../../types/global";

import{} from 'twilio'

declare const global: ApiGlobal;

export class Authy {
    authyInstance = require('authy')(global.config.authy.apiKey);

    registerUser(user: User, email: string, phone: string, countryCode: string) {
        let authy = this.authyInstance;
        return new Promise(async (resolve, reject) => {
            authy.register_user(email, phone, countryCode, async (regErr: any, regRes: { user: { id: any; }; }) => {
                console.log('In Registration...');
                if (regErr) {
                    console.log(regErr);
                    reject(regErr);
                } else if (regRes) {
                    console.log(regRes);
                    await this.saveUser(user.id, regRes.user.id);
                    resolve(regRes.user.id)
                }
            });
        });
    }

    verifyRequest(id: number, token: number): Promise<void> {
        let authy = this.authyInstance;
        return new Promise(async (resolve, reject) => {
            authy.verify(id, token, (verifyErr: any, verifyRes: any) => {
                console.log('In Verification...');
                if (verifyErr) {
                    console.log(verifyErr);
                    reject(verifyErr)
                } else if (verifyRes) {
                    console.log(verifyRes);
                    resolve();
                }
            });
        });
    }

    saveUser(userId: number, authyId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `user_secondfactor` (user_id, totp_key) VALUES (?, ?)", [userId, authyId]);
                resolve(true);
            } catch (e) {
                reject(e);
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: Device; Function: addDevice: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
            } finally {
                await conn.end();
            }
        });

    }
}