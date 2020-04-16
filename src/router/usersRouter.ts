import express from 'express';
import winston from 'winston';

import {User}   from '../classes/user';
import {Ldap}   from '../classes/ldap';
const logger = winston.loggers.get('main');

export let router = express.Router();


router.use((req, res, next) =>{
    if(req.decoded.admin){
        next();
        return;
    }
    return res.sendStatus(401);
});


/**
 * Returns all users from Database
 *
 */
router.get('/', async function(req, res){
    try {
        let data = await User.getAllUsers();
        await res.json(data);
    } catch(e){
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
router.get('/type/:type', async function(req, res){

    try {
        let data = await User.getUsersByType(req.params.type);
        await res.json(data);
    } catch(e){
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
router.get('/username/:username', async function(req, res){
    try {
        let data = await User.getUserByUsername(req.params.username);
        await res.json([data]);
    } catch(e){
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
router.get('/id/:id', async function(req, res){
    try {
        let data = await User.getUserById(parseInt(req.params.id));
        await res.json([data]);
    } catch(e){
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
router.get('/username/:username/preAuth', async function(req, res){

    let username = req.params.username.toLowerCase();
    try {
        let user: User = await User.getUserByUsername(req.params.username);
        await user.isActive();
        let token = await user.createPreAuthToken(username);

        //TODO add eviro var for domain

        await res.json(["https://splan.nils-witt.de/pages/login.html?token="+ token]);
    } catch(e){
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/:username/preAuth ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});

router.get('/ldap/', async function(req, res){

    try {

        await res.json(await Ldap.getAllStudents());
    } catch(e){
        logger.log({
            level: 'error',
            label: 'Express',
            message: 'Routing: /users/ldap/ ; ' + JSON.stringify(e)
        });
        console.log(e);
        res.sendStatus(500);
    }
});