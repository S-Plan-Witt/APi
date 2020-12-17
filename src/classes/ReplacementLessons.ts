//Create Database connection pool for requests
import {ApiGlobal} from "../types/global";
import {TimeTable} from "./TimeTable";
import {Utils} from "./Utils";
import {ReplacementLesson} from "./ReplacementLesson";
import {Course} from "./Course";
import {Lesson} from "./Lesson";


declare const global: ApiGlobal;


export class ReplacementLessons {
    /**
     * Get replacement lessons by course
     * @param course {course}
     * @returns {Promise<ReplacementLesson[]>}
     */
    static getByCourse(course: Course): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT data_replacementlessons.iddata_vertretungen, data_replacementlessons.date, data_replacementlessons.subject, data_replacementlessons.room, data_replacementlessons.info, data_replacementlessons.lessonId, data_replacementlessons.teacherId AS replacementTeacherId, data_replacementlessons.replacementId, data_lessons.weekday, data_lessons.room AS lessonRoom, data_lessons.lesson, data_lessons.idlessons FROM data_replacementlessons LEFT JOIN data_lessons ON data_replacementlessons.lessonId = data_lessons.idlessons LEFT JOIN data_courses ON data_lessons.courseId = data_courses.iddata_courses WHERE data_courses.grade = ? AND data_courses.subject = ? AND  data_courses.`group` = ?", [course.grade, course.subject, course.group]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Get replacement lessons by course within the specified time frame
     * @param course {course}
     * @param dateStart {String}
     * @param dateEnd {String}
     * @returns Promise {replacementLesson}
     */
    static getByCourseTimeFrame(course: Course, dateStart: string, dateEnd: string) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `lessonId`= (SELECT idlessons FROM data_lessons WHERE courseId = (SELECT iddata_courses FROM data_courses WHERE `grade`= ? AND `subject`= ? AND `group`= ?)) AND `date` >= ? AND `date`<= ?", [course.grade, course.subject, course.group, dateStart, dateEnd]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
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
                let rows = await conn.query("SELECT * FROM data_replacementlessons");
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
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
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `date`= ? ", [date]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * //TODO create JDOC
     */
    static getById(id: number) {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `replacementId`= ? ", [id]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    static convertSqlRowsToObjects(rows: any): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {

            let replacementLessons: ReplacementLesson[] = [];
            for (let i = 0; i < rows.length; i++) {
                let replacementLesson = rows[i];
                replacementLesson["date"] = Utils.convertMysqlDate(replacementLesson["date"])
                let lesson: Lesson = await TimeTable.getLessonById(replacementLesson["lessonId"].toString());

                replacementLessons.push(new ReplacementLesson(replacementLesson["iddata_vertretungen"], lesson.course, lesson, replacementLesson["teacherId"], replacementLesson["room"], replacementLesson["subject"], replacementLesson["info"], replacementLesson["date"]));
            }
            resolve(replacementLessons);
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
                    let rows = await conn.query("INSERT INTO `data_replacementlessons` (`date`, `lessonId`, `subject`, `teacherId`, `room`, `info`) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject = ?, teacherId = ?, room = ?, info = ?"
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
                    //TODO add logger
                    reject(e)
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
     * Delete replacement Lesson by id
     * @param id {string}
     * @returns Promise
     */
    static deleteById(id: string): Promise<ReplacementLesson> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `replacementId` = ? ", [id]);
                if (rows.length === 1) {
                    await conn.query("DELETE FROM `data_replacementlessons` WHERE `replacementId` = ? ", [id]);
                    let replacementLesson = rows[0];
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    let lesson: Lesson = await TimeTable.getLessonById(replacementLesson["lessonId"].toString());
                    resolve(new ReplacementLesson(replacementLesson["iddata_vertretungen"], lesson.course, lesson, replacementLesson["teacherId"], replacementLesson["room"], replacementLesson["subject"], replacementLesson["info"], replacementLesson["date"]));
                } else {
                    reject('NE')
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
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `teacherId` = ? AND `date` >= ? AND `date`<= ?", [teacherId, dateStart, dateEnd]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
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
                let rows = await conn.query("SELECT * FROM `data_replacementlessons` WHERE `info` LIKE ? ", [info]);
                resolve(await ReplacementLessons.convertSqlRowsToObjects(rows));
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}