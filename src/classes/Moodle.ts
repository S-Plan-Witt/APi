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

export class Moodle {

    //TODO add jDoc
    static apiRequest(wsToken: string, host: string, wsfunction: string, parameters: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let options = {
                'method': 'GET',
                'hostname': host,
                'path': '/webservice/rest/server.php?wstoken=' + wsToken + '&wsfunction=' + wsfunction + '&moodlewsrestformat=json&' + parameters,
                'headers': {}
            };

            let req = https.request(options, (res) => {
                let chunks: any = [];

                res.on("data", (chunk: any) => {
                    chunks.push(chunk);
                });

                res.on("end", (chunk: any) => {
                    let body = Buffer.concat(chunks);
                    resolve(body.toString())
                });

                res.on("error", (error: Error) => {
                    console.error(error);
                    reject(error);
                });
            });

            req.end();
        });
    }

    /**
     *
     * @param id {int}
     */
    static getUserById(id: number) {
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_get_users", "criteria[0][key]=id&criteria[0][value]=" + id.toString())
            }
        });

    }

    //TODO add jDoc
    static getUserByUsername(username: string) {
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_get_users", "criteria[0][key]=username&criteria[0][value]=siks" + username)
            }
        });
    }

    /**
     * @param id {int}
     */
    static deleteUserById(id: number) {
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_delete_users", "userids[0]=" + id);
                if (result === "null") {
                    console.log("success")
                } else {
                    console.log(result)
                }
            }
        });
    }

    /**
     *
     * @param username {String}
     * @param firstname {String}
     * @param lastname {String}
     * @param mail {String}
     */
    static createUser(username: string, firstname: string, lastname: string, mail: string) {
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let response: string = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_create_users", '&users[0][auth]=ldap&users[0][username]=' + username + '&users[0][firstname]=' + firstname + '&users[0][lastname]=' + lastname + '&users[0][email]=' + mail)
                let data = JSON.parse(response);
                if (data.length === 1) {
                    if (data[0].hasOwnProperty("id")) {
                        console.log(data[0]["id"]);
                        resolve(data[0]["id"]);
                        return;
                    }
                }
            }
            reject("err");
            return;
        });
    }

    /**
     *
     * @param id {int}
     * @param mail {String}
     */
    static updateEmailById(id: number, mail: string) {
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_update_users", "users[0][id]=" + id + "&users[0][email]=" + mail)
            }
        });
    }
}