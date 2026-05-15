#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_FILE="$REPO_ROOT/.env"
RESTORE_SCRIPT="$REPO_ROOT/ops/restore.sh"
ROLLBACK_LOG_DIR="$REPO_ROOT/logs/rollbacks"
BACKUP_ROOT="$REPO_ROOT/backups"
BACKUP_DIR=""
CONFIRMED=0
DRY_RUN=0
TIMEOUT_SECONDS=300
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ROLLBACK_LOG_FILE=""

log() {
  printf '[rollback] %s\n' "$*"
}

fail() {
  printf '[rollback] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./rollback.sh [options]

Options:
  --backup-dir PATH    Roll back from a specific backup directory
  --latest             Roll back from the latest backup directory
  --env-file PATH      Use a custom env file
  --dry-run            Validate inputs and print planned actions without restoring
  --yes                Skip confirmation prompt
  --timeout SECONDS    Health check timeout, default 300
  -h, --help           Show this help
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

ensure_prerequisites() {
  require_cmd docker
  require_cmd curl
  require_cmd find
  require_cmd mkdir

  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"
  [[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
  [[ -x "$RESTORE_SCRIPT" ]] || fail "Missing executable restore script: $RESTORE_SCRIPT"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

resolve_backup_dir() {
  if [[ -n "$BACKUP_DIR" ]]; then
    return
  fi

  local latest
  latest="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)"
  [[ -n "$latest" ]] || fail "No backup directories found in $BACKUP_ROOT"
  BACKUP_DIR="$latest"
}

validate_backup_dir() {
  [[ -d "$BACKUP_DIR" ]] || fail "Backup directory does not exist: $BACKUP_DIR"
  [[ -f "$BACKUP_DIR/mysql.sql.gz" ]] || fail "Missing database backup: $BACKUP_DIR/mysql.sql.gz"
  [[ -f "$BACKUP_DIR/uploads.tar.gz" ]] || fail "Missing uploads backup: $BACKUP_DIR/uploads.tar.gz"
}

print_plan() {
  log "Rollback source: $BACKUP_DIR"
  log "Restore script: $RESTORE_SCRIPT"
  log "Target services: mysql, backend, web"
}

confirm_rollback() {
  if (( CONFIRMED == 1 )); then
    return
  fi

  printf '[rollback] This will restore database and uploads from backup, then recreate services. Continue? [y/N] '
  read -r answer
  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      fail "Rollback cancelled"
      ;;
  esac
}

run_restore() {
  log "Restoring application data from backup"
  "$RESTORE_SCRIPT" --env-file "$ENV_FILE" --backup-dir "$BACKUP_DIR" --yes
}

recreate_services() {
  log "Recreating backend and web services after restore"
  compose_cmd up -d --force-recreate backend web
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

record_rollback_log() {
  mkdir -p "$ROLLBACK_LOG_DIR"
  ROLLBACK_LOG_FILE="$ROLLBACK_LOG_DIR/$TIMESTAMP.log"

  cat >"$ROLLBACK_LOG_FILE" <<EOF
timestamp=$TIMESTAMP
backup_dir=$BACKUP_DIR
env_file=$ENV_FILE
dry_run=$DRY_RUN
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir)
      [[ $# -ge 2 ]] || fail "--backup-dir requires a value"
      BACKUP_DIR="$2"
      shift 2
      ;;
    --latest)
      BACKUP_DIR=""
      shift
      ;;
    --env-file)
      [[ $# -ge 2 ]] || fail "--env-file requires a value"
      ENV_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --yes)
      CONFIRMED=1
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
resolve_backup_dir
validate_backup_dir
record_rollback_log
print_plan

if (( DRY_RUN == 1 )); then
  log "Dry run completed. No data was changed."
  log "Rollback log: $ROLLBACK_LOG_FILE"
  exit 0
fi

confirm_rollback
run_restore
recreate_services

WEB_PORT="$(read_env_value "$ENV_FILE" "WEB_PORT")"
WEB_PORT="${WEB_PORT:-8080}"

if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/api/health" "Backend health"; then
  show_failure_context
  fail "Backend health check timed out after rollback"
fi

if ! wait_for_url "http://127.0.0.1:${WEB_PORT}/" "Web entry"; then
  show_failure_context
  fail "Web health check timed out after rollback"
fi

log "Rollback completed successfully"
log "Rollback log: $ROLLBACK_LOG_FILE"
