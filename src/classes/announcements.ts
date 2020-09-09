import {Course, TimeTable} from "./timeTable";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class Announcements {

    /**
     * Retrieves all Announcements to corresponding course from the database
     * @returns {Promise<Announcement[]>}
     * @param course
     */
    static getByCourse(course: Course): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM `data_announcements` WHERE `courseId`= ? ", [course.id]);
                resolve(this.convertSqlRowsToObjects(rows));
            } catch (e) {
                console.log(e);
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    static convertSqlRowsToObjects(rows: any): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {

            let announcements: Announcement[] = [];
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                row["date"] = Utils.converMysqlDate(row["date"]);
                announcements.push(new Announcement(await TimeTable.getCourseById(row["courseId"]), row["authorId"], row["editorId"], row["content"], row["date"], row["iddata_announcements"]));
            }
            resolve(announcements);
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
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM `data_announcements`");
                resolve(this.convertSqlRowsToObjects(rows));
            }catch (e) {
                global.logger.log({
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
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM `data_announcements` WHERE iddata_announcements = ?", [id]);
                if (rows.length == 1) {
                    let row = rows[0];
                    row["date"] = Utils.converMysqlDate(row["date"])
                    resolve(new Announcement(await TimeTable.getCourseById(row["courseId"]), row["authorId"], row["editorId"], row["content"], row["date"], row["iddata_announcements"]));
                } else {
                    reject("no row");
                }
            }catch (e) {
                global.logger.log({
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
    authorId: number;
    editorId: number;
    content: string;
    date: string;
    id: number | null;

    /**
     * Constructor
     * @param course {Course}
     * @param authorId
     * @param editorId
     * @param content {String}
     * @param date {String}
     * @param id {number}
     */


    constructor(course: Course, authorId: number, editorId: number, content: string, date: string, id: number | null) {
        this.course = course;
        this.authorId = authorId;
        this.editorId = editorId;
        this.content = content;
        this.date = date;
        this.id = id;
    }

    /**
     * Submits the Announcement to the Database
     * @returns {Promise<boolean>}
     */
    create(): Promise<boolean>{
        let content = this.content;
        let authorId = this.authorId;
        let editorId = authorId;
        let courseId = this.course.id;
        let date = this.date;


        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                await conn.query("INSERT INTO `splan`.`data_announcements` (`content`, `date`, `authorId`, `editorId`, `courseId`) VALUES (?, ?, ?, ?, ?)", [content, date, authorId, editorId, courseId]);
                resolve(true);
            } catch (e) {
                global.logger.log({
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
        let editorId = this.editorId;
        let date = this.date;
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                await conn.query("UPDATE `data_announcements` SET `content` = ?, `edited` = CURRENT_TIMESTAMP, `editorId` = ?, `date` = ? WHERE iddata_announcements = ?", [content, editorId, date, id]);
                resolve(true);
            } catch (e) {
                global.logger.log({
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
                conn = await global.mySQLPool.getConnection();
                await conn.query("DELETE FROM `data_announcements` WHERE iddata_announcements = ?", [id]);
                resolve(true);
            } catch (e) {
                global.logger.log({
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