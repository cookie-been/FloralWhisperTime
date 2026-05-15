#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ALLOW_DIRTY_GIT=0

log() {
  printf '[release-check] %s\n' "$*"
}

fail() {
  printf '[release-check] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./ops/release-check.sh [options]

Options:
  --allow-dirty-git    Allow checking with a dirty git worktree
  -h, --help           Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

check_required_commands() {
  require_cmd docker
  require_cmd mvn
  require_cmd npm
  require_cmd tar
  require_cmd sed
  require_cmd grep
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
}

check_required_files() {
  local file

  for file in \
    "$REPO_ROOT/docker-compose.release.yml" \
    "$REPO_ROOT/.env.production.example" \
    "$REPO_ROOT/release-package.INSTALL.md" \
    "$REPO_ROOT/release-install.sh" \
    "$REPO_ROOT/release-upgrade.sh" \
    "$REPO_ROOT/release-rollback.sh" \
    "$REPO_ROOT/release-status.sh" \
    "$REPO_ROOT/ops/release-common.sh" \
    "$REPO_ROOT/ops/release-install.sh" \
    "$REPO_ROOT/ops/release-upgrade.sh" \
    "$REPO_ROOT/ops/release-rollback.sh" \
    "$REPO_ROOT/ops/release-status.sh"; do
    [[ -f "$file" ]] || fail "Missing required file: $file"
  done
}

check_script_syntax() {
  bash -n \
    "$REPO_ROOT/release-install.sh" \
    "$REPO_ROOT/release-upgrade.sh" \
    "$REPO_ROOT/release-rollback.sh" \
    "$REPO_ROOT/release-status.sh" \
    "$REPO_ROOT/ops/release-check.sh" \
    "$REPO_ROOT/ops/build-release.sh" \
    "$REPO_ROOT/ops/release-common.sh" \
    "$REPO_ROOT/ops/release-install.sh" \
    "$REPO_ROOT/ops/release-upgrade.sh" \
    "$REPO_ROOT/ops/release-rollback.sh" \
    "$REPO_ROOT/ops/release-status.sh" \
    || fail "Shell syntax check failed"
}

check_compose_file() {
  env \
    BACKEND_IMAGE=test/backend:check \
    WEB_IMAGE=test/web:check \
    SHARED_UPLOADS_DIR=/tmp/floralwhisper-check-uploads \
    SHARED_BACKUPS_DIR=/tmp/floralwhisper-check-backups \
    docker compose -f "$REPO_ROOT/docker-compose.release.yml" config >/dev/null \
    || fail "docker-compose.release.yml validation failed"
}

check_git_worktree() {
  if (( ALLOW_DIRTY_GIT == 1 )); then
    log "Dirty git worktree allowed by option."
    return
  fi

  if [[ -n "$(git -C "$REPO_ROOT" status --short)" ]]; then
    fail "Git worktree is not clean. Commit or stash changes first, or rerun with --allow-dirty-git"
  fi
}

check_backend_artifact() {
  if [[ ! -f "$REPO_ROOT/flower-shop-backend-java/target/flower-shop-backend-java-1.0.0.jar" ]]; then
    log "Backend jar is not present yet. This is acceptable; build-release.sh will package it."
    return
  fi

  [[ -s "$REPO_ROOT/flower-shop-backend-java/target/flower-shop-backend-java-1.0.0.jar" ]] \
    || fail "Backend jar exists but is empty"
}

print_summary() {
  log "Release preflight checks passed."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
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

check_required_commands
check_required_files
check_script_syntax
check_compose_file
check_git_worktree
check_backend_artifact
print_summary
