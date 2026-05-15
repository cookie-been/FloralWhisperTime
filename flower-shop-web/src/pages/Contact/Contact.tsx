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
  const phone = shop?.phone ?? "待补充";
  const wechat = shop?.wechat ?? "待补充";
  const address = shop?.address ?? "地址信息待完善";

  useEffect(() => {
    Promise.allSettled([getShopInfo(), getSiteConfig()]).then(([shopResult, siteConfigResult]) => {
      if (shopResult.status === "fulfilled") setShop(shopResult.value);
      if (siteConfigResult.status === "fulfilled") setSiteConfig(siteConfigResult.value);
    });
  }, []);

  const onFinish = async (values: ContactForm) => {
    setSubmitting(true);
    try {
      await submitContact(values);
      message.success(siteConfig?.contactSubmitSuccessText || "留言已提交，我们会尽快联系你");
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="site-shell-section site-shell-block">
      <div className="mb-8 sm:mb-10">
        <p className="section-eyebrow">联系咨询</p>
        <h1 className="section-title section-title-accent mt-2 text-3xl sm:text-4xl">{siteConfig?.contactPageTitle || "联系我们"}</h1>
        <p className="site-shell-copy mt-3 max-w-2xl">
          {siteConfig?.contactIntro ?? "欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface-card site-shell-card sm:p-6">
          <h2 className="section-title text-xl">门店信息</h2>
          <div className="mt-6 space-y-5 text-muted">
            <p className="flex items-start gap-3 leading-7">
              <Phone className="mt-1 shrink-0 text-forest" size={20} />
              <span className="break-all">{phone}</span>
            </p>
            <p className="flex items-start gap-3 leading-7">
              <MessageCircle className="mt-1 shrink-0 text-forest" size={20} />
              <span className="break-all">{wechat}</span>
            </p>
            <p className="flex items-start gap-3 leading-7">
              <MapPin className="mt-1 shrink-0 text-forest" size={20} />
              <span>{address}</span>
            </p>
            <p className="flex items-start gap-3 leading-7">
              <Clock className="mt-1 shrink-0 text-forest" size={20} />
              <span>{siteConfig?.businessHoursText ?? "周一至周五 09:30-21:00，周末 10:00-21:30"}</span>
            </p>
          </div>
          <div className="mt-7 aspect-[4/3.2] overflow-hidden rounded-lg border border-forest/10 bg-mint sm:mt-8 sm:aspect-[4/3]">
            <iframe
              title={`${shop?.name ?? "花语时光"}地图`}
              className="h-full w-full"
              src={`https://maps.google.com/maps?q=${shop?.latitude ?? 31.2047},${shop?.longitude ?? 121.4442}&z=15&output=embed`}
            />
          </div>
          {siteConfig?.contactImages?.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {siteConfig.contactImages.slice(0, 4).map((image) => (
                <div key={image} className="overflow-hidden rounded-lg border border-forest/10 bg-[#f4f7f2]">
                  <img src={image} alt="" className="h-28 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="surface-card site-shell-card sm:p-6">
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
            <Button type="primary" size="large" htmlType="submit" loading={submitting} block className="sm:!w-auto">
              {siteConfig?.contactPageSubmitText || "提交留言"}
            </Button>
          </Form>
        </div>
      </div>
    </section>
  );
}
