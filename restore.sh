#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_FILE="$REPO_ROOT/.env"
BACKUP_ROOT="$REPO_ROOT/backups"
BACKUP_DIR=""
CONFIRMED=0
DRY_RUN=0

log() {
  printf '[restore] %s\n' "$*"
}

fail() {
  printf '[restore] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./restore.sh [options]

Options:
  --backup-dir PATH    Restore from a specific backup directory
  --latest             Restore from the latest backup directory
  --env-file PATH      Use a custom env file
  --dry-run            Validate backup and print planned actions without restoring
  --yes                Skip confirmation prompt
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
  require_cmd tar
  require_cmd gzip
  require_cmd find
  require_cmd sed
  require_cmd cp
  require_cmd rm
  require_cmd mktemp
  require_cmd curl

  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"
  [[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

ensure_services_running() {
  compose_cmd ps mysql >/dev/null 2>&1 || fail "MySQL service is not available in compose"
  compose_cmd ps backend >/dev/null 2>&1 || fail "Backend service is not available in compose"
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
  [[ -f "$BACKUP_DIR/metadata.txt" ]] || fail "Missing metadata file: $BACKUP_DIR/metadata.txt"
}

print_plan() {
  log "Restore source: $BACKUP_DIR"
  log "Database file: $BACKUP_DIR/mysql.sql.gz"
  log "Uploads file: $BACKUP_DIR/uploads.tar.gz"
  log "Target uploads directory: $REPO_ROOT/flower-shop-backend-java/uploads"
}

confirm_restore() {
  if (( CONFIRMED == 1 )); then
    return
  fi

  printf '[restore] This will overwrite the current database and uploads. Continue? [y/N] '
  read -r answer
  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      fail "Restore cancelled"
      ;;
  esac
}

restore_database() {
  local database user password

  database="$(read_env_value "$ENV_FILE" "MYSQL_DATABASE")"
  user="$(read_env_value "$ENV_FILE" "MYSQL_USER")"
  password="$(read_env_value "$ENV_FILE" "MYSQL_PASSWORD")"

  [[ -n "$database" ]] || fail "MYSQL_DATABASE is empty in $ENV_FILE"
  [[ -n "$user" ]] || fail "MYSQL_USER is empty in $ENV_FILE"
  [[ -n "$password" ]] || fail "MYSQL_PASSWORD is empty in $ENV_FILE"

  log "Restoring MySQL database: $database"
  gzip -dc "$BACKUP_DIR/mysql.sql.gz" | compose_cmd exec -T mysql sh -lc "MYSQL_PWD='$password' mysql -u'$user' '$database'"
}

restore_uploads() {
  local uploads_dir temp_dir

  uploads_dir="$REPO_ROOT/flower-shop-backend-java/uploads"
  temp_dir="$(mktemp -d)"
  trap 'rm -rf "$temp_dir"' RETURN

  mkdir -p "$uploads_dir"
  log "Restoring uploads directory"
  tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$temp_dir"
  rm -rf "$uploads_dir"
  mkdir -p "$uploads_dir"
  cp -a "$temp_dir"/. "$uploads_dir"/
}

run_health_check() {
  local web_port url
  web_port="$(read_env_value "$ENV_FILE" "WEB_PORT")"
  url="http://127.0.0.1:${web_port:-8080}/api/health"

  log "Running post-restore health check: $url"
  curl -fsS "$url" >/dev/null || fail "Health check failed after restore"
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
ensure_services_running
resolve_backup_dir
validate_backup_dir
print_plan

if (( DRY_RUN == 1 )); then
  log "Dry run completed. No data was changed."
  exit 0
fi

confirm_restore
restore_database
restore_uploads
run_health_check
log "Restore completed successfully."
