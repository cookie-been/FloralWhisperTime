import { Alert, Button, Empty, Input, Modal, Spin, Switch, Tag, message } from "antd";
import { AlertTriangle, Archive, Download, HardDriveDownload, KeyRound, RefreshCw, ServerCog, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { archiveAdminOperationLogs, downloadAdminFile, downloadLatestAdminBackup, getAdminOperationLogArchiveFiles, getAdminSystemStatus, isAbortError } from "@/services/api";
import type { OperationLogArchiveFile, OperationLogArchiveResult, SystemStatus } from "@/types";

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

export function AdminSystemStatus() {
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
  const [latestArchiveResult, setLatestArchiveResult] = useState<OperationLogArchiveResult | null>(null);
  const [archiveFiles, setArchiveFiles] = useState<OperationLogArchiveFile[]>([]);
  const requestControllerRef = useRef<AbortController | null>(null);

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
      const [nextStatus, nextArchiveFiles] = await Promise.all([
        getAdminSystemStatus({ signal: controller.signal }),
        getAdminOperationLogArchiveFiles({ signal: controller.signal }),
      ]);
      setStatus(nextStatus);
      setArchiveFiles(nextArchiveFiles);
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

    if (issues.length === 0) {
      return { level: "success", title: "系统运行正常", message: "关键依赖与目录状态均正常，可继续进行运营与部署操作。" };
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
      { label: "最近备份", value: status.latestBackupPresent ? status.latestBackupName : "暂无", note: "用于升级前回滚和恢复", icon: KeyRound },
      { label: "操作日志", value: status.operationLogCount, note: `保留策略 ${status.operationLogRetentionDays} 天`, icon: Archive },
    ];
  }, [status]);

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
      <section className="admin-panel p-5">
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

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="admin-panel p-6">
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
              <p className="mt-2 text-muted">环境：{status.deploymentEnvironment || "未知"}</p>
              <p className="mt-2 break-all text-muted">提交：{status.gitRevision || "未记录"}</p>
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
              <p className="mt-2 text-muted">客户：{status.licenseCustomerName || "未填写"}</p>
              <p className="mt-2 text-muted">编号：{status.licenseCode || "未填写"}</p>
              <p className="mt-2 text-muted">类型：{status.licenseType || "未填写"}</p>
              <p className="mt-2 text-muted">到期：{formatDateTime(status.licenseExpiresAt)}</p>
              <p className="mt-2 text-muted">预警：提前 {status.licenseWarningDays || 30} 天</p>
              {status.licenseNotes ? <p className="mt-2 text-muted">备注：{status.licenseNotes}</p> : null}
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">数据库连接</p>
              <p className="mt-2 text-muted">{status.databaseConnected ? "已连接" : "连接失败"}</p>
              <p className="mt-2 text-muted">数据库版本：{status.databaseVersion || "未知"}</p>
              <p className="mt-2 text-muted">数据库容量：{status.databaseSize || "未知"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">上传目录</p>
              <p className="mt-2 break-all text-muted">{status.uploadDirectoryPath}</p>
              <p className="mt-2 text-muted">{status.uploadDirectoryReady ? "目录存在且可写" : "目录不可写或不存在"}</p>
              <p className="mt-2 text-muted">目录容量：{status.uploadDirectorySize || "未知"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">服务运行时长</p>
              <p className="mt-2 text-muted">{status.uptimeLabel || "未知"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">磁盘占用</p>
              <p className="mt-2 text-muted">总容量：{status.diskTotal || "未知"}</p>
              <p className="mt-2 text-muted">可用容量：{status.diskUsable || "未知"}</p>
              <p className="mt-2 text-muted">已用比例：{status.diskUsageRate || "未知"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-panel p-6">
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

          <div className="admin-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">备份状态</p>
                <h3 className="admin-section-title mt-2 text-xl">最近备份</h3>
              </div>
              <div className="flex items-center gap-3">
                <Tag color={status.latestBackupPresent ? "green" : "gold"}>{status.latestBackupPresent ? "已发现备份" : "暂无备份"}</Tag>
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
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">备份目录</p>
                <p className="mt-2 break-all text-muted">{status.latestBackupPath || "暂无"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">备份标识</p>
                <p className="mt-2 text-muted">{status.latestBackupName || "暂无"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">最近更新时间</p>
                <p className="mt-2 text-muted">{formatDateTime(status.latestBackupModifiedAt)}</p>
              </div>
            </div>
          </div>

          <div className="admin-panel p-6">
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
    </div>
  );
}
