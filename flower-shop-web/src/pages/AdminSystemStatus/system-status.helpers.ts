import type { AdminOpsTask } from "@/types";
import type { KeyValueEntry } from "./components/tabs/types";
import type { AdminBackupFile, OperationLogArchiveFile } from "@/types";
import type { TaskStatusFilter, TaskTypeFilter } from "./components/tabs/types";

export function formatServiceName(value?: string) {
  const mapping: Record<string, string> = {
    "flower-shop-backend-java": "Java 主线后端",
  };
  return value ? (mapping[value] ?? value) : "未知服务";
}

export function formatTaskTypeLabel(value?: string) {
  if (value === "backup") return "手动备份";
  if (value === "inspection") return "系统巡检";
  return value || "未知任务";
}

export function resolveOpsCommand(taskType?: string) {
  if (taskType === "backup") {
    return {
      commandName: "ops.sh backup",
      commandPreview: "./ops.sh backup",
    };
  }
  if (taskType === "inspection") {
    return {
      commandName: "ops.sh release inspect",
      commandPreview: "./ops.sh release inspect",
    };
  }
  return {
    commandName: "",
    commandPreview: "",
  };
}

export function getTaskStatusMeta(status?: string) {
  if (status === "success") return { color: "green" as const, label: "成功" };
  if (status === "failed") return { color: "red" as const, label: "失败" };
  return { color: "blue" as const, label: "执行中" };
}

function readString(value: unknown, fallback = "暂无") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readBooleanLabel(value: unknown, positive = "正常", negative = "异常") {
  return value === true ? positive : value === false ? negative : "未知";
}

export function getTaskResultEntries(task: AdminOpsTask): KeyValueEntry[] {
  const result = task.resultData ?? {};
  if (task.taskType === "backup") {
    return [
      { label: "备份标识", value: readString(result.backupName) },
      { label: "备份目录", value: readString(result.backupPath) },
      { label: "配置快照", value: readString(result.configExport) },
      { label: "上传归档", value: readString(result.uploadsArchive) },
    ];
  }
  if (task.taskType === "inspection") {
    return [
      { label: "数据库", value: readBooleanLabel(result.databaseConnected) },
      { label: "上传目录", value: readBooleanLabel(result.uploadDirectoryReady) },
      { label: "最近备份", value: readBooleanLabel(result.latestBackupPresent, "已发现", "缺失") },
      { label: "AI 启用", value: readBooleanLabel(result.aiEnabled, "已启用", "未启用") },
      { label: "AI 密钥", value: readBooleanLabel(result.aiKeyConfigured, "已配置", "未配置") },
      { label: "安全等级", value: readString(result.securityLevel) },
      { label: "安全摘要", value: readString(result.securitySummary) },
      { label: "限流次数", value: String(result.rateLimitedCount ?? 0) },
      { label: "繁忙拒绝", value: String(result.busyRejectedCount ?? 0) },
    ];
  }
  return Object.entries(result).map(([key, value]) => ({
    label: key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

export function buildTaskStats(tasks: AdminOpsTask[]) {
  const failed = tasks.filter((item) => item.status === "failed").length;
  const inspection = tasks.filter((item) => item.taskType === "inspection").length;
  const backup = tasks.filter((item) => item.taskType === "backup").length;
  return { failed, inspection, backup };
}

export function buildBackupOverview(
  backupFiles: AdminBackupFile[],
  latestBackupTaskFinishedAt?: string | null,
) {
  const latestBackupFile = backupFiles[0];
  return [
    { label: "备份总数", value: `${backupFiles.length} 份`, note: "当前可直接下载的备份目录数量" },
    { label: "最新备份", value: latestBackupFile?.backupName || "暂无", note: latestBackupFile?.modifiedAt || "尚未产生可用备份" },
    {
      label: "最新体积",
      value: latestBackupFile?.size || "未知",
      note: latestBackupTaskFinishedAt ? `最近手动备份完成于 ${latestBackupTaskFinishedAt}` : "尚未记录后台触发的备份任务",
    },
  ];
}

export function buildRecommendedCommands() {
  return [
    {
      key: "backup",
      label: "手动备份",
      description: "对应后台“立即备份”动作。适合升级前、配置导入前、重要数据调整前执行。",
      command: "./ops.sh backup",
    },
    {
      key: "inspection",
      label: "部署后巡检",
      description: "对应后台“执行巡检”与运维核查场景。适合上线后、升级后、问题排查时执行。",
      command: "./ops.sh release inspect",
    },
    {
      key: "upgrade",
      label: "源码升级",
      description: "用于代码仓库模式下的更新与重建，建议先执行备份。",
      command: "./ops.sh upgrade",
    },
    {
      key: "rollback",
      label: "备份回滚",
      description: "用于源码部署模式下从最近备份恢复，建议先 dry-run。",
      command: "./ops.sh rollback --latest --dry-run",
    },
  ];
}

export function enrichOpsTasksWithCommands(tasks: AdminOpsTask[]) {
  return tasks.map((item) => {
    const commandMeta = resolveOpsCommand(item.taskType);
    return {
      ...item,
      commandName: commandMeta.commandName,
      commandPreview: commandMeta.commandPreview,
    };
  });
}

export function buildArchiveDownloadHint(archiveFiles: OperationLogArchiveFile[], latestArchiveFilename?: string | null) {
  if (!latestArchiveFilename) return "";
  return archiveFiles.find((item) => item.filename === latestArchiveFilename)?.downloadUrl ?? "";
}

export function filterOpsTasks(
  tasks: AdminOpsTask[],
  taskTypeFilter: TaskTypeFilter,
  taskStatusFilter: TaskStatusFilter,
) {
  return tasks.filter((item) => {
    const typeMatched = taskTypeFilter === "all" || item.taskType === taskTypeFilter;
    const statusMatched = taskStatusFilter === "all" || item.status === taskStatusFilter;
    return typeMatched && statusMatched;
  });
}

export function buildTaskListWithResolvedCommand(tasks: AdminOpsTask[]) {
  return tasks.map((item) => ({
    ...item,
    ...resolveOpsCommand(item.taskType),
  }));
}
