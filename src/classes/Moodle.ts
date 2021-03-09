/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import https from 'https';
import {User} from "./user/User";
import {ReplacementLesson} from "./ReplacementLesson";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class Moodle {

    static apiRequest(mFunction: string, parameters: any): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let options = {
                'method': 'GET',
                'hostname': global.config.moodleConfig.host,
                'path': global.config.moodleConfig.path + '/webservice/rest/server.php?wstoken=' + global.config.moodleConfig.token + '&wsfunction=' + mFunction + '&moodlewsrestformat=json&' + parameters,
                'headers': {}
            };

            let req = https.request(options, (res) => {
                let chunks: any = [];

                res.on("data", (chunk: any) => {
                    chunks.push(chunk);
                });

                res.on("end", (chunk: any) => {
                    let body = Buffer.concat(chunks);
                    resolve(JSON.parse(body.toString()));
                });

                res.on("error", (error: Error) => {
                    console.error(error);
                    reject(error);
                });
            });

            req.end();
        });
    }

    static createUser(user: User): Promise<MoodleCreateResponse> {
        return new Promise(async (resolve, reject) => {
            let params = `users[0][username]=${user.username}&users[0][auth]=ldap&users[0][firstname]=${user.firstName}&users[0][lastname]=${user.lastName}&users[0][email]=${user.username}@netman.lokal`

            let res: MoodleResponse = <any>await this.apiRequest(MoodleFunctions.CREATE_USER, params);
            if (!res.exception) {
                let mUser: MoodleCreateResponse = (<any>res)[0];
                await this.saveMapping(user.id, mUser.id)
                resolve(mUser);
            } else {
                reject("Error: " + res.exception);
            }
        });
    }

    static delete(mUID: number) {
        return new Promise(async (resolve, reject) => {
            let params = `userids[0]=${mUID}`
            let res = await this.apiRequest(MoodleFunctions.DELETE_USER, params);

            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM user_moodleaccounts WHERE moodleid=?", [mUID]);
                resolve(res);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static find(username: string) {
        return new Promise(async (resolve, reject) => {
            let params = `field=username&values[0]=${username}`

            let res: MoodleUser[] | MoodleResponse = <any>await this.apiRequest(MoodleFunctions.SEARCH_USER, params);
            if (res.hasOwnProperty('exception')) {
                reject("Error: " + res);
            } else {
                resolve(res);
            }

        });
    }

    static saveMapping(userId: number, moodleId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("INSERT INTO user_moodleaccounts (userid, moodleid) VALUES (?,?)", [userId, moodleId]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await ReplacementLesson.convertSqlRowToObjects(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getUidByUserId(userId: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM user_moodleaccounts WHERE userid=?", [userId]);

                if (rows.length > 0) {
                    resolve(rows[0].moodleid);
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}

enum MoodleFunctions {
    CREATE_USER = "core_user_create_users",
    SEARCH_USER = "core_user_get_users_by_field",
    DELETE_USER = "core_user_delete_users",
}

export class MoodleResponse {
    exception: string = "";
    errorcode: string = "";
    message: string = "";
    debuginfo: string = ""
}

export class MoodleCreateResponse extends MoodleResponse {
    username: string = "";
    id: number = 0;
}

export class MoodleUser extends MoodleResponse {
    username: string = "";
    id: number = 0;
    auth: string = "";
}