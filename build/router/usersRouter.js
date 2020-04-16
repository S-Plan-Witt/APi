"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const user_1 = require("../classes/user");
const ldap_1 = require("../classes/ldap");
const logger = winston_1.default.loggers.get('main');
exports.router = express_1.default.Router();
exports.router.use((req, res, next) => {
    if (req.decoded.admin) {
        next();
        return;
    }
    return res.sendStatus(401);
});
/**
 * Returns all users from Database
 *
 */
exports.router.get('/', async function (req, res) {
    try {
        let data = await user_1.User.getAllUsers();
        await res.json(data);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Returns all users by Type from Database
 *
 */
exports.router.get('/type/:type', async function (req, res) {
    try {
        let data = await user_1.User.getUsersByType(req.params.type);
        await res.json(data);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/type/ : ' + JSON.stringify(e)
        });
        res.sendStatus(500);
    }
});
/**
 * Get Information for user
 * returns Json with userInformation
 */
exports.router.get('/username/:username', async function (req, res) {
    try {
        let data = await user_1.User.getUserByUsername(req.params.username);
        await res.json([data]);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Get Information for user
 * returns Json with userInformation
 */
exports.router.get('/id/:id', async function (req, res) {
    try {
        let data = await user_1.User.getUserById(parseInt(req.params.id));
        await res.json([data]);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/username ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
/**
 * Generate a Link to skip username and password prompt for user
 * Return Json with link to login
 */
exports.router.get('/username/:username/preAuth', async function (req, res) {
    let username = req.params.username.toLowerCase();
    try {
        let user = await user_1.User.getUserByUsername(req.params.username);
        await user.isActive();
        let token = await user.createPreAuthToken(username);
        //TODO add eviro var for domain
        await res.json(["https://splan.nils-witt.de/pages/login.html?token=" + token]);
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/:username/preAuth ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
exports.router.get('/ldap/', async function (req, res) {
    try {
        await res.json(await ldap_1.Ldap.getAllStudents());
    }
    catch (e) {
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/ldap/ ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});
