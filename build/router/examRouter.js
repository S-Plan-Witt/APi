"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeTable_1 = require("../classes/timeTable");
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const exams_1 = require("../classes/exams");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
exports.router.post('/', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    try {
        let body = req.body;
        for (let i = 0; i < body.length; i++) {
            let element = body[i];
            let exam = new exams_1.Exam(element["date"], element["from"], element["to"], new timeTable_1.Course(element["grade"], element["subject"], element["group"]), element["teacher"], element["students"], element["room"], false, element["id"]);
            await exam.save();
        }
        res.sendStatus(200);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});
exports.router.get('/', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    let rows = await exams_1.Exams.getAll();
    await res.json(rows);
});
exports.router.put('/:id', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    let id = req.params.id;
    //TODO add exam update
    res.sendStatus(605);
});
exports.router.delete('/id/:id', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    //TODO add Delete
    res.sendStatus(605);
});
exports.router.get('/exams/supervisors/:id', async function (req, res) {
    if (!req.decoded.admin) {
        return res.sendStatus(401);
    }
    try {
        let data = await exams_1.Supervisors.getById(parseInt(req.params.id));
        await res.json(data);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'ExamsRouter',
            message: 'Err: ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});
