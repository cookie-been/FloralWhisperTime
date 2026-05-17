import type { AboutPageContent, AboutTimelineEntry, ShopInfo, SiteConfig, TeamMember } from "@/types";

export function shouldShowAboutLoadError(results: Array<PromiseSettledResult<unknown>>) {
  return results.every((item) => item.status === "rejected");
}

export function buildAboutTimelineItems(timeline: AboutTimelineEntry[]) {
  return [...timeline]
    .sort((left, right) => left.sort - right.sort || left.yearLabel.localeCompare(right.yearLabel, "zh-CN"))
    .map((item) => ({
      label: item.yearLabel,
      children: item.content,
    }));
}

export function buildAboutContent(aboutPage: AboutPageContent | null) {
  return {
    heroImage: aboutPage?.heroImage || "/home-hero/hero-2.jpg",
    heroEyebrow: aboutPage?.heroEyebrow || "关于我们",
    heroTitle: aboutPage?.heroTitle || "关于我们",
    heroSubtitle: aboutPage?.heroSubtitle || "品牌信息与服务内容由后台统一维护。",
    storyTitle: aboutPage?.storyTitle || "品牌故事",
    storyContent: aboutPage?.storyContent || "当前暂无品牌故事内容。",
  };
}
