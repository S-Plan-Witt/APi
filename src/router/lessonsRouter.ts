import {ApiGlobal} from "../types/global";
import express from "express";
import path from "path";
import {Course} from "../classes/Course";
import {User} from "../classes/user/User";
import {Lesson} from "../classes/Lesson";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * checks if the users has permission to access the endpoints
 */
router.use((req, res, next) => {
    if (req.user.permissions.timeTable) {
        next();
        return;
    }
    global.logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.user.id}`,
        file: path.basename(__filename)
    });
    return res.sendStatus(401);
});

/**
 * Returns all available lessons
 * @route GET /lessons
 * @group Lessons
 * @returns {Array.<Lesson>} 200
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/', async (req, res) => {
    res.json(await Lesson.getAll());
});

/**
 * Adds Lessons
 * @route POST /lessons
 * @group Lessons
 * @param {Lesson.model} Lesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/', async (req, res) => {
    if (!req.user.permissions.timeTableAdmin) {
        return res.sendStatus(401);
    }

    let body = req.body;
    for (let i = 0; i < body.length; i++) {
        let lessonDataSet = body[i];
        try {
            let course: Course | undefined = undefined;
            try {
                course = await Course.getByFields(lessonDataSet["course"]["subject"], lessonDataSet["course"]["grade"], lessonDataSet["course"]["group"]);
            } catch (e) {
                console.log(e)
            }
            if (course === undefined) {
                let teacherId: number | null = null;
                try {
                    let teacherName: string = lessonDataSet["teacher"];
                    teacherName = teacherName.replace("ä", "ae");
                    teacherName = teacherName.replace("ö", "oe");
                    teacherName = teacherName.replace("ü", "ue");
                    let teacher: User = await User.getByUsername(lessonDataSet["teacher"]);
                    teacherId = teacher.id;
                } catch (e) {
                    console.log("Teacher error:" + e)
                }

                course = await (new Course(lessonDataSet["course"]["grade"], lessonDataSet["course"]["subject"], lessonDataSet["course"]["group"], false, null, teacherId)).save();
            }
            let lesson: Lesson = new Lesson(course, lessonDataSet["lessonNumber"], lessonDataSet["day"], lessonDataSet["room"], null);
            try {
                await lesson.save();
            } catch (e) {
            }

        } catch (e) {
            console.log(e);
        }
    }
    res.sendStatus(200);
});