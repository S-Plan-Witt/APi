import {Course} from "./Course";
import {Lesson} from "./Lesson";

export class ReplacementLesson {
    id: number | null;
    course: Course;
    lesson: Lesson;
    teacherId: number | null;
    room: string;
    subject: string;
    info: string;
    date: string;

    constructor(id: number | null, course: Course, lesson: Lesson, teacherId: number | null, room: string, subject: string, info: string, date: string) {
        this.id = id;
        this.course = course;
        this.lesson = lesson;
        this.teacherId = teacherId;
        this.room = room;
        this.subject = subject;
        this.info = info;
        this.date = date;

    }
}