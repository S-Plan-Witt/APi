import winston from 'winston';
const logger = winston.loggers.get('main');
import {ApiGlobal} from "../types/global";
import assert from "assert";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class TimeTable {
    /**
     * Get all lessons by course
     * @param course {course}
     * @returns Promise {[lesson]}
     */
    static getLessonsByCourse(course: Course) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons: Lesson[] = [];
                assert(course.id != null);
                let rows = await conn.query("SELECT * FROM data_lessons WHERE courseId = ?", [course.id]);
                rows.forEach((row: any) => {
                    lessons.push(new Lesson(course, row["lesson"], row["weekday"], row["room"], row["idlessons"]));
                });
                resolve(lessons);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    static getLessonById(id: number): Promise<Lesson> {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT data_lessons.idlessons, data_lessons.room, data_lessons.lesson, data_lessons.weekday, data_lessons.identifier, data_lessons.teacherId, data_lessons.courseId, data_courses.iddata_courses, data_courses.grade, data_courses.subject, data_courses.`group`, data_courses.coursename FROM data_lessons LEFT JOIN data_courses ON data_lessons.courseId = data_courses.iddata_courses WHERE `idlessons`=?", [id.toString()]);
                if(rows.length == 1){
                    let row = rows[0];
                    resolve(new Lesson(new Course(row["grade"], row["subject"], row["group"],false, row["courseId"]), row["lesson"], row["weekday"], row["room"], row["idlessons"]))
                }else {
                    reject();
                }
            } catch (e) {
                //TODO add logger
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
    static getLessonsByCourseAndLessonAndDay(course: Course,lessonNum: number, weekday: number): Promise<Lesson> {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM data_lessons WHERE `courseId`=? && `lesson`=? AND weekday = ?", [course.id, lessonNum, weekday]);
                if(rows.length == 1){
                    let row = rows[0];
                    resolve(new Lesson(course, row["lesson"], row["weekday"], row["room"],parseInt(row["idlessons"])));
                }else {
                    reject("No lesson: "+ lessonNum + "; " + course.grade + "/" + course.subject + "-" + course.group);
                }
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }
    /**
     * Get all Lessons
     * @returns Promise {[Lesson]}
     */
    static getAllLessons(): Promise<Lesson[]> {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons: Lesson[] = [];
                let rows = await conn.query("SELECT data_lessons.idlessons, data_lessons.room, data_lessons.lesson, data_lessons.weekday, data_lessons.identifier, data_lessons.teacherId, data_lessons.courseId, data_courses.iddata_courses, data_courses.grade, data_courses.subject, data_courses.`group`, data_courses.coursename FROM data_lessons LEFT JOIN data_courses ON data_lessons.courseId = data_courses.iddata_courses");
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    console.log(row)
                    lessons.push(new Lesson(new Course(row["grade"], row["subject"], row["group"],false, row["iddata_courses"]), row["lesson"], row["weekday"], row["room"],row["idlessons"]));
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
     * Add lesson
     * @param lesson {Lesson}
     * @returns Promise
     */
    static addLesson(lesson: Lesson){
        return new Promise(async (resolve, reject) =>{
            let conn = await pool.getConnection();
            try{
                await conn.query("INSERT INTO `data_lessons` (`courseId`, `room`, `lesson`, weekday) VALUES (?, ?, ?, ?);",[lesson.course.id, lesson.room, lesson.lessonNumber, lesson.day]);
                resolve();
            }catch(e){
                //TODO add logger
                reject(e);
            }finally{
                await conn.end();
            }
        });
    }

    static addCourse(course: Course) : Promise<Course>{
        return new Promise(async (resolve, reject) =>{
            let conn = await pool.getConnection();
            try{
                let result = await conn.query("INSERT INTO `data_courses` (grade, subject, `group`, teacherId) VALUES (?, ?, ?, ?);",[course.grade, course.subject, course.group, course.teacherId]);
                course.id = result.insertId;
                resolve(course);
            }catch(e){
                //TODO add logger
                reject(e);
            }finally{
                await conn.end();
            }
        });
    }

    /**
     *
     * @param teacherId
     * @param weekday
     * @param lesson
     * @returns {Promise<Course[]>}
     */
    static getCourseByTeacherDayLesson(teacherId: number, weekday: any, lesson: any): Promise<Course[]>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons: any = [];
                let rows = await conn.query("SELECT * FROM data_lessons WHERE (`teacherId`=? && `lesson`=? && `weekday`=?)", [teacherId, lesson, weekday]);
                rows.forEach((lesson:any) => {
                    lessons.push(lesson);
                });
                resolve(lessons);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static getCourseByFields(subject: string, grade: string, group: string): Promise<Course>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM data_courses WHERE (subject=? && `grade`=? && `group`=?)", [subject, grade, group]);
                if (rows.length != 1) {
                    reject()
                } else {
                    resolve(new Course(rows[0]["grade"],rows[0]["subject"],rows[0]["group"], false, rows[0]["iddata_courses"]));
                }
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
    static getCourseById(id: number): Promise<Course>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons: any = [];
                let rows = await conn.query("SELECT * FROM data_courses WHERE (iddata_courses=?)", [id]);
                if (rows.length != 1) {
                    reject()
                } else {
                    resolve(new Course(rows[0]["grade"],rows[0]["subject"],rows[0]["group"], false, rows[0]["iddata_courses"]));
                }
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    static getAllCourses(): Promise<Course[]>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let courses: Course[] = [];
                let rows = await conn.query("SELECT * FROM data_courses ORDER BY grade, subject, `group`");
                rows.forEach((lesson: any) => {
                    courses.push(lesson);
                });
                resolve(courses);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    static rebuildCourseList() {
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let courses: any = [];
                let rows = await conn.query('SELECT `teacherId` FROM data_lessons');
                rows.forEach((course: any)=> {
                    let conName: string;
                    if(course["grade"] == course["group"]){
                        conName = course["grade"] + "/" + course["subject"];
                    }else {
                        conName = course["grade"] + "/" + course["subject"] + "-" + course["group"];
                    }
                    courses[conName] = course;
                });
                await conn.query("TRUNCATE TABLE data_courses");
                for (let courseId in courses){
                    if(courses.hasOwnProperty(courseId)){
                        let course = courses[courseId];
                        rows = await conn.query('INSERT INTO data_courses (grade, subject, `group`, `teacher`) VALUES (?, ?, ?, ?)', [course["grade"], course["subject"], course["group"], course["teacher"]]);
                    }
                }
                resolve();
            } catch (e) {
                //TODO add logger
                console.log(e);
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}


export class Lesson {
    course: Course;
    lessonNumber: number;
    day: number;
    room: string;
    id: number | null;

    /**
     *
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
}


export class Course {
    grade: any;
    subject: any;
    group: any;
    exams: boolean;
    id: number | null;
    teacherId: number | null;

    /**
     *
     * @param grade {String}
     * @param subject {String}
     * @param group {String}
     * @param exams {String}
     * @param id
     * @param teacherId
     */
    constructor(grade: string | null = null, subject: string | null = null, group: string | null = null, exams = false, id: number | null = null, teacherId: number | null = null) {
        this.grade = grade;
        this.subject = subject;
        this.group = group;
        this.exams = exams;
        this.id = id;
        this.teacherId = teacherId;
    }
}