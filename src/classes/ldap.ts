import ldap, {Client, LDAPResult, SearchOptions} from 'ldapjs';
import winston from 'winston';
const logger = winston.loggers.get('main');

import {User,Student,Teacher,Parent, UserFilter} from './user';
import {url} from "inspector";
let urlLdap: string;
if(process.env.LDAP_HOST !== undefined){
    urlLdap = process.env.LDAP_HOST;
}
console.log(process.env.LDAP_HOST);
console.log(process.env.LDAP_USER);
console.log(process.env.LDAP_PASS);

export class Ldap {

    /**
     * authenticates service user to work in forest
     */
    static bindLDAP(){
        return new Promise(function (resolve, reject) {
            let ldapClient = ldap.createClient({
                url: urlLdap
            });

            // @ts-ignore
            ldapClient.bind(process.env.LDAP_DOMAIN + "\\" + process.env.LDAP_USER, process.env.LDAP_PASS, function(err) {
                if(err){
                    reject("BindFailed");
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'bind failed: ' + err
                    });
                }else{
                    resolve(ldapClient);
                    logger.log({
                        level: 'silly',
                        label: 'LDAP',
                        message: 'bind successful control connection'
                    });
                }
            });
        });
    }

    /**
     * Get all Teachers
     * @returns Promise {[user]}
     */
    static loadTeacher(){
        return new Promise(async function (resolve, reject) {
            let ldapClient: any = await Ldap.bindLDAP();
            //set filter criteria
            let opts = {
                filter: '(&(objectClass=user)(memberOf=CN=NMTeachers-global,OU=HH,DC=netman,DC=lokal))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName']
            };
            //search on DC
            ldapClient.search(process.env.LDAP_ROOT, opts, function (err: Error, res: any) {
                if (err) {
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'search failed'
                    });
                    reject(err)
                } else {
                    let users: any = [];
                    //Found user
                    res.on('searchEntry', function (entry: any) {
                        //TODO add logger
                        //console.log('entry: ' + JSON.stringify(entry.object));
                        //Clean object
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral: any) {
                        //TODO add logger
                        //console.log('referral: ' + referral.uris.join());
                    });
                    res.on('error', function (err: Error) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'Load teacher error: ' + err.message
                        });
                    });
                    //Search completed
                    res.on('end', function (result: any) {
                        //TODO add logger
                        //console.log('status: ' + result.status);
                        resolve(users);
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });
    }

    /**
     *
     * @param username
     * @param password
     * @returns {Promise<unknown>}
     */
    static checkPassword(username: string, password: string){
        return new Promise(function (resolve, reject) {
            if (password === "") {
                reject();
            } else {
                //Create new connection
                let ldpC = ldap.createClient({
                    url: urlLdap,
                    reconnect: true
                });
                //Attempt login
                ldpC.bind(process.env.LDAP_DOMAIN + "\\" + username, password, function (err) {
                    if (err) {
                        logger.log({
                            level: 'warn',
                            label: 'LDAP',
                            message: 'bind failed for: ' + username + ' ;Reason: ' + err
                        });
                        reject();
                    } else {
                        let opts: SearchOptions = {
                            filter: '(samAccountName=' + username + ')',
                            scope: 'sub',
                            attributes: ['dn', 'info', 'samaccountname', 'memberof']
                        };
                        ldpC.search(process.env.LDAP_ROOT + "", opts, function (err, res) {
                            if (err) {
                                logger.log({
                                    level: 'error',
                                    label: 'LDAP',
                                    message: 'search failed for: ' + JSON.stringify(opts)
                                });
                                reject(err);
                            } else {
                                let users: any = [];
                                res.on('searchEntry', function (entry) {
                                    logger.log({
                                        level: 'silly',
                                        label: 'LDAP',
                                        message: 'entry found: ' + JSON.stringify(entry.object)
                                    });

                                    let object = entry.object;
                                    object.type = "student";
                                    users.push(object);
                                });
                                res.on('searchReference', function (referral: any) {
                                    logger.log({
                                        level: 'silly',
                                        label: 'LDAP',
                                        message: 'referral: ' + referral.uris.join()
                                    });
                                });
                                res.on('error', function (err: Error) {
                                    logger.log({
                                        level: 'error',
                                        label: 'LDAP',
                                        message: 'search error : ' + err.message
                                    });
                                });
                                res.on('end', function (result: LDAPResult) {
                                    logger.log({
                                        level: 'silly',
                                        label: 'LDAP',
                                        message: 'search ended: ' + result.status
                                    });
                                    if (users[0].memberOf === "CN=NMTeachers-global,OU=HH,DC=netman,DC=lokal") {
                                        logger.log({
                                            level: 'silly',
                                            label: 'LDAP',
                                            message: 'password successfully checked: ' + username
                                        });
                                        resolve(2);
                                    } else {

                                        let birthday = users[0].info.replace(/\./g, "");
                                        //verify that password and date of birth are not equal
                                        if (password === birthday) {
                                            logger.log({
                                                level: 'warn',
                                                label: 'LDAP-User-Confirm',
                                                message: 'Password equals birthday'
                                            });

                                            reject("pw equals birth");
                                        } else {
                                            logger.log({
                                                level: 'silly',
                                                label: 'LDAP',
                                                message: 'password successfully checked: ' + username
                                            });
                                            resolve(1);
                                            ldpC.unbind();
                                            ldpC.destroy();
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Find user in AD not submitted fields will be ignored
     * @returns Promise {[user]}
     * @param filter {UserFilter}
     */
    static searchUser(filter: UserFilter) {
        let firstName = filter.firstName;
        let lastName = filter.lastName;
        let birthDate = filter.birthday;
        return new Promise(async function (resolve, reject) {

            if (firstName == null) {
                firstName = "*";
            }
            if (lastName == null) {
                lastName = "*";
            }
            if (birthDate == null) {
                birthDate = "*";
            }

            let opts = {
                filter: '(&(objectClass=user)(sn=' + lastName + ')(givenname=' + firstName + ')(info=' + birthDate + '))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName']
            };
            let ldapClient: any = await Ldap.bindLDAP();

            ldapClient.search(process.env.LDAP_ROOT, opts, function (err: any, res: any) {
                if (err) {
                    logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err)
                } else {
                    let users: any = [];
                    res.on('searchEntry', function (entry: any) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object)
                        });
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral: any) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err: Error) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'search error : ' + err.message
                        });
                    });
                    res.on('end', function (result: LDAPResult) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got status : ' + result.status
                        });
                        //console.log('status: ' + result.status);
                        resolve(users);
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });
    }

    /**
     * load user details for user
     * @returns Promise {[user]}
     * @param username
     */
    static getUserByUsername(username: string): Promise<User> {
        return new Promise(async function (resolve, reject) {
            let ldapClient: any = await Ldap.bindLDAP();
            let opts = {
                filter: '(&(objectClass=user)(samaccountname=' + username + '))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayname']
            };

            ldapClient.search(process.env.LDAP_ROOT, opts, function (err: Error, res: any) {
                if (err) {
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'Get user by username failed: ' + err
                    });
                    reject(err)
                } else {
                    let users: any = [];
                    res.on('searchEntry', function (entry: any) {
                        //TODO add logger
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral: any) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err :Error) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'Get user by username search failed: ' + err.message
                        });
                    });
                    res.on('end', function (result: LDAPResult) {
                        //console.log('status: ' + result.status);

                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Get user by username result: ' + JSON.stringify(users)
                        });
                        if(users.length === 1){
                            resolve(users[0]);
                        }else {
                            reject("no user")
                        }
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });
    }

    static getAllStudents(){
        return new Promise(async function (resolve, reject) {
            let opts = {
                filter: '(objectClass=user)',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName'],
                paged: true
            };
            let ldapClient: any = await Ldap.bindLDAP();

            ldapClient.search("OU=Students,DC=netman,DC=lokal", opts, function (err: Error, res: any) {
                if (err) {
                    logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err)
                } else {
                    let users: any = [];
                    res.on('searchEntry', function (entry: any) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object)
                        });
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral: any) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err: Error) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'search error : ' + err.message
                        });
                    });
                    res.on('end', function (result: LDAPResult) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got status : ' + result.status
                        });
                        //console.log('status: ' + result.status);
                        resolve(users);
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });

    }
}



setTimeout(async () => {
    let ldapClient: any = await Ldap.bindLDAP();
    ldapClient.unbind();
    ldapClient.destroy();
},100);

export class LdapSearch{

    _firstName: string;
    _lastName: string;
    _birthDate: string;
    _username: string;
    _ou: string;

    constructor(firstName: string, lastName: string, birthDate: string, username: string, ou: string) {
        this._firstName = firstName;
        this._lastName = lastName;
        this._birthDate = birthDate;
        this._username = username;
        this._ou = ou;
    }
}