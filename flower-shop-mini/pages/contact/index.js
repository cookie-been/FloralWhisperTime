const { getShopInfo, getSiteConfig } = require("../../services/api");

Page({
  data: {
    shop: {},
    siteConfig: {},
  },
  async onLoad() {
    try {
      const [shop, siteConfig] = await Promise.all([getShopInfo(), getSiteConfig()]);
      this.setData({ shop, siteConfig });
    } catch (error) {
      wx.showToast({ title: "数据加载失败", icon: "none" });
      console.error(error);
    }
  },
  callShop() {
    const shop = this.data.shop || {};
    if (!shop.phone) return;
    wx.makePhoneCall({ phoneNumber: shop.phone });
  },
  copyWechat() {
    const shop = this.data.shop || {};
    if (!shop.wechat) return;
    wx.setClipboardData({
      data: shop.wechat,
      success: () => wx.showToast({ title: "微信号已复制" }),
    });
  },
});
