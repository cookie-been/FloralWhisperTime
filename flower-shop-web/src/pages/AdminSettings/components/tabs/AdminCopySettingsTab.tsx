import { Form, Input } from "antd";
import type { FormInstance } from "antd";
import { LayoutTemplate } from "lucide-react";
import type { SettingsForm } from "../../AdminSettings";
import { SettingsPreviewPanel } from "../SettingsPreviewPanel";
import { SettingsSection } from "../SettingsSection";

type AdminCopySettingsTabProps = {
  form: FormInstance<SettingsForm>;
};

export function AdminCopySettingsTab({ form }: AdminCopySettingsTabProps) {
  const adminDashboardEyebrow = Form.useWatch("adminDashboardEyebrow", form) ?? "";
  const adminDashboardTitle = Form.useWatch("adminDashboardTitle", form) ?? "";
  const adminDashboardDescription = Form.useWatch("adminDashboardDescription", form) ?? "";
  const adminFlowersEyebrow = Form.useWatch("adminFlowersEyebrow", form) ?? "";
  const adminFlowersTitle = Form.useWatch("adminFlowersTitle", form) ?? "";
  const adminFlowersDescription = Form.useWatch("adminFlowersDescription", form) ?? "";
  const adminSettingsEyebrow = Form.useWatch("adminSettingsEyebrow", form) ?? "";
  const adminSettingsTitle = Form.useWatch("adminSettingsTitle", form) ?? "";
  const adminSettingsDescription = Form.useWatch("adminSettingsDescription", form) ?? "";
  const adminAiEyebrow = Form.useWatch("adminAiEyebrow", form) ?? "";
  const adminAiTitle = Form.useWatch("adminAiTitle", form) ?? "";
  const adminAiDescription = Form.useWatch("adminAiDescription", form) ?? "";
  const adminContactsEyebrow = Form.useWatch("adminContactsEyebrow", form) ?? "";
  const adminContactsTitle = Form.useWatch("adminContactsTitle", form) ?? "";
  const adminContactsDescription = Form.useWatch("adminContactsDescription", form) ?? "";
  const adminSystemEyebrow = Form.useWatch("adminSystemEyebrow", form) ?? "";
  const adminSystemTitle = Form.useWatch("adminSystemTitle", form) ?? "";
  const adminSystemDescription = Form.useWatch("adminSystemDescription", form) ?? "";
  const adminOperationLogsEyebrow = Form.useWatch("adminOperationLogsEyebrow", form) ?? "";
  const adminOperationLogsTitle = Form.useWatch("adminOperationLogsTitle", form) ?? "";
  const adminOperationLogsDescription = Form.useWatch("adminOperationLogsDescription", form) ?? "";

  const previewCards = [
    [adminDashboardEyebrow || "后台概览", adminDashboardTitle || "运营总览", adminDashboardDescription || "先看网站状态，再进入作品与内容编辑。"],
    [adminFlowersEyebrow || "作品目录", adminFlowersTitle || "作品管理", adminFlowersDescription || "筛选、整理与更新作品内容，保持前台展示一致。"],
    [adminSettingsEyebrow || "动态配置", adminSettingsTitle || "站点配置", adminSettingsDescription || "统一维护站点首页、门店信息、品牌故事与关于我们内容。"],
    [adminAiEyebrow || "AI 工作台", adminAiTitle || "AI 生图配置", adminAiDescription || "统一维护 AI 生图与作品信息建议能力所需的开关、密钥、模型和接口参数。"],
    [adminContactsEyebrow || "访客留言", adminContactsTitle || "用户留言", adminContactsDescription || "查看访客提交的预约、咨询与定制需求。"],
    [adminSystemEyebrow || "运维状态", adminSystemTitle || "运维中心", adminSystemDescription || "统一查看系统状态，并执行备份、巡检和配置迁移。"],
    [adminOperationLogsEyebrow || "审计恢复", adminOperationLogsTitle || "操作日志", adminOperationLogsDescription || "记录后台写操作和登录行为，并支持按历史快照恢复误操作数据。"],
  ] as const;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SettingsSection
        title="后台页面文案"
        icon={<LayoutTemplate size={16} className="text-forest" />}
        description="单独维护后台各模块的页头眉题、标题和说明，避免和品牌故事、前台页面文案混在一起。"
      >
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="adminDashboardEyebrow" label="后台总览眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminDashboardTitle" label="后台总览标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminFlowersEyebrow" label="后台作品页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminFlowersTitle" label="后台作品页标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminSettingsEyebrow" label="后台站点配置眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminSettingsTitle" label="后台站点配置标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminAiEyebrow" label="后台 AI 页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminAiTitle" label="后台 AI 页标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminContactsEyebrow" label="后台留言页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminContactsTitle" label="后台留言页标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminSystemEyebrow" label="后台运维页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminSystemTitle" label="后台运维页标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminOperationLogsEyebrow" label="后台日志页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="adminOperationLogsTitle" label="后台日志页标题">
            <Input />
          </Form.Item>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item name="adminDashboardDescription" label="后台总览说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminFlowersDescription" label="后台作品页说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminSettingsDescription" label="后台站点配置说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminAiDescription" label="后台 AI 页说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminContactsDescription" label="后台留言页说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminSystemDescription" label="后台运维页说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="adminOperationLogsDescription" label="后台日志页说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>
      </SettingsSection>

      <SettingsPreviewPanel title="后台页头文案预览">
        <div className="grid gap-3">
          {previewCards.map(([eyebrow, title, description]) => (
            <div key={`${String(eyebrow)}-${String(title)}`} className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{eyebrow}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{title}</p>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </SettingsPreviewPanel>
    </section>
  );
}
