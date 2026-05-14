#!/bin/sh

set -eu

UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
APP_USER="${APP_USER:-appuser}"
APP_GROUP="${APP_GROUP:-appgroup}"

mkdir -p "$UPLOAD_DIR"
chown -R "$APP_USER:$APP_GROUP" "$UPLOAD_DIR"
chmod 775 "$UPLOAD_DIR"

exec su -s /bin/sh -c "exec \"$JAVA_HOME/bin/java\" $JAVA_OPTS -jar /app/app.jar" "$APP_USER"
