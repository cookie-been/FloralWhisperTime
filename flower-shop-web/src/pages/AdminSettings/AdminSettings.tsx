import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Grid, Input, InputNumber, Spin, Tabs, Upload, message } from "antd";
import type { RcFile } from "antd/es/upload";
import { Building2, Image as ImageIcon, MapPin, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getAdminSiteConfig, getBrandStory, getShopInfo, updateSiteConfig, uploadFlowerImage } from "@/services/api";
import type { BrandStory, ShopInfo, SiteConfig } from "@/types";
import dayjs from "dayjs";

const AdminAboutLazy = lazy(() =>
  import("@/pages/AdminAbout/AdminAbout").then((module) => ({ default: module.AdminAbout })),
);

type SettingsForm = SiteConfig & {
  phone: string;
  wechat: string;
  address: string;
  latitude: number;
  longitude: number;
  storyTitle: string;
  storySubtitle: string;
  storyContent: string;
  storyImages: string;
  heroSlidesText: string;
  adminLoginSlidesText: string;
  contactImagesText: string;
};

const joinText = (items: string[]) => items.join("，");
const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

const siteSectionItems = [
  { key: "brand", label: "品牌与首页" },
  { key: "contact", label: "门店与联系" },
  { key: "story", label: "品牌故事" },
] as const;

export function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [uploadingHero, setUploadingHero] = useState(false);
  const activeTab = searchParams.get("tab") === "about" ? "about" : "site";
  const activeSiteSection = useMemo<string>(() => {
    const section = searchParams.get("section");
    return section && siteSectionItems.some((item) => item.key === section) ? section : "brand";
  }, [searchParams]);

  const brandName = Form.useWatch("brandName", form) ?? "";
  const heroEyebrow = Form.useWatch("heroEyebrow", form) ?? "";
  const heroTitle = Form.useWatch("heroTitle", form) ?? "";
  const heroDescription = Form.useWatch("heroDescription", form) ?? "";
  const heroImage = Form.useWatch("heroImage", form) ?? "";
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
  const homeStoryStoreLabel = Form.useWatch("homeStoryStoreLabel", form) ?? "";
  const homeStoryDetailLinkText = Form.useWatch("homeStoryDetailLinkText", form) ?? "";
  const homeFeaturedSectionEyebrow = Form.useWatch("homeFeaturedSectionEyebrow", form) ?? "";
  const homeFeaturedSectionTitle = Form.useWatch("homeFeaturedSectionTitle", form) ?? "";
  const homeFeaturedSectionIntro = Form.useWatch("homeFeaturedSectionIntro", form) ?? "";
  const homeFeaturedSectionLinkText = Form.useWatch("homeFeaturedSectionLinkText", form) ?? "";
  const homeServiceSectionEyebrow = Form.useWatch("homeServiceSectionEyebrow", form) ?? "";
  const homeServiceSectionTitle = Form.useWatch("homeServiceSectionTitle", form) ?? "";
  const homeServiceSectionIntro = Form.useWatch("homeServiceSectionIntro", form) ?? "";
  const homeServiceSectionLinkText = Form.useWatch("homeServiceSectionLinkText", form) ?? "";
  const aboutStorySectionEyebrow = Form.useWatch("aboutStorySectionEyebrow", form) ?? "";
  const aboutTimelineSectionEyebrow = Form.useWatch("aboutTimelineSectionEyebrow", form) ?? "";
  const aboutTimelineSectionTitle = Form.useWatch("aboutTimelineSectionTitle", form) ?? "";
  const aboutTeamSectionEyebrow = Form.useWatch("aboutTeamSectionEyebrow", form) ?? "";
  const aboutTeamSectionTitle = Form.useWatch("aboutTeamSectionTitle", form) ?? "";
  const aboutTeamSectionIntro = Form.useWatch("aboutTeamSectionIntro", form) ?? "";
  const galleryPageEyebrow = Form.useWatch("galleryPageEyebrow", form) ?? "";
  const galleryPageTitle = Form.useWatch("galleryPageTitle", form) ?? "";
  const galleryPageIntro = Form.useWatch("galleryPageIntro", form) ?? "";
  const gallerySearchPlaceholder = Form.useWatch("gallerySearchPlaceholder", form) ?? "";
  const galleryEmptyText = Form.useWatch("galleryEmptyText", form) ?? "";
  const galleryLoadErrorText = Form.useWatch("galleryLoadErrorText", form) ?? "";
  const contactPageTitle = Form.useWatch("contactPageTitle", form) ?? "";
  const contactPageSubmitText = Form.useWatch("contactPageSubmitText", form) ?? "";
  const contactSubmitSuccessText = Form.useWatch("contactSubmitSuccessText", form) ?? "";
  const consultButtonText = Form.useWatch("consultButtonText", form) ?? "";
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
  const phone = Form.useWatch("phone", form) ?? "";
  const address = Form.useWatch("address", form) ?? "";
  const storyTitle = Form.useWatch("storyTitle", form) ?? "";
  const storyContent = Form.useWatch("storyContent", form) ?? "";
  const storyImages = Form.useWatch("storyImages", form) ?? "";
  const brandLogo = Form.useWatch("brandLogo", form) ?? "";
  const heroSlidesText = Form.useWatch("heroSlidesText", form) ?? "";
  const adminLoginSlidesText = Form.useWatch("adminLoginSlidesText", form) ?? "";
  const contactImagesText = Form.useWatch("contactImagesText", form) ?? "";
  const storyPreviewImages = useMemo(() => splitText(storyImages), [storyImages]);
  const heroPreviewSlides = useMemo(() => splitText(heroSlidesText), [heroSlidesText]);
  const adminLoginPreviewSlides = useMemo(() => splitText(adminLoginSlidesText), [adminLoginSlidesText]);
  const contactPreviewImages = useMemo(() => splitText(contactImagesText), [contactImagesText]);

  useEffect(() => {
    Promise.all([getAdminSiteConfig(), getShopInfo(), getBrandStory()])
      .then(([siteConfig, shopInfo, story]) => {
        form.setFieldsValue({
          ...siteConfig,
          phone: shopInfo.phone,
          wechat: shopInfo.wechat ?? "",
          address: shopInfo.address,
          latitude: shopInfo.latitude,
          longitude: shopInfo.longitude,
          storyTitle: story.title,
          storySubtitle: story.subtitle ?? "",
          storyContent: story.content,
          storyImages: joinText(story.images),
          heroSlidesText: joinText(siteConfig.heroSlides ?? []),
          adminLoginSlidesText: joinText(siteConfig.adminLoginSlides ?? []),
          contactImagesText: joinText(siteConfig.contactImages ?? []),
        });
      })
      .catch((error) => message.error(error.message))
      .finally(() => setBooting(false));
  }, [form]);

  const save = async () => {
    if (loading) return;
    const values = await form.validateFields();
    setLoading(true);
    try {
      await updateSiteConfig({
        ...values,
        storyImages: splitText(values.storyImages),
        heroSlides: splitText(values.heroSlidesText),
        adminLoginSlides: splitText(values.adminLoginSlidesText),
        contactImages: splitText(values.contactImagesText),
      });
      message.success("站点配置已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleHeroUpload = async (file: RcFile) => {
    if (uploadingHero) return false;
    setUploadingHero(true);
    try {
      const result = await uploadFlowerImage(file);
      form.setFieldValue("heroImage", result.url);
      message.success("首屏背景图已上传");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploadingHero(false);
    }
    return false;
  };

  const uploadImageToField = async (file: RcFile, field: keyof SettingsForm, successMessage: string) => {
    const result = await uploadFlowerImage(file);
    form.setFieldValue(field, result.url);
    message.success(successMessage);
    return false;
  };

  if (booting) {
    return <div className="admin-panel px-6 py-16 text-center text-muted">正在载入站点配置...</div>;
  }

  const brandSection = (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="admin-panel admin-shell-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            品牌与首页
          </div>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
            <Form.Item name="brandName" label="品牌名称" rules={[{ required: true, message: "请输入品牌名称" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="adminBrandTitle" label="后台品牌标题">
              <Input />
            </Form.Item>
            <Form.Item label="网站 Logo">
              <div className="space-y-3">
                <Form.Item name="brandLogo" noStyle>
                  <Input placeholder="可直接粘贴 Logo 图片 URL，或使用上传按钮" />
                </Form.Item>
                <Upload
                  beforeUpload={(file) => uploadImageToField(file, "brandLogo", "Logo 已上传")}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button>上传 Logo</Button>
                </Upload>
              </div>
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
            <Form.Item label="首屏背景图">
              <div className="space-y-3">
                <Form.Item name="heroImage" noStyle>
                  <Input placeholder="可直接粘贴图片 URL，或使用下方上传按钮" />
                </Form.Item>
                <Upload beforeUpload={handleHeroUpload} showUploadList={false} accept="image/*">
                  <Button loading={uploadingHero}>上传图片并回填</Button>
                </Upload>
              </div>
            </Form.Item>
          </div>
          <Form.Item name="adminBrandDescription" label="后台品牌简介">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="heroDescription" label="首页简介">
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="grid gap-x-4 md:grid-cols-2">
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
          </div>
          <Form.Item name="heroSlidesText" label="首页轮播图 URL">
            <Input.TextArea rows={4} placeholder="多个 URL 用逗号或换行分隔" />
          </Form.Item>
          <Form.Item name="adminLoginSlidesText" label="后台登录轮播图 URL">
            <Input.TextArea rows={4} placeholder="多个 URL 用逗号或换行分隔" />
          </Form.Item>
          <div className="grid gap-x-4 md:grid-cols-2">
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
        </div>

        <div className="space-y-6">
          <div className="admin-panel overflow-hidden p-0">
            <div className="relative min-h-[240px] bg-[#f1ece5]">
              {heroImage ? <img src={heroImage} alt="" className="h-60 w-full object-cover" /> : <div className="flex h-60 items-center justify-center text-muted">暂无首页主图</div>}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,17,0.06),rgba(15,23,17,0.68))]" />
              <div className="absolute inset-x-0 bottom-0 px-5 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">{heroEyebrow || "首页标语预览"}</p>
                <p className="mt-2 text-2xl font-semibold">{heroTitle || "首页主标题预览"}</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/80">{heroDescription || "这里会展示首页首屏的介绍文案。"} </p>
              </div>
            </div>
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Building2 size={16} className="text-forest" />
              品牌提示
            </div>
            {brandLogo ? (
              <div className="mt-4 flex items-center gap-3">
                <img src={brandLogo} alt="Logo 预览" className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                <span className="text-sm text-muted">当前网站 Logo</span>
              </div>
            ) : null}
            <p className="mt-3 text-base font-semibold text-[#1b281e]">{adminBrandTitle || brandName || "花语时光"}</p>
            {adminBrandSubtitle ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#6d7e72]">{adminBrandSubtitle}</p> : null}
            <p className="mt-2 text-sm leading-6 text-muted">{adminBrandDescription || "品牌名、主标题和主图会直接影响管理后台首页预览和前台第一屏的识别速度。"}</p>
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">轮播图预览</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {heroPreviewSlides.slice(0, 4).map((url) => (
                <div key={`hero-slide-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
              {adminLoginPreviewSlides.slice(0, 4).map((url) => (
                <div key={`admin-slide-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
            {!heroPreviewSlides.length && !adminLoginPreviewSlides.length ? (
              <div className="admin-subpanel mt-4 px-4 py-8 text-sm text-muted">暂无首页/登录轮播图预览</div>
            ) : null}
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">首页其他区块预览</p>
            <div className="mt-4 grid gap-3">
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
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">首页品牌故事预览</p>
            <p className="mt-3 text-lg font-semibold text-[#1b281e]">{homeStorySectionTitle || "品牌故事"}</p>
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
          </div>
        </div>
      </section>
  );

  const contactSection = (
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="admin-panel admin-shell-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <MapPin size={16} className="text-forest" />
            门店与联系
          </div>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
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
          <Form.Item name="contactImagesText" label="联系页展示图 URL">
            <Input.TextArea rows={4} placeholder="多个 URL 用逗号或换行分隔" />
          </Form.Item>
          <Form.Item name="footerDescription" label="页脚简介">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>

          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">信息预览</p>
            <p className="mt-3 text-base font-semibold text-[#1b281e]">{contactPageTitle || "联系我们"}</p>
            <div className="admin-subpanel mt-4 px-4 py-4">
            <p className="text-sm font-semibold text-[#1b281e]">{brandName || "花语时光"}</p>
            <p className="mt-3 text-sm text-muted">{phone || "联系电话将在这里显示"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{address || "门店地址将在这里显示"}</p>
            <p className="mt-3 inline-flex rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-semibold text-forest">{contactPageSubmitText || "提交留言"}</p>
            <p className="mt-2 text-sm text-muted">{contactSubmitSuccessText || "留言已提交，我们会尽快联系你"}</p>
          </div>
          <div className="admin-subpanel mt-4 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{galleryPageEyebrow || "作品浏览"}</p>
            <p className="mt-2 text-base font-semibold text-[#1b281e]">{galleryPageTitle || "作品画廊"}</p>
            <p className="mt-2 text-sm text-muted">{galleryPageIntro || "画廊页简介预览"}</p>
            <p className="mt-3 text-sm text-muted">搜索框：{gallerySearchPlaceholder || "搜索花束、花材或标签"}</p>
            <p className="mt-1 text-sm text-muted">空状态：{galleryEmptyText || "没有找到匹配的花束作品"}</p>
            <p className="mt-1 text-sm text-muted">失败提示：{galleryLoadErrorText || "作品列表加载失败，请稍后刷新重试"}</p>
          </div>
          {contactPreviewImages.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {contactPreviewImages.slice(0, 4).map((url) => (
                <div key={`contact-preview-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
  );

  const storySection = (
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel admin-shell-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <ImageIcon size={16} className="text-forest" />
            品牌故事
          </div>
          <Form.Item name="storyTitle" label="故事标题" className="mt-4">
            <Input />
          </Form.Item>
          <Form.Item name="storySubtitle" label="故事副标题">
            <Input />
          </Form.Item>
          <Form.Item name="storyContent" label="故事正文">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="storyImages" label="故事图片 URL">
            <Input.TextArea rows={4} placeholder="多个 URL 用逗号或换行分隔" />
          </Form.Item>
          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item name="aboutStorySectionEyebrow" label="关于页故事眉题">
              <Input />
            </Form.Item>
            <Form.Item name="aboutTimelineSectionEyebrow" label="关于页时间轴眉题">
              <Input />
            </Form.Item>
            <Form.Item name="aboutTimelineSectionTitle" label="关于页时间轴标题">
              <Input />
            </Form.Item>
            <Form.Item name="aboutTeamSectionEyebrow" label="关于页团队眉题">
              <Input />
            </Form.Item>
            <Form.Item name="aboutTeamSectionTitle" label="关于页团队标题">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="aboutTeamSectionIntro" label="关于页团队简介">
            <Input.TextArea rows={3} />
          </Form.Item>
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
        </div>

        <div className="space-y-6">
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">故事摘要</p>
            <p className="mt-1 text-sm text-[#58725f]">{aboutStorySectionEyebrow || "品牌故事"}</p>
            <p className="mt-3 text-xl font-semibold text-[#1b281e]">{storyTitle || "品牌故事标题预览"}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{storyContent || "故事正文预览会显示在这里，帮助你在保存前快速确认语气与长度。"} </p>
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">故事图片</p>
            {storyPreviewImages.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {storyPreviewImages.slice(0, 4).map((url) => (
                  <div key={url} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                    <img src={url} alt="" className="h-28 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-subpanel mt-4 px-4 py-8 text-sm text-muted">暂无故事图片预览</div>
            )}
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">关于页区块文案预览</p>
            <div className="mt-4 grid gap-3">
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
          </div>
          <div className="admin-panel admin-shell-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">后台页头文案预览</p>
            <div className="mt-4 grid gap-3">
              {[
                [adminDashboardEyebrow || "后台概览", adminDashboardTitle || "运营总览", adminDashboardDescription || "先看网站状态，再进入作品与内容编辑。"],
                [adminFlowersEyebrow || "作品目录", adminFlowersTitle || "作品管理", adminFlowersDescription || "筛选、整理与更新作品内容，保持前台展示一致。"],
                [adminSettingsEyebrow || "动态配置", adminSettingsTitle || "站点配置", adminSettingsDescription || "统一维护站点首页、门店信息、品牌故事与关于我们内容。"],
                [adminAiEyebrow || "AI 工作台", adminAiTitle || "AI 生图配置", adminAiDescription || "统一维护 AI 生图与作品信息建议能力所需的开关、密钥、模型和接口参数。"],
                [adminContactsEyebrow || "访客留言", adminContactsTitle || "用户留言", adminContactsDescription || "查看访客提交的预约、咨询与定制需求。"],
                [adminSystemEyebrow || "运维状态", adminSystemTitle || "运维中心", adminSystemDescription || "统一查看系统状态，并执行备份、巡检和配置迁移。"],
                [adminOperationLogsEyebrow || "审计恢复", adminOperationLogsTitle || "操作日志", adminOperationLogsDescription || "记录后台写操作和登录行为，并支持按历史快照恢复误操作数据。"],
              ].map(([eyebrow, title, description]) => (
                <div key={`${String(eyebrow)}-${String(title)}`} className="admin-subpanel px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{eyebrow}</p>
                  <p className="mt-2 text-base font-semibold text-[#1b281e]">{title}</p>
                  <p className="mt-2 text-sm text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
  );

  const siteContent = (
    <Form form={form} layout="vertical">
      <Tabs
        activeKey={activeSiteSection}
        onChange={(nextSection) => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("section", String(nextSection));
          nextParams.delete("tab");
          setSearchParams(nextParams, { replace: true });
        }}
        tabBarGutter={screens.sm ? 24 : 12}
        className="admin-panel admin-shell-card p-4 sm:p-5"
        items={[
          {
            key: "brand",
            label: "品牌与首页",
            children: <div className="pt-2">{brandSection}</div>,
          },
          {
            key: "contact",
            label: "门店与联系",
            children: <div className="pt-2">{contactSection}</div>,
          },
          {
            key: "story",
            label: "品牌故事",
            children: <div className="pt-2">{storySection}</div>,
          },
        ]}
      />
    </Form>
  );

  return (
    <div className="space-y-6">
      <section className={`admin-toolbar p-5 ${activeTab === "site" ? "admin-sticky-toolbar" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">统一配置台</p>
            <h3 className="admin-section-title mt-2 text-xl">站点配置工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">将站点配置和关于我们配置统一放在一个菜单里维护，减少切换路径，所有动态内容在同一处完成管理。首页统计不在这里维护，前台会直接读取系统真实数据。</p>
          </div>
          {activeTab === "site" ? (
            <Button type="primary" size="large" loading={loading} onClick={save} block={!screens.sm}>
              保存站点配置
            </Button>
          ) : null}
        </div>

        {activeTab === "site" ? (
          <p className="mt-4 text-sm text-muted">已按模块拆分为切换式展示，可分别维护品牌首页、门店联系和品牌故事等内容。</p>
        ) : null}
      </section>

      <Tabs
        activeKey={activeTab}
        onChange={(nextTab) => {
          const nextParams = new URLSearchParams(searchParams);
          if (nextTab === "about") {
            nextParams.set("tab", "about");
          } else {
            nextParams.delete("tab");
            if (!nextParams.get("section")) {
              nextParams.set("section", activeSiteSection);
            }
          }
          setSearchParams(nextParams, { replace: true });
        }}
        tabBarGutter={screens.sm ? 32 : 12}
        items={[
          {
            key: "site",
            label: "站点配置",
            children: siteContent,
          },
          {
            key: "about",
            label: "关于我们",
            children:
              activeTab === "about" ? (
                <Suspense
                  fallback={
                    <div className="flex min-h-[40vh] items-center justify-center">
                      <Spin size="large" />
                    </div>
                  }
                >
                  <AdminAboutLazy embedded />
                </Suspense>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
