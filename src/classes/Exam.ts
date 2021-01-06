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

declare const global: ApiGlobal;

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

    /**
     * @returns {Promise<Exam[]>}
     */
    static getAll(): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT `data_exams`.*, `data_exam_rooms`.room   FROM `data_exams` LEFT JOIN `data_exam_rooms` ON `data_exams`.`roomLink` = `data_exam_rooms`.`iddata_exam_rooms`");
                resolve(await this.sqlRowToArray(rows));
            } catch (err) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get All failed: ' + JSON.stringify(err)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @param course {Course}
     * @returns {Promise<Exam[]>}
     */
    static getByCourse(course: Course): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_exams` WHERE `subject`= ? AND `grade`= ? AND `group`= ?", [course.subject, course.grade, course.group]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get by course failed: ' + JSON.stringify(course) + " Err: " + JSON.stringify(e)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static getByTeacher(teacher: string): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_exams` WHERE `teacher`= ?", [teacher]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                //TODO add logger
                reject(e);

            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static sqlRowToArray(rows: any): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let data: Exam[] = [];
            for (let i = 0; i < rows.length; i++) {
                let element = rows[i];
                let date = new Date(element["date"]);
                element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                data.push(new Exam(element["visibleOnDisplay"], element["date"], new Course(element["grade"], element["subject"], element["group"]), element["from"], element["to"], element["teacher"], element["students"], await RoomLink.getById(element["roomLink"]), element["iddata_klausuren"], element["uniqueIdentifier"]))
            }
            resolve(data);
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static getByRoomLink(roomLinkId: number): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM data_exams where roomLink = ?;", [roomLinkId]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisors by exam failed: ' + roomLinkId + " Err: " + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<void>}
     */
    delete(): Promise<void> {
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `data_exams` WHERE (`iddata_klausuren` = ?);", [id]);
                global.logger.log({
                    level: 'silly',
                    label: 'exams',
                    message: 'Deleted: ' + JSON.stringify(id)
                });
                resolve();
            } catch (err) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Delete failed: ' + JSON.stringify(id) + " Err: " + JSON.stringify(err)
                });
                reject(err);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    save(): Promise<boolean> {
        let date = this.date;
        let from = this.from;
        let to = this.to;
        let grade = this.course.grade;
        let subject = this.course.subject;
        let group = this.course.group;
        let teacher = this.teacher;
        let students = this.students;
        let show = this.display;
        let room = this.room;
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let avilRoomLinks: any = await RoomLink.getRoomLinks(date, room);
            if (avilRoomLinks.length === 0) {
                await RoomLink.add(new RoomLink(room, from, to, date));
            }
            avilRoomLinks = await RoomLink.getRoomLinks(date, room);
            if (avilRoomLinks === 0) {
                reject("err");
                return;
            }
            if (teacher === undefined) {
                teacher = "";
            }
            if (students === undefined) {
                students = 0;
            }

            let linkId = avilRoomLinks[0]["iddata_exam_rooms"];
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();

                let uniqueIdentifier = grade + '-' + group + '-' + subject + '-' + date;

                let rows = await conn.query('SELECT * FROM data_exams WHERE uniqueIdentifier=?', [uniqueIdentifier]);
                if (rows.length > 0 && id == null) {
                    reject("row exists");
                    return;
                }
                let res;
                if (id != null) {
                    res = await conn.query("UPDATE `data_exams` SET `date` = ?, `subject` = ?, `grade` = ?, `group` = ?, `visibleOnDisplay` = ?, `from` = ?, `to` = ?, `teacher` = ?,`students` = ? WHERE (`iddata_klausuren` = ?);", [date, subject, grade, group, show, from, to, teacher, students, id]);
                } else {
                    res = await conn.query("INSERT INTO data_exams (date, subject, grade, `group`, visibleOnDisplay, `from`, `to`, teacher, students, roomLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [date, subject, grade, group, show, from, to, teacher, students, linkId]);
                }
                resolve(res);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Err: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

}