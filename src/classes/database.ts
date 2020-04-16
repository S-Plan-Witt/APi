
import { exec } from 'child_process';


export class Database {


    static init(){
        let host = process.env.SQL_HOST;
        let port = process.env.SQL_PORT;
        let user = process.env.SQL_USER;
        let password = process.env.SQL_PASS;
        let db = process.env.SQL_DB;
        return new Promise(async function (resolve, reject) {
            try {
                exec('mysql -h '+ host + ' -P '+ port + ' -u ' + user + ' --password='+ password + ' ' + db + ' < setup.sql', (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        reject("Error: " + err);
                        return;
                    }

                    resolve("Done");
                    console.log("DB init done");
                });
            } catch (e) {
                console.log("DB init failed");
                //console.log(e);
            }

        });
    }

}

module.exports.Database = Database;