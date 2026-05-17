import { Button, Upload, message } from "antd";
import { Download, UploadCloud } from "lucide-react";
import type { RcFile } from "antd/es/upload";
import { SystemActionGrid } from "./SystemActionGrid";

type Props = {
  importingConfig: boolean;
  onConfigImport: (file: RcFile) => Promise<boolean> | boolean;
  onConfigExport: () => void;
};

export function SystemMigrationTab({ importingConfig, onConfigImport, onConfigExport }: Props) {
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
            action: (
              <Upload beforeUpload={onConfigImport} showUploadList={false} accept=".json,application/json">
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
    </div>
  );
}
