import {Course} from "./timeTable";

import winston from 'winston';
const logger = winston.loggers.get('main');

import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class Announcements {

    /**
     * Retrieves all Announcements to corresponding course from the database
     * @param course {Course}
     * @returns {Promise<Announcement[]>}
     */
    static getByCourse(course: Course): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let data: Announcement[] = [];
                const rows = await conn.query("SELECT * FROM `splan`.`data_announcements` WHERE `subject`= ? AND `grade`= ? AND `group`= ?", [course.subject, course.grade, course.group]);
                rows.forEach((element: any) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(new Announcement(course, element["author"], element["content"], element["date"], element["iddata_announcements"]));

                });
                resolve(data);
            }catch (e) {
                console.log(e);
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Retrieves all Announcements from the Database
     * @returns {Promise<Announcement[]>}
     */
    static getAll(): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let data: Announcement[] = [];
                const rows = await conn.query("SELECT * FROM `splan`.`data_announcements`");
                rows.forEach((element: any) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    data.push(new Announcement(new Course(element["grade"], element["subject"], element["group"]), element["author"], element["content"], element["date"], element["iddata_announcements"]));
                });
                resolve(data);
            }catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getAll)) ' + e
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

     /**
     * Retrieves the Announcement with the corresponding id from the Database
     * @param id
     * @returns {Promise<Announcement>}
     */
    static getById(id: number): Promise<Announcement> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM `splan`.`data_announcements` WHERE iddata_announcements = ?", [id]);
                if(rows.length == 1){
                    let row = rows[0];
                    let date = new Date(row["date"]);
                    row["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    resolve(new Announcement(new Course(row["grade"], row["subject"], row["group"]), row["author"], row["content"], row["date"], row["iddata_announcements"]));
                }else {
                    reject("no row");
                }
            }catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getById)) ' + e
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

}

/**
 * @typedef Announcement
 * @property {Course.model} course.required
 * @property {string} author.required
 * @property {string} content.required
 * @property {string} date.required
 * @property {string} id
 */

export class Announcement {
    course: Course;
    author: string;
    content: string;
    date: string;
    id: number;

    /**
     * Constructor
     * @param course {Course}
     * @param author {String}
     * @param content {String}
     * @param date {String}
     * @param id {number}
     */
    constructor(course: Course, author: string, content: string, date: string, id: any = null) {
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
    create(): Promise<boolean>{
        let content = this.content;
        let author = this.author;
        let editor = author;
        let course = this.course;
        let date = this.date;


        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("INSERT INTO `splan`.`data_announcements` (`content`, `shownOnDisplay`, `displayColor`, `displayOrder`, `author`, `editedBy`, `grade`, `subject`, `group`, `date`) VALUES (?, '1', 'red', '1', ?, ?, ?, ?, ?, ?)", [content, author, editor, course.grade, course.subject, course.group, date]);
                resolve(true);
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(create) ' + e
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Submits the updated Announcement to the Database
     * @returns {Promise<boolean>}
     */
    update(): Promise<boolean> {
        let content = this.content;
        let editor = this.author;
        let course = this.course;
        let date = this.date;
        let id = "1";

        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("UPDATE `splan`.`data_announcements` SET `content` = ?, `edited` = CURRENT_TIMESTAMP, `editedBy` = ?, `grade` = ?, `subject` = ?, `group` = ?, `date` = ? WHERE iddata_announcements = ?", [content, editor, course.grade, course.subject, course.group, date, id]);
                resolve(true);
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(update) ' + e
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });

    }

    /**
     * Deletes the Announcement from the Database
     * @returns {Promise<boolean>}
     */
    delete(): Promise<boolean> {
        let id = this.id;
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("DELETE FROM `splan`.`data_announcements` WHERE iddata_announcements = ?", [id]);
                resolve(true);
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(delete) ' + e
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}