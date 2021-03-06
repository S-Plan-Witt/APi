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
import assert from "assert";
import {Course} from "./Course";
import {Lesson} from "./Lesson";


declare const global: ApiGlobal;

export class TimeTable {

    /**
     * Returns all Courses from a teacher
     * @param teacherId
     * @param weekday
     * @param lesson
     * @returns {Promise<Course[]>}
     */
    static getCourseByTeacherDayLesson(teacherId: number, weekday: any, lesson: any): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let lessons: any = [];
                let rows = await conn.query("SELECT lessons.* FROM lessons left join courses on lessons.courseId = courses.id_courses where (`teacherId`=? && `lesson`=? && `weekday`=?)", [teacherId, lesson, weekday]);
                rows.forEach((lesson: any) => {
                    lessons.push(lesson);
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