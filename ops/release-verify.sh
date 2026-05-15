#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_ROOT="${RELEASE_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
CHECKSUM_FILE="$RELEASE_ROOT/CHECKSUMS.sha256"

log() {
  printf '[release-verify] %s\n' "$*"
}

fail() {
  printf '[release-verify] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./ops/release-verify.sh

Verify files in the extracted release directory against CHECKSUMS.sha256.
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

require_cmd sha256sum
[[ -f "$CHECKSUM_FILE" ]] || fail "Missing checksum file: $CHECKSUM_FILE"

log "Verifying extracted release files..."
(
  cd "$RELEASE_ROOT"
  sha256sum -c "$CHECKSUM_FILE"
)

log "Release file verification passed."
