import type { BrandStory, ShopInfo, SiteConfig } from "@/types";
import { joinListText, splitListText } from "@/utils/list-text";
import type { SettingsForm, SettingsTabKey } from "./AdminSettings";

export const LEGACY_SECTION_TO_TAB: Record<string, Exclude<SettingsTabKey, "about">> = {
  brand: "home",
  contact: "contact",
  story: "story",
};

export const TAB_LABELS: Record<SettingsTabKey, string> = {
  home: "首页与品牌",
  contact: "门店与联系",
  story: "品牌故事",
  about: "关于我们",
  "admin-copy": "后台文案",
  media: "媒体资源",
};

export const DEFAULT_TAB: SettingsTabKey = "home";

export function isSettingsTabKey(value: string | null): value is SettingsTabKey {
  return Boolean(value && value in TAB_LABELS);
}

export function buildSettingsFormValues(
  siteConfig: SiteConfig,
  shopInfo: ShopInfo,
  story: BrandStory,
): SettingsForm {
  return {
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
  };
}

export function buildSettingsUpdatePayload(values: SettingsForm) {
  return {
    ...values,
    storyImages: splitListText(values.storyImages),
    heroSlides: splitListText(values.heroSlidesText),
    adminLoginSlides: splitListText(values.adminLoginSlidesText),
    contactImages: splitListText(values.contactImagesText),
  };
}

export function appendSettingsFieldUrls(currentValue: string, urls: string[]) {
  return joinListText([...splitListText(currentValue), ...urls]);
}
