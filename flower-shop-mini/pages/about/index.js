const { getBrandStory, getShopInfo } = require("../../services/api");

Page({
  data: {
    story: { images: [] },
    shop: {},
  },
  async onLoad() {
    try {
      const [story, shop] = await Promise.all([getBrandStory(), getShopInfo()]);
      this.setData({ story, shop });
    } catch (error) {
      wx.showToast({ title: "数据加载失败", icon: "none" });
      console.error(error);
    }
  },
});
