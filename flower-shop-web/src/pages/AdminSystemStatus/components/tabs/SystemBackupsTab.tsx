import { Alert, Button, Tag } from "antd";
import { Download, HardDriveDownload, SearchCheck } from "lucide-react";
import type { AdminBackupFile } from "@/types";
import type { BackupOverviewItem } from "./types";

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
  onDownloadLatestBackup: () => void;
  onDownloadBackupFile: (downloadUrl: string, filename: string) => void;
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
  onDownloadLatestBackup,
  onDownloadBackupFile,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
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
              onClick={onCreateBackupTask}
            >
              立即备份
            </Button>
            <Button
              icon={<SearchCheck size={16} />}
              loading={runningInspection}
              onClick={onCreateInspectionTask}
            >
              执行巡检
            </Button>
          </div>
        </div>
      </section>

      <section className="admin-panel admin-shell-card sm:p-6">
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
              disabled={!latestBackupPresent || !latestBackupDownloadUrl}
              onClick={onDownloadLatestBackup}
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
