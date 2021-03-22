/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {User} from "../user/User";
import * as twofactor from 'node-2fa';
import path from "path";
import {ApiGlobal} from "../../types/global";
import {SecondFactor, SecondFactorType} from "./SecondFactor";

declare const global: ApiGlobal;

export class TOTP implements SecondFactor {

    id: number | null;
    privateKey: string;
    type: SecondFactorType = SecondFactorType.TOTP;
    userId: number;
    verified: boolean = false;
    regData: any;

    constructor(id: number | null, privateKey: string, userId: number) {
        this.id = id;
        this.privateKey = privateKey;
        this.userId = userId;
    }

    static new(user: User): Promise<TOTP> {
        return new Promise(async (resolve, reject) => {
            let endpoint = twofactor.generateSecret({name: "S-Plan", account: user.displayName});
            try {
                let totp = new TOTP(null, endpoint.secret, user.id)
                totp.regData = endpoint;
                resolve(totp);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: 'TOTP new failed: ' + JSON.stringify(this) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            }

        });
    }

    static getByUID(id: number): Promise<TOTP> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let result = await conn.query("SELECT * FROM user_secondfactor WHERE type=0 AND user_id=?", [id]);
                if (result.length == 1) {
                    let entity = result[0];
                    let totp = new TOTP(entity.id_secondfactor, entity.totp_key, id);
                    totp.verified = entity.verified;
                    resolve(totp);
                } else {
                    reject("not found")
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: 'TOTP load failed: ' + JSON.stringify(this) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    generateCode(){
        return new Promise(async (resolve, reject) => {
            let token = twofactor.generateToken(this.privateKey);
            resolve(token);
        });
    }

    setVerified(isVerified: boolean) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("UPDATE splan.user_secondfactor t SET t.verified = ? WHERE t.id_secondfactor = ?", [isVerified, this.id]);
                this.verified = isVerified;
                resolve(this);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: 'TOTP verify failed: ' + JSON.stringify(this) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    validateCode(code: string) {
        return new Promise(async (resolve, reject) => {
            let result = twofactor.verifyToken(this.privateKey, code)
            if (result == null) {
                reject("Invalid code");
            } else {
                if (result.delta < 3 && result.delta > -3) {
                    resolve("");
                } else {
                    reject("Invalid code")
                }
            }
        });
    }

    save() {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let result = await conn.query("INSERT INTO user_secondfactor (user_id, totp_key, type) VALUES (?,  ?, ?)", [this.userId, this.privateKey, SecondFactorType.TOTP]);
                this.id = result.insertId;
                resolve(this);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: 'TOTP Save failed: ' + JSON.stringify(this) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    verify(endpoint: string, token: string) {
        return new Promise(async (resolve, reject) => {
            let result = twofactor.verifyToken(endpoint, token);
            if (result != null) {
                resolve(true);
            } else {
                reject("error");
            }
        });
    }

    delete(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM user_secondfactor WHERE id_secondfactor=?", [this.id]);
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'TOTP',
                    message: 'TOTP delete failed: ' + JSON.stringify(this) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}