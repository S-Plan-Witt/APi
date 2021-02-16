/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import http from 'https';
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class SendGrid {

    //TODO add jDoc
    static createMailConfirmation(userId: number, mail: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            let conn;

            try {
                conn = await global.mySQLPool.getConnection();

                let rows = await conn.query("SELECT * FROM users_mails WHERE mail = ?", [mail]);

                if (rows.length > 0) {
                    if (rows[0].userid === userId) {
                        //TODO add where clause
                        //await conn.query("UPDATE splan.users_mails SET token = ?",[token]);
                    } else {
                        reject("assigned to other user");
                    }
                } else {
                    await conn.query("INSERT INTO users_mails (mail, token, userid) VALUES (?, ?, ?)", [mail, token, userId]);
                }

                await conn.end();

                let options = {
                    "method": "POST",
                    "port": 443,
                    "hostname": "api.sendgrid.com",
                    "path": "/v3/mail/send",
                    "headers": {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + global.config.pushFrameWorks.sendGrid.key
                    }
                };

                let req = http.request(options, (res) => {
                    let chunks: any = [];


                    res.on("data", (chunk) => {
                        chunks.push(chunk);
                    });

                    res.on("end", () => {
                        let body = Buffer.concat(chunks);
                        console.log(body.toString())
                    });
                });

                req.write(JSON.stringify({
                    from: {
                        email: 'noreply@nils-witt.de'
                    },
                    personalizations:
                        [
                            {
                                to: [{email: mail}],
                                dynamic_template_data:
                                    {
                                        header: 'Email bestätigen',
                                        text: '',
                                        c2a_link: 'https://splan.nils-witt.de/pages/verify_email.html?token=' + token,
                                        c2a_button: 'Bestätigen'
                                    }
                            }
                        ],
                    template_id: 'd-c59e0ff3ae584fac819950a64ca2e761'
                }));
                req.end();
                resolve();
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}

/**
 * @typedef EMail
 * @property {number} userId.required
 * @property {string} address.required
 * @property {boolean} verified.required
 * @property {Date} dateAdded.required
 * @property {boolean} primary
 */
export class EMail {
    public userId: number;
    public address: string;
    public verified: boolean;
    public dateAdded: any;
    public primary: boolean;

    /**
     *
     * @param userId {Number}
     * @param address {String}
     * @param verified {Boolean}
     * @param dateAdded {Date}
     * @param primary {Boolean}
     */
    constructor(userId: number, address: string, verified: any, dateAdded: any, primary: boolean = false) {
        this.userId = userId;
        this.address = address;
        this.verified = verified;
        this.dateAdded = dateAdded;
        this.primary = primary
    }
}