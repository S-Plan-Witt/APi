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
import assert from "assert";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

/**
 * @typedef Lesson
 * @property {number} id
 * @property {Course.model} course.required
 * @property {string} room.required
 * @property {number} lesson.required
 * @property {number} weekday.required
 */
export class Lesson {
    public course: Course;
    public lessonNumber: number;
    public day: number;
    public room: string;
    public id: number | null;

    /**
     * @param course {Course}
     * @param lesson {number}
     * @param day {number}
     * @param room {string}
     * @param id
     */
    constructor(course: Course, lesson: number, day: number, room: string, id: number | null) {
        this.course = course;
        this.lessonNumber = lesson;
        this.day = day;
        this.room = room;
        this.id = id;
    }

    /**
     * Returns the lesson with the given id or rejects if not available
     * @param id
     */
    static getById(id: number): Promise<Lesson> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT lessons.id_lessons, lessons.room, lessons.lesson, lessons.weekday, lessons.identifier, courses.teacherId, lessons.courseId, courses.id_courses, courses.grade, courses.subject, courses.`group`, courses.coursename FROM lessons LEFT JOIN courses ON lessons.courseId = courses.id_courses WHERE id_lessons=?", [id.toString()]);
                if (rows.length === 1) {
                    let row = rows[0];
                    resolve(new Lesson(new Course(row["grade"], row["subject"], row["group"], false, row["courseId"]), row["lesson"], row["weekday"], row["room"], row["idlessons"]))
                } else {
                    //TODO error message
                    reject();
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Get all lessons by course
     * @param course {course}
     * @param lessonNum
     * @param weekday
     * @returns Promise {[lesson]}
     */
    static getByCourseAndLessonAndDay(course: Course, lessonNum: number, weekday: number): Promise<Lesson> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM lessons WHERE `courseId`=? && `lesson`=? AND weekday = ?", [course.id, lessonNum, weekday]);
                if (rows.length === 1) {
                    let row = rows[0];
                    resolve(new Lesson(course, row["lesson"], row["weekday"], row["room"], parseInt(row["id_lessons"])));
                } else {
                    reject("No lesson: " + lessonNum + "; " + course.grade + "/" + course.subject + "-" + course.group);
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Returns all Lessons
     * @returns Promise {[Lesson]}
     */
    static getAll(): Promise<Lesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let lessons: Lesson[] = [];
                let rows = await conn.query("SELECT * FROM lessons");
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    let course: Course = await Course.getById(row["courseId"]);
                    lessons.push(new Lesson(course, row["lesson"], row["weekday"], row["room"], row["id_lessons"]));
                }
                resolve(lessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Adds one lesson
     * @param lesson {Lesson}
     * @returns Promise
     */
    save(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `lessons` (`courseId`, `room`, `lesson`, weekday) VALUES (?, ?, ?, ?);", [this.course.id, this.room, this.lessonNumber, this.day]);
                resolve();
            } catch (e) {
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
                await conn.query("DELETE FROM lessons WHERE id_lessons=?", [this.id]);
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}