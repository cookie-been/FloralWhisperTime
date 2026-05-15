#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMEOUT_SECONDS=300
TARGET_RELEASE_ID=""
USE_LATEST_PREVIOUS=0

usage() {
  cat <<'EOF'
Usage: ./ops/release-rollback.sh [options]

Options:
  --app-root PATH         Target app root, default /opt/floralwhispertime
  --release-id ID         Roll back to a specific release id
  --latest-previous       Roll back to the previous release
  --timeout SECONDS       Health check timeout, default 300
  -h, --help              Show this help
EOF
}

resolve_target_release() {
  local current_id
  local latest_previous

  if [[ -n "$TARGET_RELEASE_ID" ]]; then
    return
  fi

  if (( USE_LATEST_PREVIOUS == 0 )); then
    fail_release "Either --release-id or --latest-previous is required"
  fi

  current_id="$(current_release_id)"
  latest_previous="$(
    find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' \
      | sort \
      | grep -vx "${current_id}" \
      | tail -n 1
  )"

  [[ -n "$latest_previous" ]] || fail_release "No previous release found"
  TARGET_RELEASE_ID="$latest_previous"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-root)
      [[ $# -ge 2 ]] || { echo "--app-root requires a value" >&2; exit 1; }
      APP_ROOT="$2"
      shift 2
      ;;
    --release-id)
      [[ $# -ge 2 ]] || { echo "--release-id requires a value" >&2; exit 1; }
      TARGET_RELEASE_ID="$2"
      shift 2
      ;;
    --latest-previous)
      USE_LATEST_PREVIOUS=1
      shift
      ;;
    --timeout)
      [[ $# -ge 2 ]] || { echo "--timeout requires a value" >&2; exit 1; }
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

source "$SCRIPT_DIR/release-common.sh"

ensure_release_prerequisites
resolve_project_name
ensure_release_directories
resolve_target_release

RELEASE_ROOT="$RELEASES_DIR/$TARGET_RELEASE_ID"
resolve_release_paths
load_release_info "$RELEASE_INFO_FILE"
[[ -f "$SHARED_ENV_FILE" ]] || fail_release "Missing shared env file: $SHARED_ENV_FILE"

log_release "Rolling back to release: $TARGET_RELEASE_ID"
compose_release_cmd up -d --force-recreate backend web
wait_for_release_health
switch_current_release

log_release "Rollback completed successfully."
log_release "Current release: $TARGET_RELEASE_ID"
log_release "Compose project: $PROJECT_NAME"
log_release "Site URL: http://127.0.0.1:$(resolve_release_web_port)"
