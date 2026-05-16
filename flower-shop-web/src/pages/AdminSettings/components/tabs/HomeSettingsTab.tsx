import { Form, Input } from "antd";
import type { FormInstance } from "antd";
import { Building2, Sparkles } from "lucide-react";
import type { SettingsForm } from "../../AdminSettings";
import { SettingsPreviewPanel } from "../SettingsPreviewPanel";
import { SettingsSection } from "../SettingsSection";

type HomeSettingsTabProps = {
  form: FormInstance<SettingsForm>;
};

export function HomeSettingsTab({ form }: HomeSettingsTabProps) {
  const brandName = Form.useWatch("brandName", form) ?? "";
  const heroEyebrow = Form.useWatch("heroEyebrow", form) ?? "";
  const heroTitle = Form.useWatch("heroTitle", form) ?? "";
  const heroDescription = Form.useWatch("heroDescription", form) ?? "";
  const adminBrandTitle = Form.useWatch("adminBrandTitle", form) ?? "";
  const adminBrandSubtitle = Form.useWatch("adminBrandSubtitle", form) ?? "";
  const adminBrandDescription = Form.useWatch("adminBrandDescription", form) ?? "";
  const homeStorySectionTitle = Form.useWatch("homeStorySectionTitle", form) ?? "";
  const homeStorySectionIntro = Form.useWatch("homeStorySectionIntro", form) ?? "";
  const homeStoryPrimaryLabel = Form.useWatch("homeStoryPrimaryLabel", form) ?? "";
  const homeStoryPrimaryTitle = Form.useWatch("homeStoryPrimaryTitle", form) ?? "";
  const homeStoryPrimaryDescription = Form.useWatch("homeStoryPrimaryDescription", form) ?? "";
  const homeStoryServiceLabel = Form.useWatch("homeStoryServiceLabel", form) ?? "";
  const homeStoryServiceDescription = Form.useWatch("homeStoryServiceDescription", form) ?? "";
  const homeStoryExperienceLabel = Form.useWatch("homeStoryExperienceLabel", form) ?? "";
  const homeStoryExperienceDescription = Form.useWatch("homeStoryExperienceDescription", form) ?? "";
  const homeFeaturedSectionEyebrow = Form.useWatch("homeFeaturedSectionEyebrow", form) ?? "";
  const homeFeaturedSectionTitle = Form.useWatch("homeFeaturedSectionTitle", form) ?? "";
  const homeFeaturedSectionIntro = Form.useWatch("homeFeaturedSectionIntro", form) ?? "";
  const homeFeaturedSectionLinkText = Form.useWatch("homeFeaturedSectionLinkText", form) ?? "";
  const homeServiceSectionEyebrow = Form.useWatch("homeServiceSectionEyebrow", form) ?? "";
  const homeServiceSectionTitle = Form.useWatch("homeServiceSectionTitle", form) ?? "";
  const homeServiceSectionIntro = Form.useWatch("homeServiceSectionIntro", form) ?? "";
  const homeServiceSectionLinkText = Form.useWatch("homeServiceSectionLinkText", form) ?? "";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SettingsSection
        title="首页与品牌文案"
        icon={<Sparkles size={16} className="text-forest" />}
        description="集中维护首屏、品牌识别和首页主要内容区的文本。图片资源与轮播素材移到“媒体资源”单独管理。"
      >
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="brandName" label="品牌名称" rules={[{ required: true, message: "请输入品牌名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="adminBrandTitle" label="后台品牌标题">
            <Input />
          </Form.Item>
          <Form.Item name="adminBrandSubtitle" label="后台品牌副标题">
            <Input />
          </Form.Item>
          <Form.Item name="heroEyebrow" label="首屏小标语">
            <Input />
          </Form.Item>
          <Form.Item name="heroTitle" label="首页主标题" rules={[{ required: true, message: "请输入首页主标题" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="primaryCtaText" label="主按钮文字">
            <Input />
          </Form.Item>
          <Form.Item name="secondaryCtaText" label="副按钮文字">
            <Input />
          </Form.Item>
          <Form.Item name="consultButtonText" label="咨询按钮文字">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryDetailLinkText" label="首页品牌故事按钮">
            <Input />
          </Form.Item>
          <Form.Item name="homeStorySectionTitle" label="首页品牌故事标题">
            <Input />
          </Form.Item>
          <Form.Item name="homeFeaturedSectionEyebrow" label="首页精选区眉题">
            <Input />
          </Form.Item>
          <Form.Item name="homeFeaturedSectionTitle" label="首页精选区标题">
            <Input />
          </Form.Item>
          <Form.Item name="homeFeaturedSectionLinkText" label="首页精选区按钮">
            <Input />
          </Form.Item>
          <Form.Item name="homeServiceSectionEyebrow" label="首页服务区眉题">
            <Input />
          </Form.Item>
          <Form.Item name="homeServiceSectionTitle" label="首页服务区标题">
            <Input />
          </Form.Item>
          <Form.Item name="homeServiceSectionLinkText" label="首页服务区按钮">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryPrimaryLabel" label="首页品牌卡片标签">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryPrimaryTitle" label="首页品牌卡片标题">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryServiceLabel" label="首页服务方式标签">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryExperienceLabel" label="首页到店体验标签">
            <Input />
          </Form.Item>
          <Form.Item name="homeStoryStoreLabel" label="首页门店信息标签">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="adminBrandDescription" label="后台品牌简介">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="heroDescription" label="首页简介">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="homeStorySectionIntro" label="首页品牌故事导语">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item name="homeFeaturedSectionIntro" label="首页精选区导语">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="homeServiceSectionIntro" label="首页服务区导语">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>
        <Form.Item name="homeStoryPrimaryDescription" label="首页品牌卡片说明">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item name="homeStoryServiceDescription" label="首页服务方式说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="homeStoryExperienceDescription" label="首页到店体验说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>
      </SettingsSection>

      <div className="space-y-6">
        <SettingsSection
          title="品牌提示"
          icon={<Building2 size={16} className="text-forest" />}
          description="这里仅预览文字气质。Logo、主图和轮播图在“媒体资源”统一维护。"
        >
          <p className="text-base font-semibold text-[#1b281e]">{adminBrandTitle || brandName || "花语时光"}</p>
          {adminBrandSubtitle ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#6d7e72]">{adminBrandSubtitle}</p> : null}
          <p className="mt-2 text-sm leading-6 text-muted">
            {adminBrandDescription || "品牌名、主标题和主图会直接影响管理后台首页预览和前台第一屏的识别速度。"}
          </p>
        </SettingsSection>

        <SettingsPreviewPanel title="首页首屏预览">
          <div className="admin-subpanel px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest/70">{heroEyebrow || "首页标语预览"}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{heroTitle || "首页主标题预览"}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              {heroDescription || "这里会展示首页首屏的介绍文案。"}
            </p>
          </div>
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="首页其他区块预览">
          <div className="grid gap-3">
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{homeFeaturedSectionEyebrow || "精选作品"}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{homeFeaturedSectionTitle || "精选作品"}</p>
              <p className="mt-2 text-sm text-muted">{homeFeaturedSectionIntro || "首页精选作品区导语预览"}</p>
              <p className="mt-3 text-xs font-semibold text-forest">{homeFeaturedSectionLinkText || "查看全部"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{homeServiceSectionEyebrow || "服务场景"}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{homeServiceSectionTitle || "服务场景"}</p>
              <p className="mt-2 text-sm text-muted">{homeServiceSectionIntro || "首页服务场景区导语预览"}</p>
              <p className="mt-3 text-xs font-semibold text-forest">{homeServiceSectionLinkText || "浏览全部分类"}</p>
            </div>
          </div>
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="首页品牌故事预览">
          <p className="text-lg font-semibold text-[#1b281e]">{homeStorySectionTitle || "品牌故事"}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{homeStorySectionIntro || "首页品牌故事区导语预览"}</p>
          <div className="mt-4 grid gap-3">
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{homeStoryPrimaryLabel || "品牌气质"}</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{homeStoryPrimaryTitle || "品牌卡片标题"}</p>
              <p className="mt-2 text-sm text-muted">{homeStoryPrimaryDescription || "品牌卡片说明预览"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="admin-subpanel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{homeStoryServiceLabel || "服务方式"}</p>
                <p className="mt-2 text-sm text-muted">{homeStoryServiceDescription || "服务方式说明预览"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{homeStoryExperienceLabel || "到店体验"}</p>
                <p className="mt-2 text-sm text-muted">{homeStoryExperienceDescription || "到店体验说明预览"}</p>
              </div>
            </div>
          </div>
        </SettingsPreviewPanel>
      </div>
    </section>
  );
}
