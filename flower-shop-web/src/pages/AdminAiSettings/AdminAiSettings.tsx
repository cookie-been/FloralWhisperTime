import { Button, Form, Input, InputNumber, Switch, message } from "antd";
import { KeyRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAdminAiSettings, updateAdminAiSettings } from "@/services/api";
import type { AiSettings } from "@/types";

type AiSettingsForm = AiSettings;

export function AdminAiSettings() {
  const [form] = Form.useForm<AiSettingsForm>();
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);

  const aiEnabled = Form.useWatch("enabled", form) ?? false;
  const aiProvider = Form.useWatch("provider", form) ?? "";
  const aiModel = Form.useWatch("model", form) ?? "";
  const aiSize = Form.useWatch("size", form) ?? "";
  const aiTextModel = Form.useWatch("textModel", form) ?? "";
  const aiKeyConfigured = Form.useWatch("apiKeyConfigured", form) ?? false;
  const aiKeyMasked = Form.useWatch("apiKeyMasked", form) ?? "";

  useEffect(() => {
    getAdminAiSettings()
      .then((settings) => form.setFieldsValue(settings))
      .catch((error) => message.error(error instanceof Error ? error.message : "AI 配置加载失败"))
      .finally(() => setBooting(false));
  }, [form]);

  const summaryText = useMemo(
    () => `当前提供商：${aiProvider || "未配置"}；生图模型：${aiModel || "未配置"}；文本模型：${aiTextModel || "未配置"}；当前尺寸：${aiSize || "未配置"}。`,
    [aiModel, aiProvider, aiSize, aiTextModel],
  );

  const save = async () => {
    if (saving) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const result = await updateAdminAiSettings(values);
      form.setFieldsValue({ ...result, apiKey: "" });
      message.success("AI 配置已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "AI 配置保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (booting) {
    return <div className="admin-panel px-6 py-16 text-center text-muted">正在载入 AI 配置...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="admin-toolbar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">AI 生成配置</p>
            <h3 className="admin-section-title mt-2 text-xl">AI 生图工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">这里单独维护 AI 生图与作品信息建议能力，保存后作品管理中的 AI 工作台会立即使用最新配置。</p>
          </div>
          <Button type="primary" size="large" loading={saving} onClick={save}>
            保存 AI 配置
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <KeyRound size={16} className="text-forest" />
            AI 生图配置
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">建议按环境使用独立密钥，模型与接口地址都支持后台动态切换，方便后续更换服务商或升级版本。</p>
          <Form form={form} layout="vertical" className="mt-4">
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="enabled" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item name="provider" label="提供商">
                <Input placeholder="volcengine" />
              </Form.Item>
              <Form.Item name="model" label="模型">
                <Input placeholder="doubao-seedream-5-0-260128" />
              </Form.Item>
              <Form.Item name="generatePath" label="生成路径">
                <Input placeholder="/images/generations" />
              </Form.Item>
              <Form.Item name="size" label="图片尺寸">
                <Input placeholder="1920x1920" />
              </Form.Item>
              <Form.Item name="textModel" label="文本模型">
                <Input placeholder="doubao-1-5-pro-32k-250115" />
              </Form.Item>
              <Form.Item name="textGeneratePath" label="文本生成路径">
                <Input placeholder="/chat/completions" />
              </Form.Item>
              <Form.Item name="textTemperature" label="文本温度">
                <InputNumber className="w-full" min={0} max={2} step={0.1} />
              </Form.Item>
              <Form.Item name="textMaxTokens" label="文本最大输出">
                <InputNumber className="w-full" min={256} max={4096} step={64} />
              </Form.Item>
            </div>

            <Form.Item name="apiKey" label={aiKeyConfigured ? `API Key（已配置：${aiKeyMasked || "已脱敏"}）` : "API Key"}>
              <Input.Password placeholder={aiKeyConfigured ? "留空则保持原密钥不变，输入新值将覆盖" : "输入新的服务密钥后保存"} visibilityToggle />
            </Form.Item>
            <Form.Item name="baseUrl" label="服务地址">
              <Input placeholder="https://ark.cn-beijing.volces.com/api/v3" />
            </Form.Item>
          </Form>
        </div>

        <div className="space-y-6">
          <div className="admin-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">配置摘要</p>
            <p className="mt-3 text-base font-semibold text-[#1b281e]">{aiEnabled ? "AI 生图已启用" : "AI 生图未启用"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{summaryText}</p>
          </div>
          <div className="admin-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">维护建议</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>建议正式环境和测试环境使用不同 API Key，避免调试内容混入生产资产。</p>
              <p>修改模型、接口地址、尺寸与文本模型后会立即生效，适合后续接入新模型或切换不同的生成策略。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
