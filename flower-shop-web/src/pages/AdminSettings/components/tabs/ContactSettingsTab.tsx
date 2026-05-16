import { Form, Input, InputNumber } from "antd";
import type { FormInstance } from "antd";
import { MapPin } from "lucide-react";
import type { SettingsForm } from "../../AdminSettings";
import { SettingsPreviewPanel } from "../SettingsPreviewPanel";
import { SettingsSection } from "../SettingsSection";

type ContactSettingsTabProps = {
  form: FormInstance<SettingsForm>;
};

export function ContactSettingsTab({ form }: ContactSettingsTabProps) {
  const brandName = Form.useWatch("brandName", form) ?? "";
  const phone = Form.useWatch("phone", form) ?? "";
  const address = Form.useWatch("address", form) ?? "";
  const contactPageTitle = Form.useWatch("contactPageTitle", form) ?? "";
  const contactPageSubmitText = Form.useWatch("contactPageSubmitText", form) ?? "";
  const contactSubmitSuccessText = Form.useWatch("contactSubmitSuccessText", form) ?? "";
  const galleryPageEyebrow = Form.useWatch("galleryPageEyebrow", form) ?? "";
  const galleryPageTitle = Form.useWatch("galleryPageTitle", form) ?? "";
  const galleryPageIntro = Form.useWatch("galleryPageIntro", form) ?? "";
  const gallerySearchPlaceholder = Form.useWatch("gallerySearchPlaceholder", form) ?? "";
  const galleryEmptyText = Form.useWatch("galleryEmptyText", form) ?? "";
  const galleryLoadErrorText = Form.useWatch("galleryLoadErrorText", form) ?? "";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SettingsSection
        title="门店与联系"
        icon={<MapPin size={16} className="text-forest" />}
        description="维护门店基础信息、联系页和画廊页文案。联系页展示图已归到“媒体资源”统一维护。"
      >
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="wechat" label="微信">
            <Input />
          </Form.Item>
          <Form.Item name="latitude" label="纬度">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="longitude" label="经度">
            <InputNumber className="w-full" />
          </Form.Item>
        </div>
        <Form.Item name="address" label="地址">
          <Input />
        </Form.Item>
        <Form.Item name="businessHoursText" label="营业时间展示文案">
          <Input />
        </Form.Item>
        <Form.Item name="contactIntro" label="联系我们页简介">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="contactPageTitle" label="联系页主标题">
            <Input />
          </Form.Item>
          <Form.Item name="contactPageSubmitText" label="联系页提交按钮">
            <Input />
          </Form.Item>
          <Form.Item name="contactSubmitSuccessText" label="联系页提交成功提示">
            <Input />
          </Form.Item>
          <Form.Item name="galleryPageEyebrow" label="画廊页眉题">
            <Input />
          </Form.Item>
          <Form.Item name="galleryPageTitle" label="画廊页标题">
            <Input />
          </Form.Item>
          <Form.Item name="gallerySearchPlaceholder" label="画廊搜索占位文案">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="galleryPageIntro" label="画廊页简介">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item name="galleryEmptyText" label="画廊空状态文案">
            <Input />
          </Form.Item>
          <Form.Item name="galleryLoadErrorText" label="画廊加载失败文案">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="footerDescription" label="页脚简介">
          <Input.TextArea rows={2} />
        </Form.Item>
      </SettingsSection>

      <div className="space-y-6">
        <SettingsPreviewPanel title="联系页信息预览">
          <div className="admin-subpanel px-4 py-4">
            <p className="text-sm font-semibold text-[#1b281e]">{brandName || "花语时光"}</p>
            <p className="mt-3 text-sm text-muted">{phone || "联系电话将在这里显示"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{address || "门店地址将在这里显示"}</p>
            <p className="mt-3 inline-flex rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-semibold text-forest">
              {contactPageSubmitText || "提交留言"}
            </p>
            <p className="mt-2 text-sm text-muted">{contactSubmitSuccessText || "留言已提交，我们会尽快联系你"}</p>
          </div>
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="画廊页预览">
          <div className="admin-subpanel px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{galleryPageEyebrow || "作品浏览"}</p>
            <p className="mt-2 text-base font-semibold text-[#1b281e]">{galleryPageTitle || "作品画廊"}</p>
            <p className="mt-2 text-sm text-muted">{galleryPageIntro || "画廊页简介预览"}</p>
            <p className="mt-3 text-sm text-muted">搜索框：{gallerySearchPlaceholder || "搜索花束、花材或标签"}</p>
            <p className="mt-1 text-sm text-muted">空状态：{galleryEmptyText || "没有找到匹配的花束作品"}</p>
            <p className="mt-1 text-sm text-muted">失败提示：{galleryLoadErrorText || "作品列表加载失败，请稍后刷新重试"}</p>
          </div>
        </SettingsPreviewPanel>
      </div>
    </section>
  );
}
