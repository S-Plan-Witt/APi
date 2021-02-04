/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import express, {Request, Response} from 'express';
import {User} from '../classes/User';
import {Ldap} from '../classes/Ldap';
import {TimeTable} from "../classes/TimeTable";
import {ApiGlobal} from "../types/global";
import {UserFilter} from "../classes/UserFilter";
import {Course} from "../classes/Course";
import {Teacher} from "../classes/Teacher";
import {SearchOptions} from "ldapjs";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Checks if base permission for all sub functions is given
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.users) {
        next();
        return;
    }
    global.logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.decoded.userId}`
    });
    return res.sendStatus(401);
});

/**
 * Returns all users
 * @route GET /users/
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        let data = await User.getAllUsers();
        await res.json(data);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users ; ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns all users by a specific type
 * @route GET /users/type/{type}
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/type/:type', async (req: Request, res: Response) => {

    try {
        let data = await User.getUsersByType(parseInt(req.params.type));
        await res.json(data);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/type/ : ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns user specified by username
 * @route GET /users/username/{username}
 * @group Users - Operations about all users
 * @returns {User.model} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/username/:username', async (req: Request, res: Response) => {
    try {
        let data = await User.getUserByUsername(req.params.username);
        await res.json([data]);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns user specified by id
 * @route GET /users/id/{id}
 * @group Users - Operations about all users
 * @returns {User.model} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/id/:id', async (req: Request, res: Response) => {
    try {
        let data = await User.getUserById(parseInt(req.params.id));
        await res.json([data]);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * Generates a Link for login without password
 * @route GET /users/userid/{id}/preAuth
 * @group Users - Operations about all users
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/userid/:userId/preAuth', async (req: Request, res: Response) => {
    if (!req.decoded.permissions.usersAdmin) {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/find'
        });
        return res.sendStatus(401);
    }
    let userId = parseInt(req.params.userId.toLowerCase());
    try {
        let user: User = await User.getUserById(userId);
        await user.isActive();
        let token = await user.createPreAuthToken(userId);

        await res.json([token]);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/:username/preAuth ; ' + JSON.stringify(e)
        });

        res.sendStatus(500);
    }
});

/**
 * Returns all users from the connected Ldap server
 * @route GET /users/ldap
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/ldap/', async (req: Request, res: Response) => {

    try {
        await res.json(await Ldap.getAllStudents());
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/ldap/ ; ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns all users from the connected Ldap server
 * @route POST /users/ldap/find
 * @group Users - Operations about all users
 * @param {UserFilter.model} UserFilter.body.required
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/ldap/find', async (req: Request, res: Response) => {

    let filter = new UserFilter("", "", "", "");
    let firstName = "";
    let lastName = "";
    let birthday = "";
    let birthdayFilter = "";

    if (req.body.hasOwnProperty("firstname")) {
        firstName = req.body.firstname;
    }
    if (req.body.hasOwnProperty("lastname")) {
        lastName = req.body.lastname;
    }
    if (req.body.hasOwnProperty("birthday")) {
        birthday = req.body.birthday;
    }

    try {
        if (firstName === "") {
            firstName = "*";
        }
        if (lastName === "") {
            lastName = "*";
        }
        if (birthday === "") {
            birthdayFilter = "";
        }else{
            birthdayFilter = '(info=' + birthday + ')';
        }

        let opts: SearchOptions = {
            filter: '(&(objectClass=user)(sn=' + lastName + ')(givenname=' + firstName + ')'+ birthdayFilter +')',
            scope: 'sub',
            attributes: ['sn', 'givenname', 'samaccountname', 'displayName','memberOf','info']
        };
        let users = await Ldap.searchUsers(opts, global.config.ldapConfig.root);
        res.json(users);
    } catch (e) {
        global.logger.log({
            level: 'warn',
            label: 'Express',
            message: 'Error while executing callback : /students/find : ' + e
        });
        res.status(500);
        res.send(e);
    }
});

/**
 * Sets courses for student
 * @route POST /users/{username}/courses
 * @group Users - Operations about all users
 * @param {Array.<Course>} Array<Course>.body.required
 * @returns {object} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/:username/courses', async (req: Request, res: Response) => {
    if (!req.decoded.permissions.usersAdmin) {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /users/' + req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }
    let user: User | null = null;
    try {
        user = await User.getUserByUsername(req.params.username);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: '/users/' + req.params.username + '/courses;1: ' + JSON.stringify(e)
        });
    }
    if (user == null) {
        await User.createUserFromLdap(req.params.username);
        user = await User.getUserByUsername(req.params.username);
    }
    if (user != null) {
        try {
            await user.deleteCourses();
            let courses = [];
            for (const courseData of req.body) {
                try {
                    let course: Course = await TimeTable.getCourseByFields(courseData["subject"], courseData["grade"], courseData["group"])
                    course.exams = courseData["exams"];
                    courses.push(course);
                } catch (e) {
                    //TODO add logger
                }
            }
            await user.addCourse(courses);
            res.sendStatus(200);
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: '/users/' + req.params.username + '/courses;2: ' + JSON.stringify(e)
            });
            res.sendStatus(500);
        }
    } else {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: '/users/' + req.params.username + '/courses;3: User not found'
        });
        res.send("user not found")
    }
});

/**
 * Loads all teachers from AD Server
 * @route POST /users/teacher/reload
 * @group Users - Operations about all users
 * @returns {object} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/teacher/reload', async (req: Request, res: Response) => {
    if (!req.decoded.permissions.usersAdmin) {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/' + req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }
    let teachers: Teacher[] = await Ldap.loadTeachers();
    for (const teacherKey in teachers) {
        let teacher = teachers[teacherKey];
        try {
            await teacher.createToDB();
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: '/teacher/reload: ' + JSON.stringify(e)
            });
        }
    }
    res.sendStatus(200);
});