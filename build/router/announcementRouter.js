"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeTable_1 = require("../classes/timeTable");
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const announcements_1 = require("../classes/announcements");
const user_1 = require("../classes/user");
const pushNotifications_1 = require("../classes/pushNotifications");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
exports.router.use((req, res, next) => {
    if (req.decoded.admin) {
        next();
        return;
    }
    else if (req.decoded.userType == 'teacher') {
        next();
        return;
    }
    return res.sendStatus(401);
});
exports.router.post('/', async function (req, res) {
    let body = req.body;
    let author = req.decoded.username;
    try {
        let course = new timeTable_1.Course(body["course"]["grade"], body["course"]["subject"], body["course"]["group"], null);
        if (!req.decoded.admin) {
            let user = await user_1.User.getUserByUsername(req.decoded.username);
            if (!user.isTeacherOf(course)) {
                return res.sendStatus(401);
            }
        }
        let announcement = new announcements_1.Announcement(course, author, body["content"], body["date"]);
        await announcement.create();
        let devices = await user_1.User.getStudentDevicesByCourse(course);
        let push = new pushNotifications_1.PushNotifications();
        push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Hinzugefügt: " + announcement.content + " Datum: " + announcement.date);
        res.sendStatus(200);
    }
    catch (e) {
        console.log(e);
        logger.log({
            level: 'error',
            label: 'announcementsRouter',
            message: 'Error while processing request ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});
exports.router.get('/', async function (req, res) {
    let rows = await announcements_1.Announcements.getAll();
    await res.json(rows);
});
//TODO jDoc
exports.router.put('/id/:id', async function (req, res) {
    let body = req.body;
    let id = parseInt(req.params.id);
    let announcement = await announcements_1.Announcements.getById(id);
    announcement.course = new timeTable_1.Course(body["course"]["grade"], body["course"]["subject"], body["course"]["group"], null);
    announcement.content = body["content"];
    announcement.date = body["date"];
    await announcement.update();
    let devices = await user_1.User.getStudentDevicesByCourse(announcement.course);
    let push = new pushNotifications_1.PushNotifications();
    push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Geändert: " + announcement.content + " Datum: " + announcement.date);
    res.sendStatus(200);
});
//TODO jDoc
exports.router.get('/id/:id', async function (req, res) {
    let id = parseInt(req.params.id);
    let announcement = await announcements_1.Announcements.getById(id);
    res.json(announcement);
});
//TODO jDoc
//TODO jDoc
exports.router.delete('/id/:id', async function (req, res) {
    try {
        let id = parseInt(req.params.id);
        let announcement = await announcements_1.Announcements.getById(id);
        if (!req.decoded.admin) {
            let user = await user_1.User.getUserByUsername(req.decoded.username);
            if (!user.isTeacherOf(announcement.course)) {
                return res.sendStatus(401);
            }
        }
        await announcement.delete();
        let devices = await user_1.User.getStudentDevicesByCourse(announcement.course);
        let push = new pushNotifications_1.PushNotifications();
        push.sendBulk(devices, "Aushang: " + announcement.course.subject, " Entfernt Datum: " + announcement.date);
        await res.sendStatus(200);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        await res.sendStatus(500);
    }
});
