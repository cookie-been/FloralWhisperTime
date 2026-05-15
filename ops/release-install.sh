#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMEOUT_SECONDS=300

usage() {
  cat <<'EOF'
Usage: ./ops/release-install.sh [options]

Options:
  --app-root PATH      Target app root, default /opt/floralwhispertime
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
ensure_release_registered
ensure_release_env_file "$RELEASE_ROOT/.env.production.example"
import_release_images
write_release_runtime_metadata

log_release "Starting services for release: $RELEASE_ID"
compose_release_cmd up -d
wait_for_release_health
switch_current_release

log_release "Release installed successfully."
log_release "Current release: $RELEASE_ID"
log_release "Compose project: $PROJECT_NAME"
log_release "Site URL: http://127.0.0.1:$(resolve_release_web_port)"
