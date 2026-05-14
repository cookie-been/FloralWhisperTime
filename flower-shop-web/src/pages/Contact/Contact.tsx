import { useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { getShopInfo, getSiteConfig, submitContact } from "@/services/api";
import type { ContactForm, ShopInfo, SiteConfig } from "@/types";

export function Contact() {
  const [form] = Form.useForm<ContactForm>();
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getShopInfo().then(setShop);
    getSiteConfig().then(setSiteConfig);
  }, []);

  const onFinish = async (values: ContactForm) => {
    setSubmitting(true);
    try {
      await submitContact(values);
      message.success("留言已提交，我们会尽快联系你");
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="section-eyebrow">Contact</p>
        <h1 className="section-title section-title-accent mt-2 text-4xl">联系我们</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          {siteConfig?.contactIntro ?? "欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg bg-[#f7fbf7] p-6">
          <h2 className="section-title text-xl">门店信息</h2>
          <div className="mt-6 space-y-5 text-muted">
            <p className="flex gap-3">
              <Phone className="shrink-0 text-forest" size={20} />
              {shop?.phone}
            </p>
            <p className="flex gap-3">
              <MessageCircle className="shrink-0 text-forest" size={20} />
              {shop?.wechat}
            </p>
            <p className="flex gap-3">
              <MapPin className="shrink-0 text-forest" size={20} />
              {shop?.address}
            </p>
            <p className="flex gap-3">
              <Clock className="shrink-0 text-forest" size={20} />
              {siteConfig?.businessHoursText ?? "周一至周五 09:30-21:00，周末 10:00-21:30"}
            </p>
          </div>
          <div className="mt-8 aspect-[4/3] overflow-hidden rounded-lg border border-forest/10 bg-mint">
            <iframe
              title={`${shop?.name ?? "花语时光"}地图`}
              className="h-full w-full"
              src={`https://maps.google.com/maps?q=${shop?.latitude ?? 31.2047},${shop?.longitude ?? 121.4442}&z=15&output=embed`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-black/5 p-6 shadow-soft">
          <h2 className="section-title text-xl">预约咨询</h2>
          <Form form={form} layout="vertical" className="mt-6" onFinish={onFinish}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
              <Input size="large" placeholder="你的称呼" />
            </Form.Item>
            <Form.Item name="phone" label="电话" rules={[{ required: true, message: "请输入联系电话" }]}>
              <Input size="large" placeholder="方便联系的电话" />
            </Form.Item>
            <Form.Item name="message" label="留言内容" rules={[{ required: true, message: "请输入留言内容" }]}>
              <Input.TextArea rows={6} placeholder="想咨询的花艺类型、预算或使用场景" />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit" loading={submitting}>
              提交留言
            </Button>
          </Form>
        </div>
      </div>
    </section>
  );
}
