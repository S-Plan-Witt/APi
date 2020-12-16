import {Course} from "./Course";

export class Lesson {
    course: Course;
    lessonNumber: number;
    day: number;
    room: string;
    id: number | null;

    /**
     *
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