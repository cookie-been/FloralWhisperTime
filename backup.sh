#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
ENV_FILE="$REPO_ROOT/.env"
BACKUP_ROOT="$REPO_ROOT/backups"
RETENTION_COUNT=7
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=""

log() {
  printf '[backup] %s\n' "$*"
}

fail() {
  printf '[backup] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./backup.sh [options]

Options:
  --env-file PATH      Use a custom env file
  --output-dir PATH    Backup root directory, default ./backups
  --retain COUNT       Keep latest COUNT backups, default 7
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
  require_cmd date

  [[ -f "$COMPOSE_FILE" ]] || fail "Missing compose file: $COMPOSE_FILE"
  [[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

ensure_services_running() {
  compose_cmd ps mysql >/dev/null 2>&1 || fail "MySQL service is not available in compose"
}

prepare_backup_dir() {
  mkdir -p "$BACKUP_ROOT"
  BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
  mkdir -p "$BACKUP_DIR"
}

backup_database() {
  local database user password dump_file

  database="$(read_env_value "$ENV_FILE" "MYSQL_DATABASE")"
  user="$(read_env_value "$ENV_FILE" "MYSQL_USER")"
  password="$(read_env_value "$ENV_FILE" "MYSQL_PASSWORD")"

  [[ -n "$database" ]] || fail "MYSQL_DATABASE is empty in $ENV_FILE"
  [[ -n "$user" ]] || fail "MYSQL_USER is empty in $ENV_FILE"
  [[ -n "$password" ]] || fail "MYSQL_PASSWORD is empty in $ENV_FILE"

  dump_file="$BACKUP_DIR/mysql.sql.gz"
  log "Backing up MySQL database: $database"
  compose_cmd exec -T mysql sh -lc "MYSQL_PWD='$password' mysqldump --single-transaction --quick --routines --triggers --no-tablespaces -u'$user' '$database'" | gzip -c >"$dump_file"
  [[ -s "$dump_file" ]] || fail "Database backup file is empty: $dump_file"
}

backup_uploads() {
  local uploads_dir archive_file

  uploads_dir="$REPO_ROOT/flower-shop-backend-java/uploads"
  archive_file="$BACKUP_DIR/uploads.tar.gz"

  mkdir -p "$uploads_dir"
  log "Backing up uploads directory"
  tar -C "$uploads_dir" -czf "$archive_file" .
  [[ -s "$archive_file" ]] || fail "Uploads backup file is empty: $archive_file"
}

write_metadata() {
  local web_port version
  web_port="$(read_env_value "$ENV_FILE" "WEB_PORT")"
  version="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'unknown')"

  cat >"$BACKUP_DIR/metadata.txt" <<EOF
timestamp=$TIMESTAMP
git_revision=$version
web_port=${web_port:-8080}
env_file=$ENV_FILE
EOF
}

cleanup_old_backups() {
  local backups_to_remove
  mapfile -t backups_to_remove < <(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"${RETENTION_COUNT}" 2>/dev/null || true)

  if ((${#backups_to_remove[@]} == 0)); then
    return
  fi

  for dir in "${backups_to_remove[@]}"; do
    log "Removing old backup: $(basename "$dir")"
    rm -rf "$dir"
  done
}

print_summary() {
  log "Backup completed successfully."
  log "Backup directory: $BACKUP_DIR"
  log "Files:"
  find "$BACKUP_DIR" -maxdepth 1 -type f -printf '  - %f\n' | sort
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      [[ $# -ge 2 ]] || fail "--env-file requires a value"
      ENV_FILE="$2"
      shift 2
      ;;
    --output-dir)
      [[ $# -ge 2 ]] || fail "--output-dir requires a value"
      BACKUP_ROOT="$2"
      shift 2
      ;;
    --retain)
      [[ $# -ge 2 ]] || fail "--retain requires a value"
      RETENTION_COUNT="$2"
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

[[ "$RETENTION_COUNT" =~ ^[0-9]+$ ]] || fail "--retain must be a non-negative integer"
(( RETENTION_COUNT >= 1 )) || fail "--retain must be at least 1"

ensure_prerequisites
ensure_services_running
prepare_backup_dir
backup_database
backup_uploads
write_metadata
cleanup_old_backups
print_summary
