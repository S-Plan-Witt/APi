import {User} from "./User";
import {Permissions} from "./Permissions";

export class Student extends User {
    _grade: string;
    birthday: string;


    constructor(firstName = "", lastName = "", displayName: string, username = "", id = 0, grade = "", birthday: string,) {
        super(firstName, lastName, username, id, 1, [], false, null, null, 0, Permissions.getDefault());
        this._grade = grade;
        this.birthday = birthday;
        this.displayName = displayName;
    }
}