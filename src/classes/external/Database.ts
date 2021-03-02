/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import mySQL from "mariadb";
import path from "path";
import {ApiGlobal} from "../../types/global";

declare const global: ApiGlobal;

export class Database {

    /**
     * Connects to the database server
     */
    static connect(){

        global.mySQLPool = mySQL.createPool({
            host: global.config.mysqlConfig.hostname,
            port: global.config.mysqlConfig.port,
            user: global.config.mysqlConfig.username,
            password: global.config.mysqlConfig.password,
            connectionLimit: 30,
            collation: "latin1_german2_ci",
            database: global.config.mysqlConfig.database
        });

        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'MySql Connected',
            file: path.basename(__filename)
        });
    }

    /**
     * Deletes all data from the database
     */
    static clear(){
        //TODO implement
    }

    /**
     * Loads the template schema into the database
     */
    static init(){
        //TODO implement
    }

    /**
     * updates the schema version
     */
    static update(){
        //TODO implement
    }
}