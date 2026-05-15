import { Alert, Button, Empty, Input, Modal, Segmented, Spin, Switch, Tag, Upload, message } from "antd";
import { AlertTriangle, Archive, Download, HardDriveDownload, KeyRound, RefreshCw, SearchCheck, ServerCog, Sparkles, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { archiveAdminOperationLogs, createAdminBackupTask, createAdminInspectionTask, downloadAdminConfigExport, downloadAdminFile, downloadLatestAdminBackup, getAdminBackups, getAdminOperationLogArchiveFiles, getAdminOpsTasks, getAdminSystemStatus, importAdminConfig, isAbortError } from "@/services/api";
import { useAdminShell } from "@/components/admin/AdminShell";
import type { AdminBackupFile, AdminOpsTask, OperationLogArchiveFile, OperationLogArchiveResult, SystemStatus } from "@/types";
import type { RcFile } from "antd/es/upload";

const AUTO_REFRESH_INTERVAL_MS = 60000;
const AUTO_REFRESH_ERROR_THRESHOLD = 3;

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

function getTaskResultEntries(task: AdminOpsTask) {
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

type RiskActionKey = "failed-logs" | "upload" | "backup" | "ai-settings" | "security" | "change-password";

type RiskItem = {
  level: "error" | "warning";
  priority: number;
  title: string;
  detail: string;
  suggestion?: string;
  actionKey?: RiskActionKey;
  actionLabel?: string;
};

function buildSystemRisks(status: SystemStatus) {
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
  const [latestArchiveResult, setLatestArchiveResult] = useState<OperationLogArchiveResult | null>(null);
  const [archiveFiles, setArchiveFiles] = useState<OperationLogArchiveFile[]>([]);
  const [backupFiles, setBackupFiles] = useState<AdminBackupFile[]>([]);
  const [opsTasks, setOpsTasks] = useState<AdminOpsTask[]>([]);
  const [archiveFilesError, setArchiveFilesError] = useState("");
  const [backupFilesError, setBackupFilesError] = useState("");
  const [opsTasksError, setOpsTasksError] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | "backup" | "inspection">("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [selectedTask, setSelectedTask] = useState<AdminOpsTask | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);
  const securitySectionRef = useRef<HTMLDivElement | null>(null);
  const backupSectionRef = useRef<HTMLDivElement | null>(null);

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
    loadStatus("init");
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
    if (!status) return { level: "warning", title: "系统状态未知", message: "暂时无法判断当前运行状态，请刷新后重试。" };

    const issues: string[] = [];
    if (!status.databaseConnected) issues.push("数据库连接异常");
    if (!status.uploadDirectoryReady) issues.push("上传目录不可写");
    if (status.aiEnabled && !status.aiKeyConfigured) issues.push("AI 已启用但密钥未配置");
    if (!status.latestBackupPresent) issues.push("尚未发现可用备份");
    if (status.requirePasswordChange) issues.push("管理员初始密码尚未修改");
    if (status.security?.securityLevel === "risk") issues.push("仍存在默认安全配置");

    if (issues.length === 0) {
      return { level: "success", title: "系统运行正常", message: "关键依赖、目录与核心配置状态均正常，可继续进行运营、部署与客户交付。" };
    }

    const critical = !status.databaseConnected || !status.uploadDirectoryReady;
    return {
      level: critical ? "error" : "warning",
      title: critical ? "系统存在高风险项" : "系统存在待处理项",
      message: issues.join("，"),
    };
  }, [status]);

  const riskAlertType = riskState.level === "success" ? "success" : riskState.level === "error" ? "error" : "warning";

  const summary = useMemo(() => {
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

  const latestInspectionTask = useMemo(
    () => opsTasks.find((item) => item.taskType === "inspection") ?? null,
    [opsTasks],
  );

  const latestBackupTask = useMemo(
    () => opsTasks.find((item) => item.taskType === "backup") ?? null,
    [opsTasks],
  );

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

  const inspectionOverview = useMemo(() => {
    if (!latestInspectionTask) return [];
    return getTaskResultEntries(latestInspectionTask).slice(0, 6);
  }, [latestInspectionTask]);

  const backupOverview = useMemo(() => {
    const latestBackupFile = backupFiles[0];
    return [
      { label: "备份总数", value: `${backupFiles.length} 份`, note: "当前可直接下载的备份目录数量" },
      { label: "最新备份", value: latestBackupFile?.backupName || "暂无", note: latestBackupFile?.modifiedAt || "尚未产生可用备份" },
      { label: "最新体积", value: latestBackupFile?.size || "未知", note: latestBackupTask?.finishedAt ? `最近手动备份完成于 ${formatDateTime(latestBackupTask.finishedAt)}` : "尚未记录后台触发的备份任务" },
    ];
  }, [backupFiles, latestBackupTask]);

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
      uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionKey === "backup") {
      backupSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionKey === "security") {
      securitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionKey === "change-password") {
      adminShell?.openPasswordModal();
    }
  }, [adminShell, navigate]);

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
      <section className="admin-panel admin-shell-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-3">
            <Alert
              showIcon
              type={riskAlertType}
              icon={<AlertTriangle size={16} />}
              message={riskState.title}
              description={riskState.message}
            />
            {lastRefreshError ? (
              <Alert
                showIcon
                type={autoRefreshPaused ? "error" : "warning"}
                message={autoRefreshPaused ? "自动轮询已暂停" : "最近一次刷新失败"}
                description={
                  autoRefreshPaused
                    ? `连续失败 ${refreshErrorCount} 次，已暂停自动轮询。最近错误：${lastRefreshError}`
                    : `连续失败 ${refreshErrorCount} 次。最近错误：${lastRefreshError}`
                }
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>最近刷新：{lastRefreshAt || "暂无"}</span>
              <span>连续失败：{refreshErrorCount} 次</span>
              <label className="flex items-center gap-2">
                <Switch checked={autoRefresh} onChange={handleToggleAutoRefresh} size="small" />
                <span>自动轮询（60秒）{autoRefreshPaused ? " · 已暂停" : ""}</span>
              </label>
            </div>
          </div>
          <Button
            icon={<RefreshCw size={16} />}
            loading={refreshing}
            onClick={handleManualRefresh}
          >
            刷新状态
          </Button>
        </div>
      </section>

      <section className="admin-panel admin-shell-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-eyebrow">运维操作</p>
            <h3 className="admin-section-title mt-2 text-xl">手动备份与巡检</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              这里承接日常后台运维动作。可直接从管理界面执行手动备份和系统巡检，执行结果会进入任务记录。部署、升级、回滚仍建议通过命令行脚本完成。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              icon={<HardDriveDownload size={16} />}
              loading={runningBackup}
              onClick={() => void handleCreateBackupTask()}
            >
              立即备份
            </Button>
            <Button
              icon={<SearchCheck size={16} />}
              loading={runningInspection}
              onClick={() => void handleCreateInspectionTask()}
            >
              执行巡检
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-stat-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf4eb] text-forest">
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">风险清单</p>
              <h3 className="admin-section-title mt-2 text-xl">当前优先处理项</h3>
            </div>
            <Tag color={riskItems.length ? "red" : "green"}>{riskItems.length ? `${riskItems.length} 项` : "正常"}</Tag>
          </div>
          <div className="mt-5 space-y-3">
            {riskItems.length ? (
              riskItems.map((item) => (
                <Alert
                  key={item.title}
                  showIcon
                  type={item.level}
                  message={`${item.title} · P${item.priority}`}
                  description={
                    <div className="space-y-2">
                      <p>{item.detail}</p>
                      {item.suggestion ? <p className="text-xs text-muted">建议处理：{item.suggestion}</p> : null}
                    </div>
                  }
                  action={
                    item.actionKey && item.actionLabel ? (
                      <Button size="small" onClick={() => handleRiskAction(item.actionKey)}>
                        {item.actionLabel}
                      </Button>
                    ) : undefined
                  }
                />
              ))
            ) : (
              <Alert
                showIcon
                type="success"
                message="当前没有高优先级风险项"
                description="数据库、上传目录、备份、AI 密钥与基础安全状态当前均处于可交付范围内。"
              />
            )}
          </div>
        </div>

        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">巡检摘要</p>
              <h3 className="admin-section-title mt-2 text-xl">最近一次巡检结论</h3>
            </div>
            <Tag color={latestInspectionTask ? getTaskStatusMeta(latestInspectionTask.status).color : "default"}>
              {latestInspectionTask ? getTaskStatusMeta(latestInspectionTask.status).label : "暂无"}
            </Tag>
          </div>
          {latestInspectionTask ? (
            <div className="mt-5 space-y-4 text-sm">
              <p className="text-muted">
                巡检时间：{formatDateTime(latestInspectionTask.finishedAt || latestInspectionTask.startedAt)}，操作人：{latestInspectionTask.operatorName || "admin"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {inspectionOverview.map((entry) => (
                  <div key={`inspection-overview-${entry.label}`} className="admin-subpanel px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{entry.label}</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[#1b281e]">{entry.value}</p>
                  </div>
                ))}
              </div>
              <Button size="small" onClick={() => setSelectedTask(latestInspectionTask)}>
                查看完整巡检结果
              </Button>
            </div>
          ) : (
            <div className="admin-empty-inline mt-5">
              <p>当前还没有系统巡检记录，建议先执行一次巡检建立基线。</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">服务状态</p>
              <h3 className="admin-section-title mt-2 text-xl">运行状态</h3>
            </div>
            <Tag color={status.databaseConnected ? "green" : "red"}>{status.databaseConnected ? "正常" : "异常"}</Tag>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">当前服务</p>
              <p className="mt-2 text-muted">{formatServiceName(status.service)}</p>
              {status.service ? <p className="mt-2 break-all text-xs text-muted">{status.service}</p> : null}
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">部署信息</p>
              <p className="mt-2 text-muted">环境：{status.deploymentEnvironment || "未识别环境"}</p>
              <p className="mt-2 break-all text-muted">提交：{status.gitRevision || "未写入构建提交号"}</p>
              <p className="mt-2 text-muted">构建时间：{formatDateTime(status.buildTime)}</p>
              <p className="mt-2 text-muted">部署时间：{formatDateTime(status.deployedAt)}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#1b281e]">授权状态</p>
                <Tag color={status.licenseStatus === "active" ? "green" : status.licenseStatus === "expiring" ? "gold" : status.licenseStatus === "expired" ? "red" : "default"}>
                  {status.licenseStatusLabel || "未配置授权信息"}
                </Tag>
              </div>
              <p className="mt-2 text-muted">客户：{status.licenseCustomerName || "待补充客户信息"}</p>
              <p className="mt-2 text-muted">编号：{status.licenseCode || "待补充授权编号"}</p>
              <p className="mt-2 text-muted">类型：{status.licenseType || "待补充授权类型"}</p>
              <p className="mt-2 text-muted">到期：{formatDateTime(status.licenseExpiresAt)}</p>
              <p className="mt-2 text-muted">预警：提前 {status.licenseWarningDays || 30} 天</p>
              {status.licenseNotes ? <p className="mt-2 text-muted">备注：{status.licenseNotes}</p> : null}
            </div>
            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#1b281e]">交付初始化</p>
                <Tag color={status.deliveryInitialized ? "green" : "gold"}>
                  {status.deliveryInitialized ? "已完成" : "待完成"}
                </Tag>
              </div>
              <p className="mt-2 text-muted">
                {status.requirePasswordChange ? "当前仍在使用初始管理员密码，需先完成改密。" : "管理员密码已完成初始化，可继续正式运营。"}
              </p>
              <p className="mt-2 text-muted">
                最近改密时间：{formatDateTime(status.adminPasswordChangedAt)}
              </p>
            </div>
            <div className="admin-subpanel px-4 py-4" ref={securitySectionRef}>
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#1b281e]">安全状态</p>
                <Tag color={status.security?.securityLevel === "good" ? "green" : status.security?.securityLevel === "warning" ? "gold" : "red"}>
                  {status.security?.securityLevel === "good" ? "良好" : status.security?.securityLevel === "warning" ? "待完善" : "高风险"}
                </Tag>
              </div>
              <p className="mt-2 text-muted">{status.security?.securitySummary || "暂未获取安全状态摘要"}</p>
              <p className="mt-2 text-muted">管理员密码：{status.security?.adminPasswordInitialized ? "已初始化" : "仍需初始化"}</p>
              <p className="mt-2 text-muted">JWT 密钥：{status.security?.jwtSecretCustomized ? "已替换默认值" : "仍为默认值"}</p>
              <p className="mt-2 text-muted">数据加密密钥：{status.security?.dataEncryptionKeyCustomized ? "已替换默认值" : "仍为默认值"}</p>
              <p className="mt-2 text-muted">AI 密钥存储：{status.security?.aiKeyEncryptedAtRest ? "已加密存储" : "未加密存储"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">数据库连接</p>
              <p className="mt-2 text-muted">{status.databaseConnected ? "已连接" : "连接失败"}</p>
              <p className="mt-2 text-muted">数据库版本：{status.databaseVersion || "未读取到版本信息"}</p>
              <p className="mt-2 text-muted">数据库容量：{status.databaseSize || "未读取到容量信息"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4" ref={uploadSectionRef}>
              <p className="font-semibold text-[#1b281e]">上传目录</p>
              <p className="mt-2 break-all text-muted">{status.uploadDirectoryPath}</p>
              <p className="mt-2 text-muted">{status.uploadDirectoryReady ? "目录存在且可写" : "目录不可写或不存在"}</p>
              <p className="mt-2 text-muted">目录容量：{status.uploadDirectorySize || "暂未统计到目录容量"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">服务运行时长</p>
              <p className="mt-2 text-muted">{status.uptimeLabel || "暂未记录服务运行时长"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">磁盘占用</p>
              <p className="mt-2 text-muted">总容量：{status.diskTotal || "暂未读取到总容量"}</p>
              <p className="mt-2 text-muted">可用容量：{status.diskUsable || "暂未读取到可用容量"}</p>
              <p className="mt-2 text-muted">已用比例：{status.diskUsageRate || "暂未计算已用比例"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">并发防护</p>
                <h3 className="admin-section-title mt-2 text-xl">流量保护状态</h3>
              </div>
              <Tag color={status.protection?.enabled ? "green" : "default"}>
                {status.protection?.enabled ? "已启用" : "未启用"}
              </Tag>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">基础限流阈值</p>
                <p className="mt-2 text-muted">公开读取：{status.protection?.publicReadCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">公开写入：{status.protection?.publicWriteCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">后台接口：{status.protection?.adminCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">高成本接口：{status.protection?.heavyCapacity ?? 0} / 周期</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">并发隔离阈值</p>
                <p className="mt-2 text-muted">AI 任务：{status.protection?.aiMaxConcurrent ?? 0} 并发</p>
                <p className="mt-2 text-muted">上传任务：{status.protection?.uploadMaxConcurrent ?? 0} 并发</p>
                <p className="mt-2 text-muted">配置导入：{status.protection?.configImportMaxConcurrent ?? 0} 并发</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">已触发限流</p>
                <p className="mt-2 text-muted">{status.protection?.rateLimitedCount ?? 0} 次</p>
                <p className="mt-2 text-sm leading-6 text-muted">代表入口限流已经拒绝过部分请求，可用来判断是否需要调大阈值或加前置网关。</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">已触发繁忙拒绝</p>
                <p className="mt-2 text-muted">{status.protection?.busyRejectedCount ?? 0} 次</p>
                <p className="mt-2 text-sm leading-6 text-muted">代表 AI、生图上传或配置导入等重接口因并发保护被拒绝过，可据此评估后续扩容需求。</p>
              </div>
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">任务记录</p>
                <h3 className="admin-section-title mt-2 text-xl">最近运维任务</h3>
              </div>
              <Tag color={filteredOpsTasks.length ? "green" : "default"}>{filteredOpsTasks.length} 条</Tag>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="admin-subpanel px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">失败任务</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.failed}</p>
                  <p className="mt-2 text-xs leading-6 text-muted">优先排查失败备份、失败巡检和连续异常记录。</p>
                </div>
                <div className="admin-subpanel px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">巡检任务</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.inspection}</p>
                  <p className="mt-2 text-xs leading-6 text-muted">用于观察后台是否形成固定巡检节奏。</p>
                </div>
                <div className="admin-subpanel px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">备份任务</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.backup}</p>
                  <p className="mt-2 text-xs leading-6 text-muted">用于判断人工备份执行频率是否满足交付要求。</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3">
                  <Segmented
                    value={taskTypeFilter}
                    onChange={(value) => setTaskTypeFilter(value as "all" | "backup" | "inspection")}
                    options={[
                      { label: "全部任务", value: "all" },
                      { label: "手动备份", value: "backup" },
                      { label: "系统巡检", value: "inspection" },
                    ]}
                  />
                  <Segmented
                    value={taskStatusFilter}
                    onChange={(value) => setTaskStatusFilter(value as "all" | "success" | "failed")}
                    options={[
                      { label: "全部状态", value: "all" },
                      { label: "成功", value: "success" },
                      { label: "失败", value: "failed" },
                    ]}
                  />
                </div>
                <p className="text-xs text-muted">
                  当前显示 {filteredOpsTasks.length} / {opsTasks.length} 条
                </p>
              </div>

              {filteredOpsTasks.length ? (
                filteredOpsTasks.map((item) => (
                  <div key={item.id} className="admin-subpanel px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#1b281e]">{item.taskLabel || formatTaskTypeLabel(item.taskType)}</p>
                          <Tag color={getTaskStatusMeta(item.status).color}>{getTaskStatusMeta(item.status).label}</Tag>
                        </div>
                        <p className="mt-2 text-muted">类型：{item.taskType} · 操作人：{item.operatorName || "admin"}</p>
                        <p className="mt-2 text-muted">开始：{formatDateTime(item.startedAt)} · 完成：{formatDateTime(item.finishedAt)}</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {getTaskResultEntries(item).slice(0, 4).map((entry) => (
                            <div key={`${item.id}-${entry.label}`} className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-white/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{entry.label}</p>
                              <p className="mt-1 break-all text-xs text-[#1b281e]">{entry.value}</p>
                            </div>
                          ))}
                        </div>
                        {item.errorMessage ? <p className="mt-2 text-xs text-[#b33a3a]">{item.errorMessage}</p> : null}
                      </div>
                      <Button size="small" onClick={() => setSelectedTask(item)}>
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-inline">
                  <p>{opsTasksError ? opsTasksError : opsTasks.length ? "当前筛选条件下没有匹配的运维任务。" : "当前还没有后台触发的运维任务记录。"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">AI 状态</p>
                <h3 className="admin-section-title mt-2 text-xl">AI 运行配置</h3>
              </div>
              <Tag color={status.aiEnabled ? "green" : "default"}>{status.aiEnabled ? "已启用" : "未启用"}</Tag>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">提供商</p>
                <p className="mt-2 text-muted">{status.aiProvider || "未配置"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">生图模型</p>
                <p className="mt-2 text-muted">{status.aiImageModel || "未配置"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">文本模型</p>
                <p className="mt-2 text-muted">{status.aiTextModel || "未配置"}</p>
              </div>
              <Alert
                type={status.aiKeyConfigured ? "success" : "warning"}
                showIcon
                message={status.aiKeyConfigured ? "AI 密钥已配置" : "AI 密钥未配置"}
              />
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="section-eyebrow">交付迁移</p>
                <h3 className="admin-section-title mt-2 text-xl">配置导入导出</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  用于客户交付、环境迁移和售后恢复。导出包包含站点配置、门店信息、品牌故事、关于我们、时间轴、团队成员和 AI 配置，不会改动作品与留言数据。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="primary"
                  icon={<Download size={16} />}
                  onClick={() => {
                    downloadAdminConfigExport()
                      .then(() => message.success("已开始下载配置导出包"))
                      .catch((error) => message.error(error instanceof Error ? error.message : "配置导出失败"));
                  }}
                >
                  导出配置
                </Button>
                <Upload beforeUpload={handleConfigImport} showUploadList={false} accept=".json,application/json">
                  <Button loading={importingConfig} icon={<UploadCloud size={16} />}>
                    导入配置
                  </Button>
                </Upload>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">适用场景</p>
                <p className="mt-2 text-sm leading-6 text-muted">新客户环境初始化、测试环境回填、同品牌多实例复制，以及售后排障前的配置快照留存。</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">导入影响范围</p>
                <p className="mt-2 text-sm leading-6 text-muted">会覆盖当前动态配置内容，建议导入前先导出一份当前配置包，作为回退基线。</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">执行建议</p>
                <p className="mt-2 text-sm leading-6 text-muted">正式环境建议先下载最近备份，再执行配置导入；完成后刷新前台首页、关于页和后台设置页确认结果。</p>
              </div>
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6" ref={backupSectionRef}>
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">备份状态</p>
                <h3 className="admin-section-title mt-2 text-xl">备份资产</h3>
              </div>
              <div className="flex items-center gap-3">
                <Tag color={backupFiles.length ? "green" : "gold"}>{backupFiles.length ? `${backupFiles.length} 份` : "暂无备份"}</Tag>
                <Button
                  type="primary"
                  icon={<Download size={16} />}
                  disabled={!status.latestBackupPresent || !status.latestBackupDownloadUrl}
                  onClick={() => {
                    downloadLatestAdminBackup(status.latestBackupDownloadUrl)
                      .then(() => message.success("已开始下载最近备份"))
                      .catch((error) => message.error(error instanceof Error ? error.message : "备份下载失败"));
                  }}
                >
                  下载最近备份
                </Button>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="grid gap-3 lg:grid-cols-3">
                {backupOverview.map((item) => (
                  <div key={item.label} className="admin-subpanel px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{item.label}</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[#1b281e]">{item.value}</p>
                    <p className="mt-2 text-xs leading-6 text-muted">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">备份目录</p>
                <p className="mt-2 break-all text-muted">{status.latestBackupPath || "当前未发现备份目录记录"}</p>
              </div>
              {backupFilesError ? (
                <Alert
                  showIcon
                  type="warning"
                  message="备份资产列表加载失败"
                  description={backupFilesError}
                />
              ) : null}
              {backupFiles.length ? (
                <div className="space-y-3">
                  {backupFiles.slice(0, 6).map((item) => (
                    <div key={item.backupName} className="admin-subpanel px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#1b281e]">{item.backupName}</p>
                            {item.latest ? <Tag color="green">最新</Tag> : null}
                          </div>
                          <p className="mt-1 text-xs text-muted">{item.modifiedAt || "暂无时间"} · {item.size || "未知大小"}</p>
                          <p className="mt-1 break-all text-xs text-muted">{item.path}</p>
                        </div>
                        <Button
                          icon={<Download size={14} />}
                          onClick={() => {
                            downloadAdminFile(item.downloadUrl, `${item.backupName}.tar.gz`)
                              .then(() => message.success(`已开始下载 ${item.backupName}`))
                              .catch((error) => message.error(error instanceof Error ? error.message : "备份下载失败"));
                          }}
                        >
                          下载该备份
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-inline">
                  <p>当前还没有可用的手动或历史备份目录。</p>
                </div>
              )}
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">日志归档</p>
                <h3 className="admin-section-title mt-2 text-xl">操作日志保留策略</h3>
              </div>
              <Button type="primary" icon={<Archive size={16} />} onClick={openArchiveModal}>
                手动归档
              </Button>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">当前日志数量</p>
                <p className="mt-2 text-muted">{status.operationLogCount} 条</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">保留策略</p>
                <p className="mt-2 text-muted">默认保留 {status.operationLogRetentionDays} 天，超出范围的历史日志建议归档后清理。</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">建议归档截止时间</p>
                <p className="mt-2 text-muted">{status.operationLogArchiveBefore || "暂无可归档建议时间"}</p>
              </div>
              {latestArchiveResult ? (
                <Alert
                  showIcon
                  type="success"
                  message={`最近一次归档：${latestArchiveResult.archivedCount} 条`}
                  description={`归档文件 ${latestArchiveResult.archiveFilename}，归档截止 ${latestArchiveResult.archiveBefore}`}
                />
              ) : null}
              <div className="admin-subpanel px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#1b281e]">归档文件</p>
                    <p className="mt-1 text-sm text-muted">展示最近生成的日志归档文件，可直接下载留存。</p>
                  </div>
                  <Tag color={archiveFiles.length ? "green" : "default"}>{archiveFiles.length} 份</Tag>
                </div>
                {archiveFilesError ? (
                  <Alert
                    className="mt-4"
                    showIcon
                    type="warning"
                    message="归档文件列表加载失败"
                    description={archiveFilesError}
                  />
                ) : null}
                {archiveFiles.length ? (
                  <div className="mt-4 space-y-3">
                    {archiveFiles.slice(0, 5).map((item) => (
                      <div key={item.filename} className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-white px-4 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#1b281e]">{item.filename}</p>
                            <p className="mt-1 text-xs text-muted">{item.modifiedAt || "暂无时间"} · {item.size || "未知大小"}</p>
                            <p className="mt-1 truncate text-xs text-muted">{item.path}</p>
                          </div>
                          <Button
                            icon={<Download size={14} />}
                            onClick={() => {
                              downloadAdminFile(item.downloadUrl, item.filename)
                                .then(() => message.success(`已开始下载 ${item.filename}`))
                                .catch((error) => message.error(error instanceof Error ? error.message : "归档文件下载失败"));
                            }}
                          >
                            下载
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-inline mt-4">
                    <p>当前还没有操作日志归档文件。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
            description="归档文件会写入备份目录下的 operation-logs 子目录。该操作适用于控制日志表体积，执行前请确认截止日期。"
          />
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
            {selectedTask.errorMessage ? (
              <Alert showIcon type="error" message="任务失败信息" description={selectedTask.errorMessage} />
            ) : null}
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
