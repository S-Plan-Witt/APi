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