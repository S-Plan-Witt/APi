"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ldapjs_1 = __importDefault(require("ldapjs"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.loggers.get('main');
let urlLdap;
if (process.env.LDAP_HOST !== undefined) {
    urlLdap = process.env.LDAP_HOST;
}
console.log(process.env.LDAP_HOST);
console.log(process.env.LDAP_USER);
console.log(process.env.LDAP_PASS);
class Ldap {
    /**
     * authenticates service user to work in forest
     */
    static bindLDAP() {
        return new Promise(function (resolve, reject) {
            let ldapClient = ldapjs_1.default.createClient({
                url: urlLdap
            });
            // @ts-ignore
            ldapClient.bind(process.env.LDAP_DOMAIN + "\\" + process.env.LDAP_USER, process.env.LDAP_PASS, function (err) {
                if (err) {
                    reject("BindFailed");
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'bind failed: ' + err
                    });
                }
                else {
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
    static loadTeacher() {
        return new Promise(async function (resolve, reject) {
            let ldapClient = await Ldap.bindLDAP();
            //set filter criteria
            let opts = {
                filter: '(&(objectClass=user)(memberOf=CN=NMTeachers-global,OU=HH,DC=netman,DC=lokal))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName']
            };
            //search on DC
            ldapClient.search(process.env.LDAP_ROOT, opts, function (err, res) {
                if (err) {
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'search failed'
                    });
                    reject(err);
                }
                else {
                    let users = [];
                    //Found user
                    res.on('searchEntry', function (entry) {
                        //TODO add logger
                        //console.log('entry: ' + JSON.stringify(entry.object));
                        //Clean object
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral) {
                        //TODO add logger
                        //console.log('referral: ' + referral.uris.join());
                    });
                    res.on('error', function (err) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'Load teacher error: ' + err.message
                        });
                    });
                    //Search completed
                    res.on('end', function (result) {
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
    static checkPassword(username, password) {
        return new Promise(function (resolve, reject) {
            if (password === "") {
                reject();
            }
            else {
                //Create new connection
                let ldpC = ldapjs_1.default.createClient({
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
                    }
                    else {
                        let opts = {
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
                            }
                            else {
                                let users = [];
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
                                res.on('searchReference', function (referral) {
                                    logger.log({
                                        level: 'silly',
                                        label: 'LDAP',
                                        message: 'referral: ' + referral.uris.join()
                                    });
                                });
                                res.on('error', function (err) {
                                    logger.log({
                                        level: 'error',
                                        label: 'LDAP',
                                        message: 'search error : ' + err.message
                                    });
                                });
                                res.on('end', function (result) {
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
                                    }
                                    else {
                                        let birthday = users[0].info.replace(/\./g, "");
                                        //verify that password and date of birth are not equal
                                        if (password === birthday) {
                                            logger.log({
                                                level: 'warn',
                                                label: 'LDAP-User-Confirm',
                                                message: 'Password equals birthday'
                                            });
                                            reject("pw equals birth");
                                        }
                                        else {
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
    static searchUser(filter) {
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
            let ldapClient = await Ldap.bindLDAP();
            ldapClient.search(process.env.LDAP_ROOT, opts, function (err, res) {
                if (err) {
                    logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err);
                }
                else {
                    let users = [];
                    res.on('searchEntry', function (entry) {
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
                    res.on('searchReference', function (referral) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'search error : ' + err.message
                        });
                    });
                    res.on('end', function (result) {
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
    static getUserByUsername(username) {
        return new Promise(async function (resolve, reject) {
            let ldapClient = await Ldap.bindLDAP();
            let opts = {
                filter: '(&(objectClass=user)(samaccountname=' + username + '))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayname']
            };
            ldapClient.search(process.env.LDAP_ROOT, opts, function (err, res) {
                if (err) {
                    logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'Get user by username failed: ' + err
                    });
                    reject(err);
                }
                else {
                    let users = [];
                    res.on('searchEntry', function (entry) {
                        //TODO add logger
                        let obj = entry.object;
                        delete (obj.controls);
                        delete (obj.dn);
                        users.push(obj);
                    });
                    res.on('searchReference', function (referral) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'Get user by username search failed: ' + err.message
                        });
                    });
                    res.on('end', function (result) {
                        //console.log('status: ' + result.status);
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Get user by username result: ' + JSON.stringify(users)
                        });
                        if (users.length === 1) {
                            resolve(users[0]);
                        }
                        else {
                            reject("no user");
                        }
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });
    }
    static getAllStudents() {
        return new Promise(async function (resolve, reject) {
            let opts = {
                filter: '(objectClass=user)',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName'],
                paged: true
            };
            let ldapClient = await Ldap.bindLDAP();
            ldapClient.search("OU=Students,DC=netman,DC=lokal", opts, function (err, res) {
                if (err) {
                    logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err);
                }
                else {
                    let users = [];
                    res.on('searchEntry', function (entry) {
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
                    res.on('searchReference', function (referral) {
                        logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'referral: ' + referral.uris.join()
                        });
                    });
                    res.on('error', function (err) {
                        logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'search error : ' + err.message
                        });
                    });
                    res.on('end', function (result) {
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
exports.Ldap = Ldap;
setTimeout(async () => {
    let ldapClient = await Ldap.bindLDAP();
    ldapClient.unbind();
    ldapClient.destroy();
}, 100);
class LdapSearch {
    constructor(firstName, lastName, birthDate, username, ou) {
        this._firstName = firstName;
        this._lastName = lastName;
        this._birthDate = birthDate;
        this._username = username;
        this._ou = ou;
    }
}
exports.LdapSearch = LdapSearch;
