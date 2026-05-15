#!/usr/bin/env bash

HOST_BOOTSTRAP_OS_READY=0
HOST_BOOTSTRAP_PRIVILEGE_READY=0
HOST_BOOTSTRAP_APT_UPDATED=0
HOST_BOOTSTRAP_DOCKER_REPO_READY=0

HOST_OS_FAMILY=""
HOST_OS_ID=""
HOST_OS_VERSION_ID=""
HOST_PACKAGE_MANAGER=""
HOST_PRIVILEGE_CMD=()

host_bootstrap_log() {
  printf '[bootstrap] %s\n' "$*"
}

host_bootstrap_fail() {
  printf '[bootstrap] ERROR: %s\n' "$*" >&2
  return 1
}

host_has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

host_detect_os() {
  if (( HOST_BOOTSTRAP_OS_READY == 1 )); then
    return 0
  fi

  [[ -f /etc/os-release ]] || host_bootstrap_fail "Unsupported Linux distribution: /etc/os-release is missing"

  # shellcheck disable=SC1091
  source /etc/os-release

  HOST_OS_ID="${ID:-}"
  HOST_OS_VERSION_ID="${VERSION_ID:-}"

  case "$HOST_OS_ID" in
    ubuntu|debian)
      HOST_OS_FAMILY="debian"
      HOST_PACKAGE_MANAGER="apt-get"
      ;;
    centos|rhel|rocky|almalinux|ol|fedora)
      HOST_OS_FAMILY="rhel"
      if host_has_cmd dnf; then
        HOST_PACKAGE_MANAGER="dnf"
      else
        HOST_PACKAGE_MANAGER="yum"
      fi
      ;;
    *)
      host_bootstrap_fail "Unsupported Linux distribution: ${HOST_OS_ID:-unknown}"
      ;;
  esac

  HOST_BOOTSTRAP_OS_READY=1
}

host_prepare_privileges() {
  if (( HOST_BOOTSTRAP_PRIVILEGE_READY == 1 )); then
    return 0
  fi

  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    HOST_PRIVILEGE_CMD=()
    HOST_BOOTSTRAP_PRIVILEGE_READY=1
    return 0
  fi

  if host_has_cmd sudo; then
    HOST_PRIVILEGE_CMD=(sudo)
    HOST_BOOTSTRAP_PRIVILEGE_READY=1
    return 0
  fi

  host_bootstrap_fail "Installing missing runtime dependencies requires root or sudo"
}

host_run_privileged() {
  host_prepare_privileges
  "${HOST_PRIVILEGE_CMD[@]}" "$@"
}

host_install_packages() {
  host_detect_os
  host_prepare_privileges

  if [[ $# -eq 0 ]]; then
    return 0
  fi

  case "$HOST_PACKAGE_MANAGER" in
    apt-get)
      if (( HOST_BOOTSTRAP_APT_UPDATED == 0 )); then
        host_bootstrap_log "Refreshing apt package index..."
        host_run_privileged apt-get update
        HOST_BOOTSTRAP_APT_UPDATED=1
      fi
      host_run_privileged apt-get install -y --no-install-recommends "$@"
      ;;
    dnf)
      host_run_privileged dnf install -y "$@"
      ;;
    yum)
      host_run_privileged yum install -y "$@"
      ;;
    *)
      host_bootstrap_fail "Unsupported package manager: $HOST_PACKAGE_MANAGER"
      ;;
  esac
}

host_ensure_docker_repo() {
  host_detect_os
  host_prepare_privileges

  if (( HOST_BOOTSTRAP_DOCKER_REPO_READY == 1 )); then
    return 0
  fi

  case "$HOST_OS_FAMILY" in
    debian)
      host_install_packages ca-certificates curl gnupg
      host_run_privileged install -m 0755 -d /etc/apt/keyrings
      if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
        curl -fsSL "https://download.docker.com/linux/${HOST_OS_ID}/gpg" \
          | host_run_privileged gpg --dearmor -o /etc/apt/keyrings/docker.asc
        host_run_privileged chmod a+r /etc/apt/keyrings/docker.asc
      fi
      if [[ ! -f /etc/apt/sources.list.d/docker.list ]]; then
        printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
          "$(dpkg --print-architecture)" \
          "$HOST_OS_ID" \
          "${VERSION_CODENAME:-stable}" \
          | host_run_privileged tee /etc/apt/sources.list.d/docker.list >/dev/null
      fi
      HOST_BOOTSTRAP_APT_UPDATED=0
      ;;
    rhel)
      if [[ "$HOST_PACKAGE_MANAGER" == "dnf" ]]; then
        host_install_packages dnf-plugins-core
        if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
          host_run_privileged dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        fi
      else
        host_install_packages yum-utils
        if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
          host_run_privileged yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        fi
      fi
      ;;
    *)
      host_bootstrap_fail "Docker repository setup is not supported on this Linux distribution"
      ;;
  esac

  HOST_BOOTSTRAP_DOCKER_REPO_READY=1
}

host_enable_docker_service() {
  host_prepare_privileges

  if host_has_cmd systemctl; then
    host_run_privileged systemctl enable --now docker
    return 0
  fi

  if host_has_cmd service; then
    host_run_privileged service docker start
    return 0
  fi

  host_bootstrap_fail "Docker was installed, but the service manager is unavailable"
}

host_ensure_docker_access() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    return 0
  fi

  if host_has_cmd usermod && [[ -n "${USER:-}" ]]; then
    host_bootstrap_log "Adding current user to docker group..."
    host_run_privileged usermod -aG docker "$USER" || true
  fi

  host_bootstrap_fail "Docker is installed but the current shell cannot access the Docker daemon. Re-login or run the script as root."
}

host_ensure_docker_runtime() {
  local docker_missing=0
  local compose_missing=0

  if ! host_has_cmd docker; then
    docker_missing=1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    compose_missing=1
  fi

  if (( docker_missing == 0 && compose_missing == 0 )); then
    host_ensure_docker_access
    return 0
  fi

  host_bootstrap_log "Installing Docker runtime and Compose plugin..."
  host_ensure_docker_repo
  host_install_packages docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  hash -r
  host_enable_docker_service

  host_has_cmd docker || host_bootstrap_fail "Docker installation completed but docker command is unavailable"
  docker compose version >/dev/null 2>&1 || host_bootstrap_fail "Docker Compose plugin installation failed"
  host_ensure_docker_access
}

host_ensure_curl() {
  if host_has_cmd curl; then
    return 0
  fi

  host_bootstrap_log "Installing curl..."
  host_install_packages curl
  hash -r
  host_has_cmd curl || host_bootstrap_fail "curl installation failed"
}

host_ensure_git() {
  if host_has_cmd git; then
    return 0
  fi

  host_bootstrap_log "Installing git..."
  host_install_packages git
  hash -r
  host_has_cmd git || host_bootstrap_fail "git installation failed"
}

host_ensure_python3() {
  if host_has_cmd python3; then
    return 0
  fi

  host_bootstrap_log "Installing python3..."
  host_install_packages python3
  hash -r
  host_has_cmd python3 || host_bootstrap_fail "python3 installation failed"
}

host_ensure_maven() {
  if host_has_cmd mvn; then
    return 0
  fi

  host_bootstrap_log "Installing Maven..."
  host_install_packages maven
  hash -r
  host_has_cmd mvn || host_bootstrap_fail "Maven installation failed"
}

host_ensure_source_runtime() {
  host_ensure_docker_runtime
  host_ensure_curl
  host_ensure_python3
  host_ensure_maven
}

host_ensure_release_runtime() {
  host_ensure_docker_runtime
  host_ensure_curl
}

