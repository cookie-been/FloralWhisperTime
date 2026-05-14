import { Alert, Button, Empty, Spin, Tag, message } from "antd";
import { AlertTriangle, Download, HardDriveDownload, KeyRound, RefreshCw, ServerCog, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadLatestAdminBackup, getAdminSystemStatus } from "@/services/api";
import type { SystemStatus } from "@/types";

export function AdminSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(async (mode: "init" | "refresh" = "init") => {
    if (mode === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      setStatus(await getAdminSystemStatus());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "系统状态加载失败");
    } finally {
      if (mode === "refresh") {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadStatus("init");
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
      { label: "运行时长", value: status.uptimeLabel || "未知", note: "用于判断服务是否发生过近期重启", icon: ServerCog },
      { label: "上传目录容量", value: status.uploadDirectorySize || "未知", note: status.uploadDirectoryReady ? `文件数 ${status.uploadFileCount}` : "上传目录异常", icon: HardDriveDownload },
      { label: "AI 配置", value: status.aiEnabled ? "已启用" : "未启用", note: status.aiKeyConfigured ? "密钥已配置" : "密钥未配置", icon: Sparkles },
      { label: "最近备份", value: status.latestBackupPresent ? status.latestBackupName : "暂无", note: "用于升级前回滚和恢复", icon: KeyRound },
    ];
  }, [status]);

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
          <Alert
            showIcon
            type={riskAlertType}
            icon={<AlertTriangle size={16} />}
            message={riskState.title}
            description={riskState.message}
            className="flex-1"
          />
          <Button
            icon={<RefreshCw size={16} />}
            loading={refreshing}
            onClick={() => loadStatus("refresh")}
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
              <p className="font-semibold text-[#1b281e]">服务标识</p>
              <p className="mt-2 text-muted">{status.service}</p>
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
                <p className="mt-2 text-muted">{status.latestBackupModifiedAt || "暂无"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
