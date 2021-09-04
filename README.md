# S-Plan_APi

## CI Builds
master / release:
[![Docker](https://github.com/S-Plan-Witt/APi/actions/workflows/docker-publish.yml/badge.svg?branch=master)](https://github.com/S-Plan-Witt/APi/actions/workflows/docker-publish.yml)

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
