/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Starter} from "../startEnviroment";
import {Ldap} from "../classes/external/Ldap";
import {ApiGlobal} from "../types/global";
import {Student} from "../classes/user/Student";
import {Teacher} from "../classes/user/Teacher";

declare const global: ApiGlobal;

let useStandardENV: boolean = true;

(async () => {
    try {
        Starter.logger();
        Starter.config();

        if (!useStandardENV) {
            setCustomParams();
        }

        await Ldap.bindTest();
        console.log("SUCCESSFUL 1/4 (General connection)");

        await Ldap.bindLDAPAsUser("user", "pass")
        console.log("SUCCESSFUL 2/4");

        let students: Student[] = await Ldap.getAllStudents();

        console.log(students.length);
        console.log("SUCCESSFUL 3/4");

        let teachers: Teacher[] = await Ldap.getAllTeachers();

        console.log(teachers.length);
        console.log("SUCCESSFUL 4/4");
    } catch (e) {
        console.log("The tester run into an error:")
        console.error(e);
    }
})();

function setCustomParams() {
    global.config.ldapConfig.root = "";
    global.config.ldapConfig.enabled = true;
    global.config.ldapConfig.host = "ldap://127.00.0.1:378";
    global.config.ldapConfig.domain = "domain";
    global.config.ldapConfig.tls = false;
    global.config.ldapConfig.caCertPath = "";
    global.config.ldapConfig.user = "user";
    global.config.ldapConfig.password = "pass";
    global.config.ldapConfig.teacherGroup = "CN=Teachers,DC=netman,DC=lokal";
    global.config.ldapConfig.studentGroup = "CN=Students,DC=netman,DC=lokal";
}

