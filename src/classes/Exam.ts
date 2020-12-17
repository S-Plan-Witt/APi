import {Course} from "./Course";
import {RoomLink} from "./RoomLink";
import {ApiGlobal} from "../types/global";
import {RoomLinks} from "./RoomLinks";

declare const global: ApiGlobal;

export class Exam {
    display: boolean;
    date: string;
    course: Course;
    from: string;
    to: string;
    teacher: string;
    students: number;
    roomLink: RoomLink | null;
    room: string;
    id: number;
    uniqueIdentifier: string;


    constructor(display: boolean, date: string, course: Course, from: string, to: string, teacher: string, students: number, roomLink: RoomLink | null, id: number, uniqueIdentifier: string) {
        this.display = display;
        this.date = date;
        this.course = course;
        this.from = from;
        this.to = to;
        this.teacher = teacher;
        this.students = students;
        this.roomLink = roomLink;
        this.id = id;
        this.uniqueIdentifier = uniqueIdentifier;
        this.room = "";
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    save(): Promise<boolean> {
        let date = this.date;
        let from = this.from;
        let to = this.to;
        let grade = this.course.grade;
        let subject = this.course.subject;
        let group = this.course.group;
        let teacher = this.teacher;
        let students = this.students;
        let show = this.display;
        let room = this.room;
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let avilRoomLinks: any = await RoomLinks.getRoomLinks(date, room);
            if (avilRoomLinks.length === 0) {
                await RoomLinks.add(new RoomLink(room, from, to, date));
            }
            avilRoomLinks = await RoomLinks.getRoomLinks(date, room);
            if (avilRoomLinks === 0) {
                reject("err");
                return;
            }
            if (teacher === undefined) {
                teacher = "";
            }
            if (students === undefined) {
                students = 0;
            }

            let linkId = avilRoomLinks[0]["iddata_exam_rooms"];
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();

                let uniqueIdentifier = grade + '-' + group + '-' + subject + '-' + date;

                let rows = await conn.query('SELECT * FROM data_exams WHERE uniqueIdentifier=?', [uniqueIdentifier]);
                if (rows.length > 0 && id == null) {
                    reject("row exists");
                    return;
                }
                let res;
                if (id != null) {
                    res = await conn.query("UPDATE `data_exams` SET `date` = ?, `subject` = ?, `grade` = ?, `group` = ?, `visibleOnDisplay` = ?, `from` = ?, `to` = ?, `teacher` = ?,`students` = ? WHERE (`iddata_klausuren` = ?);", [date, subject, grade, group, show, from, to, teacher, students, id]);
                } else {
                    res = await conn.query("INSERT INTO data_exams (date, subject, grade, `group`, visibleOnDisplay, `from`, `to`, teacher, students, roomLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [date, subject, grade, group, show, from, to, teacher, students, linkId]);
                }
                resolve(res);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Err: ' + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<void>}
     */
    delete(): Promise<void> {
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                await conn.query("DELETE FROM `data_exams` WHERE (`iddata_klausuren` = ?);", [id]);
                global.logger.log({
                    level: 'silly',
                    label: 'exams',
                    message: 'Deleted: ' + JSON.stringify(id)
                });
                resolve();
            } catch (err) {
                global.logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Delete failed: ' + JSON.stringify(id) + " Err: " + JSON.stringify(err)
                });
                reject(err);
            } finally {
                await conn.end();
            }
        });
    }
}