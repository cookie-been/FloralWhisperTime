#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMEOUT_SECONDS=300

usage() {
  cat <<'EOF'
Usage: ./ops/release-upgrade.sh [options]

Options:
  --app-root PATH      Target app root, default /opt/floralwhispertime
  --retain COUNT       Keep latest COUNT releases, default 5
  --timeout SECONDS    Health check timeout, default 300
  -h, --help           Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-root)
      [[ $# -ge 2 ]] || { echo "--app-root requires a value" >&2; exit 1; }
      APP_ROOT="$2"
      shift 2
      ;;
    --retain)
      [[ $# -ge 2 ]] || { echo "--retain requires a value" >&2; exit 1; }
      RELEASE_RETENTION_COUNT="$2"
      shift 2
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

resolve_release_paths
ensure_release_prerequisites
resolve_project_name
ensure_release_directories
load_release_info "$RELEASE_INFO_FILE"
[[ -f "$SHARED_ENV_FILE" ]] || fail_release "Missing shared env file: $SHARED_ENV_FILE. Run release-install.sh first."
ensure_release_registered
import_release_images
write_release_runtime_metadata

log_release "Upgrading services to release: $RELEASE_ID"
compose_release_cmd up -d --force-recreate backend web
wait_for_release_health
switch_current_release
cleanup_old_releases

log_release "Release upgraded successfully."
log_release "Current release: $RELEASE_ID"
log_release "Compose project: $PROJECT_NAME"
log_release "Release retention count: $RELEASE_RETENTION_COUNT"
log_release "Site URL: http://127.0.0.1:$(resolve_release_web_port)"
