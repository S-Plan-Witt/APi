"use strict";
//JWToken
import jwt from 'jsonwebtoken';
//Filesystem
import fs from 'fs';
import {User} from './User';


//Create Database connection pool for requests
import {ApiGlobal} from "../types/global";
import {NextFunction, Request, Response} from "express";

declare const global: ApiGlobal;

//Load signing and validation keys
const privateKey = fs.readFileSync('./keys/jwtRS256.key');
const publicKey = fs.readFileSync('./keys/jwtRS256.key.pub');

//Paths without token validation
const authFreePaths = [
    '/user/login',
];

export class Jwt {
	/**
	 *
	 * @param id {number}
	 */
	static verifyId (id: number): Promise<never>{
		return new Promise(async (resolve, reject) => {
			let conn = await global.mySQLPool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM `jwt_Token` WHERE `tokenIdentifier`= ?", [id]);
				if (rows.length === 1) {
					resolve(rows[0]['idjwt_Token']);
				} else {
					console.log("revoked: " + rows.length);
					reject();
				}

			} catch (e) {
				console.log(e);
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	static saveToken(userId: number, tokenId: string): Promise<never>{
		return new Promise(async (resolve, reject) => {
			let conn;
			try {
				conn = await global.mySQLPool.getConnection();
				await conn.query("INSERT INTO `jwt_Token` (`tokenIdentifier`, `userid`) VALUES (?, ?);", [tokenId, userId]);
				await conn.end();
				resolve();

			} catch (e) {
				reject(e);
				await conn.end();
			}
		});

	}

	static createJWT(userId: number, userType: string, sessionId: string): Promise<string> {
		return new Promise(async (resolve, reject) => {
			let payload: any = {};
			payload.userId = userId;
			payload.session = sessionId;
			payload.userType = userType;
			try {
				await Jwt.saveToken(userId, sessionId);
				let token = jwt.sign(payload, privateKey, {algorithm: 'RS256'});
				resolve(token);
			} catch (e) {
				reject(e);
			}
		});
	}


	static async checkToken (req: Request, res: Response, next: NextFunction) {
		if(authFreePaths.includes(req.path)) {
			global.logger.log({
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
			let token: string | string[] | undefined = req.headers['x-access-token'] || req.headers['authorization'];

			if (typeof token == "string") {
				//Strip down token if it contains type
				if (token.startsWith('Bearer ')) {
					token = token.slice(7, token.length);
				}
				//Verify Token signature with local key
				try {
					let decoded: any = jwt.verify(token, publicKey);
					if(typeof decoded == 'object'){
						decoded['jwtId'] = await Jwt.verifyId(decoded.session)
						req.decoded = decoded;
						req.user = await User.getUserById(req.decoded.userId);
						req.decoded.permissions = req.user.permissions;
						next();
					}else {
						console.log("JWT decode error");
						console.log(token);
						res.sendStatus(500);
					}

				}catch (e) {

					global.logger.log({
						level: 'warn',
						label: 'JWT',
						message: 'validation of token failed: ' + e
					});
					return res.sendStatus(401);
				}
			} else {
				//TODO add global.logger
				return res.sendStatus(401)
			}
		}

	}

	static revokeById(tokenId: number): Promise<never>{
		//Delete token from DB
		return new Promise(async (resolve, reject) => {
			let conn = await global.mySQLPool.getConnection();
			try {
				await conn.query(`DELETE
								  FROM jwt_Token
								  where idjwt_Token = ?`, [tokenId]);
				global.logger.log({
					level: 'silly',
					label: 'JWT',
					message: 'token revoked: ' + tokenId
				});
				resolve();
			} catch (e) {
				global.logger.log({
					level: 'error',
					label: 'JWT',
					message: 'revoke of token failed ' + tokenId + '; e:' + e
				});
				reject(e);
			}finally {
				await conn.end();
			}
		});
	}

	 static getByUser(username: string){
		 return new Promise(async (resolve, reject) => {
			 let conn = await global.mySQLPool.getConnection();
			 try {
				 let rows = await conn.query(`SELECT *
											  FROM jwt_Token
											  WHERE userid = ?`, [username]);
				 resolve(rows);
			 } catch (e) {
				 global.logger.log({
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

	static getAll () {
		//Load all issued tokens from DB
		return new Promise(async (resolve, reject) => {
			let conn = await global.mySQLPool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM `jwt_Token`");
				resolve(rows);
			} catch (e) {
				global.logger.log({
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

	static revokeUser (username: string) {
		//Delete all tokens for specified user
		return new Promise(async (resolve, reject) => {
			let conn = await global.mySQLPool.getConnection();
			try {
				await conn.query("DELETE From `jwt_Token` where `userid`=?", [username]);
				global.logger.log({
					level: 'silly',
					label: 'JWT',
					message: 'Revoked by username: ' + username
				});
				resolve();
			} catch (e) {
				global.logger.log({
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

	static preAuth (token: string) {
		return new Promise(async (resolve, reject) => {
			let conn = await global.mySQLPool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM `preAuth_Token` WHERE `token` = ?", [token]);
				if (rows.length === 1) {
					let username = rows[0].username;
					resolve(username);
				} else {
					global.logger.log({
						level: 'error',
						label: 'JWT',
						message: 'PreAuth failed: ' + JSON.stringify(token) + " Err: not in database"
					});
					reject("not found in db");
				}
			} catch (e) {
				global.logger.log({
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