export class LdapConfig {
    enabled: boolean = false;
    tls: boolean = false;
    host: string = "";
    root: string = "";
    user: string = "";
    password: string = "";
    studentPath: string = "";
    teacherPath: string = "";
    domain: string = "";
    teacherGroup: string = "";
    studentGroup: string = "";
    caCertPath: string = "";
}