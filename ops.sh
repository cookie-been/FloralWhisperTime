#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$SCRIPT_DIR/ops"

usage() {
  cat <<'EOF'
花语时光统一运维入口

用法:
  ./ops.sh <command> [args...]
  ./ops.sh release <action> [args...]

命令:
  deploy            源码一键部署
  backup            备份数据库与上传文件
  upgrade           源码升级
  rollback          从备份回滚
  restore           从备份恢复
  release-check     发布包自检
  release-install   发布包安装
  release-upgrade   发布包升级
  release-rollback  发布包回滚
  release-status    发布包状态查看
  release-inspect   发布后巡检
  release-verify    发布包校验

等价写法:
  ./ops.sh release check
  ./ops.sh release install
  ./ops.sh release upgrade
  ./ops.sh release rollback
  ./ops.sh release status
  ./ops.sh release inspect
  ./ops.sh release verify

示例:
  ./ops.sh deploy --env-file .env.production --web-port 8081
  ./ops.sh backup --retain 14
  ./ops.sh upgrade --skip-build
  ./ops.sh rollback --latest --dry-run
  ./ops.sh release install --env-file .env
  ./ops.sh release status

说明:
  - 旧的根目录脚本仍然保留，可继续使用
  - ops/ 目录下脚本是实现层，通常不需要直接调用
EOF
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

dispatch() {
  local target="$1"
  shift
  exec "$OPS_DIR/$target.sh" "$@"
}

[[ $# -gt 0 ]] || {
  usage
  exit 0
}

case "$1" in
  -h|--help|help)
    usage
    ;;
  deploy|backup|upgrade|rollback|restore|release-check|release-install|release-upgrade|release-rollback|release-status|release-inspect|release-verify)
    command="$1"
    shift
    dispatch "$command" "$@"
    ;;
  release)
    [[ $# -ge 2 ]] || fail "Missing release action. Use: ./ops.sh release <check|install|upgrade|rollback|status|inspect|verify>"
    action="$2"
    shift 2
    case "$action" in
      check|install|upgrade|rollback|status|inspect|verify)
        dispatch "release-$action" "$@"
        ;;
      *)
        fail "Unsupported release action: $action"
        ;;
    esac
    ;;
  *)
    fail "Unsupported command: $1. Use ./ops.sh --help"
    ;;
esac
