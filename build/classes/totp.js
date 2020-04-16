"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
let pool = global["mySQLPool"];
const speakeasy_1 = __importDefault(require("speakeasy"));
class Totp {
    static async saveTokenForUser(token, userId, alias) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let res = await conn.query("INSERT INTO `splan`.`totp` (`user_id`, `totp_key`, alias) VALUES (?, ?, ?);", [userId, token, alias]);
                await conn.query("UPDATE splan.users SET twoFactor = 1 WHERE idusers = ?", [userId]);
                console.log(res);
                if (res.warningStatus == 0) {
                    resolve(res.insertId);
                }
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
            finally {
                if (conn)
                    await conn.end();
            }
        });
    }
    static async verifyKey(tokenId, code) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM splan.totp WHERE id_totp = ?;", [tokenId]);
                if (rows.length != 1) {
                    reject("Key is not available");
                }
                else {
                    console.log(rows[0]);
                    let key = rows[0]["totp_key"];
                    let valid = speakeasy_1.default.totp.verify({ secret: key,
                        encoding: 'base32',
                        token: code });
                    if (!valid) {
                        reject("Invalid code");
                        return;
                    }
                    await conn.query("UPDATE splan.totp SET verified = 1 WHERE id_totp = ?", [tokenId]);
                    resolve();
                }
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
            finally {
                if (conn)
                    await conn.end();
            }
        });
    }
    static checkKeyCode(key, code) {
        return new Promise(async function (resolve, reject) {
            try {
                const isValid = speakeasy_1.default.totp.verify({ token: code.toString(), secret: key });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static verifyUserCode(code, userId) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM splan.totp WHERE user_id = ?;", [userId]);
                for (let i = 0; i < rows.length; i++) {
                    if (rows.hasOwnProperty(i)) {
                        let valid = speakeasy_1.default.totp.verify({ secret: rows[i]["totp_key"], encoding: 'base32', token: code.toString() });
                        if (valid) {
                            resolve();
                            return;
                        }
                    }
                }
                reject();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static removeById(id, userId) {
        return new Promise(async function (resolve, reject) {
            let conn;
            try {
                conn = await pool.getConnection();
                let rows = await conn.query("SELECT * FROM splan.totp WHERE id_totp = ?;", [id]);
                if (rows.length > 0) {
                    await conn.query("DELETE FROM splan.totp WHERE id_totp = ?", [id]);
                    rows = await conn.query("SELECT * FROM splan.totp WHERE user_id = ?;", [userId]);
                    if (rows.length < 1) {
                        await conn.query("UPDATE splan.users SET twoFactor = 0 WHERE idusers = ?", [userId]);
                    }
                }
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.Totp = Totp;
