import winston from 'winston';
const logger = winston.loggers.get('main');
import {ApiGlobal} from "../types/global";
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
                let rows = await conn.query("SELECT * FROM splan.data_lessons WHERE (`grade`=? && `subject`=? && `group`=?)", [course.grade, course.subject, course.group]);
                rows.forEach((row: any) => {
                    lessons.push(new Lesson(new Course(row["grade"], row["subject"], row["group"],null),row["teacher"], row["lesson"], row["weekday"], row["room"]));
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

    /**
     * Add lesson
     * @param lesson {Lesson}
     * @returns Promise
     */
    static addLesson(lesson: any){
        return new Promise(async (resolve, reject) =>{
            let conn = await pool.getConnection();
            try{
                let subject 		= lesson.subject;
                let grade 			= lesson.grade;
                let group 			= lesson.group;
                let teacher 		= lesson.teacher;
                let lessonNumber 	= lesson.lesson;
                let day 			= lesson.day;
                let room 			= lesson.room;
                await conn.query("INSERT INTO `splan`.`data_lessons` (`subject`, `teacher`, `grade`, `group`, `room`, `lesson`, `weekday`) VALUES (?, ?, ?, ?, ?, ?, ?);",[subject, teacher, grade, group, room, lessonNumber, day]);
                resolve();
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
     * @param teacher
     * @param weekday
     * @param lesson
     * @returns {Promise<unknown>}
     */
    static getCourseByTeacherDayLesson(teacher: any, weekday: any, lesson: any){
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons: any = [];
                let rows = await conn.query("SELECT * FROM splan.data_lessons WHERE (`teacher`=? && `lesson`=? && `weekday`=?)", [teacher, lesson, weekday]);
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

    /**
     *
     * @returns {Promise<unknown>}
     */
    static getAllCourses(){
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let courses: any = [];
                let rows = await conn.query("SELECT * FROM splan.data_courses ORDER BY grade, subject, `group`");
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
                let rows = await conn.query('SELECT `subject`,`grade`,`group`, `teacher` FROM splan.data_lessons');
                rows.forEach((course: any )=> {
                    let conName = course["grade"] + "/" + course["subject"] + "-" + course["group"];
                    courses[conName] = course;
                });
                await conn.query('TRUNCATE TABLE splan.data_courses');
                for (let courseId in courses){
                    let course = courses[courseId];
                    console.log(course)
                    rows = await conn.query('INSERT INTO splan.data_courses (grade, subject, `group`, `teacher`) VALUES (?, ?, ?, ?)', [course["grade"], course["subject"], course["group"], course["teacher"]]);
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
    teacher: string;
    lesson: number;
    day: number;
    room: string;

    /**
     *
     * @param course {Course}
     * @param teacher {string}
     * @param lesson {number}
     * @param day {number}
     * @param room {string}
     */
    constructor(course: Course, teacher: string, lesson: number, day: number, room: string) {
        this.course = course;
        this.teacher = teacher;
        this.lesson = lesson;
        this.day = day;
        this.room = room;
    }
}


export class Course {
    grade: any;
    subject: any;
    group: any;
    exams: any;

    /**
     *
     * @param grade {String}
     * @param subject {String}
     * @param group {String}
     * @param exams {String}
     */
    constructor(grade = null, subject = null, group = null, exams = null) {
        this.grade = grade;
        this.subject = subject;
        this.group = group;
        this.exams = exams;
    }
}