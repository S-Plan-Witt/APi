"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const wsToken = process.env.MOODLE_KEY;
const url = process.env.MOODLE_URL;
class Moodle {
    static apiRequest(wsToken, host, wsfunction, parameters) {
        return new Promise(async function (resolve, reject) {
            let options = {
                'method': 'GET',
                'hostname': host,
                'path': '/webservice/rest/server.php?wstoken=' + wsToken + '&wsfunction=' + wsfunction + '&moodlewsrestformat=json&',
                'headers': {}
            };
            let req = https_1.default.request(options, function (res) {
                let chunks = [];
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                res.on("end", function (chunk) {
                    let body = Buffer.concat(chunks);
                    console.log(body.toString());
                });
                res.on("error", function (error) {
                    console.error(error);
                });
            });
            req.end();
        });
    }
    /**
     *
     * @param id {int}
     */
    static getUserById(id) {
        if (process.env.MOODLE_KEY != undefined && process.env.MOODLE_URL !== undefined) {
            Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_get_users", "criteria[0][key]=id&criteria[0][value]=" + id);
        }
    }
    /**
     * @param id {int}
     */
    static deleteUserById(id) {
        if (process.env.MOODLE_KEY != undefined && process.env.MOODLE_URL !== undefined) {
            Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_delete_users", "userids[0]=" + id);
        }
    }
    /**
     *
     * @param username {String}
     * @param firstname {String}
     * @param lastname {String}
     * @param mail {String}
     */
    static createUser(username, firstname, lastname, mail) {
        if (process.env.MOODLE_KEY != undefined && process.env.MOODLE_URL !== undefined) {
            Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_create_users", 'users[0][createpassword]=1&users[0][username]=' + username + '&users[0][firstname]=' + firstname + '&users[0][lastname]=' + lastname + '&users[0][email]=' + mail);
        }
    }
    /**
     *
     * @param id {int}
     * @param mail {String}
     */
    static updateEmailById(id, mail) {
        if (process.env.MOODLE_KEY != undefined && process.env.MOODLE_URL !== undefined) {
            Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_update_users", "users[0][id]=" + id + "&users[0][email]=" + mail);
        }
    }
}
