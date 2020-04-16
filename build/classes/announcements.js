"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeTable_1 = require("./timeTable");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.loggers.get('main');
let pool = global["mySQLPool"];
class Announcements {
    /**
     * Retrieves all Announcements to corresponding course from the database
     * @param course {Course}
     */
    static getByCourse(course) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let data = [];
                const rows = await conn.query("SELECT * FROM `splan`.`data_announcements` WHERE `subject`= ? AND `grade`= ? AND `group`= ?", [course.subject, course.grade, course.group]);
                rows.forEach((element) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(new Announcement(course, element["author"], element["content"], element["date"], element["iddata_announcements"]));
                });
                resolve(data);
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * Retrieves all Announcements from the Database
     * @returns {Promise<Announcement[]>}
     */
    static getAll() {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let data = [];
                const rows = await conn.query("SELECT * FROM `splan`.`data_announcements`");
                rows.forEach((element) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(new Announcement(new timeTable_1.Course(element["grade"], element["subject"], element["group"]), element["author"], element["content"], element["date"], element["iddata_announcements"]));
                });
                resolve(data);
            }
            catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getAll)) ' + e
                });
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
    * Retrieves the Announcement with the corresponding id from the Database
    * @param id
    * @returns {Promise<Announcement>}
    */
    static getById(id) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let data = [];
                const rows = await conn.query("SELECT * FROM `splan`.`data_announcements` WHERE iddata_announcements = ?", [id]);
                rows.forEach((element) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    data.push(new Announcement(new timeTable_1.Course(element["grade"], element["subject"], element["group"]), element["author"], element["content"], element["date"], element["iddata_announcements"]));
                });
                if (data.length == 1) {
                    resolve(data[0]);
                }
                else {
                    reject("no row");
                }
            }
            catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getById)) ' + e
                });
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
}
exports.Announcements = Announcements;
class Announcement {
    /**
     * Constructor
     * @param course {Course}
     * @param author {String}
     * @param content {String}
     * @param date
     * @param id
     */
    constructor(course, author = "", content = "", date = "", id = 0) {
        this.id = id;
        this.course = course;
        this.author = author;
        this.content = content;
        this.date = date;
    }
    /**
     * Submits the Announcement to the Database
     * @returns {Promise<boolean>}
     */
    create() {
        let content = this.content;
        let author = this.author;
        let editor = author;
        let course = this.course;
        let date = this.date;
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("INSERT INTO `splan`.`data_announcements` (`content`, `shownOnDisplay`, `displayColor`, `displayOrder`, `author`, `editedBy`, `grade`, `subject`, `group`, `date`) VALUES (?, '1', 'red', '1', ?, ?, ?, ?, ?, ?)", [content, author, editor, course.grade, course.subject, course.group, date]);
                resolve(true);
            }
            catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(create) ' + e
                });
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * Submits the updated Announcement to the Database
     * @returns {Promise<boolean>}
     */
    update() {
        let content = this.content;
        let editor = this.author;
        let course = this.course;
        let date = this.date;
        let id = "1";
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("UPDATE `splan`.`data_announcements` SET `content` = ?, `edited` = CURRENT_TIMESTAMP, `editedBy` = ?, `grade` = ?, `subject` = ?, `group` = ?, `date` = ? WHERE iddata_announcements = ?", [content, editor, course.grade, course.subject, course.group, date, id]);
                resolve(true);
            }
            catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(update) ' + e
                });
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * Deletes the Announcement from the Database
     * @returns {Promise<boolean>}
     */
    delete() {
        let id = this.id;
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("DELETE FROM `splan`.`data_announcements` WHERE iddata_announcements = ?", [id]);
                resolve(true);
            }
            catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(delete) ' + e
                });
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
}
exports.Announcement = Announcement;
//EXPORTS
module.exports.Announcement = Announcement;
module.exports.Announcements = Announcements;
