import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button, Form, Grid, Spin, Tabs, message } from "antd";
import { useSearchParams } from "react-router-dom";
import { getAdminSiteConfig, getBrandStory, getShopInfo, updateSiteConfig, uploadFlowerImage } from "@/services/api";
import type { SiteConfig } from "@/types";
import { joinListText, splitListText } from "@/utils/list-text";
import { buildQueryTabSearchParams, resolveQueryTab } from "@/utils/query-tabs";
import { AdminCopySettingsTab } from "./components/tabs/AdminCopySettingsTab";
import { ContactSettingsTab } from "./components/tabs/ContactSettingsTab";
import { HomeSettingsTab } from "./components/tabs/HomeSettingsTab";
import { MediaSettingsTab } from "./components/tabs/MediaSettingsTab";
import { StorySettingsTab } from "./components/tabs/StorySettingsTab";

const AdminAboutLazy = lazy(() =>
  import("@/pages/AdminAbout/AdminAbout").then((module) => ({ default: module.AdminAbout })),
);

export type SettingsImageFieldName =
  | "brandLogo"
  | "heroImage"
  | "heroSlidesText"
  | "adminLoginSlidesText"
  | "contactImagesText"
  | "storyImages";

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

export const splitText = splitListText;

function isSettingsTabKey(value: string | null): value is SettingsTabKey {
  return Boolean(value && value in TAB_LABELS);
}

type UploadState = Partial<Record<SettingsImageFieldName, boolean>>;

export function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [embeddedAboutSaving, setEmbeddedAboutSaving] = useState(false);
  const [booting, setBooting] = useState(true);
  const [uploading, setUploading] = useState<UploadState>({});
  const [aboutSaveSignal, setAboutSaveSignal] = useState(0);
  const activeTab = useMemo(
    () =>
      resolveQueryTab(searchParams, {
        defaultValue: DEFAULT_TAB,
        isValid: isSettingsTabKey,
        legacyKeys: [
          {
            key: "section",
            mapping: LEGACY_SECTION_TO_TAB,
          },
        ],
      }),
    [searchParams],
  );

  useEffect(() => {
    const normalizedParams = buildQueryTabSearchParams(searchParams, activeTab, { removeKeys: ["section"] });
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
          storyImages: joinListText(story.images),
          heroSlidesText: joinListText(siteConfig.heroSlides ?? []),
          adminLoginSlidesText: joinListText(siteConfig.adminLoginSlides ?? []),
          contactImagesText: joinListText(siteConfig.contactImages ?? []),
        });
      })
      .catch((error) => message.error(error instanceof Error ? error.message : "站点配置加载失败"))
      .finally(() => setBooting(false));
  }, [form]);

  const save = async () => {
    if (activeTab === "about") {
      setAboutSaveSignal((current) => current + 1);
      return;
    }
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

  const appendUrlsToField = (field: keyof SettingsForm, urls: string[]) => {
    const currentValue = String(form.getFieldValue(field) ?? "").trim();
    const currentItems = splitText(currentValue);
    const nextValue = joinListText([...currentItems, ...urls]);
    form.setFieldValue(field, nextValue);
  };

  const uploadImageToField = async (
    file: File,
    field: SettingsImageFieldName,
    successMessage: string,
    mode: "replace" | "append" = "replace",
  ) => {
    if (uploading[field]) return false;
    setUploading((current) => ({ ...current, [field]: true }));
    try {
      const result = await uploadFlowerImage(file);
      if (mode === "append") {
        appendUrlsToField(field, [result.url]);
      } else {
        form.setFieldValue(field, result.url);
      }
      message.success(successMessage);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading((current) => ({ ...current, [field]: false }));
    }
    return false;
  };

  const uploadImagesToListField = async (
    files: File[],
    field: Extract<SettingsImageFieldName, "heroSlidesText" | "adminLoginSlidesText" | "contactImagesText" | "storyImages">,
    successMessage: string,
  ) => {
    if (!files.length || uploading[field]) return false;
    setUploading((current) => ({ ...current, [field]: true }));
    try {
      const results = await Promise.all(files.map((file) => uploadFlowerImage(file)));
      appendUrlsToField(field, results.map((item) => item.url));
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
      <section className="admin-toolbar p-5 admin-sticky-toolbar">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">统一配置台</p>
            <h3 className="admin-section-title mt-2 text-xl">站点配置工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              将站点配置和关于我们配置统一放在一个菜单里维护，减少切换路径，所有动态内容在同一处完成管理。首页统计不在这里维护，前台会直接读取系统真实数据。
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            loading={activeTab === "about" ? embeddedAboutSaving : loading}
            onClick={save}
            block={!screens.sm}
          >
            保存{TAB_LABELS[activeTab]}
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted">
          当前为 {TAB_LABELS[activeTab]}，所有字段仍沿用现有接口与保存链路，切换 Tab 不会中断当前表单状态。
        </p>
      </section>

      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={(nextTab) => {
            setSearchParams(buildQueryTabSearchParams(searchParams, nextTab as SettingsTabKey, { removeKeys: ["section"] }), { replace: true });
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
                    <AdminAboutLazy
                      embedded
                      externalSaveSignal={aboutSaveSignal}
                      onEmbeddedSaveStateChange={setEmbeddedAboutSaving}
                    />
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
                    onUploadImages={uploadImagesToListField}
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
