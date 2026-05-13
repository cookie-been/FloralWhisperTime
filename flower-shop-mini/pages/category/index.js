const { getCategories, getFlowers } = require("../../services/api");

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
    try {
      const [categories, flowers] = await Promise.all([
        getCategories(),
        getFlowers({ categoryId: this.data.activeCategoryId, sortBy: this.data.sortBy, limit: 40 }),
      ]);
      this.setData({ categories, flowers: flowers.list });
    } catch (error) {
      wx.showToast({ title: "数据加载失败", icon: "none" });
      console.error(error);
    }
  },
  async handleCategoryChange(event) {
    this.setData({ activeCategoryId: event.detail.id });
    await this.loadData();
  },
  async handleSort(event) {
    this.setData({ sortBy: event.currentTarget.dataset.sort });
    await this.loadData();
  },
});
