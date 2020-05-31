import express, {Request, Response} from 'express';
import winston from 'winston';
import { User, UserFilter } from '../classes/user';
import { Ldap }   from '../classes/ldap';
import {Course} from "../classes/timeTable";

const logger = winston.loggers.get('main');
export let router = express.Router();

/**
 * Checks if base permission for all sub functions is given
 */
router.use((req, res, next) =>{
    if(req.decoded.permissions.users){
        next();
        return;
    }
    logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.decoded.userId}`
    });
    return res.sendStatus(401);
});


/**
 * Returns all users
 * @route GET /users/
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/', async (req: Request, res : Response) => {
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
 * Returns all users by a specific type
 * @route GET /users/type/{type}
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/type/:type', async (req: Request, res: Response) => {

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
 * Returns user specified by username
 * @route GET /users/username/{username}
 * @group Users - Operations about all users
 * @returns {User.model} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/username/:username', async (req: Request, res: Response) => {
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
 * Returns user specified by id
 * @route GET /users/id/{id}
 * @group Users - Operations about all users
 * @returns {User.model} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/id/:id', async (req: Request, res: Response) => {
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
 * Generates a Link for login without password
 * @route GET /users/userid/{id}/preAuth
 * @group Users - Operations about all users
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/userid/:userId/preAuth', async (req: Request, res: Response) => {
    if(!req.decoded.permissions.usersAdmin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/find'
        });
        return res.sendStatus(401);
    }
    let userId = parseInt(req.params.userId.toLowerCase());
    try {
        let user: User = await User.getUserById(userId);
        await user.isActive();
        let token = await user.createPreAuthToken(userId);

        //TODO add eviro var for domain

        await res.json([token]);
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

/**
 * Returns all users from the connected Ldap server
 * @route GET /users/ldap
 * @group Users - Operations about all users
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/ldap/', async (req: Request, res: Response) => {

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

/**
 * Returns all users from the connected Ldap server
 * @route POST /users/ldap/find
 * @group Users - Operations about all users
 * @param {UserFilter.model} UserFilter.body.required
 * @returns {Array.<User>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.post('/ldap/find', async (req: Request, res: Response) => {

    let filter = new UserFilter("","","","");

    if(req.body.hasOwnProperty("firstname")){
        filter.firstName = req.body.firstname;
    }
    if(req.body.hasOwnProperty("lastname")){
        filter.lastName = req.body.lastname;
    }
    if(req.body.hasOwnProperty("birthday")){
        filter.birthday = req.body.birthday;
    }

    try {
        let users = await Ldap.searchUser(filter);
        res.json(users);
    } catch (e){
        logger.log({
            level: 'warn',
            label: 'Express',
            message: 'Error while executing callback : /students/find : ' + e
        });
        res.sendStatus(500);
    }
});

/**
 * Sets courses for student
 * @route POST /users/{username}/courses
 * @group Users - Operations about all users
 * @param {Array.<Course>} Array<Course>.body.required
 * @returns {object} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.post('/:username/courses', async (req: Request, res: Response) => {
    if(!req.decoded.permissions.usersAdmin){
        logger.log({
            level: 'debug',
            label: 'Express',
            message: 'No permissions : /students/'+ req.params.username + '/courses'
        });
        return res.sendStatus(401);
    }
    let user: User | null = null;

    try {
        user = await User.getUserByUsername(req.params.username);
    }catch (e) {
        console.log(e);
    }
    console.log(user);
    if(user == null){
        await User.createUserFromLdap(req.params.username);
        user = await User.getUserByUsername(req.params.username);
    }
    console.log(user);
    if(user != null){
        try {
            await req.user.deleteCourses();
            let courses = [];
            for (const courseData of req.body){
                courses.push(new Course(courseData["grade"],courseData["subject"], courseData["group"], courseData["exams"]));
            }
            await req.user.addCourse(courses);
            res.sendStatus(200);
        } catch(e){
            //TODO add logger
            console.log(e);
            res.sendStatus(500);
        }
    }else {
        res.send("user not found")
    }

});