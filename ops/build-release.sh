#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/tmp/releases"
ALLOW_DIRTY_GIT=0
SKIP_BUILD=0
RELEASE_ID=""
BUILD_TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
SKIP_PREFLIGHT=0
RELEASE_NOTES_COMMITS=10

log() {
  printf '[build-release] %s\n' "$*"
}

fail() {
  printf '[build-release] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./ops/build-release.sh [options]

Options:
  --release-id ID      Explicit release id, default auto-generated
  --output-dir PATH    Output directory for release package, default ./tmp/releases
  --skip-build         Reuse existing local images and artifacts
  --skip-preflight     Skip release preflight checks
  --notes-commits N    Number of recent commits in release notes, default 10
  --allow-dirty-git    Allow building from a dirty git worktree
  -h, --help           Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

ensure_prerequisites() {
  require_cmd docker
  require_cmd mvn
  require_cmd npm
  require_cmd tar
  require_cmd sha256sum
  require_cmd sed
  require_cmd grep
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

ensure_clean_git_worktree() {
  if (( ALLOW_DIRTY_GIT == 1 )); then
    return
  fi

  if [[ -n "$(git -C "$REPO_ROOT" status --short)" ]]; then
    fail "Git worktree is not clean. Commit or stash changes first, or rerun with --allow-dirty-git"
  fi
}

resolve_release_id() {
  local git_revision

  if [[ -n "$RELEASE_ID" ]]; then
    return
  fi

  git_revision="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'dev')"
  RELEASE_ID="${BUILD_TIMESTAMP}-${git_revision}"
}

package_backend_artifact() {
  log "Packaging backend application jar..."
  (
    cd "$REPO_ROOT/flower-shop-backend-java"
    mvn -q -DskipTests package
  )
}

build_release_images() {
  log "Building backend image..."
  docker build \
    -f "$REPO_ROOT/flower-shop-backend-java/Dockerfile.runtime" \
    -t "floralwhispertime/backend:${RELEASE_ID}" \
    "$REPO_ROOT"

  log "Building web image..."
  docker build \
    -f "$REPO_ROOT/flower-shop-web/Dockerfile.runtime" \
    -t "floralwhispertime/web:${RELEASE_ID}" \
    "$REPO_ROOT"
}

prepare_release_tree() {
  RELEASE_STAGING_DIR="$OUTPUT_DIR/floralwhispertime-release-${RELEASE_ID}"
  RELEASE_PACKAGE="$OUTPUT_DIR/floralwhispertime-release-${RELEASE_ID}.tar.gz"

  rm -rf "$RELEASE_STAGING_DIR"
  mkdir -p "$RELEASE_STAGING_DIR/images" "$RELEASE_STAGING_DIR/ops" "$OUTPUT_DIR"

  cp "$REPO_ROOT/docker-compose.release.yml" "$RELEASE_STAGING_DIR/"
  cp "$REPO_ROOT/.env.production.example" "$RELEASE_STAGING_DIR/"
  cp "$REPO_ROOT/release-package.INSTALL.md" "$RELEASE_STAGING_DIR/INSTALL.md"
  cp \
    "$REPO_ROOT/release-check.sh" \
    "$REPO_ROOT/release-inspect.sh" \
    "$REPO_ROOT/release-install.sh" \
    "$REPO_ROOT/release-verify.sh" \
    "$REPO_ROOT/release-upgrade.sh" \
    "$REPO_ROOT/release-rollback.sh" \
    "$REPO_ROOT/release-status.sh" \
    "$RELEASE_STAGING_DIR/"
  cp \
    "$REPO_ROOT/ops/release-check.sh" \
    "$REPO_ROOT/ops/release-common.sh" \
    "$REPO_ROOT/ops/release-inspect.sh" \
    "$REPO_ROOT/ops/release-install.sh" \
    "$REPO_ROOT/ops/release-verify.sh" \
    "$REPO_ROOT/ops/release-upgrade.sh" \
    "$REPO_ROOT/ops/release-rollback.sh" \
    "$REPO_ROOT/ops/release-status.sh" \
    "$RELEASE_STAGING_DIR/ops/"
  chmod +x "$RELEASE_STAGING_DIR"/release-*.sh
  chmod +x "$RELEASE_STAGING_DIR"/ops/*.sh
}

run_preflight_check() {
  if (( SKIP_PREFLIGHT == 1 )); then
    log "Skipping release preflight checks."
    return
  fi

  log "Running release preflight checks..."
  if (( ALLOW_DIRTY_GIT == 1 )); then
    "$REPO_ROOT/ops/release-check.sh" --allow-dirty-git
    return
  fi

  "$REPO_ROOT/ops/release-check.sh"
}

write_release_info() {
  local git_revision

  git_revision="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'dev')"

  cat >"$RELEASE_STAGING_DIR/RELEASE_INFO" <<EOF
release_id=$RELEASE_ID
build_timestamp=$BUILD_TIMESTAMP
git_revision=$git_revision
backend_image=floralwhispertime/backend:$RELEASE_ID
web_image=floralwhispertime/web:$RELEASE_ID
EOF
}

write_release_notes() {
  local git_revision git_branch

  git_revision="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'dev')"
  git_branch="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || printf 'unknown')"

  cat >"$RELEASE_STAGING_DIR/RELEASE_NOTES.md" <<EOF
# Release Notes

- Release ID: \`$RELEASE_ID\`
- Build Timestamp (UTC): \`$BUILD_TIMESTAMP\`
- Git Branch: \`$git_branch\`
- Git Revision: \`$git_revision\`
- Backend Image: \`floralwhispertime/backend:$RELEASE_ID\`
- Web Image: \`floralwhispertime/web:$RELEASE_ID\`

## Recent Commits

EOF

  if git -C "$REPO_ROOT" rev-parse --verify HEAD >/dev/null 2>&1; then
    git -C "$REPO_ROOT" log -n "$RELEASE_NOTES_COMMITS" --pretty=format:'- `%h` %s' >>"$RELEASE_STAGING_DIR/RELEASE_NOTES.md"
    printf '\n' >>"$RELEASE_STAGING_DIR/RELEASE_NOTES.md"
  else
    printf -- '- No git history available.\n' >>"$RELEASE_STAGING_DIR/RELEASE_NOTES.md"
  fi
}

export_release_images() {
  log "Saving backend image archive..."
  docker save -o "$RELEASE_STAGING_DIR/images/backend-image.tar" "floralwhispertime/backend:${RELEASE_ID}"

  log "Saving web image archive..."
  docker save -o "$RELEASE_STAGING_DIR/images/web-image.tar" "floralwhispertime/web:${RELEASE_ID}"
}

write_release_checksums() {
  log "Writing release file checksums..."
  (
    cd "$RELEASE_STAGING_DIR"
    find . -type f ! -name 'CHECKSUMS.sha256' -printf '%P\n' | sort | while read -r file; do
      sha256sum "$file"
    done > CHECKSUMS.sha256
  )
}

package_release_archive() {
  log "Packaging release archive..."
  tar -C "$OUTPUT_DIR" -czf "$RELEASE_PACKAGE" "$(basename "$RELEASE_STAGING_DIR")"
  log "Writing archive checksum..."
  (
    cd "$OUTPUT_DIR"
    sha256sum "$(basename "$RELEASE_PACKAGE")" > "$(basename "$RELEASE_PACKAGE").sha256"
  )
}

print_summary() {
  log "Release package created successfully."
  log "Release id: $RELEASE_ID"
  log "Package: $RELEASE_PACKAGE"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id)
      [[ $# -ge 2 ]] || fail "--release-id requires a value"
      RELEASE_ID="$2"
      shift 2
      ;;
    --output-dir)
      [[ $# -ge 2 ]] || fail "--output-dir requires a value"
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT=1
      shift
      ;;
    --notes-commits)
      [[ $# -ge 2 ]] || fail "--notes-commits requires a value"
      RELEASE_NOTES_COMMITS="$2"
      shift 2
      ;;
    --allow-dirty-git)
      ALLOW_DIRTY_GIT=1
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

[[ "$RELEASE_NOTES_COMMITS" =~ ^[0-9]+$ ]] || fail "--notes-commits must be a non-negative integer"
(( RELEASE_NOTES_COMMITS >= 1 )) || fail "--notes-commits must be at least 1"

ensure_prerequisites
run_preflight_check
ensure_clean_git_worktree
resolve_release_id

if (( SKIP_BUILD == 0 )); then
  package_backend_artifact
  build_release_images
fi

prepare_release_tree
write_release_info
write_release_notes
export_release_images
write_release_checksums
package_release_archive
print_summary
