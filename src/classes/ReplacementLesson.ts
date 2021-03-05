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
import {Lesson} from "./Lesson";
import {Utils} from "./Utils";
import {TimeTable} from "./TimeTable";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

/**
 * @typedef ReplacementLesson
 * @property {number} id
 * @property {Course.model} course.required
 * @property {Lesson.model} lesson.required
 * @property {string} newTeacher.required
 * @property {string} newRoom.required
 */
export class ReplacementLesson {
    public id: number | null;
    public course: Course;
    public lesson: Lesson;
    public teacherId: number;
    public room: string;
    public subject: string;
    public info: string;
    public date: string;

    constructor(id: number | null, course: Course, lesson: Lesson, teacherId: number, room: string, subject: string, info: string, date: string) {
        this.id = id;
        this.course = course;
        this.lesson = lesson;
        this.teacherId = teacherId;
        this.room = room;
        this.subject = subject;
        this.info = info;
        this.date = date;
    }


    save(){
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let result = await conn.query("INSERT INTO replacementlessons (date, subject, room, info, lessonId, teacherId) VALUES (?, ?, ?, ?, ?, ?)", [this.date, this.subject, this.room, this.info,this.lesson.id,this.teacherId]);
                this.id = result.insertId;
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    delete(){
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM replacementlessons WHERE id_replacementlessons=?", [this.id]);
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Get replacement lessons by course
     * @param course {course}
     * @returns {Promise<ReplacementLesson[]>}
     */
    static getByCourse(course: Course): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT replacementlessons.id_replacementlessons, replacementlessons.date, replacementlessons.subject, replacementlessons.room, replacementlessons.info, replacementlessons.lessonId, replacementlessons.teacherId AS replacementTeacherId, replacementlessons.replacementId, lessons.weekday, lessons.room AS lessonRoom, lessons.lesson, lessons.id_lessons FROM replacementlessons LEFT JOIN lessons ON replacementlessons.lessonId = lessons.id_lessons LEFT JOIN courses ON lessons.courseId = courses.id_courses WHERE courses.grade = ? AND courses.subject = ? AND  courses.`group` = ?", [course.grade, course.subject, course.group]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    let entry = await ReplacementLesson.convertSqlRowsToObjects(rows)
                    replacementLessons.push(entry);
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Get all replacement Lessons
     * @returns Promise {replacementLessons}
     */
    static getAll(): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM replacementlessons");
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    let entry = await ReplacementLesson.convertSqlRowsToObjects(rows)
                    replacementLessons.push(entry);
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get all replacement lessons within the specified time frame
     * @param date {String}
     * @returns Promise {replacementLessons}
     */
    static getByDate(date: string): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `replacementlessons` WHERE `date`= ? ", [date]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    let entry = await ReplacementLesson.convertSqlRowsToObjects(rows)
                    replacementLessons.push(entry);
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     *
     * @param id
     */
    static getById(id: number): Promise<ReplacementLesson> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `replacementlessons` WHERE `replacementId`= ? ", [id]);
                resolve(await ReplacementLesson.convertSqlRowsToObjects(rows));
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * returns the entry as object
     * @param entry
     */
    static convertSqlRowsToObjects(entry: any): Promise<ReplacementLesson> {
        return new Promise(async (resolve, reject) => {

            entry["date"] = Utils.convertMysqlDate(entry["date"])
            let lesson: Lesson = await Lesson.getById(entry["lessonId"].toString());
            let replacementLessons: ReplacementLesson[] = [];

            resolve(new ReplacementLesson(entry["iddata_vertretungen"], lesson.course, lesson, entry["teacherId"], entry["room"], entry["subject"], entry["info"], entry["date"]));
        });
    }

    /**
     * Add a replacementLesson
     * @param replacementLesson {ReplacementLesson}
     * @returns Promise {String} status
     */
    static add(replacementLesson: ReplacementLesson) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {

                try {
                    let rows = await conn.query("INSERT INTO `replacementlessons` (`date`, `lessonId`, `subject`, `teacherId`, `room`, `info`) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject = ?, teacherId = ?, room = ?, info = ?"
                        , [replacementLesson.date, replacementLesson.lesson.id, replacementLesson.subject, replacementLesson.teacherId, replacementLesson.room, replacementLesson.info, replacementLesson.subject, replacementLesson.teacherId, replacementLesson.room, replacementLesson.info]);
                    if (rows.insertId > 0) {
                        resolve("added");
                    } else if (rows.insertId === 0) {
                        resolve("updated");
                    } else {
                        resolve(rows)
                    }

                } catch (e) {
                    if (e.code === "ER_DUP_ENTRY") {
                        console.log("update Needed");
                    }
                    reject(e)
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get replacement lessons by teacher
     * @param teacherId {number}
     * @param dateStart {String}
     * @param dateEnd {String}
     * @returns Promise {[replacementLessons]}
     */
    static getByTeacher(teacherId: number, dateStart: string, dateEnd: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `replacementlessons` WHERE `teacherId` = ? AND `date` >= ? AND `date`<= ?", [teacherId, dateStart, dateEnd]);
                resolve(await ReplacementLesson.convertSqlRowsToObjects(rows));
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static search(info: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `replacementlessons` WHERE `info` LIKE ? ", [info]);
                resolve(await ReplacementLesson.convertSqlRowsToObjects(rows));
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}