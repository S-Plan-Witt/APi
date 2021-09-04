FROM node:16.0-buster-slim
WORKDIR /usr/src/app
COPY package.json ./
COPY tsconfig.json ./
RUN apt update && apt install mariadb-client python make g++ -y
RUN npm install
COPY ./src ./src
RUN npx tsc



FROM node:16-buster

WORKDIR /usr/src/splan
COPY package.json ./
RUN npm install --only=prod
RUN mkdir /var/log/splan/

ENV PORT=3000
ENV API_TELEGRAM=""
ENV API_SENDGRID=""
ENV ORIGIN="https://siks.example.de"
ENV LDAP="true"
ENV LDAP_TLS="true"
ENV LDAP_HOST="ldap://127.0.0.1:10042"
ENV LDAP_USER="user"
ENV LDAP_PASS="pass"
ENV LDAP_ROOT="DC=domain,DC=local"
ENV LDAP_STUDENTS="OU=Students"
ENV LDAP_TEACHER="OU=Teachers"
ENV LDAP_DOMAIN="domain"
ENV LDAP_CA_PATH="/usr/src/splan/keys/ldap-ca.pem"
ENV SQL_PORT=3306
ENV SQL_HOST="db"
ENV SQL_USER="siks"
ENV SQL_PASS=""
ENV SQL_DB="siks"
ENV VAPID_PUBLIC=""
ENV VAPID_PRIVATE=""
ENV VAPID_MAIL="mailto:"
ENV GOOGLE_APPLICATION_CREDENTIALS="/usr/src/splan/keys/fcm_key.json"

COPY --from=0 /usr/src/app/build ./
CMD ["node","app.js"]
EXPOSE 3000