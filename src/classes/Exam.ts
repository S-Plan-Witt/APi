/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Course} from "./Course";
import {RoomLink} from "./RoomLink";
import {ApiGlobal} from "../types/global";
import path from "path";
import {TimeTable} from "./TimeTable";

declare const global: ApiGlobal;

/**
 * @typedef Exam
 * @property {string} display.required
 * @property {string} date.required
 * @property {Course.model} course.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} teacher.required
 * @property {number} students
 * @property {RoomLink.model} roomLink
 * @property {string} room.required
 * @property {number} id
 * @property {string} uniqueIdentifier
 */
export class Exam {
    public display: boolean;
    public date: string;
    public course: Course;
    public from: string;
    public to: string;
    public teacher: string;
    public students: number;
    public roomLink: RoomLink | null;
    public room: string;
    public id: number;
    public uniqueIdentifier: string;

    constructor(display: boolean, date: string, course: Course, from: string, to: string, teacher: string, students: number, roomLink: RoomLink | null, id: number, uniqueIdentifier: string) {
        this.display = display;
        this.date = date;
        this.course = course;
        this.from = from;
        this.to = to;
        this.teacher = teacher;
        this.students = students;
        this.roomLink = roomLink;
        this.id = id;
        this.uniqueIdentifier = uniqueIdentifier;
        this.room = "";
    }

    static getAll(): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[] = await conn.query("SELECT `exams`.*, `exams_rooms`.room   FROM `exams` LEFT JOIN `exams_rooms` ON `exams`.`roomLink` = `exams_rooms`.id_exam_rooms");
                let exams: Exam[] = [];
                for (let i = 0; i < rows.length; i++) {
                    exams.push(await this.fromSqlRow(rows[i]));
                }
                resolve(exams);
            } catch (err) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get All failed: ' + JSON.stringify(err),
                    file: path.basename(__filename)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    static getByCourse(course: Course): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[] = await conn.query("SELECT * FROM `exams` WHERE `courseId`= ? ", [course.id]);
                let exams: Exam[] = [];
                for (let i = 0; i < rows.length; i++) {
                    exams.push(await this.fromSqlRow(rows[i]));
                }
                resolve(exams);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get by course failed: ' + JSON.stringify(course) + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    static getByTeacher(teacher: string): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[] = await conn.query("SELECT * FROM `exams` WHERE `teacher`= ?", [teacher]);
                let exams: Exam[] = [];
                for (let i = 0; i < rows.length; i++) {
                    exams.push(await this.fromSqlRow(rows[i]));
                }
                resolve(exams);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getUpcomingOnDisplay(): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: any[] = await conn.query("SELECT * FROM `exams` WHERE `visibleOnDisplay`= 1 AND date >= CURRENT_DATE");
                let exams: Exam[] = [];
                for (let i = 0; i < rows.length; i++) {
                    exams.push(await this.fromSqlRow(rows[i]));
                }
                resolve(exams);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static fromSqlRow(row: any): Promise<Exam> {
        return new Promise(async (resolve, reject) => {
            let date = new Date(row["date"]);
            row["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
            let course = await Course.getById(row["courseId"])
            resolve(new Exam(row["visibleOnDisplay"], row["date"], course, row["from"], row["to"], row["teacher"], row["students"], await RoomLink.getById(row["roomLink"]), row["id_exam"], row["uniqueIdentifier"]))
        });
    }

    static getByRoomLink(roomLinkId: number): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: any[] = await conn.query("SELECT * FROM exams where roomLink = ?;", [roomLinkId]);
                let exams: Exam[] = [];
                for (let i = 0; i < rows.length; i++) {
                    exams.push(await this.fromSqlRow(rows[i]));
                }
                resolve(exams);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisors by exam failed: ' + roomLinkId + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getById(id: number): Promise<Exam> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM exams where id_exam= ?;", [id]);
                if (rows.length == 1) {
                    resolve(await this.fromSqlRow(rows[0]));
                }else {
                    reject("Not found")
                }

            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get exam by id failed: ' + id + " Err: " + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    delete(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `exams` WHERE (id_exam = ?);", [this.id]);
                global.logger.log({
                    level: 'silly',
                    label: 'exams',
                    message: 'Deleted: ' + JSON.stringify(this.id),
                    file: path.basename(__filename)
                });
                resolve();
            } catch (err) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Delete failed: ' + JSON.stringify(this.id) + " Err: " + JSON.stringify(err),
                    file: path.basename(__filename)
                });
                reject(err);
            } finally {
                await conn.end();
            }
        });
    }

    save(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            let availRoomLinks: any = await RoomLink.getRoomLinks(this.date, this.room);
            if (availRoomLinks.length === 0) {
                await (new RoomLink(this.room, this.from, this.to, this.date)).save();
            }
            availRoomLinks = await RoomLink.getRoomLinks(this.date, this.room);
            if (availRoomLinks === 0) {
                reject("err");
                return;
            }
            if (this.teacher === undefined) {
                this.teacher = "";
            }
            if (this.students === undefined) {
                this.students = 0;
            }

            if (this.course.id == null) {
                try {
                    this.course = await Course.getByFields(this.course.subject, this.course.grade, this.course.group);
                } catch (e) {
                    reject("Course not found")
                }
            }

            let linkId = availRoomLinks[0]["id_exam_rooms"];
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();

                let uniqueIdentifier = this.course.grade + '-' + this.course.group + '-' + this.course.subject + '-' + this.date;

                let rows = await conn.query('SELECT * FROM exams WHERE uniqueIdentifier=?', [uniqueIdentifier]);
                if (rows.length > 0 && this.id == null) {
                    reject("row exists");
                    return;
                }
                let res;
                if (this.id != null) {
                    res = await conn.query("UPDATE `exams` SET `date` = ?, `courseId` = ?, `visibleOnDisplay` = ?, `from` = ?, `to` = ?, `teacher` = ?,`students` = ? WHERE (id_exam = ?);", [this.date, this.course.id, this.display, this.from, this.to, this.teacher, this.students, this.id]);
                } else {
                    res = await conn.query("INSERT INTO exams (date, courseId, visibleOnDisplay, `from`, `to`, teacher, students, roomLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [this.date, this.course.id, this.display, this.from, this.to, this.teacher, this.students, linkId]);
                }
                resolve(res);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Err: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

}