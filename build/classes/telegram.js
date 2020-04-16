"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
let pool = global["mySQLPool"];
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.loggers.get('main');
class Telegram {
    /**
     * Validates a telegram activation token and returns telegram id
     * @param token {String}
     * @returns Promise {Integer} telegram id
     */
    static validateRequestToken(token) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let rows = await conn.query("SELECT * FROM splan.telegramLinks WHERE `token`= ? ", [token]);
                if (rows.length === 1) {
                    resolve(rows[0].telegramId);
                }
                else {
                    reject("Token Invalid");
                }
            }
            catch (e) {
                console.log(e);
                //TODO add logger
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * revokes a telegram activation token
     * @param token
     * @returns Promise
     */
    static revokeRequest(token) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                await conn.query("DELETE FROM `splan`.`telegramLinks` WHERE (`token` = ?);", [token]);
                resolve();
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
    /**
     * Creates a telegram activation token
     * @param telegramId {Integer} telegram userId
     * @returns Promise {String} token
     */
    static createRequest(telegramId) {
        return new Promise(async function (resolve, reject) {
            let conn = await pool.getConnection();
            try {
                let tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await conn.query("INSERT INTO `splan`.`telegramLinks` (`telegramId`, `token`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `token`=?;", [telegramId, tokenId, tokenId]);
                resolve(tokenId);
            }
            catch (e) {
                //TODO add logger
                reject(e);
            }
            finally {
                await conn.end();
            }
        });
    }
}
exports.Telegram = Telegram;
module.exports.Telegram = Telegram;
