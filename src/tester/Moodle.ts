/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {ApiGlobal} from "../types/global";
import {Starter} from "../startEnviroment";
import {Moodle} from "../classes/Moodle";
import {Course} from "../classes/Course";
import {User, UserType} from "../classes/user/User";

declare const global: ApiGlobal;

let useStandardENV: boolean = true;

(async () => {
    try {
        Starter.logger();
        Starter.config();
        Starter.mysql();

        if (!useStandardENV) {
            setCustomParams();
        }

        let users: User[] = await User.getUsersByType(UserType.TEACHER);
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user.moodleUID == null) {
                await user.enableMoodle();
            }
        }

        let courses = await Course.getAll();
        for (let i = 0; i < courses.length; i++) {
            let course = courses[i];

            if (course.moodleId == null) {
                await Moodle.createCourse(course);
            }
        }

        console.log("FINISHED")
    } catch (e) {
        console.log("The tester run into an error:")
        console.error(e);
    }
})();

function setCustomParams() {

}