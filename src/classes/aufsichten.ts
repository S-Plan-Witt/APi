import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

//TODO split exports and functions
module.exports = {
    set: async function (id: number,aufsicht: any) {
        let date    = aufsicht.date;
        let time    = aufsicht.time;
        let location= aufsicht.location;
        let teacher = aufsicht.teacher;

        let conn;
        try {
            conn = await pool.getConnection();
            await conn.query("UPDATE `splan`.`data_aufsichten` SET `date` = ?, `time`= ?, `location`= ?, `teacher`= ? WHERE (`iddata_aufsichten` = ?);",[date, time, location, teacher,id]);
            return true;
        } catch (err) {
            console.log(err);
            return false;            
        } finally {
            await conn.end();
        }
    },
    add: async function (aufsicht: any) {
      
        let date    = aufsicht.date;
        let time    = aufsicht.time;
        let location= aufsicht.location;
        let teacher = aufsicht.teacher;

        let conn;
        
        try {
            conn = await pool.getConnection();
            await conn.query("INSERT INTO `splan`.`data_aufsichten` (`date`,`time`, `teacher`, `location`) VALUES (?, ?, ?, ?);",[date, time, location, teacher]);
            return true;
        } catch (err) {
            console.log(err);
            return false;            
        } finally {
            await conn.end();
        }
        
    },
    delete: async function (id: any) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query("DELETE FROM `splan`.`data_aufsichten` WHERE (`iddata_aufsichten` = ?);",[id]);
            if(rows.affectedRows > 0){
                console.log("deleted");
            }else{
                console.log("not found")
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;            
        } finally {
            await conn.end();
        }
    },
    getAll: async function (){
        let conn;
        try {
            conn = await pool.getConnection();
            return await conn.query("SELECT *  FROM `splan`.`data_aufsichten`");
            
        } catch (err) {
            console.log(err);
            return false;            
        } finally {
            await conn.end();
        }
    }
};