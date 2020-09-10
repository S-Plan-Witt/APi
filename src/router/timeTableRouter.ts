import express, {Request, Response} from 'express';

import {Course, Lesson, TimeTable} from '../classes/timeTable';
import {User} from "../classes/user";
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export let router = express.Router();
/**
 * Checks if base permission for all sub functions is given
 */
router.use((req, res, next) => {
    if (req.decoded.permissions.timeTable) {
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
 * Adds Lessons
 * @route POST /timetable/lessons
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @param {Lesson.model} Lesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/lessons', async (req, res) => {
    if (!req.decoded.permissions.timeTableAdmin) {
        //TODO add logger
        return res.sendStatus(401);
    }

    let body = req.body;
    for (let i = 0; i < body.length; i++) {
        let lessonDataSet = body[i];
        try {
            let course: Course | undefined = undefined;
            try {
                course = await TimeTable.getCourseByFields(lessonDataSet["course"]["subject"], lessonDataSet["course"]["grade"], lessonDataSet["course"]["group"]);
            } catch (e) {
                console.log(e)
            }
            if(course == undefined){
                let teacherId: number | null = null;
                try {
                    let teacher: User = await User.getUserByUsername(lessonDataSet["teacher"]);
                    teacherId = teacher.id;
                } catch (e) {
                    console.log("Teacher error:" + e)
                }

                course = await TimeTable.addCourse(new Course(lessonDataSet["course"]["grade"], lessonDataSet["course"]["subject"], lessonDataSet["course"]["group"],false,null, teacherId))
            }
            let lesson: Lesson = new Lesson(course,lessonDataSet["lessonNumber"], lessonDataSet["day"], lessonDataSet["room"], null);
            try {
                await TimeTable.addLesson(lesson);
            }catch (e) {
                console.log("AE: "+ JSON.stringify(lesson));
            }

        } catch(e){
            console.log(e);
            //TODO add logger
        }
    }
    res.sendStatus(200);
});

/**
 * Adds Lessons
 * @route POST /timetable/find/course
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @param {Course.model} Course.body.required
 * @returns {Array.<Course>} 200 - Success
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.post('/find/course', async (req: Request, res: Response) => {
    try{
        let courses = await TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);

        res.json(courses);
    }catch(e){
        //TODO add logger
        res.sendStatus(500);
    }
});

/**
 * Returns all available grades
 * @route GET /timetable/grades
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Grade>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/grades', async (req, res) => {
    //TODO implement
});

/**
 * Returns all available courses
 * @route GET /timetable/courses
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Course>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/courses', async (req, res) => {
    res.json(await TimeTable.getAllCourses())
});

/**
 * Returns all available lessons
 * @route GET /timetable/lessons
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Lesson>} 200
 * @returns {Error} 401 - Wrong Credentials
 * @security JWT
 */
router.get('/lessons', async (req, res) => {
    res.json(await TimeTable.getAllLessons());
});
