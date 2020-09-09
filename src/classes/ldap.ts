import ldap, {Client, Error, LDAPResult, SearchCallbackResponse, SearchOptions} from 'ldapjs';
import fs from 'fs';
import {ApiGlobal} from "../types/global";
import {Permissions, Student, Teacher, User, UserFilter} from './user';

declare const global: ApiGlobal;

export class Ldap {

    static async bindTest() {
        try {
            let ldapClient: Client = await Ldap.bindLDAP();
            ldapClient.unbind();
            ldapClient.destroy();
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'LDAP',
                message: "LDAP init failed: " + JSON.stringify(e)
            });
        }
    }

    /**
     * authenticates service user to work in forest
     */
    static bindClient(ldapClient: Client, domain: string, username: string, password: string): Promise<Client> {
        return new Promise((resolve, reject) => {
            try {
                ldapClient.bind(domain + "\\" + username, password, (err: Error | null) => {
                    if (err) {
                        reject("BindFailed");
                        global.logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'bind failed: ' + err
                        });
                    } else {
                        resolve(ldapClient);
                    }
                });
            } catch (e) {
                console.log(e)
            }
        });
    }

    static startTlsClient(client: Client) {
        return new Promise((resolve, reject) => {
            global.logger.log({
                level: 'silly',
                label: 'LDAP',
                message: 'starting TLS'
            });
            let opts = {
                ca: [fs.readFileSync(global.config.ldapConfig.caCertPath).toString()]
            };
            client.starttls(opts, undefined, (err, res) => {
                if (err) {
                    global.logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'starting TLS: ' + err
                    });
                    reject(err)
                    return
                }
                resolve(client);
            });
        });
    }

    static bindLDAP(): Promise<Client> {
        return new Promise(async (resolve, reject) => {
            if (global.config.ldapConfig.enabled) {
                let ldapClient: Client = ldap.createClient({
                    url: global.config.ldapConfig.host
                });
                console.log(global.config.ldapConfig.host)
                if (global.config.ldapConfig.tls) {
                    await this.startTlsClient(ldapClient);
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, global.config.ldapConfig.user, global.config.ldapConfig.password));
                } else if (global.config.ldapConfig.password != "") {
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, global.config.ldapConfig.user, global.config.ldapConfig.password));
                }
            } else {
                reject("LDAP disabled")
            }
        });
    }

    static bindLDAPAsUser(username: string, password: string): Promise<Client> {
        return new Promise(async (resolve, reject) => {
            if (global.config.ldapConfig.enabled) {
                let ldapClient: Client = ldap.createClient({
                    url: global.config.ldapConfig.host
                });
                if (global.config.ldapConfig.tls) {
                    await this.startTlsClient(ldapClient);
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, username, password));
                } else {
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, username, password));
                }
            } else {
                reject("LDAP disabled")
            }
        });
    }

    static searchUsers(opts: SearchOptions, searchRoot: string): Promise<User[]> {
        return new Promise(async function (resolve, reject) {
            let ldapClient: Client = await Ldap.bindLDAP();
            if (opts.paged === undefined) opts.paged = true;
            if (opts.filter === undefined) opts.filter = '(objectClass=user)';
            if (opts.scope === undefined) opts.scope = 'sub';
            if (opts.attributes === undefined) opts.attributes = ['sn', 'givenname', 'samaccountname', 'displayName', 'memberOf'];

            //search on DC
            ldapClient.search(searchRoot, opts, (err: Error | null, res: SearchCallbackResponse) => {
                if (err) {
                    global.logger.log({
                        level: 'error',
                        label: 'LDAP',
                        message: 'search failed'
                    });
                    reject(err)
                } else {
                    let users: User[] = [];
                    res.on('error', ldapErrorHandler);
                    res.on('end', () => {
                        ldapClient.unbind();
                        ldapClient.destroy();

                        resolve(users);
                    });
                    res.on('searchEntry', function (entry: any) {
                        global.logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object)
                        });
                        let obj = entry.object;
                        let dn = obj["dn"].toString().split(",");
                        let grade = dn[1].substr(3, (dn[1].length - 1));

                        if (grade != '_Removed') {
                            let user: User = new User(obj["givenName"], obj["sn"], obj["sAMAccountName"], 0, 2, [], true, null, null, null, Permissions.getDefault());
                            user.displayName = obj["displayName"];
                            if (obj["memberOf"].includes(global.config.ldapConfig.studentGroup)) {
                                user.type = 1;
                            } else if (obj["memberOf"].includes(global.config.ldapConfig.teacherGroup)) {
                                user.type = 2;
                                console.log("teacher")
                            }
                            users.push(user);
                        }
                    });
                }
            });
        });
    }


    /**
     * Get all Teachers
     * @returns Promise {[user]}
     */
    static loadTeachers(): Promise<Teacher[]> {
        return new Promise(async function (resolve, reject) {
            let opts: SearchOptions = {
                filter: '(&(objectClass=user)(memberOf=' + global.config.ldapConfig.teacherGroup + '))'
            };
            resolve(await Ldap.searchUsers(opts, global.config.ldapConfig.root));
        });
    }

    /**
     *
     * @param username
     * @param password
     * @returns {Promise<number>}
     */
    static checkPassword(username: string, password: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                await Ldap.bindLDAPAsUser(username, password);
                let users = await Ldap.searchUsers({
                    filter: '(&(objectClass=user)(samaccountname=' + username + '))'
                }, global.config.ldapConfig.root);
                if (users.length == 1) {
                    resolve(users[0].type)
                } else {
                    reject("User not found")
                }
            } catch (e) {
                reject("password check failed")
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

            if (firstName == "") {
                firstName = "*";
            }
            if (lastName == "") {
                lastName = "*";
            }
            if (birthDate == "") {
                birthDate = "*";
            }

            let opts = {
                filter: '(&(objectClass=user)(sn=' + lastName + ')(givenname=' + firstName + ')(info=' + birthDate + '))',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName']
            };
            let ldapClient: any = await Ldap.bindLDAP();

            ldapClient.search(process.env.LDAP_ROOT, opts, function (err: Error, res: any) {
                if (err) {
                    global.logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err)
                } else {
                    let users: User[] = [];
                    res.on('searchEntry', function (entry: any) {
                        global.logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object)
                        });
                        let obj = entry.object;
                        let dn = obj["dn"].toString().split(",");
                        let grade = dn[1].substr(3, (dn[1].length -1 ));
                        if(grade != '_Removed') {
                            users.push(new User(obj["givenName"], obj["sn"], obj["sAMAccountName"], 0, 0, [], true, null, null, null, Permissions.getDefault()));
                        }
                    });
                    res.on('error', ldapErrorHandler);
                    res.on('end', function (result: LDAPResult) {
                        global.logger.log({
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
            try {
                let ldapClient: any = await Ldap.bindLDAP();
                let opts = {
                    filter: '(&(objectClass=user)(samaccountname=' + username + '))',
                    scope: 'sub',
                    attributes: ['sn', 'givenname', 'samaccountname', 'displayname']
                };

                ldapClient.search(process.env.LDAP_ROOT, opts, function (err: Error, res: any) {
                    if (err) {
                        global.logger.log({
                            level: 'error',
                            label: 'LDAP',
                            message: 'Get user by username failed: ' + err
                        });
                        reject(err)
                    } else {
                        let users: User[] = [];
                        res.on('searchEntry', function (entry: any) {
                            global.logger.log({
                                level: 'silly',
                                label: 'LDAP',
                                message: 'Got entry : ' + JSON.stringify(entry.object)
                            });
                            let obj = entry.object;
                            let dn = obj["dn"].toString().split(",");
                            let grade = dn[1].substr(3, (dn[1].length -1 ));
                            if(grade != '_Removed') {
                                let newUser = new User(obj["givenName"], obj["sn"], obj["sAMAccountName"], 0, 0, [], true, null, null, null, Permissions.getDefault());
                                newUser.displayName = obj["displayName"];
                                users.push(newUser);
                            }
                        });
                        res.on('error', ldapErrorHandler);
                        res.on('end', () => {
                            global.logger.log({
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
            }catch (e) {
                reject(e);
            }

        });
    }

    static getAllStudents(): Promise<Student[]>{
        return new Promise(async function (resolve, reject) {
            let opts = {
                filter: '(objectClass=user)',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName', 'info', 'dn'],
                paged: true
            };
            let ldapClient: any = await Ldap.bindLDAP();

            ldapClient.search("OU=Students,DC=netman,DC=lokal", opts, function (err: Error, res: any) {
                if (err) {
                    global.logger.log({
                        level: 'warn',
                        label: 'LDAP',
                        message: 'Error while querying server : ' + err
                    });
                    reject(err)
                } else {
                    let users: Student[] = [];
                    res.on('searchEntry', function (entry: any) {
                        global.logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object)
                        });
                        let obj = entry.object;
                        let dn = obj["dn"].toString().split(",");
                        let grade = dn[1].substr(3, (dn[1].length -1 ));
                        if(grade != '_Removed'){
                            users.push(new Student(obj["givenName"], obj["sn"], obj["displayName"], obj["sAMAccountName"],0,grade, obj["info"]));
                        }
                    });
                    res.on('error', ldapErrorHandler);

                    res.on('end', function (result: LDAPResult) {
                        global.logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got status : ' + result.status
                        });

                        resolve(users);
                        ldapClient.unbind();
                        ldapClient.destroy();
                    });
                }
            });
        });

    }
}

function ldapErrorHandler(err: Error) {
    global.logger.log({
        level: 'error',
        label: 'LDAP',
        message: 'search error : ' + err.message
    });
}

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