"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const replacementLessons_1 = require("../classes/replacementLessons");
const user_1 = require("../classes/user");
const pushNotifications_1 = require("../classes/pushNotifications");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
exports.router.post('/', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    for (let i = 0; i < req.body.length; i++) {
        let replacementLesson = req.body[i];
        try {
            let status = await replacementLessons_1.ReplacementLessons.add(replacementLesson);
            let devices = await user_1.User.getStudentDevicesByCourse(replacementLesson);
            //devices = devices.concat(await user.getDevicesByUsername("bad"));
            console.log(status);
            let pushNotifis = new pushNotifications_1.PushNotifications();
            if (status === "added") {
                pushNotifis.sendBulk(devices, "Hinzugefügt: " + replacementLesson.subject, " Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }
            else if (status === "updated") {
                pushNotifis.sendBulk(devices, "Aktualisiert: " + replacementLesson.subject, " Stunde: " + replacementLesson.lesson + " Info: " + replacementLesson.info + " Datum: " + replacementLesson.date);
            }
        }
        catch (e) {
            console.log(e);
            logger.log({
                level: 'warn',
                label: 'ReplacementLessons',
                message: 'Error while processing post ' + e
            });
            //add handler
        }
    }
    res.sendStatus(200);
});
exports.router.get('/', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    try {
        await res.json(await replacementLessons_1.ReplacementLessons.getAll());
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
exports.router.get('/date/:date', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    try {
        let date = req.params.date;
        let result = await replacementLessons_1.ReplacementLessons.getByDate(date);
        await res.json(result);
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});
exports.router.get('/id/:id', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    let id = parseInt(req.params.id);
    try {
        let lesson = await replacementLessons_1.ReplacementLessons.getById(id);
        res.json(lesson);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
exports.router.post('/find', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    let info = req.body.info;
    try {
        let lessons = await replacementLessons_1.ReplacementLessons.search(info);
        res.json(lessons);
    }
    catch (e) {
        //TODO add logger
        res.sendStatus(500);
    }
});
exports.router.delete('/id/:id', async function (req, res) {
    if (!req.decoded.admin) {
        //TODO add logger
        return res.sendStatus(401);
    }
    let id = parseInt(req.params.id);
    try {
        let replacementLesson = await replacementLessons_1.ReplacementLessons.deleteById(id);
        let push = new pushNotifications_1.PushNotifications();
        let devices = await user_1.User.getStudentDevicesByCourse(replacementLesson);
        for (const id in devices) {
            if (devices.hasOwnProperty(id)) {
                const device = devices[id];
                await push.send(device.platform, device.device, "Entfernt: " + replacementLesson.subject, "Entfernt: " + replacementLesson.subject + "Datum: " + replacementLesson.date);
            }
        }
        res.sendStatus(200);
    }
    catch (e) {
        console.log(e);
        //TODO add logger
        res.sendStatus(500);
    }
});
