import type { BrandStory, Category, Flower, ShopInfo, SiteConfig, SiteStat } from "@/types";

export interface HomeSlideItem {
  image: string;
  label: string;
  note: string;
}

export const fallbackHeroSlides: HomeSlideItem[] = [
  { image: "/home-hero/hero-1.jpg", label: "花艺陈列", note: "适合礼赠与门店展示的花束陈列空间" },
  { image: "/home-hero/hero-2.jpg", label: "门店氛围", note: "更贴近日常选购与预约咨询的现场环境" },
  { image: "/home-hero/hero-3.jpg", label: "工作台面", note: "体现花材处理、组合与细节把控的制作状态" },
  { image: "/home-hero/hero-4.jpg", label: "空间花艺", note: "适合品牌陈设、活动与空间布置的整体表达" },
];

export function buildHomeStats(categories: Category[], allFlowers: Flower[]): SiteStat[] {
  return [
    { value: String(categories.filter((category) => category.id !== "all").length), label: "主题分类" },
    { value: String(allFlowers.filter((item) => item.featured).length), label: "精选作品" },
    { value: String(allFlowers.length), label: "全部作品" },
  ];
}

export function buildHeroSlides(siteConfig: SiteConfig | null): HomeSlideItem[] {
  const configuredSlides = (siteConfig?.heroSlides ?? []).filter(Boolean).map((image, index) => ({
    image,
    label: index === 0 ? siteConfig?.heroEyebrow || "品牌主视觉" : "首页轮播",
    note: index === 0 ? siteConfig?.heroDescription || "以花艺空间、礼赠氛围和门店陈列表达品牌第一印象。" : "由后台维护的首页轮播画面。",
  }));

  const sourceSlides = configuredSlides.length
    ? configuredSlides
    : [
        siteConfig?.heroImage
          ? {
              image: siteConfig.heroImage,
              label: siteConfig.heroEyebrow || "品牌主视觉",
              note: siteConfig.heroDescription || "以花艺空间、礼赠氛围和门店陈列表达品牌第一印象。",
            }
          : null,
        ...fallbackHeroSlides,
      ];

  return sourceSlides.filter((value, index, array): value is HomeSlideItem =>
    Boolean(value) && array.findIndex((item) => item?.image === value?.image) === index,
  );
}

export interface HomePageState {
  categories: Category[];
  featured: Flower[];
  allFlowers: Flower[];
  story: BrandStory | null;
  siteConfig: SiteConfig | null;
  shop: ShopInfo | null;
}
