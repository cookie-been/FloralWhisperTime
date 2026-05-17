import { Alert, Button, Modal, Upload, message } from "antd";
import { Download, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { RcFile } from "antd/es/upload";
import { SystemActionGrid } from "./SystemActionGrid";

type Props = {
  importingConfig: boolean;
  latestConfigExportAt?: string;
  latestConfigImportAt?: string;
  onConfigImport: (file: RcFile) => Promise<boolean> | boolean;
  onConfigExport: () => void;
};

export function SystemMigrationTab({ importingConfig, latestConfigExportAt, latestConfigImportAt, onConfigImport, onConfigExport }: Props) {
  const [pendingImportFile, setPendingImportFile] = useState<RcFile | null>(null);

  const handleBeforeUpload = (file: RcFile) => {
    setPendingImportFile(file);
    return false;
  };

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return;
    const currentFile = pendingImportFile;
    setPendingImportFile(null);
    await onConfigImport(currentFile);
  };

  return (
    <div className="space-y-6 pt-2">
      <SystemActionGrid
        eyebrow="交付迁移"
        title="配置导入导出"
        description="用于客户交付、环境迁移和售后恢复。导出包包含站点配置、门店信息、品牌故事、关于我们、时间轴、团队成员和 AI 配置，不会改动作品与留言数据。"
        items={[
          {
            key: "config-export",
            title: "导出配置",
            description: "适用于新客户交付、测试环境回填、同品牌多实例复制，以及售后排障前的配置快照留存。",
            icon: Download,
            badge: "低风险",
            resultTitle: "最近一次导出",
            resultStatus: latestConfigExportAt ? "success" : "default",
            resultSummary: latestConfigExportAt ? "当前会话已执行过配置导出，可直接使用下载的配置包做交付留档。" : "当前会话还没有执行配置导出。",
            resultMeta: latestConfigExportAt ? `执行时间：${latestConfigExportAt}` : undefined,
            action: (
              <Button type="primary" icon={<Download size={16} />} onClick={onConfigExport}>
                导出配置
              </Button>
            ),
          },
          {
            key: "config-import",
            title: "导入配置",
            description: "会覆盖当前动态配置内容，建议导入前先下载最近备份并导出一份当前配置包，作为回退基线。",
            icon: UploadCloud,
            badge: "需确认",
            resultTitle: "最近一次导入",
            resultStatus: latestConfigImportAt ? "warning" : "default",
            resultSummary: latestConfigImportAt ? "当前会话已执行过配置导入，请刷新前台首页、关于页和后台设置页确认结果。" : "当前会话还没有执行配置导入。",
            resultMeta: latestConfigImportAt ? `执行时间：${latestConfigImportAt}` : undefined,
            action: (
              <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept=".json,application/json">
                <Button loading={importingConfig} icon={<UploadCloud size={16} />}>
                  导入配置
                </Button>
              </Upload>
            ),
          },
        ]}
      />

      <section className="admin-panel admin-shell-card sm:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
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
      </section>

      <Modal
        title="确认导入配置"
        open={Boolean(pendingImportFile)}
        onCancel={() => {
          if (importingConfig) return;
          setPendingImportFile(null);
        }}
        onOk={() => void handleConfirmImport()}
        okText="确认导入"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={importingConfig}
      >
        <div className="space-y-3">
          <Alert
            showIcon
            type="warning"
            message="导入会覆盖当前动态配置"
            description="本次导入会覆盖站点配置、门店信息、品牌故事、关于我们、时间轴、团队成员和 AI 配置。作品、留言与操作日志不会被本次导入覆盖。"
          />
          <div className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-[#f7f8f5] px-4 py-3 text-sm text-muted">
            <p>待导入文件：{pendingImportFile?.name || "未选择"}</p>
            <p className="mt-2">建议先执行两步：</p>
            <p className="mt-1">1. 下载最近备份或先执行一次手动备份</p>
            <p className="mt-1">2. 先导出当前配置，作为回退基线</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
