"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.loggers.get('main');
let pool = global["mySQLPool"];
class TimeTable {
    /**
     * Get all lessons by course
     * @param course {course}
     * @returns Promise {[lesson]}
     */
    static getLessonsByCourse(course) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons = [];
                let rows = await conn.query("SELECT * FROM splan.data_stundenplan WHERE (`grade`=? && `subject`=? && `group`=?)", [course.grade, course.subject, course.group]);
                rows.forEach((lesson) => {
                    lessons.push(lesson);
                });
                resolve(lessons);
            }
            catch (e) {
                //TODO add logger
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * Add lesson
     * @param lesson {Lesson}
     * @returns Promise
     */
    static addLesson(lesson) {
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                let subject = lesson.subject;
                let grade = lesson.grade;
                let group = lesson.group;
                let teacher = lesson.teacher;
                let lessonNumber = lesson.lesson;
                let day = lesson.day;
                let room = lesson.room;
                await conn.query("INSERT INTO `splan`.`data_stundenplan` (`subject`, `teacher`, `grade`, `group`, `room`, `lesson`, `weekday`) VALUES (?, ?, ?, ?, ?, ?, ?);", [subject, teacher, grade, group, room, lessonNumber, day]);
                resolve();
            }
            catch (e) {
                //TODO add logger
                reject(e);
            }
            finally {
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
    static getCourseByTeacherDayLesson(teacher, weekday, lesson) {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let lessons = [];
                let rows = await conn.query("SELECT * FROM splan.data_stundenplan WHERE (`teacher`=? && `lesson`=? && `weekday`=?)", [teacher, lesson, weekday]);
                rows.forEach((lesson) => {
                    lessons.push(lesson);
                });
                resolve(lessons);
            }
            catch (e) {
                //TODO add logger
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     *
     * @returns {Promise<unknown>}
     */
    static getAllCourses() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let courses = [];
                let rows = await conn.query("SELECT * FROM splan.data_courses ORDER BY grade, subject, `group`");
                rows.forEach((lesson) => {
                    courses.push(lesson);
                });
                resolve(courses);
            }
            catch (e) {
                //TODO add logger
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     *
     * @returns {Promise<unknown>}
     */
    static rebuildCourseList() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let courses = [];
                let rows = await conn.query('SELECT `subject`,`grade`,`group`, `teacher` FROM splan.data_stundenplan');
                rows.forEach((course) => {
                    let conName = course["grade"] + "/" + course["subject"] + "-" + course["group"];
                    courses[conName] = course;
                });
                await conn.query('TRUNCATE TABLE splan.data_courses');
                for (let courseId in courses) {
                    let course = courses[courseId];
                    console.log(course);
                    rows = await conn.query('INSERT INTO splan.data_courses (grade, subject, `group`, `teacher`) VALUES (?, ?, ?, ?)', [course["grade"], course["subject"], course["group"], course["teacher"]]);
                }
                resolve();
            }
            catch (e) {
                //TODO add logger
                console.log(e);
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
}
exports.TimeTable = TimeTable;
class Course {
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
exports.Course = Course;
