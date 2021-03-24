/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "../../types/global";
import {Exam} from "../Exam";
import path from "path";
import {User} from "./User";

declare const global: ApiGlobal;

/**
 * @typedef Supervisor
 * @property {string} displayName.required
 * @property {string} lastName.required
 * @property {string} firstName.required
 * @property {string} username.required
 * @property {number} id
 */
export class Supervisor {
    name: string;
    from: string;
    to: string;


    constructor(name: string, from: string, to: string) {
        this.name = name;
        this.from = from;
        this.to = to;
    }

    static fromSqlRow(row: SupervisorSqlRow): Promise<Supervisor> {
        return new Promise(async (resolve, reject) => {

            resolve(new Supervisor((await User.getById(row.teacherId)).username, row.from, row.to));
        });
    }


    /**
     * @param id
     * @returns {Promise<Supervisor[]>}
     */
    static getByRoomLink(id: number): Promise<Supervisor[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: SupervisorSqlRow[] = await conn.query("SELECT * FROM `exams_supervisors` LEFT JOIN `users` ON `exams_supervisors`.`teacherId` = `users`.id_users WHERE `RoomLink`= ?", [id]);
                let data: Supervisor[] = [];

                for (let i = 0; i < rows.length; i++) {
                    data.push(await this.fromSqlRow(rows[i]));
                }
                resolve(data);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisors by exam failed: ' + id + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @param id
     * @returns {Promise<Supervisor>}
     */
    static getById(id: number): Promise<Supervisor> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT `exams_supervisors`.*,`users`.*, `exams_rooms`.`room`, `exams_rooms`.`date` FROM `exams_supervisors` LEFT JOIN `users` ON `exams_supervisors`.`TeacherId` = `users`.id_users LEFT JOIN `exams_rooms` ON `exams_supervisors`.`RoomLink` = `exams_rooms`.id_exam_rooms WHERE id_exam_supervisor= ?", [id]);
                if (rows.length > 0) {
                    let date = new Date(rows[0]["date"]);
                    rows[0]["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    rows[0]["exams"] = await Exam.getByRoomLink(rows[0]["RoomLink"]);
                    resolve(rows[0]);
                } else {
                    reject("no row");
                }

            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisor by id failed: ' + id + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}

type SupervisorSqlRow = {
    id_exam_supervisor: number;
    RoomLink: number;
    teacherId: number;
    from: string;
    to: string;
}