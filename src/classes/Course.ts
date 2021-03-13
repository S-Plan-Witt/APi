/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Device} from "./Device";
import path from "path";
import {ApiGlobal} from "../types/global";
import assert from "assert";
import {Lesson} from "./Lesson";
import {Exam} from "./Exam";

declare const global: ApiGlobal;

/**
 * @typedef Course
 * @property {string} grade.required
 * @property {string} subject.required
 * @property {string} group.required
 * @property {string} exams
 * @property {number} id
 * @property {number} teacherId
 */
export class Course {
    public grade: string;
    public subject: string;
    public group: string;
    public exams: boolean;
    public id: number | null;
    public teacherId: number | null;
    public moodleId: number | null;

    /**
     * @param grade {String}
     * @param subject {String}
     * @param group {String}
     * @param exams {boolean}
     * @param id {number}
     * @param teacherId {number}
     * @param moodleId {number}
     */
    constructor(grade: string, subject: string, group: string, exams = false, id: number | null = null, teacherId: number | null = null, moodleId: number | null = null) {
        this.grade = grade;
        this.subject = subject;
        this.group = group;
        this.exams = exams;
        this.id = id;
        this.teacherId = teacherId;
        this.moodleId = moodleId;
    }

    /**
     * Returns a course if found else rejects
     * @param subject
     * @param grade
     * @param group
     */
    static getByFields(subject: string, grade: string, group: string): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM courses WHERE (subject=? && `grade`=? && `group`=?)", [subject, grade, group]);
                if (rows.length !== 1) {
                    reject("Course not found")
                } else {
                    resolve(new Course(rows[0]["grade"], rows[0]["subject"], rows[0]["group"], false, rows[0]["id_courses"], rows[0]["teacherId"]));
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns a course with the given id or rejects
     * @param id
     */
    static getById(id: number): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM courses WHERE (id_courses=?)", [id]);
                if (rows.length === 1) {
                    resolve(new Course(rows[0]["grade"], rows[0]["subject"], rows[0]["group"], false, rows[0]["id_courses"], rows[0]["teacherId"]));
                } else {
                    reject()
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns a course with the given teacher id
     * @param id
     */
    static getByTeacherId(id: number): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM courses WHERE (teacherId=?)", [id]);
                let courses: Course[] = [];
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    let course = new Course(row["grade"], row["subject"], row["group"], false, row["id_courses"], row["teacherId"]);
                    courses.push(course);
                }
                resolve(courses);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns all Courses
     * @returns {Promise<Course[]>}
     */
    static getAll(): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let courses: Course[] = [];
                let rows = await conn.query("SELECT * FROM courses ORDER BY grade, subject, `group`");
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    courses.push(new Course(row.grade, row.subject, row.group, false, row.id_courses, row.teacherId, row.moodleId))
                }
                resolve(courses);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    save(): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let result = await conn.query("INSERT INTO `courses` (grade, subject, `group`, teacherId) VALUES (?, ?, ?, ?);", [this.grade, this.subject, this.group, this.teacherId]);
                this.id = result.insertId;
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            let lessons: Lesson[] = await this.getLessons();
            for (let i = 0; i < lessons.length; i++) {
                await lessons[i].delete();
            }

            let exams: Exam[] = await Exam.getByCourse(this);
            for (let i = 0; i < exams.length; i++) {
                await exams[i].delete();
            }

            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM user_student_courses WHERE courseId=?", [this.id]);
                await conn.query("DELETE FROM courses WHERE id_courses=?", [this.id]);
                resolve(this);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Get all student devices associated with the given course
     * @returns Promise {device}
     */
    getStudentDevices() {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT user_student_courses.*, devices.* FROM user_student_courses LEFT JOIN devices ON user_student_courses.user_id = devices.userID WHERE (`courseId`=? )", [this.id]);

                let devices: any = [];
                rows.forEach((row: any) => {
                    if (row.deviceIdentifier != null) {
                        let device = new Device(row.platform, row.id_devices, row.userId, row.added, row.deviceIdentifier);
                        devices.push(device);
                    }
                });
                resolve(devices);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: User; Function: getStudentDevicesByCourse: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                })
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    getLessons(): Promise<Lesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let lessons: Lesson[] = [];
                assert(this.id != null);
                let rows = await conn.query("SELECT * FROM lessons WHERE courseId = ?", [this.id]);
                rows.forEach((row: any) => {
                    lessons.push(new Lesson(this, row["lesson"], row["weekday"], row["room"], row["id_lessons"]));
                });
                resolve(lessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }
}