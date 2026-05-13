const { getCategories, getFlowers, getSiteConfig } = require("../../services/api");

Page({
  data: {
    banners: [
      {
        id: "b1",
        image: "https://picsum.photos/seed/mini-banner-1/900/600",
        title: "花语时光",
        desc: "清新文艺的鲜花展示窗口",
      },
      {
        id: "b2",
        image: "https://picsum.photos/seed/mini-banner-2/900/600",
        title: "春日来信",
        desc: "把季节花材送到心上",
      },
      {
        id: "b3",
        image: "https://picsum.photos/seed/mini-banner-3/900/600",
        title: "婚礼花艺",
        desc: "自然温暖的仪式感",
      },
    ],
    categories: [],
    hotFlowers: [],
    siteConfig: {},
  },
  async onLoad() {
    try {
      const [categories, flowers, siteConfig] = await Promise.all([
        getCategories(),
        getFlowers({ sortBy: "featured", limit: 6 }),
        getSiteConfig(),
      ]);
      this.setData({
        categories,
        hotFlowers: flowers.list,
        siteConfig,
        banners: [
          {
            id: "b1",
            image: siteConfig.heroImage,
            title: siteConfig.heroTitle,
            desc: siteConfig.heroDescription,
          },
          ...this.data.banners.slice(1),
        ],
      });
    } catch (error) {
      wx.showToast({ title: "数据加载失败", icon: "none" });
      console.error(error);
    }
  },
  goCategory(event) {
    wx.setStorageSync("activeCategoryId", event.currentTarget.dataset.id);
    wx.switchTab({ url: "/pages/category/index" });
  },
  goAbout() {
    wx.switchTab({ url: "/pages/about/index" });
  },
});
