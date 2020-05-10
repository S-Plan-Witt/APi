import http from 'https';

import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class SendGrid {
    static createMailConfirmation (userId: number,mail: string): Promise<never> {

        return new Promise(async (resolve, reject) => {
            let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            let conn;
            try {
                conn = await pool.getConnection();

                let rows = await conn.query("SELECT * FROM splan.users_mails WHERE mail = ?",[mail]);

                if(rows.length >0){
                    if(rows[0].userid == userId){
                        //TODO add where clause
                        //await conn.query("UPDATE splan.users_mails SET token = ?",[token]);
                    }else {
                        reject("assigned to other user");
                    }
                }else {
                    await conn.query("INSERT INTO splan.users_mails (mail, token, userid) VALUES (?, ?, ?)",[mail, token, userId]);
                }

                await conn.end();

                let options = {
                    "method": "POST",
                    "port": 443,
                    "hostname": "api.sendgrid.com",
                    "path": "/v3/mail/send",
                    "headers": {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + process.env.API_SENDGRID
                    }
                };

                let req = http.request(options, function (res) {
                    let chunks: any = [];


                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on("end", function () {
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
                                        c2a_link: 'https://splan.nils-witt.de/pages/verify_email.html?token='+ token,
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
                if (conn) await conn.end();
                reject(e);
            }
        });
    }

    static async test(){
        try {
            await SendGrid.createMailConfirmation(2,'nils@nils-witt.de');

        } catch (e) {

        }
    }
}

export class EMails {

}

export class EMail {
    userId: number;
    address: string;
    status: any;
    dateAdded: any;

    /**
     *
     * @param userId
     * @param address
     * @param status
     * @param dateAdded
     */
    constructor(userId: number, address: string, status: any, dateAdded: any) {
        this.userId = userId;
        this.address = address;
        this.status = status;
        this.dateAdded = dateAdded;
    }
}