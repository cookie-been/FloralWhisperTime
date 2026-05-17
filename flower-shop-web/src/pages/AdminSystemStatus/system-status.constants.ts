import type { SystemStatus } from "@/types";
import type { RiskItem } from "./components/tabs/types";

export const AUTO_REFRESH_INTERVAL_MS = 60000;
export const AUTO_REFRESH_ERROR_THRESHOLD = 3;

export type SystemTabKey = "overview" | "backups" | "tasks" | "security" | "archives" | "migration";

export const SYSTEM_TAB_LABELS: Record<SystemTabKey, string> = {
  overview: "总览",
  backups: "备份与下载",
  tasks: "巡检与任务",
  security: "安全与风险",
  archives: "日志归档",
  migration: "配置迁移",
};

export const DEFAULT_SYSTEM_TAB: SystemTabKey = "overview";

export function isSystemTabKey(value: string | null): value is SystemTabKey {
  return Boolean(value && value in SYSTEM_TAB_LABELS);
}

export function buildSystemRisks(status: SystemStatus): RiskItem[] {
  const items: RiskItem[] = [];

  if (!status.databaseConnected) {
    items.push({
      level: "error",
      priority: 100,
      title: "数据库连接异常",
      detail: "后台核心数据当前无法稳定读写，需优先检查数据库容器、连接串与账号权限。",
      suggestion: "先确认 MySQL 容器是否健康，再核对 DB 连接配置、账号权限与最近失败日志。",
      actionKey: "failed-logs",
      actionLabel: "查看失败日志",
    });
  }
  if (!status.uploadDirectoryReady) {
    items.push({
      level: "error",
      priority: 90,
      title: "上传目录不可用",
      detail: "作品图片、AI 出图和素材上传可能失败，需检查挂载目录、权限和磁盘状态。",
      suggestion: "检查 uploads 挂载目录是否存在、是否可写，以及当前磁盘可用空间是否足够。",
      actionKey: "upload",
      actionLabel: "定位上传目录",
    });
  }
  if (!status.latestBackupPresent) {
    items.push({
      level: "warning",
      priority: 70,
      title: "尚无可用备份",
      detail: "正式环境建议至少保留一份最近备份，再执行配置导入、升级或数据清理。",
      suggestion: "建议先执行一次手动备份，确认备份目录生成成功并可下载后再继续其他高风险操作。",
      actionKey: "backup",
      actionLabel: "前往备份区",
    });
  }
  if (status.aiEnabled && !status.aiKeyConfigured) {
    items.push({
      level: "warning",
      priority: 60,
      title: "AI 已启用但未配置密钥",
      detail: "AI 生图与相关生成能力当前不可用，需补齐可用的 API Key 与模型。",
      suggestion: "进入 AI 配置页补齐可用密钥、模型与接口地址，并完成一次生图验证。",
      actionKey: "ai-settings",
      actionLabel: "前往 AI 配置",
    });
  }
  if (status.requirePasswordChange) {
    items.push({
      level: "warning",
      priority: 80,
      title: "管理员仍在使用初始密码",
      detail: "当前实例尚未完成交付初始化，需先修改默认管理员密码后再投入正式使用。",
      suggestion: "建议立即改为仅内部掌握的强密码，并完成一次重新登录验证。",
      actionKey: "change-password",
      actionLabel: "立即修改密码",
    });
  }
  if (status.security?.securityLevel === "risk") {
    items.push({
      level: "error",
      priority: 95,
      title: "存在默认安全配置",
      detail: status.security?.securitySummary || "JWT 密钥、加密密钥或密码初始化状态仍有高风险项。",
      suggestion: "优先替换默认 JWT 密钥和数据加密密钥，再复核管理员密码初始化状态。",
      actionKey: "security",
      actionLabel: "定位安全状态",
    });
  }

  return items.sort((a, b) => b.priority - a.priority);
}
