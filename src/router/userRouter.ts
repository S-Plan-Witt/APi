import {TimeTable} from '../classes/timeTable';
import {Jwt} from '../classes/jwt';
import {ReplacementLesson, ReplacementLessons} from '../classes/replacementLessons';
import {Announcement, Announcements} from '../classes/announcements';
import {Exam, Exams, Supervisors} from '../classes/exams';
import express, {Request, Response} from 'express';
import {User} from '../classes/user';
import {Totp} from '../classes/totp';
import {Ldap} from "../classes/ldap";
import assert from "assert";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export let router = express.Router();


/**
 * Return the current user
 * @route POST /user/
 * @group User - Operations about logged in user
 * @returns {User.model} 200
 * @returns {Error} 401 - Wrong Credentials
 */
router.get('/', async function(req,res){
    try {
        await res.json(req.user);
    } catch (e) {
        await res.sendStatus(500)
    }
});


/**
 * Return the JWT to access the Api
 * @sum Login
 * @route POST /user/login
 * @group User - Operations about logged in user
 * @consumes application/json
 * @param {LoginRequest.model} LoginRequest.body.required - username
 * @returns {LoginResponse.model} 200
 * @returns {Error} 602 - missing secondFactor
 * @returns {Error} 401 - Wrong Credentials
 */
router.post('/login', async function (req: Request, res: Response) {

    let username = req.body.username;
    let password = req.body.password;
    let token = req.body.token;
    let preauth = false;

    if(username != null && password != null){
        username = username.toLowerCase();

    }else if(token != null){
        try{
            username = await Jwt.preAuth(token);
            preauth = true;

        }catch(e){
            global.logger.log({
                level: 'error',
                label: 'Login',
                message: 'token Error : ' + e
            });
            res.sendStatus(601);
            return ;
        }
    }else{
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login : No method provided '
        });
        res.sendStatus(601);
        return;
    }
    let user: User | null = null;
    try {
        user = await User.getUserByUsername(username);
    }catch (e) {
        //TODO User not in DB
    }
    if(user == null){
        try {
            user = await Ldap.getUserByUsername(username);
            await User.createUserFromLdap(username);
            user = await User.getUserByUsername(username);
            console.log(user)
        }catch (e) {
            res.sendStatus(401);
            global.logger.log({
                level: 'error',
                label: 'User',
                message: ' Login: /user/login : user not found (' + username + ') e:' + JSON.stringify(e)
            });
            //res.send("User not available")
            return;
        }
    }

    try{
        await user.isActive();
        if(!preauth){
            await user.verifyPassword(password);
            if(user.secondFactor === 1){
                if(req.body.hasOwnProperty("secondFactor")){
                    let code = req.body["secondFactor"];
                    try {
                        if (user.id != null) {
                            await Totp.verifyUserCode(code, user.id);
                        }
                        console.log("ERROR")
                    }catch (e) {
                        res.sendStatus(401);
                        global.logger.log({
                            level: 'info',
                            label: 'Login',
                            message: 'SecondFactor failed : ' + username
                        });
                        return ;
                    }
                }else {
                    res.sendStatus(602);
                    global.logger.log({
                        level: 'info',
                        label: 'Login',
                        message: 'Futher information required : ' + username
                    });
                    return;
                }
            }
        }
        let token = await user.generateToken();
        let type = "";
        if (user.type == 1) type = "student";
        if (user.type == 2) type = "teacher";
        res.json({"token": token, "userType": type});
        global.logger.log({
            level: 'info',
            label: 'Login',
            message: 'Loggedin : ' + username
        });
    }catch(e){
        console.log(e);
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/login/ ; ' + JSON.stringify(e)
        });
        res.sendStatus(601);
    }
});

/**
 * List all courses for the user
 * @route GET /user/courses
 * @group User - Operations about logged in user
 * @returns {Array.<Course>} 200
 * @returns {Error} 602 - missing secondFactor
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.get('/courses',  async function (req: Request, res: Response) {
    let user = req.user;
    let courses;
    try{
        if(req.decoded.userType === "student"){
            //Get userId for user
            //Get courses for user
            courses = user.courses;
            await res.json(courses);
        }else if(req.decoded.userType === "teacher"){
            //Get courses for user
            courses = user.courses;
            await res.json(courses);
        }else{
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: 'Routing: /user/courses : invalid usertype :' + req.decoded.userType
            });
            res.sendStatus(401);
        }
    } catch(e){
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/courses ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * List all lessons for the user
 * @route GET /user/lessons
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<Lesson>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/lessons',  async function (req: Request, res: Response) {
    // => Array containing all lesson for user
    let response: any = [];

    try{
        let courses = req.user.courses;
        if(courses != null){
            for(const course of courses){
                try{
                    //Get lesson for course as array
                    let lessons: any = await TimeTable.getLessonsByCourse(course);
                    console.log(lessons)
                    lessons.forEach((lesson:any) => {
                        //Add lesson to response array
                        response.push(lesson);
                    });
                } catch(e){
                    console.log(e);
                    global.logger.log({
                        level: 'error',
                        label: 'Express',
                        message: 'Routing: /user/lessons : processinf courses: ' + JSON.stringify(e)
                    });
                    //TODO add handler
                }
            }
        }
        res.json(response);
    } catch(e){
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /user/lessons : ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * List all replacement lessons for the user
 * @route GET /user/lessons
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<ReplacementLesson>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/replacementlessons',  async function (req: Request, res: Response) {

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
        let response: any = [];
        if(req.decoded.userType === "student" || req.decoded.userType === "teacher"){
            courses = req.user.courses;
        }else{
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: 'Routing: /user/replacementlessons : rej (503)'
            });

            res.sendStatus(503);
            return;
        }

        for(const course of courses){
            //Get replacement lessons with today and today + 6 days
            let data: any = await ReplacementLessons.getByCourse(course);
            data.forEach((replacementLesson: ReplacementLesson) => {
                //Add replacement lesson to all replacement lessons
                let dataset = {id: replacementLesson.id, courseId: replacementLesson.course.id, lessonId: replacementLesson.lesson.id, room: replacementLesson.room, subject: replacementLesson.subject, info: replacementLesson.info, date: replacementLesson.date}
                response.push(dataset);
            });
        }
        if(req.decoded.userType === "teacher"){
            //Get replacement lessons hold by teacher
            assert(req.user.id != null)
            let data: any = await ReplacementLessons.getByTeacher(req.user.id, dateToday, dateEnd);
            data.forEach((replacementLesson: any) => {
                let dataset = {id: replacementLesson.id, courseId: replacementLesson.course.id, lessonId: replacementLesson.lesson.id, room: replacementLesson.room, subject: replacementLesson.subject,teacherId: replacementLesson.teacherId, info: replacementLesson.info, date: replacementLesson.date}
                response.push(dataset);
            });
        }

        await res.json(response);
    }catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Lists all Announcements for the user
 * @route GET /user/announcements
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<Announcement>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/announcements',  async (req: Request, res: Response) => {
    let courses = req.user.courses;
    let response: any = [];
    for(const course of courses){
        try{
            let data: Announcements[] = await Announcements.getByCourse(course);
            for (let i = 0; i < data.length; i++) {
                let announcement: any = data[i];
                response.push({courseId: announcement.course.id, authorId: announcement.authorId, editorId: announcement.editorId, date: announcement.date, id: announcement.id, content: announcement.content})
            }

        } catch(e){
            //TODO add logger
            //TODO add handler
            console.log(e);
        }
    }

    res.json(response);
});

/**
 * Lists all exams for the user or if teacher, for his courses
 * @route GET /user/exams
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<Exam>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/exams',  async function (req: Request, res: Response) {
    try{
        let response: Exam[] = [];
        console.log("UT:" + req.decoded.userType)
        if(req.decoded.userType === "student"){
            let courses = req.user.courses;

            for(const course of courses){
                try{
                    //if user should see exams in this course
                    if (course.exams) {
                        //Get exams by course
                        let data = await Exams.getByCourse(course);
                        data.forEach(exam => {
                            response.push(exam);
                        });
                    } else if (req.user.type === 2) {
                        //Get exams by course
                        let data: Exam[] = await Exams.getByCourse(course);
                        data.forEach(exam => {
                            response.push(exam);
                        });
                    }
                } catch(e){
                    //TODO add logger
                    //TODO add handler
                    console.log(e)
                }
            }

        }else if(req.decoded.userType === "teacher"){
            response = await Exams.getByTeacher(req.user.username);
        }
        //TODO add else
        res.json(response);
    }catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * only for teachers - returns all supervisor blocks
 * @route GET /user/supervisors
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<Supervisor>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/supervisors',  async function (req: Request, res: Response) {
    let username = req.user.username;
    try{
        let data = await Supervisors.getByTeacherUsername(username);
        res.json(data);
    }catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Lists all devices for the user
 * @route GET /user/devices
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {Array.<Device>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/devices', async function (req: Request, res: Response) {
    try {
        let data = await req.user.devices;
        res.json(data);
    } catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Adds a new device to the user
 * @route POST /user/devices
 * @group User - Operations about logged in user
 * @consumes application/json
 * @param {Device.model} Device.body
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/devices', async function(req: Request, res: Response){
    let deviceId = req.body.deviceId;
    let platform = req.body.plattform;

    try {
        if(await req.user.addDevice(deviceId, platform)){
            res.sendStatus(200);
        }else{
            res.sendStatus(200);
        }
    } catch(e) {
        //TODO add logger
        console.log(e);
        res.sendStatus(500);
    }
});

/**
 * Removes a device from the user account
 * @route DELETE /user/devices/deviceId/{id}
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/devices/deviceId/:id', async function (req: Request, res: Response) {
    //TODO not null req.
    let deviceId = req.params.id;
    try {
        //TODO Fix
        await User.removeDevice(deviceId);
        res.sendStatus(200)
    } catch(e){
        //TODO add logger
        console.log(e);
        res.sendStatus(500)
    }
});

router.get('/auth/totp', async function (req,res) {

    res.sendStatus(200);
});

/**
 * Submits a new totp key for secondFactor auth
 * @route POST /user/auth/totp
 * @group User - Operations about logged in user
 * @consumes application/json
 * @param {TotpAddRequest.model} TotpAddRequest.body.require
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/auth/totp', async function (req,res) {
    if(req.body.hasOwnProperty("password") && req.body.hasOwnProperty("key")){
        let user;
        let tokenId;
        try {
            user = req.user;
        }catch (e) {
            res.sendStatus(602);
            return ;
        }
        try {
            await user.verifyPassword(req.body["password"]);

        } catch (e) {
            res.json({"error":"Invalid Password"});
            return ;
        }

        try {
            let key = req.body["key"];
            let alias = req.body["alias"];
            if(user.id != null){
                tokenId = await Totp.saveTokenForUser(key, user.id, alias)
            }
        } catch (e) {

        }
        res.json(tokenId)
    }else{
        res.json({"err":"Invalid Parameters"});
    }
});

/**
 * Verifies the given key with the correct totp code
 * @route POST /user/auth/totp/verify
 * @group User - Operations about logged in user
 * @consumes application/json
 * @param {TotpVerifyRequest.model} TotpVerifyRequest.body.require
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/auth/totp/verify', async function (req,res) {
    if(req.body.hasOwnProperty("keyId") && req.body.hasOwnProperty("code")){
        try {
            let keyId = req.body["keyId"];
            let code = req.body["code"];
            await Totp.verifyKey(keyId, code);
            await res.sendStatus(200);
        } catch (e) {
            console.log(e);
            await res.json({err:e})
        }
    }else{
        res.json({"err":"Invalid Parameters",body: req.body});
    }
});

/**
 * Deletes the totp device specified by id
 * @route DELETE /user/auth/totp/id/{id}
 * @group User - Operations about logged in user
 * @consumes application/json
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.delete('/auth/totp/id/:id', async function (req,res) {
    try {
        if(req.user.id != null){
            await Totp.removeById(parseInt(req.params.id), req.user.id);
        }
        res.sendStatus(200)
    }catch (e) {
        console.log(e);
        res.json({"err": e});
    }
});

/**
 * Lists all mail addresses
 * @route GET /user/profile/emails
 * @group User - Operations about logged in user
 * @returns {Array.<EMail>} 200
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.get('/profile/emails', async (req, res) => {
        try {
            res.json(req.user.mails);
        }catch (e) {
            res.sendStatus(500);
        }
});

/**
 * Adds a new mail address
 * @route POST /user/profile/emails
 * @group User - Operations about logged in user
 * @param {EMail.model} EMail.body.require
 * @returns {object>} 200
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.post('/profile/emails', async (req, res) => {
        try {
            res.json(req.user.mails);
        }catch (e) {
            res.sendStatus(500);
        }
});

/**
 * Deletes one mail address
 * @route DELETE /user/profile/emails/{id}
 * @group User - Operations about logged in user
 * @returns {object} 200
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.delete('/profile/emails/:id', async (req, res) => {
        try {
            res.json(req.user.mails);
        }catch (e) {
            res.sendStatus(500);
        }
});

/**
 * Deletes access jwt
 * @route DELETE /user/jwt
 * @group User - Operations about logged in user
 * @returns {object} 200
 * @returns {Error} 401 - Wrong JWT
 * @security JWT
 */
router.delete('/jwt', async (req, res) => {
        try {
            await Jwt.revokeById(req.decoded.jwtId);
            console.log("revoke")
            res.sendStatus(200);
        }catch (e) {
            res.sendStatus(500);
        }
});