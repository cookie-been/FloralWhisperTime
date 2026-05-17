import { Alert, Button, Empty, Grid, Input, Modal, Spin, Tabs, message } from "antd";
import { Archive, Download, HardDriveDownload, KeyRound, ServerCog, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  archiveAdminOperationLogs,
  createAdminBackupTask,
  createAdminInspectionTask,
  downloadAdminConfigExport,
  downloadAdminFile,
  downloadLatestAdminBackup,
  getAdminBackups,
  getAdminOperationLogArchiveFiles,
  getAdminOpsTasks,
  getAdminSystemStatus,
  importAdminConfig,
  isAbortError,
} from "@/services/api";
import { useAdminShell } from "@/components/admin/AdminShell";
import type { AdminBackupFile, AdminOpsTask, OperationLogArchiveFile, OperationLogArchiveResult, SystemStatus } from "@/types";
import type { RcFile } from "antd/es/upload";
import { SystemArchivesTab } from "./components/tabs/SystemArchivesTab";
import { SystemBackupsTab } from "./components/tabs/SystemBackupsTab";
import { SystemMigrationTab } from "./components/tabs/SystemMigrationTab";
import { SystemOverviewTab } from "./components/tabs/SystemOverviewTab";
import { SystemSecurityTab } from "./components/tabs/SystemSecurityTab";
import { SystemTasksTab } from "./components/tabs/SystemTasksTab";
import type {
  BackupOverviewItem,
  KeyValueEntry,
  OpsCommandItem,
  RiskActionKey,
  RiskItem,
  SummaryItem,
  TaskStatusFilter,
  TaskTypeFilter,
} from "./components/tabs/types";

const AUTO_REFRESH_INTERVAL_MS = 60000;
const AUTO_REFRESH_ERROR_THRESHOLD = 3;

type SystemTabKey = "overview" | "backups" | "tasks" | "security" | "archives" | "migration";

const TAB_LABELS: Record<SystemTabKey, string> = {
  overview: "总览",
  backups: "备份与下载",
  tasks: "巡检与任务",
  security: "安全与风险",
  archives: "日志归档",
  migration: "配置迁移",
};

const DEFAULT_TAB: SystemTabKey = "overview";

function isSystemTabKey(value: string | null): value is SystemTabKey {
  return Boolean(value && value in TAB_LABELS);
}

function resolveTab(searchParams: URLSearchParams): SystemTabKey {
  const tab = searchParams.get("tab");
  return isSystemTabKey(tab) ? tab : DEFAULT_TAB;
}

function buildTabSearchParams(searchParams: URLSearchParams, nextTab: SystemTabKey) {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", nextTab);
  return nextParams;
}

function formatDateTime(value?: string) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatServiceName(value?: string) {
  const mapping: Record<string, string> = {
    "flower-shop-backend-java": "Java 主线后端",
  };
  return value ? (mapping[value] ?? value) : "未知服务";
}

function formatTaskTypeLabel(value?: string) {
  if (value === "backup") return "手动备份";
  if (value === "inspection") return "系统巡检";
  return value || "未知任务";
}

function resolveOpsCommand(taskType?: string) {
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

function getTaskStatusMeta(status?: string) {
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

function getTaskResultEntries(task: AdminOpsTask): KeyValueEntry[] {
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

function buildSystemRisks(status: SystemStatus): RiskItem[] {
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

export function AdminSystemStatus() {
  const navigate = useNavigate();
  const adminShell = useAdminShell();
  const screens = Grid.useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => resolveTab(searchParams), [searchParams]);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string>("");
  const [refreshErrorCount, setRefreshErrorCount] = useState(0);
  const [lastRefreshError, setLastRefreshError] = useState("");
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveBefore, setArchiveBefore] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);
  const [runningInspection, setRunningInspection] = useState(false);
  const [importingConfig, setImportingConfig] = useState(false);
  const [latestConfigExportAt, setLatestConfigExportAt] = useState("");
  const [latestConfigImportAt, setLatestConfigImportAt] = useState("");
  const [latestArchiveResult, setLatestArchiveResult] = useState<OperationLogArchiveResult | null>(null);
  const [archiveFiles, setArchiveFiles] = useState<OperationLogArchiveFile[]>([]);
  const [backupFiles, setBackupFiles] = useState<AdminBackupFile[]>([]);
  const [opsTasks, setOpsTasks] = useState<AdminOpsTask[]>([]);
  const [archiveFilesError, setArchiveFilesError] = useState("");
  const [backupFilesError, setBackupFilesError] = useState("");
  const [opsTasksError, setOpsTasksError] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>("all");
  const [selectedTask, setSelectedTask] = useState<AdminOpsTask | null>(null);

  const requestControllerRef = useRef<AbortController | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);
  const securitySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const normalizedParams = buildTabSearchParams(searchParams, activeTab);
    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const loadStatus = useCallback(async (mode: "init" | "refresh" = "init") => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    if (mode === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [statusResult, archiveFilesResult, tasksResult, backupsResult] = await Promise.allSettled([
        getAdminSystemStatus({ signal: controller.signal }),
        getAdminOperationLogArchiveFiles({ signal: controller.signal }),
        getAdminOpsTasks({ signal: controller.signal }),
        getAdminBackups({ signal: controller.signal }),
      ]);

      if (statusResult.status !== "fulfilled") {
        const reason = statusResult.reason;
        throw reason instanceof Error ? reason : new Error("系统状态加载失败");
      }

      setStatus(statusResult.value);

      if (archiveFilesResult.status === "fulfilled") {
        setArchiveFiles(archiveFilesResult.value);
        setArchiveFilesError("");
      } else {
        setArchiveFiles([]);
        setArchiveFilesError(archiveFilesResult.reason instanceof Error ? archiveFilesResult.reason.message : "日志归档文件加载失败");
      }

      if (tasksResult.status === "fulfilled") {
        setOpsTasks(tasksResult.value.list);
        setOpsTasksError("");
      } else {
        setOpsTasks([]);
        setOpsTasksError(tasksResult.reason instanceof Error ? tasksResult.reason.message : "运维任务加载失败");
      }

      if (backupsResult.status === "fulfilled") {
        setBackupFiles(backupsResult.value.list);
        setBackupFilesError("");
      } else {
        setBackupFiles([]);
        setBackupFilesError(backupsResult.reason instanceof Error ? backupsResult.reason.message : "备份资产加载失败");
      }

      setLastRefreshAt(new Date().toLocaleString("zh-CN", { hour12: false }));
      setRefreshErrorCount(0);
      setLastRefreshError("");
      setAutoRefreshPaused(false);
    } catch (error) {
      if (isAbortError(error)) return;
      const errorMessage = error instanceof Error ? error.message : "系统状态加载失败";
      setLastRefreshError(errorMessage);
      setRefreshErrorCount((previous) => {
        const nextCount = previous + 1;
        if (mode === "refresh" && nextCount >= AUTO_REFRESH_ERROR_THRESHOLD) {
          setAutoRefresh(false);
          setAutoRefreshPaused(true);
        }
        return nextCount;
      });
      message.error(errorMessage);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        if (mode === "refresh") {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    void loadStatus("init");
    return () => {
      requestControllerRef.current?.abort();
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!autoRefresh || autoRefreshPaused) {
      return;
    }
    const timer = window.setInterval(() => {
      void loadStatus("refresh");
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, autoRefreshPaused, loadStatus]);

  const handleToggleAutoRefresh = useCallback((checked: boolean) => {
    setAutoRefresh(checked);
    if (checked) {
      setAutoRefreshPaused(false);
      setRefreshErrorCount(0);
      setLastRefreshError("");
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    setAutoRefreshPaused(false);
    setRefreshErrorCount(0);
    setLastRefreshError("");
    void loadStatus("refresh");
  }, [loadStatus]);

  const riskState = useMemo(() => {
    if (!status) {
      return { level: "warning" as const, title: "系统状态未知", message: "暂时无法判断当前运行状态，请刷新后重试。" };
    }

    const issues: string[] = [];
    if (!status.databaseConnected) issues.push("数据库连接异常");
    if (!status.uploadDirectoryReady) issues.push("上传目录不可写");
    if (status.aiEnabled && !status.aiKeyConfigured) issues.push("AI 已启用但密钥未配置");
    if (!status.latestBackupPresent) issues.push("尚未发现可用备份");
    if (status.requirePasswordChange) issues.push("管理员初始密码尚未修改");
    if (status.security?.securityLevel === "risk") issues.push("仍存在默认安全配置");

    if (issues.length === 0) {
      return {
        level: "success" as const,
        title: "系统运行正常",
        message: "关键依赖、目录与核心配置状态均正常，可继续进行运营、部署与客户交付。",
      };
    }

    const critical = !status.databaseConnected || !status.uploadDirectoryReady;
    return {
      level: critical ? ("error" as const) : ("warning" as const),
      title: critical ? "系统存在高风险项" : "系统存在待处理项",
      message: issues.join("，"),
    };
  }, [status]);

  const summary = useMemo<SummaryItem[]>(() => {
    if (!status) return [];
    return [
      { label: "当前版本", value: status.version, note: "用于确认部署与升级结果", icon: ServerCog },
      { label: "部署环境", value: status.deploymentEnvironment || "未知", note: status.gitRevision ? `提交 ${status.gitRevision}` : "未记录版本提交号", icon: ServerCog },
      { label: "运行时长", value: status.uptimeLabel || "未知", note: "用于判断服务是否发生过近期重启", icon: ServerCog },
      { label: "上传目录容量", value: status.uploadDirectorySize || "未知", note: status.uploadDirectoryReady ? `文件数 ${status.uploadFileCount}` : "上传目录异常", icon: HardDriveDownload },
      { label: "AI 配置", value: status.aiEnabled ? "已启用" : "未启用", note: status.aiKeyConfigured ? "密钥已配置" : "密钥未配置", icon: Sparkles },
      { label: "交付初始化", value: status.deliveryInitialized ? "已完成" : "待完成", note: status.requirePasswordChange ? "仍需先修改管理员初始密码" : "已完成基础安全初始化", icon: KeyRound },
      { label: "安全等级", value: status.security?.securityLevel === "good" ? "良好" : status.security?.securityLevel === "warning" ? "待完善" : "高风险", note: status.security?.securitySummary || "暂未获取安全状态摘要", icon: KeyRound },
      { label: "最近备份", value: status.latestBackupPresent ? status.latestBackupName : "暂无", note: "用于升级前回滚和恢复", icon: KeyRound },
      { label: "操作日志", value: status.operationLogCount, note: `保留策略 ${status.operationLogRetentionDays} 天`, icon: Archive },
    ];
  }, [status]);

  const latestInspectionTask = useMemo(() => opsTasks.find((item) => item.taskType === "inspection") ?? null, [opsTasks]);
  const latestBackupTask = useMemo(() => opsTasks.find((item) => item.taskType === "backup") ?? null, [opsTasks]);

  const filteredOpsTasks = useMemo(() => {
    return opsTasks.filter((item) => {
      const typeMatched = taskTypeFilter === "all" || item.taskType === taskTypeFilter;
      const statusMatched = taskStatusFilter === "all" || item.status === taskStatusFilter;
      return typeMatched && statusMatched;
    });
  }, [opsTasks, taskStatusFilter, taskTypeFilter]);

  const taskStats = useMemo(() => {
    const failed = opsTasks.filter((item) => item.status === "failed").length;
    const inspection = opsTasks.filter((item) => item.taskType === "inspection").length;
    const backup = opsTasks.filter((item) => item.taskType === "backup").length;
    return { failed, inspection, backup };
  }, [opsTasks]);

  const riskItems = useMemo(() => (status ? buildSystemRisks(status) : []), [status]);
  const inspectionOverview = useMemo(() => (latestInspectionTask ? getTaskResultEntries(latestInspectionTask).slice(0, 6) : []), [latestInspectionTask]);

  const backupOverview = useMemo<BackupOverviewItem[]>(() => {
    const latestBackupFile = backupFiles[0];
    return [
      { label: "备份总数", value: `${backupFiles.length} 份`, note: "当前可直接下载的备份目录数量" },
      { label: "最新备份", value: latestBackupFile?.backupName || "暂无", note: latestBackupFile?.modifiedAt || "尚未产生可用备份" },
      { label: "最新体积", value: latestBackupFile?.size || "未知", note: latestBackupTask?.finishedAt ? `最近手动备份完成于 ${formatDateTime(latestBackupTask.finishedAt)}` : "尚未记录后台触发的备份任务" },
    ];
  }, [backupFiles, latestBackupTask]);

  const recommendedCommands = useMemo<OpsCommandItem[]>(
    () => [
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
    ],
    [],
  );

  const opsTasksWithCommands = useMemo(
    () =>
      opsTasks.map((item) => {
        const commandMeta = resolveOpsCommand(item.taskType);
        return {
          ...item,
          commandName: commandMeta.commandName,
          commandPreview: commandMeta.commandPreview,
        };
      }),
    [opsTasks],
  );

  const openArchiveModal = useCallback(() => {
    const suggested = status?.operationLogArchiveBefore ? status.operationLogArchiveBefore.slice(0, 10) : "";
    setArchiveBefore(suggested);
    setArchiveModalOpen(true);
  }, [status?.operationLogArchiveBefore]);

  const handleArchive = useCallback(async () => {
    if (!archiveBefore) {
      message.warning("请选择归档截止日期");
      return;
    }
    setArchiving(true);
    try {
      const result = await archiveAdminOperationLogs(`${archiveBefore}T00:00:00`);
      setLatestArchiveResult(result);
      setArchiveModalOpen(false);
      message.success(`已归档 ${result.archivedCount} 条操作日志`);
      await loadStatus("refresh");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作日志归档失败");
    } finally {
      setArchiving(false);
    }
  }, [archiveBefore, loadStatus]);

  const handleConfigImport = useCallback(async (file: RcFile) => {
    if (importingConfig) return false;
    setImportingConfig(true);
    try {
      const result = await importAdminConfig(file);
      message.success(`配置已导入：时间轴 ${result.timelineCount} 条，团队 ${result.teamCount} 人`);
      setLatestConfigImportAt(new Date().toLocaleString("zh-CN", { hour12: false }));
      await loadStatus("refresh");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "配置导入失败");
    } finally {
      setImportingConfig(false);
    }
    return false;
  }, [importingConfig, loadStatus]);

  const handleCreateBackupTask = useCallback(async () => {
    if (runningBackup) return;
    setRunningBackup(true);
    try {
      const result = await createAdminBackupTask();
      message.success(`备份已完成：${result.taskLabel}`);
      await loadStatus("refresh");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建手动备份失败");
    } finally {
      setRunningBackup(false);
    }
  }, [runningBackup, loadStatus]);

  const handleCreateInspectionTask = useCallback(async () => {
    if (runningInspection) return;
    setRunningInspection(true);
    try {
      const result = await createAdminInspectionTask();
      message.success(`巡检已完成：${result.taskLabel}`);
      await loadStatus("refresh");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "执行巡检失败");
    } finally {
      setRunningInspection(false);
    }
  }, [runningInspection, loadStatus]);

  const setTab = useCallback((nextTab: SystemTabKey) => {
    setSearchParams(buildTabSearchParams(searchParams, nextTab), { replace: true });
  }, [searchParams, setSearchParams]);

  const handleRiskAction = useCallback((actionKey?: RiskActionKey) => {
    if (!actionKey) return;

    if (actionKey === "failed-logs") {
      navigate("/admin/operation-logs?success=false");
      return;
    }
    if (actionKey === "ai-settings") {
      navigate("/admin/ai-settings");
      return;
    }
    if (actionKey === "upload") {
      setTab("security");
      window.setTimeout(() => {
        uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }
    if (actionKey === "backup") {
      setTab("backups");
      return;
    }
    if (actionKey === "security") {
      setTab("security");
      window.setTimeout(() => {
        securitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }
    if (actionKey === "change-password") {
      adminShell?.openPasswordModal();
    }
  }, [adminShell, navigate, setTab]);

  const handleDownloadLatestBackup = useCallback(() => {
    if (!status?.latestBackupDownloadUrl) return;
    downloadLatestAdminBackup(status.latestBackupDownloadUrl)
      .then(() => message.success("已开始下载最近备份"))
      .catch((error) => message.error(error instanceof Error ? error.message : "备份下载失败"));
  }, [status?.latestBackupDownloadUrl]);

  const handleDownloadFile = useCallback((downloadUrl: string, filename: string) => {
    downloadAdminFile(downloadUrl, filename)
      .then(() => message.success(`已开始下载 ${filename}`))
      .catch((error) => message.error(error instanceof Error ? error.message : "文件下载失败"));
  }, []);

  const handleConfigExport = useCallback(() => {
    downloadAdminConfigExport()
      .then(() => {
        setLatestConfigExportAt(new Date().toLocaleString("zh-CN", { hour12: false }));
        message.success("已开始下载配置导出包");
      })
      .catch((error) => message.error(error instanceof Error ? error.message : "配置导出失败"));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="admin-panel">
        <div className="admin-empty-state min-h-[280px]">
          <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <h4>暂时无法加载系统状态</h4>
          <p>请稍后刷新页面，或检查后端系统状态接口是否正常。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="admin-toolbar p-5 admin-sticky-toolbar">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">运维中心</p>
            <h3 className="admin-section-title mt-2 text-xl">系统运维工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              将风险总览、备份下载、巡检任务、安全状态、日志归档和配置迁移拆分为独立场景页签，减少长页面滚动，便于交付、巡检与日常维护。
            </p>
          </div>
          <Button type="primary" size="large" loading={refreshing} onClick={handleManualRefresh} block={!screens.sm}>
            刷新当前状态
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          当前为 {TAB_LABELS[activeTab]}，Tabs 仅重组展示结构，所有接口、任务记录、归档逻辑和弹窗链路保持原样。
        </p>
      </section>

      <Tabs
        activeKey={activeTab}
        onChange={(nextTab) => setTab(nextTab as SystemTabKey)}
        tabBarGutter={screens.sm ? 24 : 12}
        items={[
          {
            key: "overview",
            label: "总览",
            children: (
              <SystemOverviewTab
                riskAlertType={riskState.level}
                riskState={riskState}
                lastRefreshError={lastRefreshError}
                autoRefreshPaused={autoRefreshPaused}
                refreshErrorCount={refreshErrorCount}
                lastRefreshAt={lastRefreshAt}
                autoRefresh={autoRefresh}
                refreshing={refreshing}
                onToggleAutoRefresh={handleToggleAutoRefresh}
                onManualRefresh={handleManualRefresh}
                summary={summary}
                riskItems={riskItems}
                latestInspectionTask={latestInspectionTask}
                inspectionOverview={inspectionOverview}
                onRiskAction={handleRiskAction}
                onViewTask={setSelectedTask}
                getTaskStatusMeta={getTaskStatusMeta}
                formatDateTime={formatDateTime}
              />
            ),
          },
          {
            key: "backups",
            label: "备份与下载",
            children: (
              <SystemBackupsTab
                runningBackup={runningBackup}
                runningInspection={runningInspection}
                onCreateBackupTask={() => void handleCreateBackupTask()}
                onCreateInspectionTask={() => void handleCreateInspectionTask()}
                backupFiles={backupFiles}
                backupFilesError={backupFilesError}
                backupOverview={backupOverview}
                latestBackupPresent={status.latestBackupPresent}
                latestBackupDownloadUrl={status.latestBackupDownloadUrl}
                latestBackupPath={status.latestBackupPath}
                latestBackupTask={latestBackupTask}
                latestInspectionTask={latestInspectionTask}
                formatDateTime={formatDateTime}
                onDownloadLatestBackup={handleDownloadLatestBackup}
                onDownloadBackupFile={handleDownloadFile}
                recommendedCommands={recommendedCommands}
              />
            ),
          },
          {
            key: "tasks",
            label: "巡检与任务",
            children: (
              <SystemTasksTab
                filteredOpsTasks={filteredOpsTasks.map((item) => ({
                  ...item,
                  ...resolveOpsCommand(item.taskType),
                }))}
                opsTasks={opsTasksWithCommands}
                opsTasksError={opsTasksError}
                taskStats={taskStats}
                taskTypeFilter={taskTypeFilter}
                taskStatusFilter={taskStatusFilter}
                setTaskTypeFilter={setTaskTypeFilter}
                setTaskStatusFilter={setTaskStatusFilter}
                setSelectedTask={setSelectedTask}
                getTaskStatusMeta={getTaskStatusMeta}
                formatTaskTypeLabel={formatTaskTypeLabel}
                formatDateTime={formatDateTime}
                getTaskResultEntries={getTaskResultEntries}
              />
            ),
          },
          {
            key: "security",
            label: "安全与风险",
            children: (
              <SystemSecurityTab
                status={status}
                uploadSectionRef={uploadSectionRef}
                securitySectionRef={securitySectionRef}
                formatDateTime={formatDateTime}
                formatServiceName={formatServiceName}
                onRiskAction={handleRiskAction}
              />
            ),
          },
          {
            key: "archives",
            label: "日志归档",
            children: (
              <SystemArchivesTab
                operationLogCount={status.operationLogCount}
                operationLogRetentionDays={status.operationLogRetentionDays}
                operationLogArchiveBefore={status.operationLogArchiveBefore}
                archiveFiles={archiveFiles}
                archiveFilesError={archiveFilesError}
                latestArchiveResult={latestArchiveResult}
                openArchiveModal={openArchiveModal}
                onDownloadArchiveFile={handleDownloadFile}
              />
            ),
          },
          {
            key: "migration",
            label: "配置迁移",
            children: (
              <SystemMigrationTab
                importingConfig={importingConfig}
                latestConfigExportAt={latestConfigExportAt}
                latestConfigImportAt={latestConfigImportAt}
                onConfigImport={handleConfigImport}
                onConfigExport={handleConfigExport}
              />
            ),
          },
        ]}
      />

      <Modal
        title="归档历史操作日志"
        open={archiveModalOpen}
        onCancel={() => {
          if (archiving) return;
          setArchiveModalOpen(false);
        }}
        onOk={() => void handleArchive()}
        okText="确认归档"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !archiveBefore }}
        confirmLoading={archiving}
      >
        <div className="space-y-3">
          <Alert
            showIcon
            type="warning"
            message="归档会导出并删除截止日期之前的操作日志"
            description="归档文件会写入备份目录下的 operation-logs 子目录。该操作适用于控制日志表体积，执行前请确认截止日期，并建议先下载已有归档文件留档。"
          />
          <div className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-[#f7f8f5] px-4 py-3 text-sm text-muted">
            <p>影响范围：</p>
            <p className="mt-1">- 删除截止日期之前的操作日志记录</p>
            <p className="mt-1">- 同时生成一份对应归档文件，便于后续留档或下载</p>
            <p className="mt-2">执行建议：</p>
            <p className="mt-1">- 先确认当前建议截止日期是否符合预期</p>
            <p className="mt-1">- 如需长期留档，归档后及时下载归档文件</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">归档截止日期</p>
            <Input type="date" value={archiveBefore} onChange={(event) => setArchiveBefore(event.target.value)} />
          </div>
          <p className="text-sm leading-6 text-muted">
            当前建议值：{status.operationLogArchiveBefore || "暂无"}。确认后会归档该日期 00:00:00 之前的日志。
          </p>
        </div>
      </Modal>

      <Modal
        title={selectedTask ? `${selectedTask.taskLabel || formatTaskTypeLabel(selectedTask.taskType)}详情` : "任务详情"}
        open={Boolean(selectedTask)}
        footer={null}
        width={720}
        onCancel={() => setSelectedTask(null)}
      >
        {selectedTask ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">任务类型</p>
              <p className="mt-2 text-muted">{formatTaskTypeLabel(selectedTask.taskType)}</p>
              {resolveOpsCommand(selectedTask.taskType).commandPreview ? (
                <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f7f8f5] p-3 text-xs text-[#1b281e]">
                  {resolveOpsCommand(selectedTask.taskType).commandPreview}
                </pre>
              ) : null}
            </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">任务状态</p>
                <p className="mt-2 text-muted">{getTaskStatusMeta(selectedTask.status).label}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">开始时间</p>
                <p className="mt-2 text-muted">{formatDateTime(selectedTask.startedAt)}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">完成时间</p>
                <p className="mt-2 text-muted">{formatDateTime(selectedTask.finishedAt)}</p>
              </div>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">结构化结果</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {getTaskResultEntries(selectedTask).map((entry) => (
                  <div key={`${selectedTask.id}-detail-${entry.label}`} className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{entry.label}</p>
                    <p className="mt-1 break-all text-xs text-[#1b281e]">{entry.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {selectedTask.errorMessage ? <Alert showIcon type="error" message="任务失败信息" description={selectedTask.errorMessage} /> : null}
            {selectedTask.resultSummary ? (
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">原始结果摘要</p>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f7f8f5] p-3 text-xs text-muted">{selectedTask.resultSummary}</pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
