import winston from 'winston';
const logger = winston.loggers.get('main');
//Create Database connection pool for requests
import {ApiGlobal} from "../types/global";
import {Course} from "./timeTable";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class ReplacementLessons {
    /**
     * Get replacement lessons by course
     * @param course {course}
     * @returns {Promise<unknown>}
     */
    static getByCourse(course: Course) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `grade`= ? AND `subject`= ? AND `group`= ?", [course.grade, course.subject, course.group]);
                rows.forEach((replacementLesson: any) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `grade`= ? AND `subject`= ? AND `group`= ? AND `date` >= ? AND `date`<= ?", [course.grade, course.subject, course.group, dateStart, dateEnd]);
                rows.forEach((replacementLesson: any) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
    static getAll() {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];

                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen`",);
                rows.forEach((replacementLesson: any) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
    static getByDate(date: string) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];

                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `date`= ? ", [date]);
                rows.forEach((replacementLesson: any) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];

                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                rows.forEach((replacementLesson: any) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(replacementLesson);
                });
                resolve(data);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }

        });
    }

    /**
     * Add a replacementLesson
     * @param replacementLesson {replacementLesson}
     * @returns Promise {String} status
     */
    static add(replacementLesson: any){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let weekday = new Date(replacementLesson.date).getDay();

                try {
                    let rows = await conn.query("INSERT INTO `splan`.`data_vertretungen` (`date`, `lesson`, `changedSubject`, `changedTeacher`, `changedRoom`, `info`, `grade`, `subject`, `group`, `weekday`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE changedSubject = ?, changedTeacher = ?, changedRoom = ?, info = ?"
                        , [replacementLesson.date, replacementLesson.lesson, replacementLesson.changedSubject, replacementLesson.changedTeacher, replacementLesson.changedRoom, replacementLesson.info, replacementLesson.grade, replacementLesson.subject, replacementLesson.group, weekday, replacementLesson.changedSubject, replacementLesson.changedTeacher, replacementLesson.changedRoom, replacementLesson.info]);
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
     * @param id {number}
     * @returns Promise
     */
    static deleteById(id: number): Promise<Course> {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                if(rows.length == 1){
                    await conn.query("DELETE FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                    resolve(rows[0]);
                }else {
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
     * @param teacher {String}
     * @param dateStart {String}
     * @param dateEnd {String}
     * @returns Promise {[replacementLessons]}
     */
    static getByTeacher(teacher: string, dateStart: string, dateEnd: string){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `changedTeacher` LIKE ? AND `date` >= ? AND `date`<= ?", ['%'+teacher+'%', dateStart, dateEnd]);
                rows.forEach((replacementLesson: any) => {
                    data.push(replacementLesson);
                });
                resolve(data);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static search(info: string){
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data: any = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `info` LIKE ? ", [info]);
                rows.forEach((replacementLesson: any) => {
                    data.push(replacementLesson);
                });
                resolve(data);
            } catch (e) {
                //TODO add logger
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}