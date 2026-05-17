import { Alert, Button, Tag } from "antd";
import { Archive, Download } from "lucide-react";
import type { OperationLogArchiveFile, OperationLogArchiveResult } from "@/types";
import { SystemActionGrid } from "./SystemActionGrid";

type Props = {
  operationLogCount: number;
  operationLogRetentionDays: number;
  operationLogArchiveBefore?: string;
  archiveFiles: OperationLogArchiveFile[];
  archiveFilesError: string;
  latestArchiveResult: OperationLogArchiveResult | null;
  openArchiveModal: () => void;
  onDownloadArchiveFile: (downloadUrl: string, filename: string) => void;
};

export function SystemArchivesTab({
  operationLogCount,
  operationLogRetentionDays,
  operationLogArchiveBefore,
  archiveFiles,
  archiveFilesError,
  latestArchiveResult,
  openArchiveModal,
  onDownloadArchiveFile,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <SystemActionGrid
        eyebrow="日志归档"
        title="操作日志保留策略"
        description="用于控制操作日志表体积，避免长期累计后影响后台查询与维护。归档文件会进入备份目录下的 operation-logs 子目录。"
        items={[
          {
            key: "archive",
            title: "手动归档",
            description: "适合在交付前、月度清理或后台写操作较多后执行。归档前请确认截止日期，并保留最新下载文件。",
            icon: Archive,
            badge: "需确认",
            action: (
              <Button type="primary" icon={<Archive size={16} />} onClick={openArchiveModal}>
                手动归档
              </Button>
            ),
          },
        ]}
      />

      <section className="admin-panel admin-shell-card sm:p-6">
        <div className="mt-1 space-y-4 text-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">当前日志数量</p>
              <p className="mt-2 text-muted">{operationLogCount} 条</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">保留策略</p>
              <p className="mt-2 text-muted">默认保留 {operationLogRetentionDays} 天，超出范围的历史日志建议归档后清理。</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">建议归档截止时间</p>
              <p className="mt-2 text-muted">{operationLogArchiveBefore || "暂无可归档建议时间"}</p>
            </div>
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
              <Alert className="mt-4" showIcon type="warning" message="归档文件列表加载失败" description={archiveFilesError} />
            ) : null}
            {archiveFiles.length ? (
              <div className="mt-4 space-y-3">
                {archiveFiles.slice(0, 5).map((item) => (
                  <div key={item.filename} className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-white px-4 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1b281e]">{item.filename}</p>
                        <p className="mt-1 text-xs text-muted">
                          {item.modifiedAt || "暂无时间"} · {item.size || "未知大小"}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">{item.path}</p>
                      </div>
                      <Button icon={<Download size={14} />} onClick={() => onDownloadArchiveFile(item.downloadUrl, item.filename)}>
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
      </section>
    </div>
  );
}
