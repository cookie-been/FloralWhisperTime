import { Alert, Button, Tag } from "antd";
import { Download, HardDriveDownload, SearchCheck } from "lucide-react";
import type { AdminBackupFile, AdminOpsTask } from "@/types";
import type { BackupOverviewItem, OpsCommandItem } from "./types";
import { SystemActionGrid } from "./SystemActionGrid";

type Props = {
  runningBackup: boolean;
  runningInspection: boolean;
  onCreateBackupTask: () => void;
  onCreateInspectionTask: () => void;
  backupFiles: AdminBackupFile[];
  backupFilesError: string;
  backupOverview: BackupOverviewItem[];
  latestBackupPresent: boolean;
  latestBackupDownloadUrl?: string;
  latestBackupPath?: string;
  latestBackupTask: AdminOpsTask | null;
  latestInspectionTask: AdminOpsTask | null;
  formatDateTime: (value?: string) => string;
  onDownloadLatestBackup: () => void;
  onDownloadBackupFile: (downloadUrl: string, filename: string) => void;
  recommendedCommands: OpsCommandItem[];
};

export function SystemBackupsTab({
  runningBackup,
  runningInspection,
  onCreateBackupTask,
  onCreateInspectionTask,
  backupFiles,
  backupFilesError,
  backupOverview,
  latestBackupPresent,
  latestBackupDownloadUrl,
  latestBackupPath,
  latestBackupTask,
  latestInspectionTask,
  formatDateTime,
  onDownloadLatestBackup,
  onDownloadBackupFile,
  recommendedCommands,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <SystemActionGrid
        eyebrow="运维操作"
        title="后台可执行动作"
        description="这里承接日常后台低风险运维动作。可直接从管理界面执行手动备份和系统巡检，执行结果会进入任务记录。部署、升级、回滚仍建议通过统一命令入口 `./ops.sh` 完成。"
        items={[
          {
            key: "backup",
            title: "立即备份",
            description: recommendedCommands[0]?.description ?? "",
            icon: HardDriveDownload,
            badge: "后台执行",
            command: recommendedCommands[0]?.command,
            resultTitle: "最近一次备份",
            resultStatus: latestBackupTask?.status === "failed" ? "error" : latestBackupTask ? "success" : "default",
            resultSummary: latestBackupTask
              ? latestBackupTask.errorMessage || latestBackupTask.resultData?.backupName?.toString() || "已生成一份手动备份"
              : "当前还没有后台触发的手动备份记录。",
            resultMeta: latestBackupTask
              ? `完成时间：${formatDateTime(latestBackupTask.finishedAt || latestBackupTask.startedAt)}`
              : undefined,
            auditMeta: latestBackupTask
              ? `执行人：${latestBackupTask.operatorName || "admin"} · 来源：${latestBackupTask.triggerSource || "admin_ui"}`
              : undefined,
            action: (
              <Button
                type="primary"
                icon={<HardDriveDownload size={16} />}
                loading={runningBackup}
                onClick={onCreateBackupTask}
              >
                立即备份
              </Button>
            ),
          },
          {
            key: "inspection",
            title: "执行巡检",
            description: recommendedCommands[1]?.description ?? "",
            icon: SearchCheck,
            badge: "后台执行",
            command: recommendedCommands[1]?.command,
            resultTitle: "最近一次巡检",
            resultStatus: latestInspectionTask?.status === "failed" ? "error" : latestInspectionTask ? "success" : "default",
            resultSummary: latestInspectionTask
              ? latestInspectionTask.errorMessage || latestInspectionTask.resultData?.securitySummary?.toString() || "最近一次巡检已完成。"
              : "当前还没有后台触发的系统巡检记录。",
            resultMeta: latestInspectionTask
              ? `完成时间：${formatDateTime(latestInspectionTask.finishedAt || latestInspectionTask.startedAt)}`
              : undefined,
            auditMeta: latestInspectionTask
              ? `执行人：${latestInspectionTask.operatorName || "admin"} · 来源：${latestInspectionTask.triggerSource || "admin_ui"}`
              : undefined,
            action: (
              <Button icon={<SearchCheck size={16} />} loading={runningInspection} onClick={onCreateInspectionTask}>
                执行巡检
              </Button>
            ),
          },
          {
            key: "latest-backup-download",
            title: "下载最近备份",
            description: "用于把当前最新备份直接下载到本地留档，适合升级前、迁移前和排障前留存快照。",
            icon: Download,
            badge: latestBackupPresent ? "可下载" : "暂无备份",
            command: "./ops.sh backup",
            resultTitle: "当前下载源",
            resultStatus: latestBackupPresent ? "success" : "warning",
            resultSummary: latestBackupPresent
              ? `当前最近备份为 ${backupFiles[0]?.backupName || "最新备份"}，可直接下载留档。`
              : "当前未发现可下载的最近备份，建议先执行一次手动备份。",
            resultMeta: latestBackupPresent ? latestBackupPath || undefined : undefined,
            auditMeta: latestBackupTask
              ? `最近备份执行人：${latestBackupTask.operatorName || "admin"}`
              : undefined,
            action: (
              <Button
                type="primary"
                icon={<Download size={16} />}
                disabled={!latestBackupPresent || !latestBackupDownloadUrl}
                onClick={onDownloadLatestBackup}
              >
                下载最近备份
              </Button>
            ),
          },
        ]}
      />

      <section className="admin-panel admin-shell-card sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-eyebrow">备份状态</p>
            <h3 className="admin-section-title mt-2 text-xl">备份资产</h3>
          </div>
          <div className="flex items-center gap-3">
            <Tag color={backupFiles.length ? "green" : "gold"}>{backupFiles.length ? `${backupFiles.length} 份` : "暂无备份"}</Tag>
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
            <p className="mt-2 break-all text-muted">{latestBackupPath || "当前未发现备份目录记录"}</p>
          </div>
          {backupFilesError ? (
            <Alert showIcon type="warning" message="备份资产列表加载失败" description={backupFilesError} />
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
                      <p className="mt-1 text-xs text-muted">
                        {item.modifiedAt || "暂无时间"} · {item.size || "未知大小"}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted">{item.path}</p>
                    </div>
                    <Button
                      icon={<Download size={14} />}
                      onClick={() => onDownloadBackupFile(item.downloadUrl, `${item.backupName}.tar.gz`)}
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
      </section>
    </div>
  );
}
