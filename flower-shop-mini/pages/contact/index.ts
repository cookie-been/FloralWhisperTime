import { getShopInfo, getSiteConfig } from "../../services/api";

Page({
  data: {
    shop: {},
    siteConfig: {},
  },
  async onLoad() {
    const [shop, siteConfig] = await Promise.all([getShopInfo(), getSiteConfig()]);
    this.setData({ shop, siteConfig });
  },
  callShop() {
    const shop = this.data.shop as { phone?: string };
    if (!shop.phone) return;
    wx.makePhoneCall({ phoneNumber: shop.phone });
  },
  copyWechat() {
    const shop = this.data.shop as { wechat?: string };
    if (!shop.wechat) return;
    wx.setClipboardData({
      data: shop.wechat,
      success: () => wx.showToast({ title: "微信号已复制" }),
    });
  },
});
