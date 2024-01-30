#!/usr/bin/with-contenv bashio
set -e
APP_PORT=40002 APP_DEBUG=true APP_PREFIX=/rinnai APP_LOG_LEVEL=debug APP_JWT_SECRET=$(uuidgen) NODE_ENV=production node app/index.js


