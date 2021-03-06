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
import {User, UserStatus, UserType} from '../classes/user/User';
import {Ldap} from '../classes/external/Ldap';
import {TimeTable} from "../classes/TimeTable";
import {ApiGlobal} from "../types/global";
import {UserFilter} from "../classes/user/UserFilter";
import {Course} from "../classes/Course";
import {Teacher} from "../classes/user/Teacher";
import path from "path";
import assert from "assert";
import {Student} from "../classes/user/Student";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.users) {
        next();
        return;
    }
    global.logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.decoded.userId}`,
        file: path.basename(__filename)
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
            message: 'Routing: /users ; ' + JSON.stringify(e),
            file: path.basename(__filename)
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
            message: 'Routing: /users/type/ : ' + JSON.stringify(e),
            file: path.basename(__filename)
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
        let data = await User.getByUsername(req.params.username);
        await res.json([data]);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e),
            file: path.basename(__filename)
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
        let data = await User.getById(parseInt(req.params.id));
        await res.json([data]);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e),
            file: path.basename(__filename)
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
            message: 'Routing: /users/ldap/ ; ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
        res.sendStatus(500);
    }
});

/**
 * Returns all users from the connected Ldap server
 * @route POST /users/find
 * @group Users - Operations about all users
 * @param {UserFilter.model} UserFilter.body.required
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/find', async (req: Request, res: Response) => {

    let firstName = null;
    let lastName = null;
    let username = null;

    if (req.body.hasOwnProperty("firstname")) {
        firstName = req.body.firstname;
    }
    if (req.body.hasOwnProperty("lastname")) {
        lastName = req.body.lastname;
    }
    if (req.body.hasOwnProperty("username")) {
        username = req.body.username;
    }

    try {
        let filter = new UserFilter(username, firstName, lastName)
        let users: User[] = await User.search(filter);
        res.json(users);
    } catch (e) {
        global.logger.log({
            level: 'warn',
            label: 'Express',
            message: 'Error while executing callback : /students/find : ' + e,
            file: path.basename(__filename)
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
            message: 'No permissions : /users/' + req.params.username + '/courses',
            file: path.basename(__filename)
        });
        return res.sendStatus(401);
    }
    let user: User | null = null;
    try {
        user = await User.getByUsername(req.params.username);
    } catch (e) {
        global.logger.log({
            level: 'error',
            label: 'Express',
            message: '/users/' + req.params.username + '/courses;1: ' + JSON.stringify(e),
            file: path.basename(__filename)
        });
    }
    if (user == null) {
        await User.createFromLdap(req.params.username);
        user = await User.getByUsername(req.params.username);
    }
    if (user != null) {
        try {
            if (user.type == UserType.STUDENT) {
                await user.clearCourses();
                let courses = [];
                for (const courseData of req.body) {
                    try {
                        let course: Course = await Course.getByFields(courseData["subject"], courseData["grade"], courseData["group"])
                        course.exams = courseData["exams"];
                        courses.push(course);
                    } catch (e) {
                    }
                }
                await user.addCourses(courses);
                res.sendStatus(200);
            } else {
                res.send("type: " + user.type);
            }

        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: '/users/' + req.params.username + '/courses;2: ' + JSON.stringify(e),
                file: path.basename(__filename)
            });
            res.sendStatus(500);
        }
    } else {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: '/users/' + req.params.username + '/courses;3: User not found',
            file: path.basename(__filename)
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
            message: 'No permissions : /students/' + req.params.username + '/courses',
            file: path.basename(__filename)
        });
        return res.sendStatus(401);
    }
    let teachers: Teacher[] = await Ldap.getAllTeachers();
    for (const teacherKey in teachers) {
        let teacher = teachers[teacherKey];
        try {
            await teacher.createToDB();
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: '/teacher/reload: ' + JSON.stringify(e),
                file: path.basename(__filename)
            });
        }
    }
    res.sendStatus(200);
});

/**
 * Loads all students from AD Server
 * @route POST /users/students/reload
 * @group Users - Operations about all users
 * @returns {object} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/students/reload', async (req: Request, res: Response) => {
    if (!req.decoded.permissions.usersAdmin) {
        global.logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/' + req.params.username + '/courses',
            file: path.basename(__filename)
        });
        return res.sendStatus(401);
    }
    let students: Student[] = await Ldap.getAllStudents();
    for (const studentKey in students) {
        let student = students[studentKey];
        try {
            await student.createToDB();
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'Express',
                message: '/teacher/reload: ' + JSON.stringify(e),
                file: path.basename(__filename)
            });
        }
    }
    res.sendStatus(200);
});