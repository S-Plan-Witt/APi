import {ApiGlobal} from "../types/global";
import express, {Request, Response} from "express";
import {Course} from "../classes/Course";
import {TimeTable} from "../classes/TimeTable";
import path from "path";


declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.timeTable) {
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

//TODO swagger
/**
 * Returns all courses
 * @route GET /courses
 * @group Courses
 * @returns {Array.<Course>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/courses', async (req, res) => {
    res.json(await Course.getAll())
});

//TODO swagger
/**
 * Searches for Courses
 * @route POST /courses/find/
 * @group Courses
 * @param {CourseSearch} CourseSearch.body.required
 * @returns {Array.<Course>} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/find/', async (req: Request, res: Response) => {
    try {
        let courses = await TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);

        res.json(courses);
    } catch (e) {
        res.sendStatus(500);
    }
});

//TODO add endpoints: ADD, DELETE, PUT


router.delete('/', async (req, res) => {
    try {
        let courses = await Course.getAll();

        for (let i = 0; i < courses.length; i++) {
            await courses[i].delete();
        }
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});