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
    public teacherId: number | null;
    public room: string;
    public subject: string;
    public info: string;
    public date: string;

    constructor(id: number | null, course: Course, lesson: Lesson, teacherId: number | null, room: string, subject: string, info: string, date: string) {
        this.id = id;
        this.course = course;
        this.lesson = lesson;
        this.teacherId = teacherId;
        this.room = room;
        this.subject = subject;
        this.info = info;
        this.date = date;
    }

    /**
     * Get replacement lessons by course
     * @param lesson {Lesson}
     * @returns {Promise<ReplacementLesson[]>}
     */
    static getByLesson(lesson: Lesson): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM replacementlessons WHERE lessonId = ?", [lesson.id]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }

        });
    }

    /**
     * Get all replacement Lessons
     * @returns Promise {replacementLessons}
     */
    static getAll(): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM replacementlessons");
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
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
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM `replacementlessons` WHERE `date`= ? ", [date]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }

        });
    }

    /**
     *
     * @param id
     */
    static getById(id: string): Promise<ReplacementLesson> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM `replacementlessons` WHERE `replacementId`= ? ", [id]);
                if (rows.length == 1) {
                    resolve(await this.fromSqlRow(rows[0]));
                } else {
                    reject("Not found");
                }

            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }

        });
    }

    /**
     * returns the entry as object
     * @param entry
     */
    static fromSqlRow(entry: ReplacementLessonSqlRow): Promise<ReplacementLesson> {
        return new Promise(async (resolve) => {
            entry.date = Utils.convertMysqlDate(entry.date)
            let lesson: Lesson = await Lesson.getById(entry.lessonId);

            resolve(new ReplacementLesson(entry.id_replacementlessons, lesson.course, lesson, entry.teacherId, entry.room, entry.subject, entry.info, entry.date));
        });
    }

    /**
     * Add a replacementLesson
     * @param replacementLesson {ReplacementLesson}
     * @returns Promise {String} status
     */
    static add(replacementLesson: ReplacementLesson) {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();

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

                } catch (e: any) {
                    if (e.code === "ER_DUP_ENTRY") {
                        console.log("update Needed");
                    }
                    reject(e)
                }
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    /**
     * Get upcoming replacement lessons
     * @returns Promise {[replacementLessons]}
     */
    static getUpcoming(): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM `replacementlessons` WHERE `date` >= CURRENT_DATE");
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
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
    static getByTeacher(teacherId: number, dateStart: string, dateEnd: string): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM `replacementlessons` WHERE `teacherId` = ? AND `date` >= ? AND `date`<= ?", [teacherId, dateStart, dateEnd]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    static search(info: string) {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: ReplacementLessonSqlRow[] = await conn.query("SELECT * FROM `replacementlessons` WHERE `info` LIKE ? ", [info]);
                let replacementLessons: ReplacementLesson[] = [];
                for (let i = 0; i < rows.length; i++) {
                    replacementLessons.push(await this.fromSqlRow(rows[i]));
                }
                resolve(replacementLessons);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    save() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let result = await conn.query("INSERT INTO replacementlessons (date, subject, room, info, lessonId, teacherId) VALUES (?, ?, ?, ?, ?, ?)", [this.date, this.subject, this.room, this.info, this.lesson.id, this.teacherId]);
                this.id = result.insertId;
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                await conn.query("DELETE FROM replacementlessons WHERE id_replacementlessons=?", [this.id]);
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }

        });
    }
}

type ReplacementLessonSqlRow = {
    id_replacementlessons: number;
    date: string;
    subject: string;
    room: string;
    info: string;
    lessonId: number;
    teacherId: number;
    replacementId: string;
}