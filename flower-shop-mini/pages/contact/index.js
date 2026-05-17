const { getShopInfo, getSiteConfig, submitContact } = require("../../services/api");
const { fallbackText, formatBusinessHours } = require("../../utils/format");
const { showErrorMessage, showSuccessMessage } = require("../../utils/message");

Page({
  data: {
    shop: {},
    siteConfig: {},
    businessHoursText: "",
    contactDescription: "",
    submitSuccessText: "留言已提交，我们会尽快联系你",
    shopNameText: "花语时光门店",
    shopAddressText: "暂未提供",
    shopPhoneText: "暂未提供",
    shopWechatText: "暂未提供",
    businessHoursDisplayText: "请联系门店获取最新营业安排",
    canCallShop: false,
    canCopyWechat: false,
    isPageLoading: true,
    pageErrorText: "",
    isSubmitting: false,
    formData: {
      name: "",
      phone: "",
      message: "",
    },
  },

  currentPageRequestId: 0,

  onLoad() {
    void this.loadPageData();
  },

  onPullDownRefresh() {
    void this.loadPageData(true);
  },

  async loadPageData(isRefresh = false) {
    this.currentPageRequestId += 1;
    const requestId = this.currentPageRequestId;
    this.setData({
      isPageLoading: !isRefresh,
      pageErrorText: "",
    });
    try {
      const [shop, siteConfig] = await Promise.all([getShopInfo(), getSiteConfig()]);
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        shop,
        siteConfig,
        businessHoursText: formatBusinessHours(shop.hours),
        contactDescription: fallbackText(siteConfig.contactIntro, "预约花束、婚礼花艺、开业花篮与空间花艺。"),
        shopNameText: fallbackText(shop.name, "花语时光门店"),
        shopAddressText: fallbackText(shop.address, "暂未提供"),
        shopPhoneText: fallbackText(shop.phone, "暂未提供"),
        shopWechatText: fallbackText(shop.wechat, "暂未提供"),
        businessHoursDisplayText: fallbackText(
          formatBusinessHours(shop.hours),
          fallbackText(siteConfig.businessHoursText, "请联系门店获取最新营业安排"),
        ),
        canCallShop: Boolean(shop.phone),
        canCopyWechat: Boolean(shop.wechat),
      });
    } catch (error) {
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        pageErrorText: error instanceof Error ? error.message : "联系页加载失败，请稍后重试",
      });
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

  handleRetry() {
    void this.loadPageData();
  },

  callShop() {
    const shop = this.data.shop || {};
    if (!shop.phone) {
      showErrorMessage("暂无门店电话");
      return;
    }
    wx.makePhoneCall({ phoneNumber: shop.phone });
  },

  copyWechat() {
    const shop = this.data.shop || {};
    if (!shop.wechat) {
      showErrorMessage("暂无微信号");
      return;
    }
    wx.setClipboardData({
      data: shop.wechat,
      success: () => showSuccessMessage("微信号已复制"),
    });
  },

  handleNameInput(event) {
    this.setData({
      "formData.name": event.detail.value,
    });
  },

  handlePhoneInput(event) {
    this.setData({
      "formData.phone": event.detail.value,
    });
  },

  handleMessageInput(event) {
    this.setData({
      "formData.message": event.detail.value,
    });
  },

  normalizeFormData(formData) {
    return {
      name: formData.name.trim(),
      phone: formData.phone.replace(/\s+/g, "").trim(),
      message: formData.message.trim(),
    };
  },

  validateFormData(formData) {
    if (!formData.name) {
      return "请填写你的称呼";
    }
    if (!formData.phone) {
      return "请填写联系电话";
    }
    if (!/^[0-9+-]{7,20}$/.test(formData.phone)) {
      return "联系电话格式不正确";
    }
    if (!formData.message) {
      return "请填写留言内容";
    }
    if (formData.message.length < 5) {
      return "留言内容至少填写 5 个字";
    }
    return "";
  },

  async handleSubmit() {
    if (this.data.isSubmitting) {
      return;
    }
    const normalizedFormData = this.normalizeFormData(this.data.formData);
    const validationMessage = this.validateFormData(normalizedFormData);
    if (validationMessage) {
      showErrorMessage(validationMessage);
      return;
    }
    this.setData({
      formData: normalizedFormData,
      isSubmitting: true,
    });
    try {
      await submitContact(normalizedFormData);
      showSuccessMessage(this.data.submitSuccessText);
      this.setData({
        formData: {
          name: "",
          phone: "",
          message: "",
        },
      });
    } catch (error) {
      showErrorMessage(error instanceof Error ? error.message : "提交留言失败");
    } finally {
      this.setData({
        isSubmitting: false,
      });
    }
  },

  onShareAppMessage() {
    return {
      title: "联系花语时光门店",
      path: "/pages/contact/index",
    };
  },
});
