/*
 *  Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import {ApiGlobal} from "../types/global";
import {Exam} from "./Exam";
import {ReplacementLesson} from "./ReplacementLesson";
import {Announcement} from "./Announcement";

declare const global: ApiGlobal;

export class Display {
    config: DisplayConfig;

    constructor(config: DisplayConfig, id: number) {
        this.config = config;
    }

    static getById(id: number): Promise<Display> {
        return new Promise(async (resolve, reject) => {
            let conn = await global.mySQLPool.getConnection();
            try {
                let rows: DisplayTableRow[] = await conn.query("SELECT * FROM `displays` WHERE `iddisplays`= ?", [id]);
                if (rows.length == 1) {
                    resolve(new Display(new DisplayConfig(rows[0].exams, rows[0].replacementLessons, rows[0].announcements, rows[0].turnOnTime, rows[0].turnOffTime, rows[0].autoTurnOnOffActive, rows[0].updateInterval), rows[0].iddisplays));
                } else {
                    reject("Not found");
                }
            } catch (e) {
                reject(e);
            } finally {
                await conn.end();
            }
        });
    }

    getExams(): Promise<Exam[]> {
        return new Promise(async (resolve, reject) => {
            resolve(Exam.getUpcomingOnDisplay());
        });
    }

    getReplacementLessons(): Promise<ReplacementLesson[]> {
        return new Promise(async (resolve, reject) => {
            resolve(ReplacementLesson.getUpcoming());
        });
    }

    getAnnouncements(): Promise<Announcement[]> {
        return new Promise(async (resolve, reject) => {
            resolve([]);
        });
    }

    generateAccessToken() {
        return new Promise(async (resolve, reject) => {
            resolve("");
        });
    }
}

export class DisplayConfig {
    exams: boolean = false;
    replacementLessons: boolean = false;
    announcements: boolean = false;
    turnOnTime: string = "";
    turnOffTime: string = "";
    turnOnOffActive: boolean = false;
    updateInterval: number;


    constructor(exams: boolean, replacementLessons: boolean, announcements: boolean, turnOnTime: string, turnOffTime: string, turnOnOffActive: boolean, updateInterval: number) {
        this.exams = exams;
        this.replacementLessons = replacementLessons;
        this.announcements = announcements;
        this.turnOnTime = turnOnTime;
        this.turnOffTime = turnOffTime;
        this.turnOnOffActive = turnOnOffActive;
        this.updateInterval = updateInterval;
    }
}


type DisplayTableRow = {
    iddisplays: number;
    name: string;
    exams: boolean;
    replacementLessons: boolean;
    announcements: boolean;
    turnOnTime: string;
    turnOffTime: string;
    autoTurnOnOffActive: boolean;
    updateInterval: number;
}