"use strict";
//JWToken
import jwt from 'jsonwebtoken';
//Filesystem
import fs    from 'fs';
import {User} from './user';

import De from "../types/custom";

import winston from 'winston';
const logger = winston.loggers.get('main');

//Create Database connection pool for requests
import {ApiGlobal} from "../types/global";
declare const global: ApiGlobal;
let pool = global["mySQLPool"];
//Load signing and validation keys
const privateKey = fs.readFileSync('./keys/jwtRS256.key');
const publicKey = fs.readFileSync('./keys/jwtRS256.key.pub');

//Paths without token validation
const authFreePaths = [
    '/user/login',
];

const admins = [
    'wittnil1611'
];


export class Jwt {
	/**
	 *
	 * @param id {number}
	 */
	static verifyId (id: number){
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM " + process.env.SQL_DB + ".`jwt_Token` WHERE `tokenIdentifier`= ?", [id]);
				if(rows.length === 1){
					resolve();
				}else {
					console.log("revoked: " + rows.length);
					reject();
				}

			}catch (e) {
				console.log(e);
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	static saveToken(username: string, tokenId: string){
		return new Promise(async function (resolve, reject) {
			let conn;
			try {
				conn = await pool.getConnection();
				await conn.query("INSERT INTO `" + process.env.SQL_DB + "`.`jwt_Token` (`tokenIdentifier`, `userid`) VALUES (?, ?);", [tokenId, username]);
				await conn.end();
				resolve();

			}catch (e) {
				reject(e);
				await conn.end();
			}
		});

	}

	static createJWT (username: string, userType: any, sessionId: string) {
		return new Promise(async function (resolve, reject) {
			let payload: any = {};
			payload.username = username;
			payload.session = sessionId;
			payload.userType = userType;
			try {
				await Jwt.saveToken(username, sessionId);
				let token = jwt.sign(payload, privateKey, {algorithm: 'RS256'});
				resolve(token);
			} catch (e) {
				reject(e);
			}
		});
	}


	static async checkToken (req: any, res:any, next:any) {
		if(authFreePaths.includes(req.path)){
			logger.log({
				level: 'silly',
				label: 'JWT',
				message: 'auth validation free path: ' + req.path
			});
			next();
		}else if (req.method === "OPTIONS"){
			next();
		}else if (req.path.substring(0,8) === "/webcal/"){
			next();
		}else{
			//get auth header information containing auth token
			let token = req.headers['x-access-token'] || req.headers['authorization'];
			if (token) {
				//Strip down token if it contains type
				if (token.startsWith('Bearer ')) {
					token = token.slice(7, token.length);
				}
				//Verify Token signature with local key
				try {
					let decoded: any = jwt.verify(token, publicKey);
					await Jwt.verifyId(decoded.session);

					req.decoded = decoded;
					req.user = await User.getUserByUsername(req.decoded.username);
					//TODO add permissions management
					req.decoded.admin = admins.indexOf(req.decoded.username) >= 0;
					req.decoded.permissions = {};
					req.decoded.permissions.all = admins.indexOf(req.decoded.username) >= 0;

					next();
				}catch (e) {
					logger.log({
						level: 'warn',
						label: 'JWT',
						message: 'validation of token failed: ' + e
					});
					return res.sendStatus(401);
				}
			} else {
				//TODO add logger
				return res.sendStatus(401)
			}
		}

	}

	static revokeById(tokenId: number){
		//Delete token from DB
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				await conn.query("DELETE From " + process.env.SQL_DB + ".`jwt_Token` where `tokenIdentifier`=?", [tokenId]);
				logger.log({
					level: 'silly',
					label: 'JWT',
					message: 'token revoked: ' + tokenId
				});
				resolve();
			}catch (e) {
				logger.log({
					level: 'error',
					label: 'JWT',
					message: 'revoke of token failed ' + tokenId
				});
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	 static getByUser(username: string){
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM " + process.env.SQL_DB + ".`jwt_Token` WHERE `userid`=?", [username]);
				resolve(rows);
			}catch (e) {
				logger.log({
					level: 'error',
					label: 'JWT',
					message: 'Get by username failed: ' + JSON.stringify(username) + " Err: " + JSON.stringify(e)
				});
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	static getAll (){
		//Load all issued tokens from DB
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM " + process.env.SQL_DB + ".`jwt_Token`");
				resolve(rows);
			}catch (e) {
				logger.log({
					level: 'error',
					label: 'JWT',
					message: 'Get all failed: ' + JSON.stringify(e)
				});
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	static revokeUser (username: string){
		//Delete all tokens for specified user
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				await conn.query("DELETE From " + process.env.SQL_DB + ".`jwt_Token` where `userid`=?", [username]);
				logger.log({
					level: 'silly',
					label: 'JWT',
					message: 'Revoked by username: ' + username
				});
				resolve();
			}catch (e) {
				logger.log({
					level: 'error',
					label: 'JWT',
					message: 'Revoke by username failed: ' + JSON.stringify(username) + " Err: " + JSON.stringify(e)
				});
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	static preAuth (token: string){
		return new Promise(async function (resolve, reject) {
			let conn = await pool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM " + process.env.SQL_DB + ".`preAuth_Token` WHERE `token` = ?", [token]);
				if (rows.length === 1) {
					let username = rows[0].username;
					resolve(username);
				} else {
					logger.log({
						level: 'error',
						label: 'JWT',
						message: 'PreAuth failed: ' + JSON.stringify(token) + " Err: not in database"
					});
					reject("not found in db");
				}
			} catch (e) {
				logger.log({
					level: 'error',
					label: 'JWT',
					message: 'PreAuth failed: ' + JSON.stringify(token) + " Err: " + JSON.stringify(e)
				});
				reject(e);
			} finally {
				await conn.end();
			}
		});
	}
}

module.exports.Jwt = Jwt;
module.exports.CJwt = Jwt;