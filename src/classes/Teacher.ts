import {User} from "./User";
import {Permissions} from "./Permissions";

export class Teacher extends User {

    constructor(firstName = "", lastName = "", username = "", displayName: string = "", id = 0) {
        super(firstName, lastName, username, id, 2, [], false, null, null, 0, Permissions.getDefault());
        this.displayName = displayName;
    }
}