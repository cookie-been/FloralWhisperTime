import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Grid, Input, InputNumber, Switch, Tabs, Upload, message } from "antd";
import type { RcFile } from "antd/es/upload";
import { ArrowUpRight, Building2, Image as ImageIcon, KeyRound, MapPin, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AdminAbout } from "@/pages/AdminAbout/AdminAbout";
import { getBrandStory, getShopInfo, getSiteConfig, updateSiteConfig, uploadFlowerImage } from "@/services/api";
import type { AiSettings, BrandStory, ShopInfo, SiteConfig } from "@/types";

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
  aiSettings?: AiSettings;
};

const joinText = (items: string[]) => items.join("，");
const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

const sectionItems = [
  { key: "brand", label: "品牌与首页" },
  { key: "stats", label: "首页统计" },
  { key: "contact", label: "门店与联系" },
  { key: "story", label: "品牌故事" },
  { key: "ai", label: "AI生图配置" },
] as const;

export function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [uploadingHero, setUploadingHero] = useState(false);
  const activeTab = searchParams.get("tab") === "about" ? "about" : "site";

  const brandName = Form.useWatch("brandName", form) ?? "";
  const heroEyebrow = Form.useWatch("heroEyebrow", form) ?? "";
  const heroTitle = Form.useWatch("heroTitle", form) ?? "";
  const heroDescription = Form.useWatch("heroDescription", form) ?? "";
  const heroImage = Form.useWatch("heroImage", form) ?? "";
  const phone = Form.useWatch("phone", form) ?? "";
  const address = Form.useWatch("address", form) ?? "";
  const storyTitle = Form.useWatch("storyTitle", form) ?? "";
  const storyContent = Form.useWatch("storyContent", form) ?? "";
  const storyImages = Form.useWatch("storyImages", form) ?? "";
  const aiEnabled = Form.useWatch(["aiSettings", "enabled"], form) ?? false;
  const aiProvider = Form.useWatch(["aiSettings", "provider"], form) ?? "";
  const aiModel = Form.useWatch(["aiSettings", "model"], form) ?? "";
  const aiSize = Form.useWatch(["aiSettings", "size"], form) ?? "";
  const aiTextModel = Form.useWatch(["aiSettings", "textModel"], form) ?? "";

  const sectionRefs = {
    brand: useRef<HTMLDivElement | null>(null),
    stats: useRef<HTMLDivElement | null>(null),
    contact: useRef<HTMLDivElement | null>(null),
    story: useRef<HTMLDivElement | null>(null),
    ai: useRef<HTMLDivElement | null>(null),
  };

  const storyPreviewImages = useMemo(() => splitText(storyImages), [storyImages]);

  useEffect(() => {
    Promise.all([getSiteConfig(), getShopInfo(), getBrandStory()])
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
      });
      message.success("站点配置已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (key: keyof typeof sectionRefs) => {
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  if (booting) {
    return <div className="admin-panel px-6 py-16 text-center text-muted">正在载入站点配置...</div>;
  }

  const siteContent = (
    <Form form={form} layout="vertical" className="space-y-6">
      <section ref={sectionRefs.brand} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="admin-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            品牌与首页
          </div>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
            <Form.Item name="brandName" label="品牌名称" rules={[{ required: true, message: "请输入品牌名称" }]}>
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
          <div className="admin-panel p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Building2 size={16} className="text-forest" />
              品牌提示
            </div>
            <p className="mt-3 text-base font-semibold text-[#1b281e]">{brandName || "花语时光"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">品牌名、主标题和主图会直接影响管理后台首页预览和前台第一屏的识别速度。</p>
          </div>
        </div>
      </section>

      <section ref={sectionRefs.stats} className="admin-panel p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
          <ArrowUpRight size={16} className="text-forest" />
          首页统计
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">这些数字会在首页以摘要形式呈现，建议控制在 3-4 项内，内容尽量简短直观。</p>
        <Form.List name="stats">
          {(fields, { add, remove }) => (
            <div className="mt-5 space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="admin-subpanel grid gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_auto]">
                  <Form.Item {...field} name={[field.name, "value"]} label="数值" className="mb-0" rules={[{ required: true, message: "请输入数值" }]}>
                    <Input placeholder="860+" />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, "label"]} label="说明" className="mb-0" rules={[{ required: true, message: "请输入说明" }]}>
                    <Input placeholder="已服务客户" />
                  </Form.Item>
                  <div className="flex items-end">
                    <Button danger onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => add({ value: "", label: "" })}>新增统计项</Button>
            </div>
          )}
        </Form.List>
      </section>

      <section ref={sectionRefs.contact} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="admin-panel p-5">
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
          <Form.Item name="footerDescription" label="页脚简介">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>

        <div className="admin-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">信息预览</p>
          <p className="mt-3 text-base font-semibold text-[#1b281e]">门店信息预览</p>
          <div className="admin-subpanel mt-4 px-4 py-4">
            <p className="text-sm font-semibold text-[#1b281e]">{brandName || "花语时光"}</p>
            <p className="mt-3 text-sm text-muted">{phone || "联系电话将在这里显示"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{address || "门店地址将在这里显示"}</p>
          </div>
        </div>
      </section>

      <section ref={sectionRefs.story} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel p-5">
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
        </div>

        <div className="space-y-6">
          <div className="admin-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">故事摘要</p>
            <p className="mt-3 text-xl font-semibold text-[#1b281e]">{storyTitle || "品牌故事标题预览"}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{storyContent || "故事正文预览会显示在这里，帮助你在保存前快速确认语气与长度。"} </p>
          </div>
          <div className="admin-panel p-5">
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
        </div>
      </section>

      <section ref={sectionRefs.ai} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <KeyRound size={16} className="text-forest" />
            AI生图配置
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">在这里统一维护 AI 生图和作品信息建议能力的开关、密钥、模型与接口地址。保存后后台作品管理中的 AI 工作台会立即使用最新配置。</p>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
            <Form.Item name={["aiSettings", "enabled"]} label="启用状态" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item name={["aiSettings", "provider"]} label="提供商">
              <Input placeholder="volcengine" />
            </Form.Item>
            <Form.Item name={["aiSettings", "model"]} label="模型">
              <Input placeholder="Doubao-Seedream-5.0-lite" />
            </Form.Item>
            <Form.Item name={["aiSettings", "generatePath"]} label="生成路径">
              <Input placeholder="/images/generations" />
            </Form.Item>
            <Form.Item name={["aiSettings", "size"]} label="图片尺寸">
              <Input placeholder="1920x1920" />
            </Form.Item>
            <Form.Item name={["aiSettings", "textModel"]} label="文本模型">
              <Input placeholder="doubao-1-5-pro-32k-250115" />
            </Form.Item>
            <Form.Item name={["aiSettings", "textGeneratePath"]} label="文本生成路径">
              <Input placeholder="/chat/completions" />
            </Form.Item>
            <Form.Item name={["aiSettings", "textTemperature"]} label="文本温度">
              <InputNumber className="w-full" min={0} max={2} step={0.1} />
            </Form.Item>
            <Form.Item name={["aiSettings", "textMaxTokens"]} label="文本最大输出">
              <InputNumber className="w-full" min={256} max={4096} step={64} />
            </Form.Item>
          </div>
          <Form.Item name={["aiSettings", "apiKey"]} label="API Key">
            <Input.Password placeholder="输入新的服务密钥后保存" visibilityToggle />
          </Form.Item>
          <Form.Item name={["aiSettings", "baseUrl"]} label="服务地址">
            <Input placeholder="https://operator.las.cn-beijing.volces.com/api/v1" />
          </Form.Item>
        </div>

        <div className="space-y-6">
          <div className="admin-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">配置摘要</p>
            <p className="mt-3 text-base font-semibold text-[#1b281e]">{aiEnabled ? "AI 生图已启用" : "AI 生图未启用"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">当前提供商：{aiProvider || "未配置"}；生图模型：{aiModel || "未配置"}；文本模型：{aiTextModel || "未配置"}；当前尺寸：{aiSize || "未配置"}。</p>
          </div>
          <div className="admin-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">维护建议</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>建议按环境使用独立密钥，避免把调试密钥长期用于正式内容生产。</p>
              <p>模型、接口地址和尺寸都支持后台动态调整，方便后续切换新版本或适配不同模型限制。</p>
            </div>
          </div>
        </div>
      </section>
    </Form>
  );

  return (
    <div className="space-y-6">
      <section className={`admin-toolbar p-5 ${activeTab === "site" ? "admin-sticky-toolbar" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">统一配置台</p>
            <h3 className="admin-section-title mt-2 text-xl">内容配置工作区</h3>
            <p className="mt-2 text-sm leading-6 text-muted">将站点配置和关于我们配置统一放在一个菜单里维护，减少切换路径，所有动态内容在同一处完成管理。</p>
          </div>
          {activeTab === "site" ? (
            <Button type="primary" size="large" loading={loading} onClick={save} block={!screens.sm}>
              保存站点配置
            </Button>
          ) : null}
        </div>

        {activeTab === "site" ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {sectionItems.map((item) => (
              <Button key={item.key} onClick={() => scrollToSection(item.key)}>
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      <Tabs
        activeKey={activeTab}
        onChange={(nextTab) => setSearchParams(nextTab === "about" ? { tab: "about" } : {}, { replace: true })}
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
            children: <AdminAbout embedded />,
          },
        ]}
      />
    </div>
  );
}
