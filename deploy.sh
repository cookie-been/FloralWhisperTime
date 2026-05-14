#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_EXAMPLE_FILE="$REPO_ROOT/.env.example"
ENV_TEMPLATE_FILE="$ENV_EXAMPLE_FILE"
ENV_FILE="$REPO_ROOT/.env"
WEB_PORT_OVERRIDE=""
SKIP_BUILD=0
PULL_BASE=0
GIT_PULL=1
GIT_REMOTE="origin"
GIT_BRANCH=""
ALLOW_DIRTY_GIT=0
DETACH=1
TIMEOUT_SECONDS=300
GENERATED_ADMIN_PASSWORD=""
STRICT_ENV_VALIDATION=1
ALLOW_INSECURE_ENV=0

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
  --env-template PATH  Use a custom env template when initializing env file
  --web-port PORT      Override WEB_PORT for this deployment
  --branch NAME        Pull and deploy the specified git branch
  --remote NAME        Git remote name used for pull, default origin
  --no-git-pull        Skip pulling latest code from git remote
  --allow-dirty-git    Allow deployment without a clean git worktree
  --skip-build         Reuse existing images and start containers only
  --pull               Pull newer base images before building
  --timeout SECONDS    Health check timeout, default 300
  --attach             Run docker compose in foreground
  --allow-insecure-env Allow deployment with default or weak env secrets
  -h, --help           Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

package_backend_artifact() {
  log "Packaging backend application jar..."
  (
    cd "$REPO_ROOT/flower-shop-backend-java"
    mvn -q -DskipTests package
  )
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
  python3 - "$length" <<'PY'
import secrets
import string
import sys

length = int(sys.argv[1])
alphabet = string.ascii_letters + string.digits
print("".join(secrets.choice(alphabet) for _ in range(length)), end="")
PY
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

  [[ -f "$ENV_TEMPLATE_FILE" ]] || fail "Missing env template: $ENV_TEMPLATE_FILE"

  cp "$ENV_TEMPLATE_FILE" "$ENV_FILE"

  set_env_value "$ENV_FILE" "MYSQL_PASSWORD" "$(random_alnum 24)"
  set_env_value "$ENV_FILE" "MYSQL_ROOT_PASSWORD" "$(random_alnum 28)"
  GENERATED_ADMIN_PASSWORD="$(random_alnum 20)"
  set_env_value "$ENV_FILE" "ADMIN_PASSWORD" "$GENERATED_ADMIN_PASSWORD"
  set_env_value "$ENV_FILE" "ADMIN_AUTH_SECRET" "$(random_alnum 48)"

  log "Created $ENV_FILE from template $ENV_TEMPLATE_FILE with generated secrets."
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

require_non_default_env_value() {
  local key="$1"
  local expected_description="$2"
  local value
  value="$(read_env_value "$ENV_FILE" "$key")"
  [[ -n "$value" ]] || fail "$key is empty in $ENV_FILE. Expected: $expected_description"
}

validate_production_env() {
  local mysql_password mysql_root_password admin_password admin_auth_secret web_port

  require_non_default_env_value "MYSQL_DATABASE" "业务数据库名称"
  require_non_default_env_value "MYSQL_USER" "数据库用户名"
  require_non_default_env_value "MYSQL_PASSWORD" "非默认数据库密码"
  require_non_default_env_value "MYSQL_ROOT_PASSWORD" "非默认 root 密码"
  require_non_default_env_value "ADMIN_USERNAME" "后台管理员账号"
  require_non_default_env_value "ADMIN_PASSWORD" "非默认后台管理员密码"
  require_non_default_env_value "ADMIN_AUTH_SECRET" "足够长的签名密钥"
  require_non_default_env_value "WEB_PORT" "站点暴露端口"

  mysql_password="$(read_env_value "$ENV_FILE" "MYSQL_PASSWORD")"
  mysql_root_password="$(read_env_value "$ENV_FILE" "MYSQL_ROOT_PASSWORD")"
  admin_password="$(read_env_value "$ENV_FILE" "ADMIN_PASSWORD")"
  admin_auth_secret="$(read_env_value "$ENV_FILE" "ADMIN_AUTH_SECRET")"
  web_port="$(read_env_value "$ENV_FILE" "WEB_PORT")"

  [[ "$mysql_password" != "change-me" ]] || fail "MYSQL_PASSWORD still uses default placeholder"
  [[ "$mysql_root_password" != "change-root-password" ]] || fail "MYSQL_ROOT_PASSWORD still uses default placeholder"
  [[ "$admin_password" != "Floral@2026" ]] || fail "ADMIN_PASSWORD still uses default demo password"
  [[ "$admin_auth_secret" != "replace-with-a-long-random-secret" ]] || fail "ADMIN_AUTH_SECRET still uses default placeholder"
  [[ "${#admin_auth_secret}" -ge 32 ]] || fail "ADMIN_AUTH_SECRET is too short, must be at least 32 characters"
  [[ "$web_port" =~ ^[0-9]+$ ]] || fail "WEB_PORT must be numeric"
}

post_deploy_self_check() {
  local admin_username admin_password token status_payload

  admin_username="$(read_env_value "$ENV_FILE" "ADMIN_USERNAME")"
  admin_password="$(read_env_value "$ENV_FILE" "ADMIN_PASSWORD")"

  [[ -n "$admin_username" ]] || fail "ADMIN_USERNAME is empty in $ENV_FILE"
  [[ -n "$admin_password" ]] || fail "ADMIN_PASSWORD is empty in $ENV_FILE"

  log "Running post-deploy self-checks..."

  token="$(
    curl -fsS -X POST "http://127.0.0.1:${WEB_PORT}/api/admin/login" \
      -H 'Content-Type: application/json' \
      -d "{\"username\":\"${admin_username}\",\"password\":\"${admin_password}\"}" \
      | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
  )"

  [[ -n "$token" ]] || fail "Admin login self-check failed"

  status_payload="$(
    curl -fsS "http://127.0.0.1:${WEB_PORT}/api/admin/system/status" \
      -H "Authorization: Bearer ${token}"
  )"

  printf '%s' "$status_payload" | grep -q '"databaseConnected":true' || fail "System status self-check failed: databaseConnected is not true"
  printf '%s' "$status_payload" | grep -q '"uploadDirectoryReady":true' || fail "System status self-check failed: uploadDirectoryReady is not true"

  log "Post-deploy self-checks passed."
}

ensure_prerequisites() {
  require_cmd docker
  require_cmd curl
  require_cmd sed
  require_cmd grep
  require_cmd tr
  require_cmd python3
  require_cmd mvn
  if (( GIT_PULL == 1 )); then
    require_cmd git
  fi

  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"

  mkdir -p "$REPO_ROOT/flower-shop-backend-java/uploads"
}

ensure_git_context() {
  [[ -d "$REPO_ROOT/.git" ]] || fail "Git pull is enabled, but $REPO_ROOT is not a git repository"
  git -C "$REPO_ROOT" remote get-url "$GIT_REMOTE" >/dev/null 2>&1 || fail "Git remote does not exist: $GIT_REMOTE"
}

current_git_branch() {
  git -C "$REPO_ROOT" branch --show-current
}

ensure_clean_git_worktree() {
  if (( ALLOW_DIRTY_GIT == 1 )); then
    return
  fi

  if [[ -n "$(git -C "$REPO_ROOT" status --short)" ]]; then
    fail "Git worktree is not clean. Commit or stash changes first, or rerun with --allow-dirty-git"
  fi
}

checkout_git_branch_if_needed() {
  local current_branch target_branch

  current_branch="$(current_git_branch)"
  target_branch="$1"

  [[ -n "$target_branch" ]] || fail "Cannot determine deployment branch"

  if [[ "$current_branch" == "$target_branch" ]]; then
    return
  fi

  if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$target_branch"; then
    log "Switching branch: $current_branch -> $target_branch"
    git -C "$REPO_ROOT" checkout "$target_branch"
    return
  fi

  log "Creating local branch from $GIT_REMOTE/$target_branch"
  git -C "$REPO_ROOT" checkout -b "$target_branch" --track "$GIT_REMOTE/$target_branch"
}

pull_latest_code() {
  local target_branch current_branch

  ensure_git_context
  ensure_clean_git_worktree

  current_branch="$(current_git_branch)"
  target_branch="${GIT_BRANCH:-$current_branch}"

  [[ -n "$target_branch" ]] || fail "Unable to determine git branch for deployment"

  log "Fetching latest code from $GIT_REMOTE/$target_branch..."
  git -C "$REPO_ROOT" fetch "$GIT_REMOTE" "$target_branch"
  checkout_git_branch_if_needed "$target_branch"

  log "Updating local branch with remote changes..."
  git -C "$REPO_ROOT" pull --ff-only "$GIT_REMOTE" "$target_branch"
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
    --env-template)
      [[ $# -ge 2 ]] || fail "--env-template requires a value"
      ENV_TEMPLATE_FILE="$2"
      shift 2
      ;;
    --web-port)
      [[ $# -ge 2 ]] || fail "--web-port requires a value"
      WEB_PORT_OVERRIDE="$2"
      shift 2
      ;;
    --branch)
      [[ $# -ge 2 ]] || fail "--branch requires a value"
      GIT_BRANCH="$2"
      shift 2
      ;;
    --remote)
      [[ $# -ge 2 ]] || fail "--remote requires a value"
      GIT_REMOTE="$2"
      shift 2
      ;;
    --no-git-pull)
      GIT_PULL=0
      shift
      ;;
    --allow-dirty-git)
      ALLOW_DIRTY_GIT=1
      shift
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
    --allow-insecure-env)
      ALLOW_INSECURE_ENV=1
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

if (( GIT_PULL == 1 )); then
  pull_latest_code
fi

init_env_file
warn_default_secrets
if (( STRICT_ENV_VALIDATION == 1 && ALLOW_INSECURE_ENV == 0 )); then
  validate_production_env
fi

if [[ ! -f "$ENV_FILE" ]]; then
  fail "Env file not found: $ENV_FILE"
fi

WEB_PORT="${WEB_PORT_OVERRIDE:-$(read_env_value "$ENV_FILE" "WEB_PORT")}"
WEB_PORT="${WEB_PORT:-8080}"

log "Using env file: $ENV_FILE"
log "Web port: $WEB_PORT"
if (( GIT_PULL == 1 )); then
  log "Git source: $(git -C "$REPO_ROOT" remote get-url "$GIT_REMOTE")"
  log "Git branch: $(current_git_branch)"
fi

if (( PULL_BASE == 1 )); then
  log "Pulling newer base images..."
  package_backend_artifact
  compose_cmd build --pull backend web
fi

if (( SKIP_BUILD == 0 )); then
  package_backend_artifact
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

post_deploy_self_check

log "Deployment completed successfully."
log "Site URL: http://127.0.0.1:${WEB_PORT}"
log "Admin username: $(read_env_value "$ENV_FILE" "ADMIN_USERNAME")"
if [[ -n "$GENERATED_ADMIN_PASSWORD" ]]; then
  log "Generated admin password: $GENERATED_ADMIN_PASSWORD"
else
  log "Admin password: read ADMIN_PASSWORD from $ENV_FILE"
fi
