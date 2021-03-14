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
import {ApiGlobal} from "../types/global";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Response with a 200 OK status if it is a options preflight request
 */
router.options('*', (req: Request, res: Response) => {
    res.sendStatus(200);
});

/**
 * All subrouter
 */
router.use("/announcements", require('./announcementRouter').router);
router.use("/courses", require('./coursesRouter').router);
router.use("/exams", require('./examRouter').router);
router.use("/lessons", require('./lessonsRouter').router);
router.use("/replacementLessons", require('./replacementLessonRouter').router);
router.use("/user", require('./userRouter').router);
router.use("/users", require('./usersRouter').router);


/*
Models for Swagger documentation
 */

/**
 * @typedef Course
 * @property {number} id
 * @property {string} grade.required
 * @property {string} subject.required
 * @property {string} group.required
 * @property {string} teacherId.required
 */

/**
 * @typedef CourseSearch
 * @property {string} teacher
 * @property {number} weekday
 * @property {number} lesson
 */

/**
 * @typedef Announcement
 * @property {number} id
 */


/**
 * @typedef RoomLink
 * @property {string} date.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} room.required
 * @property {number} id
 */

/**
 * @typedef Exam
 * @property {number} id
 * @property {Course.model} course
 * @property {string} date
 * @property {string} from
 * @property {string} to
 * @property {string} teacher
 * @property {string} uniqueIdentifier
 * @property {RoomLink.model} roomLink
 */

/**
 * @typedef ReplacementLesson
 * @property {Course.model} course
 * @property {string} teacher
 * @property {number} lessonId
 * @property {string} room
 * @property {string} subject
 * @property {string} info
 * @property {string} date
 */


/**
 * @typedef LoginRequest
 * @property {string} username.required
 * @property {string} password.required
 */

/**
 * @typedef LoginResponse
 * @property {string} token.required
 * @property {number} userType.required
 */

/**
 * @typedef Device
 * @property {number} id
 * @property {string} platform.required
 * @property {number} userId.required
 * @property {string} timeAdded.required
 * @property {string} deviceIdentifier.required
 * @property {boolean} verified
 */

/**
 * @typedef UserFilter
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} username
 */

/**
 * @typedef Permissions
 * @property {boolean} users
 * @property {boolean} usersAdmin
 * @property {boolean} replacementLessons
 * @property {boolean} replacementLessonsAdmin
 * @property {boolean} announcements
 * @property {boolean} announcementsAdmin
 * @property {boolean} timeTable
 * @property {boolean} timeTableAdmin
 * @property {boolean} moodle
 * @property {boolean} moodleAdmin
 * @property {boolean} globalAdmin
 */

/**
 * @typedef User
 * @property {number} id
 * @property {string} firstName.required
 * @property {string} lastName.required
 * @property {string} displayName.required
 * @property {string} username.required
 * @property {UserType} type.required
 * @property {Array.<Course>} courses
 * @property {number} devices
 * @property {number} secondFactor
 * @property {Permissions.model} permissions
 * @property {number} moodleUID
 */

/**
 * @typedef Lesson
 * @property {number} id
 * @property {Course.model} course
 * @property {number} lessonNumber
 * @property {number} day
 * @property {string} room
 */