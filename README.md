# S-Plan_APi

## Travis CI Builds
master / release:
[![Build Status](https://travis-ci.com/Nils-witt/S-Plan_APi.svg?branch=master)](https://travis-ci.com/Nils-witt/S-Plan_APi)
development / upcoming:
[![Build Status](https://travis-ci.com/Nils-witt/S-Plan_APi.svg?branch=development)](https://travis-ci.com/Nils-witt/S-Plan_APi)

## Docker
Mindestanpassung der `docker-compose.yaml`
- API_URL
- PWA_URL
- DISPLAY_URL
- LDAP*
- MYSQL*

Danach starten mit
``````
docker-compose up -d
``````

## Manuell
NodeJs installien: https://nodejs.org/en/download/


Repository clonen
```
git clone https://github.com/Nils-witt/S-Plan_APi
```
Abhängigkeiten installieren
````
npm i
````

Die .env` als Kopie der `resources/env` erstellen und entsprechend anpassen

Danach kann die Anwendung mit `npm start`gestartet werden