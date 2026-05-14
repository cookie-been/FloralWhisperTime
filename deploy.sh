#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_EXAMPLE_FILE="$REPO_ROOT/.env.example"
ENV_FILE="$REPO_ROOT/.env"
WEB_PORT_OVERRIDE=""
SKIP_BUILD=0
PULL_BASE=0
DETACH=1
TIMEOUT_SECONDS=300
GENERATED_ADMIN_PASSWORD=""

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  --env-file PATH      Use a custom compose env file
  --web-port PORT      Override WEB_PORT for this deployment
  --skip-build         Reuse existing images and start containers only
  --pull               Pull newer base images before building
  --timeout SECONDS    Health check timeout, default 300
  --attach             Run docker compose in foreground
  -h, --help           Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

compose_cmd() {
  local -a cmd=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
  if [[ -n "$WEB_PORT_OVERRIDE" ]]; then
    WEB_PORT="$WEB_PORT_OVERRIDE" "${cmd[@]}" "$@"
  else
    "${cmd[@]}" "$@"
  fi
}

random_alnum() {
  local length="$1"
  tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$length"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

read_env_value() {
  local file="$1"
  local key="$2"
  local value

  value="$(sed -n "s/^${key}=//p" "$file" | tail -n 1)"
  printf '%s' "$value"
}

init_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    return
  fi

  [[ -f "$ENV_EXAMPLE_FILE" ]] || fail "Missing env template: $ENV_EXAMPLE_FILE"

  cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"

  set_env_value "$ENV_FILE" "MYSQL_PASSWORD" "$(random_alnum 24)"
  set_env_value "$ENV_FILE" "MYSQL_ROOT_PASSWORD" "$(random_alnum 28)"
  GENERATED_ADMIN_PASSWORD="$(random_alnum 20)"
  set_env_value "$ENV_FILE" "ADMIN_PASSWORD" "$GENERATED_ADMIN_PASSWORD"
  set_env_value "$ENV_FILE" "ADMIN_AUTH_SECRET" "$(random_alnum 48)"

  log "Created $ENV_FILE with generated secrets."
}

warn_default_secrets() {
  local mysql_password mysql_root_password admin_password admin_auth_secret
  mysql_password="$(read_env_value "$ENV_FILE" "MYSQL_PASSWORD")"
  mysql_root_password="$(read_env_value "$ENV_FILE" "MYSQL_ROOT_PASSWORD")"
  admin_password="$(read_env_value "$ENV_FILE" "ADMIN_PASSWORD")"
  admin_auth_secret="$(read_env_value "$ENV_FILE" "ADMIN_AUTH_SECRET")"

  if [[ "$mysql_password" == "change-me" ]] \
    || [[ "$mysql_root_password" == "change-root-password" ]] \
    || [[ "$admin_password" == "Floral@2026" ]] \
    || [[ "$admin_auth_secret" == "replace-with-a-long-random-secret" ]]; then
    log "Warning: $ENV_FILE still contains default credentials or secrets."
  fi
}

ensure_prerequisites() {
  require_cmd docker
  require_cmd curl
  require_cmd sed
  require_cmd grep
  require_cmd tr

  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"

  mkdir -p "$REPO_ROOT/flower-shop-backend-java/uploads"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local deadline now

  deadline=$((SECONDS + TIMEOUT_SECONDS))
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$label is ready: $url"
      return 0
    fi

    now=$SECONDS
    if (( now >= deadline )); then
      return 1
    fi

    sleep 3
  done
}

show_failure_context() {
  log "Container status:"
  compose_cmd ps || true
  log "Recent backend logs:"
  compose_cmd logs --tail=120 backend || true
  log "Recent web logs:"
  compose_cmd logs --tail=120 web || true
  log "Recent mysql logs:"
  compose_cmd logs --tail=120 mysql || true
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      [[ $# -ge 2 ]] || fail "--env-file requires a value"
      ENV_FILE="$2"
      shift 2
      ;;
    --web-port)
      [[ $# -ge 2 ]] || fail "--web-port requires a value"
      WEB_PORT_OVERRIDE="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --pull)
      PULL_BASE=1
      shift
      ;;
    --timeout)
      [[ $# -ge 2 ]] || fail "--timeout requires a value"
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    --attach)
      DETACH=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

ensure_prerequisites
init_env_file
warn_default_secrets

if [[ ! -f "$ENV_FILE" ]]; then
  fail "Env file not found: $ENV_FILE"
fi

WEB_PORT="${WEB_PORT_OVERRIDE:-$(read_env_value "$ENV_FILE" "WEB_PORT")}"
WEB_PORT="${WEB_PORT:-8080}"

log "Using env file: $ENV_FILE"
log "Web port: $WEB_PORT"

if (( PULL_BASE == 1 )); then
  log "Pulling newer base images..."
  compose_cmd build --pull backend web
fi

if (( SKIP_BUILD == 0 )); then
  log "Building and starting containers..."
  if (( DETACH == 1 )); then
    compose_cmd up -d --build
  else
    compose_cmd up --build
  fi
else
  log "Starting containers without rebuilding images..."
  if (( DETACH == 1 )); then
    compose_cmd up -d
  else
    compose_cmd up
  fi
fi

if (( DETACH == 0 )); then
  exit 0
fi

log "Waiting for application health checks..."
if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/api/health" "Backend health"; then
  show_failure_context
  fail "Backend health check timed out"
fi

if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/" "Web entry"; then
  show_failure_context
  fail "Web health check timed out"
fi

log "Deployment completed successfully."
log "Site URL: http://127.0.0.1:${WEB_PORT}"
log "Admin username: $(read_env_value "$ENV_FILE" "ADMIN_USERNAME")"
if [[ -n "$GENERATED_ADMIN_PASSWORD" ]]; then
  log "Generated admin password: $GENERATED_ADMIN_PASSWORD"
else
  log "Admin password: read ADMIN_PASSWORD from $ENV_FILE"
fi
