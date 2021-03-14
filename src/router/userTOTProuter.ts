/*
 * Copyright (c) 2021. Nils Witt.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import {ApiGlobal} from "../types/global";
import express from "express";
import {TOTP} from "../classes/secondFactor/TOTP";

declare const global: ApiGlobal;

export let router = express.Router();

/**
 * Submits a new totp key for secondFactor auth
 * @route GET /user/totp/register
 * @group User
 * @consumes application/json
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.get('/register', async (req, res) => {
    try {
        let endpoint: TOTP = await TOTP.new(req.user);
        await endpoint.save();

        res.json(endpoint.regData)
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Submits a new totp key for secondFactor auth
 * @route POST /user/totp/register
 * @group User
 * @consumes application/json
 * @param {ValidationRequest.model} TotpAddRequest.body.require
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.post('/register', async (req, res) => {
    if (req.body.hasOwnProperty("code") && req.body.hasOwnProperty("requestId")) {
        let user;
        let tokenId;
        try {
            user = req.user;
        } catch (e) {
            res.sendStatus(602);
            return;
        }
        try {
            await user.verifyPassword(req.body["password"]);

        } catch (e) {
            res.json({"error": "Invalid Password"});
            return;
        }

        try {
            let key = req.body["key"];
            let alias = req.body["alias"];
            if (user.id != null) {
                //tokenId = await Totp.saveTokenForUser(key, user.id, alias)
            }
        } catch (e) {

        }
        res.json(tokenId)
    } else {
        res.json({"err": "Invalid Parameters"});
    }
});

/**
 * Deletes the totp device
 * @route DELETE /user/totp
 * @group User
 * @consumes application/json
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Bearer invalid
 * @security JWT
 */
router.delete('/', async (req, res) => {
    try {
        if (req.user.id != null) {
            // await Totp.removeById(parseInt(req.params.id), req.user.id);
        }
        res.sendStatus(200)
    } catch (e) {
        console.log(e);
        res.json({"err": e});
    }
});

class TOTPDevice {
    requestId: string = ""
    totp_key:string = ""
    user_id: number = -1;
    added: string = "";
}