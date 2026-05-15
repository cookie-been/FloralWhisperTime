#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Usage: ./ops/release-inspect.sh [options]

Options:
  --app-root PATH      Target app root, default /opt/floralwhispertime
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

CURRENT_ID="$(current_release_id)"
[[ -n "$CURRENT_ID" ]] || fail_release "No current release is active under $APP_ROOT. This inspection script is for release-package deployments."

RELEASE_ROOT="$RELEASES_DIR/$CURRENT_ID"
resolve_release_paths
load_release_info "$RELEASE_INFO_FILE"

log_release "Current release: $CURRENT_ID"
log_release "Compose project: $PROJECT_NAME"
log_release "Site URL: http://127.0.0.1:$(resolve_release_web_port)"
run_release_inspection
