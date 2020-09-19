export class Course {
    grade: any;
    subject: any;
    group: any;
    exams: boolean;
    id: number | null;
    teacherId: number | null;

    /**
     *
     * @param grade {String}
     * @param subject {String}
     * @param group {String}
     * @param exams {String}
     * @param id
     * @param teacherId
     */
    constructor(grade: string | null = null, subject: string | null = null, group: string | null = null, exams = false, id: number | null = null, teacherId: number | null = null) {
        this.grade = grade;
        this.subject = subject;
        this.group = group;
        this.exams = exams;
        this.id = id;
        this.teacherId = teacherId;
    }
}