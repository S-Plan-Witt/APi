/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import ldap, {Client, Error, SearchCallbackResponse, SearchEntry, SearchEntryObject, SearchOptions} from 'ldapjs';
import fs from 'fs';
import {ApiGlobal} from "../../types/global";
import {User, UserStatus} from '../user/User';
import {Permissions} from "../Permissions";
import {Teacher} from "../user/Teacher";
import {Student} from "../user/Student";
import path from "path";
import {UserFilter} from "../user/UserFilter";

declare const global: ApiGlobal;

export class Ldap {

    //TODO add jDoc
    static async bindTest() {
        try {
            let ldapClient: Client = await Ldap.bindLDAP();
            ldapClient.unbind();
            ldapClient.destroy();
        } catch (e) {
            global.logger.log({
                level: 'error',
                label: 'LDAP',
                message: "LDAP init failed: " + JSON.stringify(e),
                file: path.basename(__filename)
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
                            message: 'bind failed: ' + err,
                            file: path.basename(__filename)
                        });
                    } else {
                        resolve(ldapClient);
                    }
                });
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'LDAP',
                    message: '(bindClient) error: ' + e,
                    file: path.basename(__filename)
                });
                reject(e);
            }
        });
    }

    //TODO add jDoc
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
                        message: 'starting TLS: ' + err,
                        file: path.basename(__filename)
                    });
                    reject(err);
                    return;
                }
                resolve(client);
            });
        });
    }

    //TODO add jDoc
    static bindLDAP(): Promise<Client> {
        return new Promise(async (resolve, reject) => {
            if (global.config.ldapConfig.enabled) {
                let ldapClient: Client = ldap.createClient({
                    url: global.config.ldapConfig.host
                });
                if (global.config.ldapConfig.tls) {
                    await this.startTlsClient(ldapClient);
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, global.config.ldapConfig.user, global.config.ldapConfig.password));
                } else if (global.config.ldapConfig.password !== "") {
                    resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, global.config.ldapConfig.user, global.config.ldapConfig.password));
                }
            } else {
                reject("LDAP disabled")
            }
        });
    }

    //TODO add jDoc
    static bindLDAPAsUser(username: string, password: string): Promise<Client> {
        return new Promise(async (resolve, reject) => {
            if (global.config.ldapConfig.enabled) {
                let ldapClient: Client = ldap.createClient({
                    url: global.config.ldapConfig.host
                });
                try {
                    if (global.config.ldapConfig.tls) {
                        await this.startTlsClient(ldapClient);
                        resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, username, password));
                    } else {
                        resolve(await Ldap.bindClient(ldapClient, global.config.ldapConfig.domain, username, password));
                    }
                } catch (e) {
                    reject(e);
                }
            } else {
                reject("LDAP disabled");
            }
        });
    }

    /**
     * Returns all users matching the filter from the LDAP Serer
     * @param filter
     */
    static searchUsers(filter: UserFilter): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            let firstname = filter.firstName;
            let lastname = filter.lastName;
            let username = filter.username;

            if (firstname === null) {
                firstname = "*";
            }
            if (lastname === null) {
                lastname = "*";
            }
            if (username === null) {
                username = "*";
            }

            let opts: SearchOptions = {
                filter: '(&(objectClass=user)(sn=' + lastname + ')(givenname=' + firstname + ')(samaccountname=' + username + ')',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName', 'memberOf', 'info'],
                paged: true
            };

            resolve(await this.searchUsersAdvanced(opts, global.config.ldapConfig.root));
        });
    }


    //TODO add jDoc
    static searchUsersAdvanced(opts: SearchOptions, searchRoot: string): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
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
                        message: 'search failed',
                        file: path.basename(__filename)
                    });
                    reject(err);
                } else {
                    let users: User[] = [];
                    res.on('error', ldapErrorHandler);
                    res.on('end', () => {
                        ldapClient.unbind();
                        ldapClient.destroy();

                        resolve(users);
                    });
                    res.on('searchEntry', (entry: ActiveDirectorySearchEntry) => {
                        global.logger.log({
                            level: 'silly',
                            label: 'LDAP',
                            message: 'Got entry : ' + JSON.stringify(entry.object),
                            file: path.basename(__filename)
                        });
                        let obj: ActiveDirectorySearchEntryObject = entry.object;
                        let dn = obj["dn"].toString().split(",");
                        let grade = dn[1].substr(3, (dn[1].length - 1));

                        if (grade !== '_Removed') {
                            let user: User = new User(obj.givenName, obj.sn, obj.displayName, obj.sAMAccountName, -1, 0, [], UserStatus.ENABLED, [], [], null, Permissions.getDefault());
                            try {
                                if (obj["memberOf"].includes(global.config.ldapConfig.studentGroup)) {
                                    user.type = 1;
                                } else if (obj["memberOf"].includes(global.config.ldapConfig.teacherGroup)) {
                                    user.type = 2;
                                }
                                users.push(user);
                            } catch (e) {
                                reject("membership validation failed");
                            }
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
        return new Promise(async (resolve, reject) => {
            let opts: SearchOptions = {
                filter: '(&(objectClass=user)(memberOf=' + global.config.ldapConfig.teacherGroup + '))'
            };
            resolve(await Ldap.searchUsersAdvanced(opts, global.config.ldapConfig.root));
        });
    }

    /**
     *
     * @param username
     * @param password
     * @returns {Promise<number>}
     */
    static checkPassword(username: string, password: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await Ldap.bindLDAPAsUser(username, password);
                let users = await Ldap.searchUsers(new UserFilter(username, null, null));
                if (users.length === 1) {
                    resolve();
                } else {
                    reject("User not found");
                }
            } catch (e) {
                reject("password check failed");
            }

        });
    }

    /**
     * load user details for user
     * @returns Promise {[user]}
     * @param username
     */
    static getUserByUsername(username: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            let opts: SearchOptions = {
                filter: '(&(objectClass=user)(samaccountname=' + username + '))'
            };
            try {
                let users = await Ldap.searchUsers(new UserFilter(username, null, null));
                if (users.length === 1) {
                    resolve(users[0]);
                } else {
                    reject("not found");
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    //TODO add jDoc
    static getAllStudents(): Promise<Student[]> {
        return new Promise(async (resolve, reject) => {
            let opts: SearchOptions = {
                filter: '(objectClass=user)',
                scope: 'sub',
                attributes: ['sn', 'givenname', 'samaccountname', 'displayName', 'info', 'dn'],
                paged: true
            };
            let users: Student[] = <Student[]>await Ldap.searchUsersAdvanced(opts, global.config.ldapConfig.root);

            resolve(users);
        });
    }
}

//TODO add jDoc
function ldapErrorHandler(err: Error) {
    global.logger.log({
        level: 'error',
        label: 'LDAP',
        message: 'search error : ' + err.message,
        file: path.basename(__filename)
    });
}

export class LdapSearch {

    firstName: string;
    lastName: string;
    birthDate: string;
    username: string;
    ou: string;

    constructor(firstName: string, lastName: string, birthDate: string, username: string, ou: string) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.username = username;
        this.ou = ou;
    }
}

interface ActiveDirectorySearchEntry extends SearchEntry {
    readonly object: ActiveDirectorySearchEntryObject;

}

interface ActiveDirectorySearchEntryObject extends SearchEntryObject {
    givenName: string;
    sn: string;
    sAMAccountName: string;
    displayName: string;
    info: string;

}