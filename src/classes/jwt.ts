"use strict";
//JWToken
import jwt from 'jsonwebtoken';
//Filesystem
import fs    from 'fs';
import {Permissions, User} from './user';

import De from "../types/custom";

import winston from 'winston';
const logger = winston.loggers.get('main');

//Create Database connection pool for requests
import {ApiGlobal} from "../types/global";
import {NextFunction, Request, Response} from "express";
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
    1630
];


export class Jwt {
	/**
	 *
	 * @param id {number}
	 */
	static verifyId (id: number): Promise<never>{
		return new Promise(async (resolve, reject) => {
			let conn = await pool.getConnection();
			try {
				let rows = await conn.query("SELECT * FROM splan.`jwt_Token` WHERE `tokenIdentifier`= ?", [id]);
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

	static saveToken(userId: number, tokenId: string): Promise<never>{
		return new Promise(async (resolve, reject) => {
			let conn;
			try {
				conn = await pool.getConnection();
				await conn.query("INSERT INTO `splan`.`jwt_Token` (`tokenIdentifier`, `userid`) VALUES (?, ?);", [tokenId, userId]);
				await conn.end();
				resolve();

			}catch (e) {
				reject(e);
				await conn.end();
			}
		});

	}

	static createJWT (userId: number, userType: any, sessionId: string):Promise<string> {
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
						await Jwt.verifyId(decoded.session);

						req.decoded = decoded;
						req.user = await User.getUserById(req.decoded.userId);
						req.decoded.permissions = req.user.permissions;
						//req.decoded.permissions.all = admins.indexOf(req.decoded.username) >= 0;
						next();
					}else {
						console.log("JWT decode error");
						console.log(token);
						res.sendStatus(500);
					}

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

	static revokeById(tokenId: number): Promise<never>{
		//Delete token from DB
		return new Promise(async (resolve, reject) => {
			let conn = await pool.getConnection();
			try {
				await conn.query(`DELETE FROM splan.jwt_Token where tokenIdentifier=?`, [tokenId]);
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
				let rows = await conn.query(`SELECT * FROM splan.jwt_Token WHERE userid=?`, [username]);
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
				let rows = await conn.query("SELECT * FROM splan.`jwt_Token`");
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
				await conn.query("DELETE From splan.`jwt_Token` where `userid`=?", [username]);
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
				let rows = await conn.query("SELECT * FROM splan.`preAuth_Token` WHERE `token` = ?", [token]);
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