#!/bin/bash
set -e

mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin <<EOF
db.getSiblingDB('auth_db').createUser({user: 'auth_user', pwd: '${AUTH_DB_PASSWORD}', roles: [{role: 'readWrite', db: 'auth_db'}]});
db.getSiblingDB('realtime_db').createUser({user: 'realtime_user', pwd: '${REALTIME_DB_PASSWORD}', roles: [{role: 'readWrite', db: 'realtime_db'}]});
EOF
