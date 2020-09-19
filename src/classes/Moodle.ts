import https from 'https';

export class Moodle {

    static apiRequest(wsToken: string, host: string, wsfunction: string, parameters: string): Promise<string>{
        return new Promise(async (resolve, reject) => {
            let options = {
                'method': 'GET',
                'hostname': host,
                'path': '/webservice/rest/server.php?wstoken=' + wsToken + '&wsfunction=' + wsfunction + '&moodlewsrestformat=json&' + parameters,
                'headers': {}
            };

            let req = https.request(options, (res) => {
                let chunks: any = [];

                res.on("data", (chunk: any) => {
                    chunks.push(chunk);
                });

                res.on("end", (chunk: any) => {
                    let body = Buffer.concat(chunks);
                    resolve(body.toString())
                });

                res.on("error", (error: Error) => {
                    console.error(error);
                    reject(error);
                });
            });

            req.end();
        });
    }

    /**
     *
     * @param id {int}
     */
    static getUserById(id: number){
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_get_users", "criteria[0][key]=id&criteria[0][value]=" + id.toString())
            }
        });

    }

    static getUserByUsername(username: string){
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_get_users", "criteria[0][key]=username&criteria[0][value]=siks" + username)
            }
        });
    }

    /**
     * @param id {int}
     */
    static deleteUserById(id: number){
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_delete_users", "userids[0]=" + id);
                if (result === "null") {
                    console.log("success")
                } else {
                    console.log(result)
                }
            }
        });
    }

    /**
     *
     * @param username {String}
     * @param firstname {String}
     * @param lastname {String}
     * @param mail {String}
     */
    static createUser(username: string, firstname: string, lastname: string, mail: string){
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let response: string = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_create_users", '&users[0][auth]=ldap&users[0][username]=' + username + '&users[0][firstname]=' + firstname + '&users[0][lastname]=' + lastname + '&users[0][email]=' + mail)
                let data = JSON.parse(response);
                if (data.length === 1) {
                    if (data[0].hasOwnProperty("id")) {
                        console.log(data[0]["id"]);
                        resolve(data[0]["id"]);
                        return;
                    }
                }
            }
            reject("err");
            return ;
        });
    }

    /**
     *
     * @param id {int}
     * @param mail {String}
     */
    static updateEmailById(id: number,  mail: string){
        return new Promise(async (resolve, reject) => {
            if (process.env.MOODLE_KEY !== undefined && process.env.MOODLE_URL !== undefined) {
                let result = await Moodle.apiRequest(process.env.MOODLE_KEY, process.env.MOODLE_URL, "core_user_update_users", "users[0][id]=" + id + "&users[0][email]=" + mail)
            }
        });
    }
}