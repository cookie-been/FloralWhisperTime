#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_FILE="$REPO_ROOT/.env"
BACKUP_SCRIPT="$REPO_ROOT/backup.sh"
UPGRADE_LOG_DIR="$REPO_ROOT/logs/upgrades"
GIT_REMOTE="origin"
GIT_BRANCH=""
ALLOW_DIRTY_GIT=0
SKIP_GIT_PULL=0
SKIP_BACKUP=0
SKIP_BUILD=0
TIMEOUT_SECONDS=300
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
UPGRADE_LOG_FILE=""

log() {
  printf '[upgrade] %s\n' "$*"
}

fail() {
  printf '[upgrade] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./upgrade.sh [options]

Options:
  --env-file PATH        Use a custom env file
  --branch NAME          Pull and upgrade to the specified branch
  --remote NAME          Git remote used for pull, default origin
  --skip-git-pull        Skip pulling latest code
  --skip-backup          Skip automatic backup before upgrade
  --skip-build           Reuse existing images and restart containers only
  --allow-dirty-git      Allow upgrading with a dirty git worktree
  --timeout SECONDS      Health check timeout, default 300
  -h, --help             Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

read_env_value() {
  local file="$1"
  local key="$2"
  local value

  value="$(sed -n "s/^${key}=//p" "$file" | tail -n 1)"
  printf '%s' "$value"
}

compose_cmd() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

resolve_web_port() {
  local mapped_port

  mapped_port="$(compose_cmd port web 80 2>/dev/null | sed -n 's/.*:\([0-9][0-9]*\)$/\1/p' | tail -n 1)"
  if [[ -n "$mapped_port" ]]; then
    printf '%s' "$mapped_port"
    return
  fi

  printf '%s' "${WEB_PORT:-8080}"
}

current_git_branch() {
  git -C "$REPO_ROOT" branch --show-current
}

ensure_prerequisites() {
  require_cmd docker
  require_cmd curl
  require_cmd git
  require_cmd mvn
  require_cmd sed
  require_cmd mkdir

  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"
  [[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
  [[ -x "$BACKUP_SCRIPT" ]] || fail "Missing executable backup script: $BACKUP_SCRIPT"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

ensure_git_context() {
  [[ -d "$REPO_ROOT/.git" ]] || fail "$REPO_ROOT is not a git repository"
  git -C "$REPO_ROOT" remote get-url "$GIT_REMOTE" >/dev/null 2>&1 || fail "Git remote does not exist: $GIT_REMOTE"
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

  [[ -n "$target_branch" ]] || fail "Cannot determine target git branch"

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

  [[ -n "$target_branch" ]] || fail "Unable to determine git branch for upgrade"

  log "Fetching latest code from $GIT_REMOTE/$target_branch"
  git -C "$REPO_ROOT" fetch "$GIT_REMOTE" "$target_branch"
  checkout_git_branch_if_needed "$target_branch"
  log "Updating local branch"
  git -C "$REPO_ROOT" pull --ff-only "$GIT_REMOTE" "$target_branch"
}

package_backend_artifact() {
  log "Packaging backend application jar"
  (
    cd "$REPO_ROOT/flower-shop-backend-java"
    mvn -q -DskipTests package
  )
}

run_backup() {
  if (( SKIP_BACKUP == 1 )); then
    log "Skipping backup before upgrade"
    return
  fi

  log "Running backup before upgrade"
  "$BACKUP_SCRIPT" --env-file "$ENV_FILE"
}

run_compose_upgrade() {
  if (( SKIP_BUILD == 1 )); then
    log "Restarting containers without rebuilding images"
    compose_cmd up -d
    return
  fi

  package_backend_artifact
  log "Rebuilding and recreating backend and web services"
  compose_cmd up -d --build --force-recreate backend web
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

record_upgrade_log() {
  local version branch
  mkdir -p "$UPGRADE_LOG_DIR"
  UPGRADE_LOG_FILE="$UPGRADE_LOG_DIR/$TIMESTAMP.log"
  version="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'unknown')"
  branch="$(current_git_branch 2>/dev/null || printf 'unknown')"

  cat >"$UPGRADE_LOG_FILE" <<EOF
timestamp=$TIMESTAMP
git_revision=$version
git_branch=$branch
env_file=$ENV_FILE
skip_git_pull=$SKIP_GIT_PULL
skip_backup=$SKIP_BACKUP
skip_build=$SKIP_BUILD
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      [[ $# -ge 2 ]] || fail "--env-file requires a value"
      ENV_FILE="$2"
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
    --skip-git-pull)
      SKIP_GIT_PULL=1
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --allow-dirty-git)
      ALLOW_DIRTY_GIT=1
      shift
      ;;
    --timeout)
      [[ $# -ge 2 ]] || fail "--timeout requires a value"
      TIMEOUT_SECONDS="$2"
      shift 2
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

if (( SKIP_GIT_PULL == 0 )); then
  pull_latest_code
else
  log "Skipping git pull"
fi

run_backup
run_compose_upgrade
record_upgrade_log

WEB_PORT="$(read_env_value "$ENV_FILE" "WEB_PORT")"
WEB_PORT="${WEB_PORT:-8080}"
WEB_PORT="$(resolve_web_port)"

log "Detected published web port: $WEB_PORT"

log "Waiting for backend health check"
if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/api/health" "Backend health"; then
  show_failure_context
  fail "Backend health check timed out after upgrade"
fi

log "Waiting for web entry"
if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/" "Web entry"; then
  show_failure_context
  fail "Web health check timed out after upgrade"
fi

log "Upgrade completed successfully"
log "Site URL: http://127.0.0.1:${WEB_PORT}"
log "Upgrade log: $UPGRADE_LOG_FILE"
