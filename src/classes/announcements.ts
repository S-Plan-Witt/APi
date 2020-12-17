import {TimeTable} from "./TimeTable";
import {ApiGlobal} from "../types/global";
import {Utils} from "./Utils";
import {Course} from "./Course";
import {Announcement} from "./Announcement";

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
                row["date"] = Utils.convertMysqlDate(row["date"]);
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
            } catch (e) {
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
                if (rows.length === 1) {
                    let row = rows[0];
                    row["date"] = Utils.convertMysqlDate(row["date"])
                    resolve(new Announcement(await TimeTable.getCourseById(row["courseId"]), row["authorId"], row["editorId"], row["content"], row["date"], row["iddata_announcements"]));
                } else {
                    reject("no row");
                }
            } catch (e) {
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
