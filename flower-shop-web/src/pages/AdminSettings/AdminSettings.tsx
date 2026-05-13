import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, message, Space } from "antd";
import { Link } from "react-router-dom";
import { getBrandStory, getShopInfo, getSiteConfig, updateSiteConfig } from "@/services/api";
import type { BrandStory, ShopInfo, SiteConfig } from "@/types";

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
};

const joinText = (items: string[]) => items.join("，");
const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function AdminSettings() {
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);

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
      .catch((error) => message.error(error.message));
  }, [form]);

  const save = async () => {
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

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold">站点配置</h1>
          <p className="mt-2 text-muted">管理首页简介、品牌故事、地址、电话、微信和营业时间文案。</p>
        </div>
        <Space>
          <Link to="/admin/flowers">
            <Button>作品管理</Button>
          </Link>
          <Button type="primary" size="large" loading={loading} onClick={save}>
            保存配置
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" className="rounded-lg bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold">首页首屏</h2>
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="brandName" label="品牌名称" rules={[{ required: true, message: "请输入品牌名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="heroEyebrow" label="首屏小标语">
            <Input />
          </Form.Item>
          <Form.Item name="heroTitle" label="首页主标题" rules={[{ required: true, message: "请输入首页主标题" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="heroImage" label="首屏背景图 URL">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="heroDescription" label="首页简介">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item name="primaryCtaText" label="主按钮文字">
            <Input />
          </Form.Item>
          <Form.Item name="secondaryCtaText" label="副按钮文字">
            <Input />
          </Form.Item>
        </div>

        <h2 className="mb-4 mt-8 text-xl font-semibold">首页统计</h2>
        <Form.List name="stats">
          {(fields, { add, remove }) => (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Form.Item {...field} name={[field.name, "value"]} className="mb-0" rules={[{ required: true }]}>
                    <Input placeholder="860+" />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, "label"]} className="mb-0" rules={[{ required: true }]}>
                    <Input placeholder="已服务客户" />
                  </Form.Item>
                  <Button danger onClick={() => remove(field.name)}>
                    删除
                  </Button>
                </div>
              ))}
              <Button onClick={() => add({ value: "", label: "" })}>新增统计项</Button>
            </div>
          )}
        </Form.List>

        <h2 className="mb-4 mt-8 text-xl font-semibold">门店信息</h2>
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
        <Form.Item name="footerDescription" label="页脚简介">
          <Input.TextArea rows={2} />
        </Form.Item>

        <h2 className="mb-4 mt-8 text-xl font-semibold">品牌故事</h2>
        <Form.Item name="storyTitle" label="故事标题">
          <Input />
        </Form.Item>
        <Form.Item name="storySubtitle" label="故事副标题">
          <Input />
        </Form.Item>
        <Form.Item name="storyContent" label="故事正文">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="storyImages" label="故事图片 URL">
          <Input.TextArea rows={2} placeholder="多个 URL 用逗号或换行分隔" />
        </Form.Item>
      </Form>
    </section>
  );
}
