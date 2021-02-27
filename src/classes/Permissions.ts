/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "../types/global";
import path from "path";

declare const global: ApiGlobal;

/**
 * @typedef Permissions
 * @param users {boolean}
 * @param usersAdmin {boolean}
 * @param replacementLessons {boolean}
 * @param replacementLessonsAdmin {boolean}
 * @param announcements {boolean}
 * @param announcementsAdmin {boolean}
 * @param timeTable {boolean}
 * @param timeTableAdmin {boolean}
 * @param moodle {boolean}
 * @param moodleAdmin {boolean}
 * @param globalAdmin {boolean}
 */
export class Permissions {
    public users: boolean;
    public usersAdmin: boolean;
    public replacementLessons: boolean;
    public replacementLessonsAdmin: boolean;
    public announcements: boolean;
    public announcementsAdmin: boolean;
    public timeTable: boolean;
    public timeTableAdmin: boolean;
    public moodle: boolean;
    public moodleAdmin: boolean;
    public globalAdmin: boolean;

    constructor(users: boolean, usersAdmin: boolean, replacementLessons: boolean, replacementLessonsAdmin: boolean, announcements: boolean, announcementsAdmin: boolean, timeTable: boolean, timeTableAdmin: boolean, moodle: boolean, moodleAdmin: boolean, globalAdmin: boolean) {
        this.users = users;
        this.usersAdmin = usersAdmin;
        this.replacementLessons = replacementLessons;
        this.replacementLessonsAdmin = replacementLessonsAdmin;
        this.announcements = announcements;
        this.announcementsAdmin = announcementsAdmin;
        this.timeTable = timeTable;
        this.timeTableAdmin = timeTableAdmin;
        this.moodle = moodle;
        this.moodleAdmin = moodleAdmin;
        this.globalAdmin = globalAdmin;
    }

    /**
     * Returns the standard Permission object (used for new users)
     */
    static getDefault() {
        return new Permissions(false, false, true, false, true, false, true, false, true, false, false);
    }

    /**
     * loads the Permissions object for the given user
     * @param userId
     */
    static getByUID(userId: number): Promise<Permissions> {
        return new Promise(async (resolve, reject) => {
            let conn;

            try {
                conn = await global.mySQLPool.getConnection();
                let result = await conn.query("SELECT * FROM permissions WHERE userId = ?", [userId]);
                if (result.length === 1) {
                    let uResult = result[0];
                    let permissions: Permissions = new Permissions(false, false, false, false, false, false, false, false, false, false, false);

                    if (uResult["users"] === 2) {
                        permissions.usersAdmin = true;
                        permissions.users = true;
                    } else if (uResult["users"] === 1) {
                        permissions.users = true;
                    }

                    if (uResult["replacementLessons"] === 2) {
                        permissions.replacementLessonsAdmin = true;
                        permissions.replacementLessons = true;
                    } else if (uResult["replacementLessons"] === 1) {
                        permissions.replacementLessons = true;
                    }

                    if (uResult["announcements"] === 2) {
                        permissions.announcementsAdmin = true;
                        permissions.announcements = true;
                    } else if (uResult["announcements"] === 1) {
                        permissions.announcementsAdmin = true;
                    }

                    if (uResult["timeTable"] === 2) {
                        permissions.timeTableAdmin = true;
                        permissions.timeTable = true;
                    } else if (uResult["timeTable"] === 1) {
                        permissions.timeTable = true;
                    }

                    if (uResult["moodle"] === 2) {
                        permissions.moodleAdmin = true;
                        permissions.moodle = true;
                    } else if (uResult["moodle"] === 1) {
                        permissions.moodle = true;
                    }

                    if (uResult["globalAdmin"] === 1) {
                        permissions = new Permissions(true, true, true, true, true, true, true, true, true, true, true);
                    }
                    global.logger.log({
                        level: 'silly',
                        label: 'Permissions',
                        message: 'Class: Permissions; Function: getByUID: loaded',
                        file: path.basename(__filename)
                    });
                    resolve(permissions);
                } else {
                    let permissions: Permissions = new Permissions(false, false, false, false, false, false, false, false, false, false, false);

                    resolve(permissions);
                }
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'Permissions',
                    message: '(getByUID) error: ' + e,
                    file: path.basename(__filename)
                });
            } finally {
                if (conn) await conn.end();
            }
        });
    }
}