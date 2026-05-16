import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button, Form, Grid, Spin, Tabs, message } from "antd";
import { useSearchParams } from "react-router-dom";
import { getAdminSiteConfig, getBrandStory, getShopInfo, updateSiteConfig, uploadFlowerImage } from "@/services/api";
import type { SiteConfig } from "@/types";
import { AdminCopySettingsTab } from "./components/tabs/AdminCopySettingsTab";
import { ContactSettingsTab } from "./components/tabs/ContactSettingsTab";
import { HomeSettingsTab } from "./components/tabs/HomeSettingsTab";
import { MediaSettingsTab } from "./components/tabs/MediaSettingsTab";
import { StorySettingsTab } from "./components/tabs/StorySettingsTab";

const AdminAboutLazy = lazy(() =>
  import("@/pages/AdminAbout/AdminAbout").then((module) => ({ default: module.AdminAbout })),
);

export type SettingsImageFieldName = "brandLogo" | "heroImage";

export type SettingsTabKey = "home" | "contact" | "story" | "about" | "admin-copy" | "media";

export type SettingsForm = SiteConfig & {
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

const LEGACY_SECTION_TO_TAB: Record<string, Exclude<SettingsTabKey, "about">> = {
  brand: "home",
  contact: "contact",
  story: "story",
};

const TAB_LABELS: Record<SettingsTabKey, string> = {
  home: "首页与品牌",
  contact: "门店与联系",
  story: "品牌故事",
  about: "关于我们",
  "admin-copy": "后台文案",
  media: "媒体资源",
};

const DEFAULT_TAB: SettingsTabKey = "home";

const joinText = (items: string[]) => items.join("，");
export const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

function isSettingsTabKey(value: string | null): value is SettingsTabKey {
  return Boolean(value && value in TAB_LABELS);
}

function resolveTab(searchParams: URLSearchParams): SettingsTabKey {
  const tab = searchParams.get("tab");
  if (isSettingsTabKey(tab)) {
    return tab;
  }

  const legacySection = searchParams.get("section");
  if (legacySection && legacySection in LEGACY_SECTION_TO_TAB) {
    return LEGACY_SECTION_TO_TAB[legacySection];
  }

  return DEFAULT_TAB;
}

function buildTabSearchParams(searchParams: URLSearchParams, nextTab: SettingsTabKey) {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", nextTab);
  nextParams.delete("section");
  return nextParams;
}

type UploadState = Partial<Record<SettingsImageFieldName, boolean>>;

export function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [uploading, setUploading] = useState<UploadState>({});
  const activeTab = useMemo(() => resolveTab(searchParams), [searchParams]);

  useEffect(() => {
    const normalizedParams = buildTabSearchParams(searchParams, activeTab);
    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

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

  const uploadImageToField = async (
    file: File,
    field: SettingsImageFieldName,
    successMessage: string,
  ) => {
    if (uploading[field]) return false;
    setUploading((current) => ({ ...current, [field]: true }));
    try {
      const result = await uploadFlowerImage(file);
      form.setFieldValue(field, result.url);
      message.success(successMessage);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading((current) => ({ ...current, [field]: false }));
    }
    return false;
  };

  if (booting) {
    return <div className="admin-panel px-6 py-16 text-center text-muted">正在载入站点配置...</div>;
  }

  return (
    <div className="space-y-6">
      <section className={`admin-toolbar p-5 ${activeTab === "about" ? "" : "admin-sticky-toolbar"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">统一配置台</p>
            <h3 className="admin-section-title mt-2 text-xl">站点配置工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              将站点配置和关于我们配置统一放在一个菜单里维护，减少切换路径，所有动态内容在同一处完成管理。首页统计不在这里维护，前台会直接读取系统真实数据。
            </p>
          </div>
          {activeTab !== "about" ? (
            <Button type="primary" size="large" loading={loading} onClick={save} block={!screens.sm}>
              保存{TAB_LABELS[activeTab]}
            </Button>
          ) : null}
        </div>

        {activeTab !== "about" ? (
          <p className="mt-4 text-sm text-muted">
            当前为 {TAB_LABELS[activeTab]}，所有字段仍沿用现有接口与保存链路，切换 Tab 不会中断当前表单状态。
          </p>
        ) : null}
      </section>

      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={(nextTab) => {
            setSearchParams(buildTabSearchParams(searchParams, nextTab as SettingsTabKey), { replace: true });
          }}
          tabBarGutter={screens.sm ? 24 : 12}
          items={[
            {
              key: "home",
              label: "首页与品牌",
              children: (
                <div className="pt-2">
                  <HomeSettingsTab form={form} />
                </div>
              ),
            },
            {
              key: "contact",
              label: "门店与联系",
              children: (
                <div className="pt-2">
                  <ContactSettingsTab form={form} />
                </div>
              ),
            },
            {
              key: "story",
              label: "品牌故事",
              children: (
                <div className="pt-2">
                  <StorySettingsTab form={form} />
                </div>
              ),
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
            {
              key: "admin-copy",
              label: "后台文案",
              children: (
                <div className="pt-2">
                  <AdminCopySettingsTab form={form} />
                </div>
              ),
            },
            {
              key: "media",
              label: "媒体资源",
              children: (
                <div className="pt-2">
                  <MediaSettingsTab
                    form={form}
                    uploading={uploading}
                    onUploadImage={uploadImageToField}
                  />
                </div>
              ),
            },
          ]}
        />
      </Form>
    </div>
  );
}
