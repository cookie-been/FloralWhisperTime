import { getCategories, getFlowers } from "../../services/api";

Page({
  data: {
    categories: [],
    flowers: [],
    activeCategoryId: "all",
    sortBy: "featured",
  },
  async onShow() {
    const cached = wx.getStorageSync("activeCategoryId");
    if (cached) {
      this.setData({ activeCategoryId: cached });
      wx.removeStorageSync("activeCategoryId");
    }
    await this.loadData();
  },
  async loadData() {
    const [categories, flowers] = await Promise.all([
      getCategories(),
      getFlowers({ categoryId: this.data.activeCategoryId, sortBy: this.data.sortBy as any, limit: 40 }),
    ]);
    this.setData({ categories, flowers: flowers.list });
  },
  async handleCategoryChange(event: WechatMiniprogram.CustomEvent) {
    this.setData({ activeCategoryId: event.detail.id });
    await this.loadData();
  },
  async handleSort(event: WechatMiniprogram.TouchEvent) {
    this.setData({ sortBy: event.currentTarget.dataset.sort });
    await this.loadData();
  },
});
