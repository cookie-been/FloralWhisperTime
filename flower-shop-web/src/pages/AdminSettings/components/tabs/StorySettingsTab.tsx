import { Form, Input } from "antd";
import type { FormInstance } from "antd";
import { Image as ImageIcon } from "lucide-react";
import type { SettingsForm } from "../../AdminSettings";
import { SettingsPreviewPanel } from "../SettingsPreviewPanel";
import { SettingsSection } from "../SettingsSection";

type StorySettingsTabProps = {
  form: FormInstance<SettingsForm>;
};

const miniSharedHint = "同时影响 Web 前台与微信小程序";

export function StorySettingsTab({ form }: StorySettingsTabProps) {
  const storyTitle = Form.useWatch("storyTitle", form) ?? "";
  const storyContent = Form.useWatch("storyContent", form) ?? "";
  const aboutStorySectionEyebrow = Form.useWatch("aboutStorySectionEyebrow", form) ?? "";
  const aboutTimelineSectionEyebrow = Form.useWatch("aboutTimelineSectionEyebrow", form) ?? "";
  const aboutTimelineSectionTitle = Form.useWatch("aboutTimelineSectionTitle", form) ?? "";
  const aboutTeamSectionEyebrow = Form.useWatch("aboutTeamSectionEyebrow", form) ?? "";
  const aboutTeamSectionTitle = Form.useWatch("aboutTeamSectionTitle", form) ?? "";
  const aboutTeamSectionIntro = Form.useWatch("aboutTeamSectionIntro", form) ?? "";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SettingsSection
        title="品牌故事"
        icon={<ImageIcon size={16} className="text-forest" />}
        description="维护品牌故事正文和 About 页面里与故事相关的区块文案。故事图片已归到“媒体资源”统一维护；标注“同时影响 Web 前台与微信小程序”的字段会跨端同步。"
      >
        <Form.Item name="storyTitle" label="故事标题">
          <Input />
        </Form.Item>
        <Form.Item name="storySubtitle" label="故事副标题">
          <Input />
        </Form.Item>
        <Form.Item name="storyContent" label="故事正文">
          <Input.TextArea rows={5} />
        </Form.Item>
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="aboutStorySectionEyebrow" label={`关于页故事眉题（${miniSharedHint}）`}>
            <Input />
          </Form.Item>
          <Form.Item name="aboutTimelineSectionEyebrow" label="关于页时间轴眉题">
            <Input />
          </Form.Item>
          <Form.Item name="aboutTimelineSectionTitle" label="关于页时间轴标题">
            <Input />
          </Form.Item>
          <Form.Item name="aboutTeamSectionEyebrow" label={`关于页团队眉题（${miniSharedHint}）`}>
            <Input />
          </Form.Item>
          <Form.Item name="aboutTeamSectionTitle" label={`关于页团队标题（${miniSharedHint}）`}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="aboutTeamSectionIntro" label={`关于页团队简介（${miniSharedHint}）`}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </SettingsSection>

      <div className="space-y-6">
        <SettingsPreviewPanel title="故事摘要">
          <p className="text-sm text-[#58725f]">{aboutStorySectionEyebrow || "品牌故事"}</p>
          <p className="mt-3 text-xl font-semibold text-[#1b281e]">{storyTitle || "品牌故事标题预览"}</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            {storyContent || "故事正文预览会显示在这里，帮助你在保存前快速确认语气与长度。"}
          </p>
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="关于页区块文案预览">
          <div className="grid gap-3">
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{aboutTimelineSectionEyebrow || "发展历程"}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{aboutTimelineSectionTitle || "发展历程"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{aboutTeamSectionEyebrow || "团队成员"}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{aboutTeamSectionTitle || "花艺师团队"}</p>
              <p className="mt-2 text-sm text-muted">{aboutTeamSectionIntro || "团队区简介预览"}</p>
            </div>
          </div>
        </SettingsPreviewPanel>
      </div>
    </section>
  );
}
