/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {LdapConfig} from './LdapConfig';
import {MysqlConfig} from "./MysqlConfig";
import {PushFrameworksConfig} from "./PushFrameworksConfig";
import {WebServerConfig} from "./WebServerConfig";

export class Config {
    public ldapConfig: LdapConfig = new LdapConfig();
    public mysqlConfig: MysqlConfig = new MysqlConfig();
    public pushFrameWorks: PushFrameworksConfig = new PushFrameworksConfig();
    public webServerConfig: WebServerConfig = new WebServerConfig();

    static loadFromEnv(): Config {
        let config = new Config();
        //LDAP
        if (typeof process.env.LDAP == "string") if (process.env.LDAP === "true") config.ldapConfig.enabled = true;
        if (typeof process.env.LDAP_TLS == "string") if (process.env.LDAP_TLS === "true") config.ldapConfig.tls = true;
        if (typeof process.env.LDAP_HOST == "string") config.ldapConfig.host = process.env.LDAP_HOST;
        if (typeof process.env.LDAP_ROOT == "string") config.ldapConfig.root = process.env.LDAP_ROOT;
        if (typeof process.env.LDAP_USER == "string") config.ldapConfig.user = process.env.LDAP_USER;
        if (typeof process.env.LDAP_PASS == "string") config.ldapConfig.password = process.env.LDAP_PASS;
        if (typeof process.env.LDAP_STUDENTS == "string") config.ldapConfig.studentPath = process.env.LDAP_STUDENTS;
        if (typeof process.env.LDAP_STUDENTSGROUP == "string") config.ldapConfig.studentGroup = process.env.LDAP_STUDENTSGROUP;
        if (typeof process.env.LDAP_TEACHER == "string") config.ldapConfig.teacherPath = process.env.LDAP_TEACHER;
        if (typeof process.env.LDAP_TEACHERGROUP == "string") config.ldapConfig.teacherGroup = process.env.LDAP_TEACHERGROUP;
        if (typeof process.env.LDAP_DOMAIN == "string") config.ldapConfig.domain = process.env.LDAP_DOMAIN;
        if (typeof process.env.LDAP_CA_PATH == "string") config.ldapConfig.caCertPath = process.env.LDAP_CA_PATH;

        //MYSQL
        if (typeof process.env.SQL_PORT == "string") config.mysqlConfig.port = parseInt(process.env.SQL_PORT);
        if (typeof process.env.SQL_HOST == "string") config.mysqlConfig.hostname = process.env.SQL_HOST;
        if (typeof process.env.SQL_USER == "string") config.mysqlConfig.username = process.env.SQL_USER;
        if (typeof process.env.SQL_PASS == "string") config.mysqlConfig.password = process.env.SQL_PASS;
        if (typeof process.env.SQL_DB == "string") config.mysqlConfig.database = process.env.SQL_DB;

        //PushFrameworks
        if (typeof process.env.TGBot == "string") if (process.env.TGBot === "true") config.pushFrameWorks.telegramBot = true;
        if (typeof process.env.API_TELEGRAM == "string") config.pushFrameWorks.telegramBotToken = process.env.API_TELEGRAM;
        if (typeof process.env.API_SENDGRID == "string") config.pushFrameWorks.sendgridToken = process.env.API_SENDGRID;
        if (typeof process.env.VAPID_PUBLIC == "string") config.pushFrameWorks.vapidKeyPublic = process.env.VAPID_PUBLIC;
        if (typeof process.env.VAPID_PRIVATE == "string") config.pushFrameWorks.vapidKeyPrivate = process.env.VAPID_PRIVATE;
        if (typeof process.env.VAPID_MAIL == "string") config.pushFrameWorks.vapidKeyMail = process.env.VAPID_MAIL;
        if (typeof process.env.GOOGLE_APPLICATION_CREDENTIALS == "string") config.pushFrameWorks.firebaseCertificatePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        //Webserver
        if (typeof process.env.PORT == "string") config.webServerConfig.port = parseInt(process.env.PORT);
        if (typeof process.env.APIDOC == "string") if (process.env.APIDOC === "true") config.webServerConfig.apiDocumentation = true;
        if (typeof process.env.ORIGIN == "string") config.webServerConfig.serverOrigin = process.env.ORIGIN;

        return config;
    }
}