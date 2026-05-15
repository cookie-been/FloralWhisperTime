#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_NAME="${PROJECT_NAME:-}"
APP_ROOT="${APP_ROOT:-/opt/floralwhispertime}"
RELEASES_DIR="${APP_ROOT}/releases"
SHARED_DIR="${APP_ROOT}/shared"
CURRENT_LINK="${APP_ROOT}/current"
SHARED_ENV_FILE="${SHARED_DIR}/.env"
SHARED_UPLOADS_DIR="${SHARED_DIR}/uploads"
SHARED_BACKUPS_DIR="${SHARED_DIR}/backups"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-300}"
RELEASE_RETENTION_COUNT="${RELEASE_RETENTION_COUNT:-5}"

log_release() {
  printf '[release] %s\n' "$*"
}

fail_release() {
  printf '[release] ERROR: %s\n' "$*" >&2
  exit 1
}

require_release_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail_release "Missing required command: $1"
}

read_release_env_value() {
  local file="$1"
  local key="$2"
  local value

  value="$(sed -n "s/^${key}=//p" "$file" | tail -n 1)"
  printf '%s' "$value"
}

set_release_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

load_release_info() {
  local release_info_file="$1"
  [[ -f "$release_info_file" ]] || fail_release "Missing release info file: $release_info_file"

  RELEASE_ID="$(read_release_env_value "$release_info_file" "release_id")"
  BACKEND_IMAGE="$(read_release_env_value "$release_info_file" "backend_image")"
  WEB_IMAGE="$(read_release_env_value "$release_info_file" "web_image")"
  RELEASE_GIT_REVISION="$(read_release_env_value "$release_info_file" "git_revision")"

  [[ -n "$RELEASE_ID" ]] || fail_release "release_id is missing in $release_info_file"
  [[ -n "$BACKEND_IMAGE" ]] || fail_release "backend_image is missing in $release_info_file"
  [[ -n "$WEB_IMAGE" ]] || fail_release "web_image is missing in $release_info_file"
}

ensure_release_prerequisites() {
  require_release_cmd docker
  require_release_cmd curl
  require_release_cmd sed
  require_release_cmd grep
  require_release_cmd mkdir
  require_release_cmd readlink
  require_release_cmd tar
  docker compose version >/dev/null 2>&1 || fail_release "docker compose is not available"
}

ensure_release_directories() {
  mkdir -p "$APP_ROOT" "$RELEASES_DIR" "$SHARED_DIR" "$SHARED_UPLOADS_DIR" "$SHARED_BACKUPS_DIR"
}

validate_release_retention_count() {
  [[ "$RELEASE_RETENTION_COUNT" =~ ^[0-9]+$ ]] || fail_release "RELEASE_RETENTION_COUNT must be a non-negative integer"
  (( RELEASE_RETENTION_COUNT >= 1 )) || fail_release "RELEASE_RETENTION_COUNT must be at least 1"
}

sanitize_project_name() {
  local value="$1"

  value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
  value="$(printf '%s' "$value" | sed 's#[^a-z0-9]#-#g')"
  value="$(printf '%s' "$value" | sed 's/--*/-/g; s/^-//; s/-$//')"

  if [[ -z "$value" ]]; then
    value="floralwhispertime"
  fi

  printf '%s' "$value"
}

resolve_project_name() {
  if [[ -n "$PROJECT_NAME" ]]; then
    PROJECT_NAME="$(sanitize_project_name "$PROJECT_NAME")"
    return
  fi

  if [[ "$APP_ROOT" == "/opt/floralwhispertime" ]]; then
    PROJECT_NAME="floralwhispertime"
    return
  fi

  PROJECT_NAME="$(sanitize_project_name "floralwhispertime-$(basename "$APP_ROOT")")"
}

resolve_release_paths() {
  RELEASE_ROOT="${RELEASE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
  RELEASE_INFO_FILE="${RELEASE_INFO_FILE:-$RELEASE_ROOT/RELEASE_INFO}"
  RELEASE_COMPOSE_FILE="${RELEASE_COMPOSE_FILE:-$RELEASE_ROOT/docker-compose.release.yml}"
  RELEASE_IMAGES_DIR="${RELEASE_IMAGES_DIR:-$RELEASE_ROOT/images}"

  [[ -f "$RELEASE_COMPOSE_FILE" ]] || fail_release "Missing release compose file: $RELEASE_COMPOSE_FILE"
  [[ -d "$RELEASE_IMAGES_DIR" ]] || fail_release "Missing release images directory: $RELEASE_IMAGES_DIR"
}

compose_release_cmd() {
  BACKEND_IMAGE="$BACKEND_IMAGE" \
  WEB_IMAGE="$WEB_IMAGE" \
  SHARED_UPLOADS_DIR="$SHARED_UPLOADS_DIR" \
  SHARED_BACKUPS_DIR="$SHARED_BACKUPS_DIR" \
  docker compose \
    --project-name "$PROJECT_NAME" \
    --env-file "$SHARED_ENV_FILE" \
    -f "$RELEASE_COMPOSE_FILE" \
    "$@"
}

resolve_release_web_port() {
  local mapped_port

  mapped_port="$(compose_release_cmd port web 80 2>/dev/null | sed -n 's/.*:\([0-9][0-9]*\)$/\1/p' | tail -n 1)"
  if [[ -n "$mapped_port" ]]; then
    printf '%s' "$mapped_port"
    return
  fi

  printf '%s' "${WEB_PORT:-8080}"
}

wait_for_release_url() {
  local url="$1"
  local label="$2"
  local deadline now

  deadline=$((SECONDS + TIMEOUT_SECONDS))
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log_release "$label is ready: $url"
      return 0
    fi

    now=$SECONDS
    if (( now >= deadline )); then
      return 1
    fi

    sleep 3
  done
}

show_release_failure_context() {
  log_release "Container status:"
  compose_release_cmd ps || true
  log_release "Recent backend logs:"
  compose_release_cmd logs --tail=120 backend || true
  log_release "Recent web logs:"
  compose_release_cmd logs --tail=120 web || true
  log_release "Recent mysql logs:"
  compose_release_cmd logs --tail=120 mysql || true
}

post_release_self_check() {
  local admin_username admin_password token status_payload web_port

  admin_username="$(read_release_env_value "$SHARED_ENV_FILE" "ADMIN_USERNAME")"
  admin_password="$(read_release_env_value "$SHARED_ENV_FILE" "ADMIN_PASSWORD")"
  web_port="$(resolve_release_web_port)"

  [[ -n "$admin_username" ]] || fail_release "ADMIN_USERNAME is empty in $SHARED_ENV_FILE"
  [[ -n "$admin_password" ]] || fail_release "ADMIN_PASSWORD is empty in $SHARED_ENV_FILE"

  token="$(
    curl -fsS -X POST "http://127.0.0.1:${web_port}/api/admin/login" \
      -H 'Content-Type: application/json' \
      -d "{\"username\":\"${admin_username}\",\"password\":\"${admin_password}\"}" \
      | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
  )"

  [[ -n "$token" ]] || fail_release "Admin login self-check failed"

  status_payload="$(
    curl -fsS "http://127.0.0.1:${web_port}/api/admin/system/status" \
      -H "Authorization: Bearer ${token}"
  )"

  printf '%s' "$status_payload" | grep -q '"databaseConnected":true' || fail_release "System status self-check failed: databaseConnected is not true"
  printf '%s' "$status_payload" | grep -q '"uploadDirectoryReady":true' || fail_release "System status self-check failed: uploadDirectoryReady is not true"
}

run_release_inspection() {
  local admin_username admin_password token status_payload web_port

  admin_username="$(read_release_env_value "$SHARED_ENV_FILE" "ADMIN_USERNAME")"
  admin_password="$(read_release_env_value "$SHARED_ENV_FILE" "ADMIN_PASSWORD")"
  web_port="$(resolve_release_web_port)"

  [[ -n "$admin_username" ]] || fail_release "ADMIN_USERNAME is empty in $SHARED_ENV_FILE"
  [[ -n "$admin_password" ]] || fail_release "ADMIN_PASSWORD is empty in $SHARED_ENV_FILE"

  log_release "Inspecting compose containers..."
  compose_release_cmd ps

  log_release "Checking backend health endpoint..."
  curl -fsS "http://127.0.0.1:${web_port}/api/health"

  log_release "Checking web entry..."
  curl -fsSI "http://127.0.0.1:${web_port}/" >/dev/null

  log_release "Checking admin login..."
  token="$(
    curl -fsS -X POST "http://127.0.0.1:${web_port}/api/admin/login" \
      -H 'Content-Type: application/json' \
      -d "{\"username\":\"${admin_username}\",\"password\":\"${admin_password}\"}" \
      | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
  )"

  [[ -n "$token" ]] || fail_release "Admin login inspection failed"

  log_release "Checking system status endpoint..."
  status_payload="$(
    curl -fsS "http://127.0.0.1:${web_port}/api/admin/system/status" \
      -H "Authorization: Bearer ${token}"
  )"

  printf '%s' "$status_payload" | grep -q '"databaseConnected":true' || fail_release "Inspection failed: databaseConnected is not true"
  printf '%s' "$status_payload" | grep -q '"uploadDirectoryReady":true' || fail_release "Inspection failed: uploadDirectoryReady is not true"

  log_release "Inspection completed successfully."
}

wait_for_release_health() {
  local web_port

  web_port="$(resolve_release_web_port)"
  if ! wait_for_release_url "http://127.0.0.1:${web_port}/api/health" "Backend health"; then
    show_release_failure_context
    fail_release "Backend health check timed out"
  fi

  if ! wait_for_release_url "http://127.0.0.1:${web_port}/" "Web entry"; then
    show_release_failure_context
    fail_release "Web health check timed out"
  fi

  post_release_self_check
}

write_release_runtime_metadata() {
  local deployed_at

  deployed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  set_release_env_value "$SHARED_ENV_FILE" "APP_GIT_REVISION" "${RELEASE_GIT_REVISION:-$RELEASE_ID}"
  set_release_env_value "$SHARED_ENV_FILE" "APP_DEPLOYED_AT" "$deployed_at"
}

ensure_release_env_file() {
  local env_template_file="$1"

  if [[ -f "$SHARED_ENV_FILE" ]]; then
    return
  fi

  [[ -f "$env_template_file" ]] || fail_release "Missing env template file: $env_template_file"
  cp "$env_template_file" "$SHARED_ENV_FILE"
  log_release "Created shared env file from template: $SHARED_ENV_FILE"
}

import_release_images() {
  [[ -f "$RELEASE_IMAGES_DIR/backend-image.tar" ]] || fail_release "Missing backend image tar"
  [[ -f "$RELEASE_IMAGES_DIR/web-image.tar" ]] || fail_release "Missing web image tar"

  log_release "Loading backend image: $BACKEND_IMAGE"
  docker load -i "$RELEASE_IMAGES_DIR/backend-image.tar" >/dev/null

  log_release "Loading web image: $WEB_IMAGE"
  docker load -i "$RELEASE_IMAGES_DIR/web-image.tar" >/dev/null
}

current_release_id() {
  if [[ -L "$CURRENT_LINK" ]]; then
    basename "$(readlink -f "$CURRENT_LINK")"
    return
  fi
  printf ''
}

switch_current_release() {
  ln -sfn "$RELEASE_ROOT" "$CURRENT_LINK"
}

cleanup_old_releases() {
  local current_id
  local candidates=()
  local remove_ids=()
  local candidate

  validate_release_retention_count
  current_id="$(current_release_id)"

  while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue
    if [[ "$candidate" == "$current_id" ]]; then
      continue
    fi
    candidates+=("$candidate")
  done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r)

  if ((${#candidates[@]} <= RELEASE_RETENTION_COUNT - 1)); then
    return
  fi

  remove_ids=("${candidates[@]:$((RELEASE_RETENTION_COUNT - 1))}")

  for candidate in "${remove_ids[@]}"; do
    log_release "Removing old release directory: $candidate"
    rm -rf "$RELEASES_DIR/$candidate"
  done
}

ensure_release_registered() {
  local target_dir="$RELEASES_DIR/$RELEASE_ID"

  if [[ "$RELEASE_ROOT" != "$target_dir" ]]; then
    rm -rf "$target_dir"
    mkdir -p "$RELEASES_DIR"
    cp -a "$RELEASE_ROOT" "$target_dir"
    RELEASE_ROOT="$target_dir"
    RELEASE_INFO_FILE="$RELEASE_ROOT/RELEASE_INFO"
    RELEASE_COMPOSE_FILE="$RELEASE_ROOT/docker-compose.release.yml"
    RELEASE_IMAGES_DIR="$RELEASE_ROOT/images"
  fi
}
