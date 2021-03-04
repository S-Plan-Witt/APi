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
     * Get all lessons by course
     * @param course {course}
     * @returns Promise {[lesson]}
     */
    static getLessonsByCourse(course: Course) {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let lessons: Lesson[] = [];
                assert(course.id != null);
                let rows = await conn.query("SELECT * FROM lessons WHERE courseId = ?", [course.id]);
                rows.forEach((row: any) => {
                    lessons.push(new Lesson(course, row["lesson"], row["weekday"], row["room"], row["idlessons"]));
                });
                resolve(lessons);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Returns the lesson with the given id or rejects if not available
     * @param id
     */
    static getLessonById(id: number): Promise<Lesson> {
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
    static getLessonsByCourseAndLessonAndDay(course: Course, lessonNum: number, weekday: number): Promise<Lesson> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM lessons WHERE `courseId`=? && `lesson`=? AND weekday = ?", [course.id, lessonNum, weekday]);
                if (rows.length === 1) {
                    let row = rows[0];
                    resolve(new Lesson(course, row["lesson"], row["weekday"], row["room"], parseInt(row["idlessons"])));
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
    static getAllLessons(): Promise<Lesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let lessons: Lesson[] = [];
                let rows = await conn.query("SELECT lessons.id_lessons, lessons.room, lessons.lesson, lessons.weekday, lessons.identifier, courses.teacherId, lessons.courseId, courses.id_courses, courses.grade, courses.subject, courses.`group`, courses.coursename FROM lessons LEFT JOIN courses ON lessons.courseId = courses.id_courses");
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    lessons.push(new Lesson(new Course(row["grade"], row["subject"], row["group"], false, row["iddata_courses"]), row["lesson"], row["weekday"], row["room"], row["idlessons"]));
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
    static addLesson(lesson: Lesson): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO `lessons` (`courseId`, `room`, `lesson`, weekday) VALUES (?, ?, ?, ?);", [lesson.course.id, lesson.room, lesson.lessonNumber, lesson.day]);
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Adds one course
     * @param course
     */
    static addCourse(course: Course): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let result = await conn.query("INSERT INTO `courses` (grade, subject, `group`, teacherId) VALUES (?, ?, ?, ?);", [course.grade, course.subject, course.group, course.teacherId]);
                course.id = result.insertId;
                resolve(course);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

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

    /**
     * Returns a course if found else rejects
     * @param subject
     * @param grade
     * @param group
     */
    static getCourseByFields(subject: string, grade: string, group: string): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM courses WHERE (subject=? && `grade`=? && `group`=?)", [subject, grade, group]);
                if (rows.length !== 1) {
                    reject("Course not found")
                } else {
                    resolve(new Course(rows[0]["grade"], rows[0]["subject"], rows[0]["group"], false, rows[0]["id_courses"]));
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
    static getCourseById(id: number): Promise<Course> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM courses WHERE (id_courses=?)", [id]);
                if (rows.length === 1) {
                    resolve(new Course(rows[0]["grade"], rows[0]["subject"], rows[0]["group"], false, rows[0]["iddata_courses"]));
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
     * Returns all Courses
     * @returns {Promise<Course[]>}
     */
    static getAllCourses(): Promise<Course[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let courses: Course[] = [];
                let rows = await conn.query("SELECT * FROM courses ORDER BY grade, subject, `group`");
                rows.forEach((lesson: any) => {
                    courses.push(lesson);
                });
                resolve(courses);
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}