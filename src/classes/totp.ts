"use strict";

import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];

import speakeasy from "speakeasy";
export class Totp {


    static async saveTokenForUser(token:string, userId: number, alias: string){
        return new Promise(async function (resolve, reject) {
            let conn;
            try{
                conn = await pool.getConnection();
                let res = await conn.query("INSERT INTO `totp` (`user_id`, `totp_key`, alias) VALUES (?, ?, ?);", [userId, token, alias]);
                await conn.query("UPDATE users SET twoFactor = 1 WHERE idusers = ?", [userId]);
                console.log(res);
                if(res.warningStatus == 0){
                    resolve(res.insertId);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            } finally {
                if(conn) await conn.end();
            }
        });

    }

    static async verifyKey(tokenId: number,code: string){
        return new Promise(async function (resolve, reject) {
            let conn;
            try{
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE id_totp = ?;", [tokenId]);
                if(rows.length != 1){

                    reject("Key is not available");
                }else {
                    console.log(rows[0]);
                    let key = rows[0]["totp_key"];
                    let valid = speakeasy.totp.verify({ secret: key,
                        encoding: 'base32',
                        token: code });

                    if(!valid){
                        reject("Invalid code");
                        return ;
                    }
                    await conn.query("UPDATE totp SET verified = 1 WHERE id_totp = ?", [tokenId]);
                    resolve();
                }

            } catch (e) {
                console.log(e);
                reject(e);
            } finally {
                if(conn) await conn.end();
            }
        });
    }

    static checkKeyCode(key: string,code: number){
        return new Promise(async function (resolve, reject) {
            try {
                speakeasy.totp.verify({token: code.toString(),secret: key});
                resolve();
            }catch (e) {
                reject(e);
            }
        });
    }

    static verifyUserCode(code: number,userId: number){
        return new Promise(async function (resolve, reject) {
            let conn;
            try{
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE user_id = ?;", [userId]);
                for (let i = 0; i < rows.length; i++) {
                    if(rows.hasOwnProperty(i)){
                        let valid = speakeasy.totp.verify({ secret: rows[i]["totp_key"], encoding: 'base32', token: code.toString() });
                        if(valid){
                            resolve();
                            return ;
                        }
                    }
                }
                reject();
            }catch (e) {
                reject(e);
            } finally {
                if(conn) await conn.end();
            }
        });
    }

    static removeById(id: number, userId: number){
        return new Promise(async function (resolve, reject) {
            let conn;
            try{
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM totp WHERE id_totp = ?;", [id]);
                if(rows.length > 0){
                    await conn.query("DELETE FROM totp WHERE id_totp = ?", [id]);
                    rows = await conn.query("SELECT * FROM totp WHERE user_id = ?;", [userId]);
                    if(rows.length < 1){
                        await conn.query("UPDATE users SET twoFactor = 0 WHERE idusers = ?", [userId]);
                    }
                }
                resolve();
            }catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end();
            }
        });
    }
}