const { getFlowerById, getRelatedFlowers } = require("../../services/api");
const { showErrorMessage } = require("../../utils/message");
const { switchToContactTab } = require("../../utils/navigation");

Page({
  data: {
    flower: null,
    relatedFlowerList: [],
    galleryImageList: [],
    tagList: [],
    materialsText: "",
    isPageLoading: true,
    pageErrorText: "",
  },

  currentDetailRequestId: 0,

  onLoad(options) {
    if (!options.id) {
      this.setData({
        isPageLoading: false,
        pageErrorText: "缺少作品参数",
      });
      return;
    }
    void this.loadPageData(options.id);
  },

  onShareAppMessage() {
    const flower = this.data.flower;
    return {
      title: (flower && flower.name) || "花语时光作品详情",
      path: flower ? `/pages/flower-detail/index?id=${flower.id}` : "/pages/index/index",
    };
  },

  async loadPageData(flowerId) {
    this.currentDetailRequestId += 1;
    const requestId = this.currentDetailRequestId;
    this.setData({
      isPageLoading: true,
      pageErrorText: "",
    });
    try {
      const flower = await getFlowerById(flowerId);
      if (requestId !== this.currentDetailRequestId) {
        return;
      }
      if (!flower) {
        this.setData({
          pageErrorText: "作品不存在或已下架",
        });
        return;
      }
      let relatedFlowerList = [];
      try {
        relatedFlowerList = await getRelatedFlowers(flower, 4);
      } catch (error) {
        relatedFlowerList = [];
      }
      if (requestId !== this.currentDetailRequestId) {
        return;
      }
      this.setData({
        flower,
        relatedFlowerList,
        galleryImageList: Array.isArray(flower.images) ? flower.images : [],
        tagList: Array.isArray(flower.tags) ? flower.tags : [],
        materialsText: flower.materials.join(" / "),
      });
    } catch (error) {
      if (requestId !== this.currentDetailRequestId) {
        return;
      }
      this.setData({
        pageErrorText: error instanceof Error ? error.message : "作品详情加载失败，请稍后重试",
      });
    } finally {
      if (requestId !== this.currentDetailRequestId) {
        return;
      }
      this.setData({
        isPageLoading: false,
      });
    }
  },

  handleRetry() {
    const flower = this.data.flower;
    const currentPages = getCurrentPages();
    const currentPage = currentPages[currentPages.length - 1];
    const flowerId = (flower && flower.id) || (currentPage && currentPage.options && currentPage.options.id);
    if (!flowerId) {
      showErrorMessage("缺少作品信息");
      return;
    }
    void this.loadPageData(flowerId);
  },

  contactShop() {
    switchToContactTab();
  },
});
