"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.loggers.get('main');
let pool = global["mySQLPool"];
class ReplacementLessons {
    /**
     * Get replacement lessons by course
     * @param course {course}
     * @returns {Promise<unknown>}
     */
    static getByCourse(course) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `grade`= ? AND `subject`= ? AND `group`= ?", [course.grade, course.subject, course.group]);
                rows.forEach((replacementLesson) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
     * Get replacement lessons by course within the specified time frame
     * @param course {course}
     * @param dateStart {String}
     * @param dateEnd {String}
     * @returns Promise {replacementLesson}
     */
    static getByCourseTimeFrame(course, dateStart, dateEnd) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `grade`= ? AND `subject`= ? AND `group`= ? AND `date` >= ? AND `date`<= ?", [course.grade, course.subject, course.group, dateStart, dateEnd]);
                rows.forEach((replacementLesson) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
     * Get all replacement Lessons
     * @returns Promise {replacementLessons}
     */
    static getAll() {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen`");
                rows.forEach((replacementLesson) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
     * Get all replacement lessons within the specified time frame
     * @param date {String}
     * @returns Promise {replacementLessons}
     */
    static getByDate(date) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `date`= ? ", [date]);
                rows.forEach((replacementLesson) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
     * //TODO create JDOC
     */
    static getById(id) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                rows.forEach((replacementLesson) => {
                    let date = new Date(replacementLesson["date"]);
                    replacementLesson["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(replacementLesson);
                });
                resolve(data);
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
     * Add a replacementLesson
     * @param replacementLesson {replacementLesson}
     * @returns Promise {String} status
     */
    static add(replacementLesson) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let weekday = new Date(replacementLesson.date).getDay();
                try {
                    let rows = await conn.query("INSERT INTO `splan`.`data_vertretungen` (`date`, `lesson`, `changedSubject`, `changedTeacher`, `changedRoom`, `info`, `grade`, `subject`, `group`, `weekday`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE changedSubject = ?, changedTeacher = ?, changedRoom = ?, info = ?", [replacementLesson.date, replacementLesson.lesson, replacementLesson.changedSubject, replacementLesson.changedTeacher, replacementLesson.changedRoom, replacementLesson.info, replacementLesson.grade, replacementLesson.subject, replacementLesson.group, weekday, replacementLesson.changedSubject, replacementLesson.changedTeacher, replacementLesson.changedRoom, replacementLesson.info]);
                    if (rows.insertId > 0) {
                        resolve("added");
                    }
                    else if (rows.insertId === 0) {
                        resolve("updated");
                    }
                    else {
                        resolve(rows);
                    }
                }
                catch (e) {
                    if (e.code === "ER_DUP_ENTRY") {
                        console.log("update Needed");
                    }
                    //TODO add logger
                    reject(e);
                }
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
     * Delete replacement Lesson by id
     * @param id {number}
     * @returns Promise
     */
    static deleteById(id) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                if (rows.length == 1) {
                    await conn.query("DELETE FROM `splan`.`data_vertretungen` WHERE `vertretungsID`= ? ", [id]);
                    resolve(rows[0]);
                }
                else {
                    reject('NE');
                }
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
     * Get replacement lessons by teacher
     * @param teacher {String}
     * @param dateStart {String}
     * @param dateEnd {String}
     * @returns Promise {[replacementLessons]}
     */
    static getByTeacher(teacher, dateStart, dateEnd) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `changedTeacher` LIKE ? AND `date` >= ? AND `date`<= ?", ['%' + teacher + '%', dateStart, dateEnd]);
                rows.forEach((replacementLesson) => {
                    data.push(replacementLesson);
                });
                resolve(data);
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
    static search(info) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let data = [];
                let rows = await conn.query("SELECT * FROM `splan`.`data_vertretungen` WHERE `info` LIKE ? ", [info]);
                rows.forEach((replacementLesson) => {
                    data.push(replacementLesson);
                });
                resolve(data);
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
}
exports.ReplacementLessons = ReplacementLessons;
