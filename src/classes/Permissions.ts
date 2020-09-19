import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class Permissions {
    users: boolean;
    usersAdmin: boolean;
    replacementLessons: boolean;
    replacementLessonsAdmin: boolean;
    announcements: boolean;
    announcementsAdmin: boolean;
    timeTable: boolean;
    timeTableAdmin: boolean;
    moodle: boolean;
    moodleAdmin: boolean;
    globalAdmin: boolean;


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

    static getDefault() {
        return new Permissions(false, false, true, false, true, false, true, false, true, false, false);
    }

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
                        message: 'Class: Permissions; Function: getByUID: loaded'
                    });
                    resolve(permissions);
                } else {
                    //TODO error
                    let permissions: Permissions = new Permissions(false, false, false, false, false, false, false, false, false, false, false);

                    resolve(permissions);
                }
            } catch (e) {
                console.log(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }
}