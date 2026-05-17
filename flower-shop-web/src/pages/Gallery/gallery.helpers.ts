import type { Category, FlowerQuery, SiteConfig } from "@/types";

export function buildGalleryCategoryOptions(categories: Category[]) {
  return categories.length ? categories.map((item) => ({ label: item.name, value: item.id })) : [{ label: "全部分类", value: "all" }];
}

export function buildGallerySearchParams(searchParams: URLSearchParams, updates: { category?: string; keyword?: string }) {
  const next = new URLSearchParams(searchParams);

  if (updates.category !== undefined) {
    if (updates.category === "all") {
      next.delete("category");
    } else {
      next.set("category", updates.category);
    }
  }

  if (updates.keyword !== undefined) {
    if (updates.keyword) {
      next.set("keyword", updates.keyword);
    } else {
      next.delete("keyword");
    }
  }

  return next;
}

export function buildGallerySortLabel(sortBy?: FlowerQuery["sortBy"]) {
  if (sortBy === "latest") return "最新作品";
  if (sortBy === "price_asc") return "价格从低到高";
  if (sortBy === "price_desc") return "价格从高到低";
  return "精选优先";
}

export function buildGalleryPageCopy(siteConfig: SiteConfig | null) {
  return {
    eyebrow: siteConfig?.galleryPageEyebrow || "作品浏览",
    title: siteConfig?.galleryPageTitle || "作品画廊",
    intro: siteConfig?.galleryPageIntro || "按分类、关键词和排序浏览花语时光的花束与空间花艺作品，直接查看更完整的作品面貌与氛围。",
    searchPlaceholder: siteConfig?.gallerySearchPlaceholder || "搜索花束、花材或标签",
    loadErrorText: siteConfig?.galleryLoadErrorText || "作品列表加载失败，请稍后刷新重试",
    emptyText: siteConfig?.galleryEmptyText || "没有找到匹配的花束作品",
  };
}
