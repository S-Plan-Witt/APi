/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {exec} from 'child_process';


export class Database {


    static init() {
        let host = process.env.SQL_HOST;
        let port = process.env.SQL_PORT;
        let user = process.env.SQL_USER;
        let password = process.env.SQL_PASS;
        let db = process.env.SQL_DB;
        return new Promise(async (resolve, reject) => {
            try {
                exec('mysql -h ' + host + ' -P ' + port + ' -u ' + user + ' --password=' + password + ' ' + db + ' < setup.sql', (err) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        reject("Error: " + err);
                        return;
                    }

                    resolve("Done");
                    console.log("DB init done");
                });
            } catch (e) {
                console.log("DB init failed");
                //console.log(e);
            }

        });
    }

}

module.exports.Database = Database;