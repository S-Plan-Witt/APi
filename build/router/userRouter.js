"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeTable_1 = require("../classes/timeTable");
const jwt_1 = require("../classes/jwt");
const replacementLessons_1 = require("../classes/replacementLessons");
const announcements_1 = require("../classes/announcements");
const exams_1 = require("../classes/exams");
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const user_1 = require("../classes/user");
const totp_1 = require("../classes/totp");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
/**
 * Information Path
 * Returns Json with links to userinformations
 */
exports.router.get('/', async function (req, res) {
    try {
        let username = req.decoded.username;
        let user = await user_1.User.getUserByUsername(username);
        await res.json(user);
    }
    catch (e) {
        await res.sendStatus(500);
    }
});
/**
 * Request Api-accesstoken by supplying authentication information
 * Supply JSON. w. username, password
 * Supply PreAuthToken
 * Return Accesskey and usertype as Json
 */
exports.router.post('/login', async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let token = req.body.token;
    let preauth = false;
    if (username != null && password != null) {
        username = username.toLowerCase();
    }
    else if (token != null) {
        try {
            username = await jwt_1.Jwt.preAuth(token);
            preauth = true;
        }
        catch (e) {
            logger.log({
                level: 'error',
                label: 'Login',
                message: 'token Error : ' + e
            });
            res.sendStatus(601);
            return;
        }
    }
    else {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login : No method provided '
        });
        res.sendStatus(601);
        return;
    }
    let user;
    try {
        user = await user_1.User.getUserByUsername(username);
    }
    catch (e) {
        res.sendStatus(602);
        return;
    }
    try {
        await user.isActive();
        if (!preauth) {
            await user.verifyPassword(password);
            if (user.secondFactor === 1) {
                if (req.body.hasOwnProperty("secondFactor")) {
                    let code = req.body["secondFactor"];
                    try {
                        await totp_1.Totp.verifyUserCode(code, user.id);
                    }
                    catch (e) {
                        res.sendStatus(401);
                        logger.log({
                            level: 'info',
                            label: 'Login',
                            message: 'SecondFactor failed : ' + username
                        });
                        return;
                    }
                }
                else {
                    res.sendStatus(602);
                    logger.log({
                        level: 'info',
                        label: 'Login',
                        message: 'Futher information required : ' + username
                    });
                    return;
                }
            }
        }
        let token = await user.generateToken();
        res.json({ "token": token, "userType": user.type });
        logger.log({
            level: 'info',
            label: 'Login',
            message: 'Loggedin : ' + username
        });
    }
    catch (e) {
        console.log(e);
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login/ ; ' + JSON.stringify(e)
        });
        res.sendStatus(601);
    }
});
/**
 * Get courses for current user
 * Returns Json Array with courses
 */
exports.router.get('/courses', async function (req, res) {
    let username = req.decoded.username;
    let courses;
    try {
        if (req.decoded.userType === "student") {
            //Get userId for user
            let user = await user_1.User.getUserByUsername(username);
            //Get courses for user
            courses = user.courses;
            await res.json(courses);
        }
        else if (req.decoded.userType === "teacher") {
            //Get courses for user
            let user = await user_1.User.getUserByUsername(username);
            courses = await user.courses;
            await res.json(courses);
        }
        else {
            logger.log({
                level: 'error',
                label: 'Express',
                message: 'Routing: /user/courses : invalid usertype :' + req.decoded.userType
            });
            res.sendStatus(401);
        }
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/courses ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Get lessons for current user
 * Returns Json Array with lessons for user
 */
exports.router.get('/lessons', async function (req, res) {
    // => Array containing all lesson for user
    let response = [];
    let username = req.decoded.username;
    try {
        let user = await user_1.User.getUserByUsername(username);
        let courses = user.courses;
        for (const course of courses) {
            try {
                //Get lesson for course as array
                let lessons = await timeTable_1.TimeTable.getLessonsByCourse(course);
                lessons.forEach((lesson) => {
                    //Add lesson to response array
                    response.push(lesson);
                });
            }
            catch (e) {
                console.log(e);
                logger.log({
                    level: 'error',
                    label: 'Express',
                    message: 'Routing: /user/lessons : processinf courses: ' + JSON.stringify(e)
                });
                //TODO add handler
            }
        }
        res.json(response);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/lessons : ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});
/**
 * Get replacement lessons for current user
 * Returns Json array with replacement lessons
 */
exports.router.get('/replacementlessons', async function (req, res) {
    let username = req.decoded.username;
    //Generate date of today
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    //create day string
    let dateToday = yyyy + '-' + mm + '-' + dd;
    //Generate date of today + 6 days
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);
    dd = String(endDate.getDate()).padStart(2, '0');
    mm = String(endDate.getMonth() + 1).padStart(2, '0');
    yyyy = endDate.getFullYear();
    let dateEnd = yyyy + '-' + mm + '-' + dd;
    try {
        let courses;
        let response = [];
        if (req.decoded.userType === "student") {
            let user = await user_1.User.getUserByUsername(username);
            courses = user.courses;
        }
        else if (req.decoded.userType === "teacher") {
            let user = await user_1.User.getUserByUsername(username);
            courses = user.courses;
        }
        else {
            //TODO add logger
            //TODO corr. status code
            res.sendStatus(401);
            return;
        }
        for (const course of courses) {
            //Get replacement lessons with today and today + 6 days
            let data = await replacementLessons_1.ReplacementLessons.getByCourse(course);
            data.forEach((replacementLesson) => {
                //Add replacement lesson to all replacement lessons
                response.push(replacementLesson);
            });
        }
        if (req.decoded.userType === "teacher") {
            //Get replacement lessons hold by teacher
            let data = await replacementLessons_1.ReplacementLessons.getByTeacher(username, dateToday, dateEnd);
            console.log(data);
            data.forEach((replacementLesson) => {
                response.push(replacementLesson);
            });
        }
        await res.json(response);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
//TODO jDoc
exports.router.get('/announcements', async function (req, res) {
    let username = req.decoded.username;
    let user = await user_1.User.getUserByUsername(username);
    let courses = user.courses;
    let response = [];
    for (const course of courses) {
        try {
            let data = await announcements_1.Announcements.getByCourse(course);
            data.forEach(element => {
                response.push(element);
            });
        }
        catch (e) {
            //TODO add logger
            //TODO add handler
            console.log(e);
        }
    }
    res.json(response);
});
/**
 * Get exams for current user
 * Returns Json array with exams (containing necessary information)
 */
exports.router.get('/exams', async function (req, res) {
    let username = req.decoded.username;
    try {
        let response = [];
        console.log(req.decoded.userType);
        if (req.decoded.userType === "student") {
            let user = await user_1.User.getUserByUsername(username);
            let courses = user.courses;
            for (const course of courses) {
                try {
                    //if user should see exams in this course
                    if (course.exams) {
                        //Get exams by course
                        let data = await exams_1.Exams.getByCourse(course);
                        data.forEach(exam => {
                            response.push(exam);
                        });
                    }
                    else if (user.type === 'teacher') {
                        //Get exams by course
                        let data = await exams_1.Exams.getByCourse(course);
                        data.forEach(exam => {
                            response.push(exam);
                        });
                    }
                }
                catch (e) {
                    //TODO add logger
                    //TODO add handler
                    console.log(e);
                }
            }
        }
        else if (req.decoded.userType === "teacher") {
            response = await exams_1.Exams.getByTeacher(username);
        }
        //TODO add else
        res.json(response);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
exports.router.get('/supervisors', async function (req, res) {
    let username = req.decoded.username;
    try {
        let data = await exams_1.Supervisors.getByTeacherUsername(username);
        res.json(data);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Get all push devices for user
 * Returns Json array with all devices
 */
exports.router.get('/devices', async function (req, res) {
    try {
        let user = await user_1.User.getUserByUsername(req.decoded.username);
        let data = await user.devices;
        res.json(data);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Add device for user
 */
exports.router.post('/devices', async function (req, res) {
    let username = req.decoded.username;
    let deviceId = req.body.deviceId;
    let platform = req.body.plattform;
    try {
        let user = await user_1.User.getUserByUsername(username);
        if (await user.addDevice(deviceId, platform)) {
            res.sendStatus(200);
        }
        else {
            res.sendStatus(200);
        }
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Delete user push device by id
 */
exports.router.delete('/devices/deviceId/:id', async function (req, res) {
    //TODO not null req.
    let deviceId = req.params.id;
    try {
        //TODO Fix
        await user_1.User.removeDevice(deviceId);
        res.sendStatus(200);
    }
    catch (e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Delete user push device by id
 */
exports.router.delete('/devices/deviceId/', async function (req, res) {
    //TODO . != [""]
    let deviceId = req.body.deviceId;
    try {
        await user_1.User.removeDevice(deviceId);
        res.sendStatus(200);
    }
    catch (e) {
        //TODO add logger
        res.sendStatus(500);
    }
});
exports.router.get('/auth/totp', async function (req, res) {
    res.sendStatus(200);
});
exports.router.post('/auth/totp', async function (req, res) {
    if (req.body.hasOwnProperty("password") && req.body.hasOwnProperty("key")) {
        let user;
        let tokenId;
        try {
            user = req.user;
        }
        catch (e) {
            res.sendStatus(602);
            return;
        }
        try {
            await user.verifyPassword(req.body["password"]);
        }
        catch (e) {
            res.json({ "error": "Invalid Password" });
            return;
        }
        try {
            let key = req.body["key"];
            let alias = req.body["alias"];
            tokenId = await totp_1.Totp.saveTokenForUser(key, user.id, alias);
        }
        catch (e) {
        }
        res.json(tokenId);
    }
    else {
        res.json({ "err": "Invalid Parameters" });
    }
});
exports.router.post('/auth/totp/verify', async function (req, res) {
    if (req.body.hasOwnProperty("keyId") && req.body.hasOwnProperty("code")) {
        try {
            let keyId = req.body["keyId"];
            let code = req.body["code"];
            await totp_1.Totp.verifyKey(keyId, code);
            await res.sendStatus(200);
        }
        catch (e) {
            console.log(e);
            await res.json({ err: e });
        }
    }
    else {
        res.json({ "err": "Invalid Parameters", body: req.body });
    }
});
exports.router.delete('/auth/totp/id/:id', async function (req, res) {
    try {
        await totp_1.Totp.removeById(parseInt(req.params.id), req.user.id);
        res.sendStatus(200);
    }
    catch (e) {
        console.log(e);
        res.json({ "err": e });
    }
});
