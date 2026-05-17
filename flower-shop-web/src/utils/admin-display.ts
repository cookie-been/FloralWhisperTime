export const ADMIN_MODULE_LABELS: Record<string, string> = {
  AUTH: "登录鉴权",
  FLOWER: "作品管理",
  CONTACT: "用户留言",
  SITE: "站点配置",
  ABOUT: "关于我们",
  TEAM: "团队成员",
  AI: "AI 配置",
  AUDIT: "系统审计",
};

export const ADMIN_ACTION_LABELS: Record<string, string> = {
  LOGIN: "登录",
  CREATE: "新增",
  UPDATE: "修改",
  DELETE: "删除",
  MARK_READ: "标记已读",
  RESTORE: "恢复",
  ARCHIVE: "归档",
};

export const ADMIN_TARGET_TYPE_LABELS: Record<string, string> = {
  FLOWER: "作品",
  CONTACT: "留言",
  SITE_CONFIG: "站点配置",
  ABOUT_PAGE: "关于页",
  ABOUT_TIMELINE: "时间轴",
  TEAM_MEMBER: "团队成员",
  AI_SETTINGS: "AI 配置",
  AUTH: "鉴权",
  OPERATION_LOG_ARCHIVE: "日志归档",
};

export const ADMIN_MODULE_OPTIONS = Object.entries(ADMIN_MODULE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const ADMIN_ACTION_OPTIONS = Object.entries(ADMIN_ACTION_LABELS)
  .filter(([value]) => value !== "ARCHIVE")
  .map(([value, label]) => ({
    label,
    value,
  }));

interface AdminTargetTypeFormatOptions {
  archiveLabel?: string;
  fallback?: string;
}

export function formatAdminModuleLabel(value?: string, fallback = "系统模块") {
  return value ? (ADMIN_MODULE_LABELS[value] ?? value) : fallback;
}

export function formatAdminActionLabel(value?: string, fallback = "操作") {
  return value ? (ADMIN_ACTION_LABELS[value] ?? value) : fallback;
}

export function formatAdminTargetTypeLabel(value?: string, options: AdminTargetTypeFormatOptions = {}) {
  const { archiveLabel = "日志归档", fallback = "数据项" } = options;
  if (!value) return fallback;
  if (value === "OPERATION_LOG_ARCHIVE") return archiveLabel;
  return ADMIN_TARGET_TYPE_LABELS[value] ?? value;
}
