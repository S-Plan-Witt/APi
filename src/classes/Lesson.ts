/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Course} from "./Course";

/**
 * @typedef Lesson
 * @property {number} id
 * @property {Course.model} course.required
 * @property {string} room.required
 * @property {number} lesson.required
 * @property {number} weekday.required
 */
export class Lesson {
    public course: Course;
    public lessonNumber: number;
    public day: number;
    public room: string;
    public id: number | null;

    /**
     * @param course {Course}
     * @param lesson {number}
     * @param day {number}
     * @param room {string}
     * @param id
     */
    constructor(course: Course, lesson: number, day: number, room: string, id: number | null) {
        this.course = course;
        this.lessonNumber = lesson;
        this.day = day;
        this.room = room;
        this.id = id;
    }
}