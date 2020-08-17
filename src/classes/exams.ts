import {User} from "./user";

import winston from 'winston';
const logger = winston.loggers.get('main');

import {ApiGlobal} from "../types/global";
import {Course} from "./timeTable";

declare const global: ApiGlobal;
let pool = global["mySQLPool"];

export class Exams {

    /**
     * @returns {Promise<Exam[]>}
     */
    static getAll(): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT `data_exams`.*, `data_exam_rooms`.room   FROM `data_exams` LEFT JOIN `data_exam_rooms` ON `data_exams`.`roomLink` = `data_exam_rooms`.`iddata_exam_rooms`");
                resolve(await this.sqlRowToArray(rows));
            } catch (err) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get All failed: ' + JSON.stringify(err)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @param course {Course}
     * @returns {Promise<Exam[]>}
     */
    static getByCourse(course: Course): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_exams` WHERE `subject`= ? AND `grade`= ? AND `group`= ?", [course.subject, course.grade, course.group]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get by course failed: ' + JSON.stringify(course) + " Err: " + JSON.stringify(e)
                });
                reject();
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static getByTeacher(teacher: string): Promise<Exam[]>{
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM `data_exams` WHERE `teacher`= ?", [teacher]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                //TODO add logger
                reject(e);

            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static sqlRowToArray(rows: any): Promise<Exam[]>{
        return new Promise(async (resolve, reject) => {
            let data: Exam[] = [];
            for (let i = 0; i < rows.length; i++) {
                let element = rows[i];
                let date = new Date(element["date"]);
                element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
                data.push(new Exam(element["visibleOnDisplay"], element["date"], new Course(element["grade"], element["subject"], element["group"]), element["from"], element["to"], element["teacher"], element["students"], await RoomLinks.getById(element["roomLink"]), element["iddata_klausuren"], element["uniqueIdentifier"]))
            }
            resolve(data);
        });
    }

    /**
     * @returns {Promise<Exam[]>}
     */
    static getByRoomLink(roomLinkId: number): Promise<Exam[]>{
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM data_exams where roomLink = ?;", [roomLinkId]);
                resolve(await this.sqlRowToArray(rows));
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisors by exam failed: ' + roomLinkId + " Err: " + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}

export class RoomLinks {

    /**
     * @returns {Promise<RoomLink[]>}
     */
    static getRoomLinks(date: string, room: string): Promise<RoomLink[]>{
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                let roomLinks: RoomLink[] = [];
                let rows = await conn.query("SELECT * FROM `data_exam_rooms` WHERE `date`= ? AND `room`= ? ", [date, room]);
                rows.forEach((element: any) => {
                    let date = new Date(element["date"]);
                    element["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    roomLinks.push(element);
                });
                resolve(roomLinks);
            } catch (e) {
                logger.log({
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
                conn = await pool.getConnection();
                let result = await conn.query("SELECT * FROM data_exam_rooms WHERE iddata_exam_rooms = ?", [id]);
                if(result.length == 1){
                    let row = result[0];
                    let date = new Date(row["date"]);
                    row["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    resolve(new RoomLink(row["room"],row["from"],row["to"],row["date"]));
                }else {
                    reject("No roomlink")
                }

            }catch (e) {

            } finally {
                await conn.end();
            }
        });
    }


    /**
     * @param roomLink {RoomLink}
     * @returns {Promise<void>}
     */
    static add(roomLink: RoomLink): Promise<void>{
        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                await conn.query("INSERT INTO data_exam_rooms (room, `from`, `to`, date) VALUES (?, ?, ?, ?)", [roomLink.room, roomLink.from, roomLink.to, roomLink.date]);
                resolve();
            } catch (e) {
                logger.log({
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

export class Supervisors {

    /**
     * @param id
     * @returns {Promise<Supervisor[]>}
     */
    static getByRoomLink(id: number): Promise<Supervisor[]>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let data: Supervisor[] = [];
                //TODO Add Supervisor object
                let rows = await conn.query("SELECT * FROM `data_exam_supervisors` LEFT JOIN `users` ON `data_exam_supervisors`.`TeacherId` = `users`.`idusers` WHERE `RoomLink`= ?", [id]);
                rows.forEach((element: any) => {
                    data.push(element);
                });
                resolve(data);
            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisors by exam failed: ' + id + " Err: " + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    /**
     * @param id
     * @returns {Promise<Supervisor>}
     */
    static getById(id: number): Promise<Supervisor>{
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT `data_exam_supervisors`.*,`users`.*, `data_exam_rooms`.`room`, `data_exam_rooms`.`date` FROM `data_exam_supervisors` LEFT JOIN `users` ON `data_exam_supervisors`.`TeacherId` = `users`.`idusers` LEFT JOIN `data_exam_rooms` ON `data_exam_supervisors`.`RoomLink` = `data_exam_rooms`.`iddata_exam_rooms` WHERE `supervisorId`= ?", [id]);
                if(rows.length > 0){
                    let date = new Date(rows[0]["date"]);
                    rows[0]["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                    rows[0]["exams"] = await Exams.getByRoomLink(rows[0]["RoomLink"]);
                    resolve(rows[0]);
                }else{
                    reject("no row");
                }

            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisor by id failed: ' + id + " Err: " + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    //TODO REMOVE
    static getByTeacherUsername(username: string): Promise<Supervisor[]>{
        return new Promise(async (resolve, reject) =>{
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT `data_exam_supervisors`.*, `data_exam_rooms`.`room`, `data_exam_rooms`.`date` FROM `data_exam_supervisors` LEFT JOIN `users` ON `data_exam_supervisors`.`TeacherId` = `users`.`idusers` LEFT JOIN `data_exam_rooms` ON `data_exam_supervisors`.`RoomLink` = `data_exam_rooms`.`iddata_exam_rooms` WHERE `TeacherId`= (SELECT idusers FROM users WHERE users.username = ?)", [username]);
                if(rows.length > 0){
                    let data = [];
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i];
                        let date = new Date(row["date"]);
                        row["date"] = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2,"0")+ "-" + date.getDate().toString().padStart(2,"0");
                        data.push(row)
                    }
                    resolve(data);
                }else{
                    reject("no row");
                }

            } catch (e) {
                logger.log({
                    level: 'error',
                    label: 'exams',
                    message: 'Get supervisor by Teacher username failed: ' + username + " Err: " + JSON.stringify(e)
                });
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }
}



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
    save(): Promise<boolean>{
        let date        = this.date;
        let from        = this.from;
        let to          = this.to;
        let grade       = this.course.grade;
        let subject     = this.course.subject;
        let group       = this.course.group;
        let teacher     = this.teacher;
        let students    = this.students;
        let show        = this.display;
        let room        = this.room;
        let id          = this.id;

        return new Promise(async (resolve, reject) => {
            let avilRoomLinks: any = await RoomLinks.getRoomLinks(date, room);
            if(avilRoomLinks.length == 0){
                await RoomLinks.add(new RoomLink(room, from, to, date));
            }
            avilRoomLinks = await RoomLinks.getRoomLinks(date, room);
            if(avilRoomLinks == 0){
                reject("err");
                return ;
            }
            let linkId = avilRoomLinks[0]["iddata_exam_rooms"];
            let conn ;
            try {
                conn = await pool.getConnection();

                let uniqueIdentifier = grade + '-' + group + '-' + subject + '-' + date;

                let rows = await conn.query('SELECT * FROM data_exams WHERE uniqueIdentifier=?', [uniqueIdentifier]);
                if(rows.length > 0 && id == null){
                    reject("row exists");
                    return ;
                }
                let res;
                if(id != null ){
                    res = await conn.query("UPDATE `data_exams` SET `date` = ?, `subject` = ?, `grade` = ?, `group` = ?, `visibleOnDisplay` = ?, `from` = ?, `to` = ?, `teacher` = ?,`students` = ? WHERE (`iddata_klausuren` = ?);", [date, subject, grade, group,  show, from, to, teacher, students, id]);
                }else {
                    res = await conn.query("INSERT INTO data_exams (date, subject, grade, `group`, visibleOnDisplay, `from`, `to`, teacher, students, roomLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [date,subject, grade , group, show, from, to, teacher, students, linkId]);
                }
                resolve(res);
            } catch (e) {
                logger.log({
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
    delete(): Promise<void>{
        let id = this.id;

        return new Promise(async (resolve, reject) => {
            let conn = await pool.getConnection();
            try {
                await conn.query("DELETE FROM `data_exams` WHERE (`iddata_klausuren` = ?);",[id]);
                logger.log({
                    level: 'silly',
                    label: 'exams',
                    message: 'Deleted: ' + JSON.stringify(id)
                });
                resolve();
            } catch (err) {
                logger.log({
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
/**
 * @typedef RoomLink
 * @property {string} date.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} room.required
 * @property {string} id
 */
export class RoomLink {
    room: any;
    from: any;
    to: any;
    date: any;
    id: number;

    constructor(room: any, from: any, to: any, date: any) {
        this.room = room;
        this.from = from;
        this.to = to;
        this.date = date;
        this.id = 0
    }
}

export class Supervisor extends User{
    //TODO add Supervisor class arguemtns
}
