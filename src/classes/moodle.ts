import https from 'https';
import fs from 'fs';
const wsToken = process.env.MOODLE_KEY;
const url = process.env.MOODLE_URL;

class Moodle {

    static apiRequest(wsToken: string, host: string, wsfunction: string, parameters: string){
        return new Promise(async function (resolve, reject) {
            let options = {
                'method': 'GET',
                'hostname': host,
                'path': '/webservice/rest/server.php?wstoken='+ wsToken + '&wsfunction=' + wsfunction + '&moodlewsrestformat=json&',
                'headers': {
                }
            };

            let req = https.request(options, function (res) {
                let chunks: any = [];

                res.on("data", function (chunk: any) {
                    chunks.push(chunk);
                });

                res.on("end", function (chunk: any) {
                    let body = Buffer.concat(chunks);
                    console.log(body.toString());
                });

                res.on("error", function (error: Error) {
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
    static getUserById(id: number){
        if(process.env.MOODLE_KEY != undefined &&  process.env.MOODLE_URL !== undefined){
            Moodle.apiRequest(process.env.MOODLE_KEY,process.env.MOODLE_URL,"core_user_get_users","criteria[0][key]=id&criteria[0][value]=" + id)
        }
    }

    /**
     * @param id {int}
     */
    static deleteUserById(id: number){
        if(process.env.MOODLE_KEY != undefined &&  process.env.MOODLE_URL !== undefined){
            Moodle.apiRequest(process.env.MOODLE_KEY,process.env.MOODLE_URL,"core_user_delete_users","userids[0]=" + id)
        }
    }

    /**
     *
     * @param username {String}
     * @param firstname {String}
     * @param lastname {String}
     * @param mail {String}
     */
    static createUser(username: string, firstname: string, lastname: string, mail: string){
        if(process.env.MOODLE_KEY != undefined &&  process.env.MOODLE_URL !== undefined){
            Moodle.apiRequest(process.env.MOODLE_KEY,process.env.MOODLE_URL,"core_user_create_users",'users[0][createpassword]=1&users[0][username]='+ username+'&users[0][firstname]='+firstname+'&users[0][lastname]=' +lastname+'&users[0][email]='+ mail)
        }
    }

    /**
     *
     * @param id {int}
     * @param mail {String}
     */
    static updateEmailById(id: number,  mail: string){
        if(process.env.MOODLE_KEY != undefined &&  process.env.MOODLE_URL !== undefined){
            Moodle.apiRequest(process.env.MOODLE_KEY,process.env.MOODLE_URL,"core_user_update_users","users[0][id]="+ id +"&users[0][email]=" + mail)
        }
    }
}