import {Course} from "./Course";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

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
    create(): Promise<boolean> {
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