import type { ShopInfo, SiteConfig } from "@/types";

export function buildContactPageCopy(siteConfig: SiteConfig | null) {
  return {
    title: siteConfig?.contactPageTitle || "联系我们",
    intro: siteConfig?.contactIntro || "欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。",
    submitText: siteConfig?.contactPageSubmitText || "提交留言",
    submitSuccessText: siteConfig?.contactSubmitSuccessText || "留言已提交，我们会尽快联系你",
    businessHoursText: siteConfig?.businessHoursText || "周一至周五 09:30-21:00，周末 10:00-21:30",
  };
}

export function buildContactShopSummary(shop: ShopInfo | null) {
  return {
    phone: shop?.phone ?? "待补充",
    wechat: shop?.wechat ?? "待补充",
    address: shop?.address ?? "地址信息待完善",
    latitude: shop?.latitude ?? 31.2047,
    longitude: shop?.longitude ?? 121.4442,
    name: shop?.name ?? "花语时光",
  };
}
