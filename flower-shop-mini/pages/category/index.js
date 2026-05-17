const { getCategories, getFlowers, getSiteConfig } = require("../../services/api");
const { showErrorMessage } = require("../../utils/message");

const DEFAULT_PAGE_SIZE = 10;

Page({
  data: {
    categoryList: [],
    flowerList: [],
    activeCategoryId: "all",
    sortBy: "featured",
    siteConfig: {},
    sortOptionList: [
      { value: "featured", label: "热门" },
      { value: "latest", label: "最新" },
      { value: "price_asc", label: "价格升序" },
      { value: "price_desc", label: "价格降序" },
    ],
    pageTitleText: "花束分类",
    pageIntroText: "按场景、风格和价格快速浏览作品。",
    searchPlaceholderText: "搜索花束、花材或寓意",
    emptyStateText: "没有找到匹配的花束作品",
    loadErrorText: "作品列表加载失败，请稍后重试",
    searchKeyword: "",
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    hasMore: true,
    isPageLoading: true,
    isListLoading: false,
    pageErrorText: "",
  },

  currentListRequestId: 0,

  onShow() {
    const cachedCategoryId = wx.getStorageSync("activeCategoryId");
    if (cachedCategoryId) {
      this.setData({ activeCategoryId: cachedCategoryId });
      wx.removeStorageSync("activeCategoryId");
    }
    void this.loadPageData(true);
  },

  onPullDownRefresh() {
    void this.loadPageData(true, true);
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.isListLoading || this.data.isPageLoading) {
      return;
    }
    void this.loadFlowerList(false);
  },

  async loadPageData(reset = true, isRefresh = false) {
    this.setData({
      isPageLoading: reset,
      pageErrorText: "",
    });
    try {
      const [categoryList, siteConfig] = await Promise.all([getCategories(), getSiteConfig()]);
      this.setData({
        categoryList,
        siteConfig,
        pageTitleText: siteConfig.galleryPageTitle || "花束分类",
        pageIntroText: siteConfig.galleryPageIntro || "按场景、风格和价格快速浏览作品。",
        searchPlaceholderText: siteConfig.gallerySearchPlaceholder || "搜索花束、花材或寓意",
        emptyStateText: siteConfig.galleryEmptyText || "没有找到匹配的花束作品",
        loadErrorText: siteConfig.galleryLoadErrorText || "作品列表加载失败，请稍后重试",
      });
      await this.loadFlowerList(true);
    } catch (error) {
      this.setData({
        pageErrorText: error instanceof Error ? error.message : "分类页加载失败，请稍后重试",
      });
      if (isRefresh) {
        showErrorMessage("刷新失败");
      }
    } finally {
      this.setData({
        isPageLoading: false,
      });
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  async loadFlowerList(reset) {
    this.currentListRequestId += 1;
    const requestId = this.currentListRequestId;
    const nextPageNumber = reset ? 1 : this.data.pageNumber + 1;
    this.setData({
      isListLoading: true,
      ...(reset
        ? {
            pageErrorText: "",
            flowerList: [],
            totalCount: 0,
            hasMore: true,
            pageNumber: 1,
          }
        : {}),
    });
    try {
      const flowerResult = await getFlowers({
        categoryId: this.data.activeCategoryId,
        keyword: this.data.searchKeyword.trim(),
        sortBy: this.data.sortBy,
        page: nextPageNumber,
        limit: this.data.pageSize,
      });
      if (requestId !== this.currentListRequestId) {
        return;
      }
      const nextFlowerList = reset ? flowerResult.list : this.data.flowerList.concat(flowerResult.list);
      this.setData({
        flowerList: nextFlowerList,
        pageNumber: flowerResult.page,
        totalCount: flowerResult.total,
        hasMore: nextFlowerList.length < flowerResult.total,
      });
    } catch (error) {
      if (requestId !== this.currentListRequestId) {
        return;
      }
      if (reset) {
        this.setData({
          pageErrorText: error instanceof Error ? error.message : this.data.loadErrorText,
        });
      } else {
        showErrorMessage(error instanceof Error ? error.message : "加载更多失败");
      }
    } finally {
      if (requestId !== this.currentListRequestId) {
        return;
      }
      this.setData({
        isListLoading: false,
      });
    }
  },

  handleRetry() {
    void this.loadPageData(true);
  },

  async handleCategoryChange(event) {
    this.setData({ activeCategoryId: event.detail.id });
    await this.loadFlowerList(true);
  },

  async handleSort(event) {
    this.setData({ sortBy: event.currentTarget.dataset.sort });
    await this.loadFlowerList(true);
  },

  handleKeywordInput(event) {
    this.setData({ searchKeyword: event.detail.value });
  },

  async handleKeywordConfirm() {
    await this.loadFlowerList(true);
  },

  async clearKeyword() {
    this.setData({ searchKeyword: "" });
    await this.loadFlowerList(true);
  },

  onShareAppMessage() {
    return {
      title: "花语时光作品分类",
      path: "/pages/category/index",
    };
  },
});
