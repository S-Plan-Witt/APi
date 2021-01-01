/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;


//TODO split exports and functions
module.exports = {
    set: async function (id: number, aufsicht: any) {
        let date = aufsicht.date;
        let time = aufsicht.time;
        let location = aufsicht.location;
        let teacher = aufsicht.teacher;

        let conn;
        try {
            conn = await global.mySQLPool.getConnection();
            await conn.query("UPDATE `data_aufsichten` SET `date` = ?, `time`= ?, `location`= ?, `teacher`= ? WHERE (`iddata_aufsichten` = ?);", [date, time, location, teacher, id]);
            return true;
        } catch (err) {
            console.log(err);
            return false;
        } finally {
            await conn.end();
        }
    },
    add: async function (aufsicht: any) {

        let date = aufsicht.date;
        let time = aufsicht.time;
        let location = aufsicht.location;
        let teacher = aufsicht.teacher;

        let conn;

        try {
            conn = await global.mySQLPool.getConnection();
            await conn.query("INSERT INTO `data_aufsichten` (`date`,`time`, `teacher`, `location`) VALUES (?, ?, ?, ?);", [date, time, location, teacher]);
            return true;
        } catch (err) {
            console.log(err);
            return false;
        } finally {
            await conn.end();
        }

    },
    delete: async function (id: any) {
        let conn;
        try {
            conn = await global.mySQLPool.getConnection();
            const rows = await conn.query("DELETE FROM `data_aufsichten` WHERE (`iddata_aufsichten` = ?);", [id]);
            if (rows.affectedRows > 0) {
                console.log("deleted");
            } else {
                console.log("not found")
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        } finally {
            await conn.end();
        }
    },
    getAll: async function () {
        let conn;
        try {
            conn = await global.mySQLPool.getConnection();
            return await conn.query("SELECT *  FROM `data_aufsichten`");

        } catch (err) {
            console.log(err);
            return false;
        } finally {
            await conn.end();
        }
    }
};