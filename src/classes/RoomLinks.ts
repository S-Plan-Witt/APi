import {RoomLink} from "./RoomLink";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export class RoomLinks {

    /**
     * @returns {Promise<RoomLink[]>}
     */
    static getRoomLinks(date: string, room: string): Promise<RoomLink[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let roomLinks: RoomLink[] = [];
                let rows = await conn.query("SELECT * FROM `data_exam_rooms` WHERE `date`= ? AND `room`= ? ", [date, room]);
                rows.forEach((element: any) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    roomLinks.push(element);
                });
                resolve(roomLinks);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get by course failed:  Err: ' + JSON.stringify(e)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<RoomLink>}
     */
    static getById(id: number): Promise<RoomLink> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let result = await conn.query("SELECT * FROM data_exam_rooms WHERE iddata_exam_rooms = ?", [id]);
                if (result.length === 1) {
                    let row = result[0];
                    let date = new Date(row["date"]);
                    row["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                    resolve(new RoomLink(row["room"], row["from"], row["to"], row["date"]));
                } else {
                    reject("No roomlink")
                }

            } catch (e) {

            } finally {
                await conn.end();
            }
        });
    }


    /**
     * @param roomLink {RoomLink}
     * @returns {Promise<void>}
     */
    static add(roomLink: RoomLink): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("INSERT INTO data_exam_rooms (room, `from`, `to`, date) VALUES (?, ?, ?, ?)", [roomLink.room, roomLink.from, roomLink.to, roomLink.date]);
                resolve();
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'roomLink',
                    message: 'RoomLink Save failed: ' + JSON.stringify(roomLink) + " Err: " + JSON.stringify(e)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }
}