/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Course} from "./Course";
import {ApiGlobal} from "../types/global";
import {Utils} from "./Utils";
import {TimeTable} from "./TimeTable";
import path from "path";

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
    public course: Course;
    public authorId: number;
    public editorId: number;
    public content: string;
    public date: string;
    public id: number | null;

    /**
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
     * Retrieves all Announcements to corresponding course from the database
     * @returns {Promise<Announcement[]>}
     * @param course
     */
    static getByCourse(course: Course): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM `announcements` WHERE `courseId`= ? ", [course.id]);
                resolve(this.convertSqlRowsToObjects(rows));
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Retrieves all Announcements to corresponding course from the database
     * @returns {Promise<Announcement[]>}
     * @param course
     */
    static getForDisplay(): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows = await conn.query("SELECT * FROM `announcements` WHERE global = 1");
                resolve(this.convertSqlRowsToObjects(rows));
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * Returns an array of Announcements from the given sql result
     * @param rows
     */
    static convertSqlRowsToObjects(rows: any): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {

            let announcements: Announcement[] = [];
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                row["date"] = Utils.convertMysqlDate(row["date"]);
                announcements.push(new Announcement(await Course.getById(row["courseId"]), row["authorId"], row["editorId"], row["content"], row["date"], row["iddata_announcements"]));
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
                let rows = await conn.query("SELECT * FROM `announcements`");
                resolve(this.convertSqlRowsToObjects(rows));
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getAll)) ' + e,
                    file: path.basename(__filename)
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
                let rows = await conn.query("SELECT * FROM `announcements` WHERE id_announcements = ?", [id]);
                if (rows.length === 1) {
                    let row = rows[0];
                    row["date"] = Utils.convertMysqlDate(row["date"])
                    resolve(new Announcement(await Course.getById(row["courseId"]), row["authorId"], row["editorId"], row["content"], row["date"], row["iddata_announcements"]));
                } else {
                    reject("no row");
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Announcements',
                    message: '(getById)) ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
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
                await conn.query("INSERT INTO `announcements` (`content`, `date`, `authorId`, `editorId`, `courseId`) VALUES (?, ?, ?, ?, ?)", [content, date, authorId, editorId, courseId]);
                resolve(true);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(create) ' + e,
                    file: path.basename(__filename)
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
                await conn.query("UPDATE `announcements` SET `content` = ?, `edited` = CURRENT_TIMESTAMP, `editorId` = ?, `date` = ? WHERE id_announcements = ?", [content, editorId, date, id]);
                resolve(true);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(update) ' + e,
                    file: path.basename(__filename)
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
                await conn.query("DELETE FROM `announcements` WHERE id_announcements = ?", [id]);
                resolve(true);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Announcement',
                    message: '(delete) ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}