"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const timeTable_1 = require("../classes/timeTable");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
exports.router.post('/lessons', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    let body = req.body;
    for (let i = 0; i < body.length; i++) {
        let lesson = body[i];
        try {
            await timeTable_1.TimeTable.addLesson(lesson);
        }
        catch (e) {
            console.log(e);
            //TODO add logger
            //Add handler
        }
    }
    res.sendStatus(200);
});
exports.router.post('/find/course', async (req, res) => {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    try {
        let courses = await timeTable_1.TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);
        res.json(courses);
    }
    catch (e) {
        //TODO add logger
        res.sendStatus(500);
    }
});
exports.router.get('/grades', async function (req, res) {
    if (!req.decoded.permissions.all) {
        return res.sendStatus(401);
    }
});
exports.router.get('/courses', async function (req, res) {
    if (!req.decoded.permissions.all) {
        return res.sendStatus(401);
    }
    res.json(await timeTable_1.TimeTable.getAllCourses());
});
exports.router.get('/rebuild', async (req, res) => {
    await timeTable_1.TimeTable.rebuildCourseList();
    res.status(200);
});
