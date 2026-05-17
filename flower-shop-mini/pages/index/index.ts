import { getCategories, getFlowers, getSiteConfig } from "../../services/api";
import type { Category, Flower, SiteConfig } from "../../types";
import { fallbackText } from "../../utils/format";
import { showErrorMessage } from "../../utils/message";

interface BannerItem {
  id: string;
  image: string;
  title: string;
  desc: string;
}

interface CategoryCardItem extends Category {
  initialText: string;
  descriptionText: string;
}

Page({
  data: {
    bannerList: [] as BannerItem[],
    categoryList: [] as CategoryCardItem[],
    featuredFlowerList: [] as Flower[],
    siteConfig: {} as Partial<SiteConfig>,
    storyEyebrowText: "品牌故事",
    storyTitleText: "让花束像一封慢慢抵达的信",
    storyDescriptionText: "了解花语时光的品牌故事",
    isPageLoading: true,
    pageErrorText: "",
    noticeText: "今日可预约婚礼手捧花、生日花束和开业花篮。",
  },

  currentPageRequestId: 0,

  onLoad() {
    void this.loadPageData();
  },

  onPullDownRefresh() {
    void this.loadPageData(true);
  },

  onShareAppMessage() {
    const siteConfig = this.data.siteConfig as Partial<SiteConfig>;
    return {
      title: fallbackText(siteConfig.heroTitle, "花语时光鲜花作品集"),
      path: "/pages/index/index",
    };
  },

  async loadPageData(isRefresh = false) {
    this.currentPageRequestId += 1;
    const requestId = this.currentPageRequestId;
    this.setData({
      isPageLoading: !isRefresh,
      pageErrorText: "",
    });
    try {
      const [categoryList, flowerResult, siteConfig] = await Promise.all([
        getCategories(),
        getFlowers({ sortBy: "featured", limit: 6 }),
        getSiteConfig(),
      ]);
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      const bannerList = this.buildBannerList(siteConfig);
      const normalizedCategoryList = this.buildCategoryList(categoryList);
      this.setData({
        categoryList: normalizedCategoryList,
        featuredFlowerList: flowerResult.list,
        siteConfig,
        bannerList,
        storyEyebrowText: fallbackText(siteConfig.heroEyebrow, "品牌故事"),
        storyTitleText: fallbackText(siteConfig.heroTitle, "让花束像一封慢慢抵达的信"),
        storyDescriptionText: fallbackText(siteConfig.heroDescription, "了解花语时光的品牌故事"),
      });
    } catch (error) {
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        pageErrorText: error instanceof Error ? error.message : "首页加载失败，请稍后重试",
      });
      if (isRefresh) {
        showErrorMessage("刷新失败");
      }
    } finally {
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        isPageLoading: false,
      });
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  buildBannerList(siteConfig: Partial<SiteConfig>) {
    const primaryBanner: BannerItem = {
      id: "hero",
      image: fallbackText(siteConfig.heroImage, "https://picsum.photos/seed/mini-banner-hero/900/600"),
      title: fallbackText(siteConfig.heroTitle, "花语时光"),
      desc: fallbackText(siteConfig.heroDescription, "清新文艺的鲜花展示窗口"),
    };

    return [
      primaryBanner,
      {
        id: "wedding",
        image: "https://picsum.photos/seed/mini-banner-wedding/900/600",
        title: "婚礼花艺",
        desc: "自然、克制、适合长期回看的仪式花艺",
      },
      {
        id: "gift",
        image: "https://picsum.photos/seed/mini-banner-gift/900/600",
        title: "日常花礼",
        desc: "生日、探望、节日与纪念日的轻盈表达",
      },
    ];
  },

  buildCategoryList(categoryList: Category[]): CategoryCardItem[] {
    return categoryList
      .filter((item) => item.id !== "all")
      .map((item) => ({
        ...item,
        initialText: fallbackText(item.name, "花").slice(0, 1),
        descriptionText: fallbackText(item.description, "花语时光精选分类"),
      }));
  },

  handleRetry() {
    void this.loadPageData();
  },

  goCategory(event: WechatMiniprogram.TouchEvent) {
    const categoryId = event.currentTarget.dataset.id as string;
    wx.setStorageSync("activeCategoryId", categoryId);
    wx.switchTab({ url: "/pages/category/index" });
  },

  goAllCategories() {
    wx.setStorageSync("activeCategoryId", "all");
    wx.switchTab({ url: "/pages/category/index" });
  },

  goAbout() {
    wx.switchTab({ url: "/pages/about/index" });
  },

  goContact() {
    wx.switchTab({ url: "/pages/contact/index" });
  },
});
