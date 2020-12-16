export class UserFilter {
    username: string;
    firstName: string;
    lastName: string;
    birthday: string;

    constructor(username: string, firstName: string, lastName: string, birthday: string) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthday = birthday;
    }
}