FROM node:current-alpine

WORKDIR /usr/src/splan
COPY package.json ./
RUN apk add mysql-client
RUN apk add --no-cache --virtual .gyp python make g++
RUN npm install
RUN apk del .gyp
RUN mkdir /var/log/splan/

ENV PORT=3000
ENV API_TELEGRAM=""
ENV API_SENDGRID=""
ENV ORIGIN="https://splan.nils-witt.de"
ENV LDAP_HOST="ldap://93.177.67.192:10042"
ENV LDAP_USER="user"
ENV LDAP_PASS="pass"
ENV LDAP_ROOT="DC=domain,DC=local"
ENV LDAP_STUDENTS="OU=Students"
ENV LDAP_TEACHER="OU=Teachers"
ENV LDAP_DOMAIN="domain"
ENV SQL_PORT=3306
ENV SQL_HOST="db"
ENV SQL_USER="splan"
ENV SQL_PASS=""
ENV SQL_DB="splan"
ENV VAPID_PUBLIC=""
ENV VAPID_PRIVATE=""
ENV VAPID_MAIL="mailto:"
ENV GOOGLE_APPLICATION_CREDENTIALS="/usr/src/splan/keys/fcm_key.json"

COPY ext/setup.sql ./
COPY build/ ./
COPY keys/ ./keys/

CMD ["node","index.js"]
EXPOSE 3000