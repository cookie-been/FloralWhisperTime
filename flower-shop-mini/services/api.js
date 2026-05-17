const { API_BASE_URL } = require("../config/api");
const mockApi = require("../shared/api");

const DEFAULT_REQUEST_TIMEOUT = 12000;

function withQuery(path, query = {}) {
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
    .join("&");
  return queryString ? `${path}?${queryString}` : path;
}

function normalizeErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

function request(path, method = "GET", data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method,
      data,
      timeout: DEFAULT_REQUEST_TIMEOUT,
      header: {
        "content-type": "application/json",
      },
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error((response.data && response.data.message) || "请求失败"));
      },
      fail: (error) => reject(new Error(error.errMsg || "网络请求失败")),
    });
  });
}

async function withMockFallback(remoteTask, mockTask) {
  try {
    return await remoteTask();
  } catch (error) {
    console.warn("[mini] remote request failed, fallback to mock:", error);
    return mockTask();
  }
}

function getFlowers(query = {}) {
  return withMockFallback(
    () => request(withQuery("/api/flowers", query)),
    () => mockApi.getFlowers(query),
  );
}

async function getFlowerById(id) {
  try {
    const result = await withMockFallback(
      () => request(`/api/flowers/${id}`),
      () => mockApi.getFlowerById(id),
    );
    return result || null;
  } catch (error) {
    return null;
  }
}

function getRelatedFlowers(flower, limit = 3) {
  return withMockFallback(
    () => request(withQuery(`/api/flowers/${flower.id}/related`, { limit })),
    () => mockApi.getRelatedFlowers(flower, limit),
  );
}

function getSiteConfig() {
  return withMockFallback(
    () => request("/api/site-config"),
    async () => ({
      brandName: "花语时光",
      heroEyebrow: "自然温暖",
      heroTitle: "让花束像一封慢慢抵达的信",
      heroDescription: "以季节花材和克制表达，为赠礼、婚礼和空间场景提供更耐看的花艺作品。",
      heroImage: "",
      heroSlides: [],
      contactImages: [],
      primaryCtaText: "浏览作品",
      secondaryCtaText: "联系门店",
      stats: [],
      homeStorySectionTitle: "品牌故事",
      homeStorySectionIntro: "了解花语时光的花艺表达、服务方式与门店气质。",
      homeFeaturedSectionTitle: "热门花束",
      homeFeaturedSectionIntro: "优先展示门店当前主推和高关注作品",
      aboutStorySectionEyebrow: "品牌故事",
      aboutTeamSectionEyebrow: "团队成员",
      aboutTeamSectionTitle: "花艺师团队",
      aboutTeamSectionIntro: "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。",
      galleryPageTitle: "花束分类",
      galleryPageIntro: "按场景、风格和价格快速浏览作品。",
      gallerySearchPlaceholder: "搜索花束、花材或寓意",
      galleryEmptyText: "没有找到匹配的花束作品",
      galleryLoadErrorText: "作品列表加载失败，请稍后重试",
      contactPageTitle: "联系我们",
      contactPageSubmitText: "提交留言",
      contactSubmitSuccessText: "留言已提交，我们会尽快联系你",
      consultButtonText: "联系门店",
      contactIntro: "预约花束、婚礼花艺、开业花篮与空间花艺。",
      businessHoursText: "周一至周五 09:30-21:00，周末 10:00-21:30",
      footerDescription: "花语时光",
    }),
  );
}

function getCategories() {
  return withMockFallback(
    () => request("/api/categories"),
    () => mockApi.getCategories(),
  );
}

function getShopInfo() {
  return withMockFallback(
    () => request("/api/shop-info"),
    () => mockApi.getShopInfo(),
  );
}

function getBrandStory() {
  return withMockFallback(
    () => request("/api/brand-story"),
    () => mockApi.getBrandStory(),
  );
}

function getAboutPage() {
  return withMockFallback(
    () => request("/api/about-page"),
    async () => ({
      heroImage: "",
      heroEyebrow: "关于我们",
      heroTitle: "关于花语时光",
      heroSubtitle: "品牌信息与服务内容由后台统一维护。",
      storyTitle: "品牌故事",
      storyContent: "我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。",
    }),
  );
}

function getTeamMembers() {
  return withMockFallback(
    () => request("/api/team"),
    () => mockApi.getTeamMembers(),
  );
}

function getAboutTimeline() {
  return withMockFallback(
    () => request("/api/about-timeline"),
    () => mockApi.getAboutTimeline(),
  );
}

async function submitContact(form) {
  try {
    return await request("/api/contact", "POST", form);
  } catch (error) {
    return mockApi.submitContact(form).catch((mockError) => {
      throw new Error(normalizeErrorMessage(mockError || error, "提交留言失败"));
    });
  }
}

module.exports = {
  getAboutPage,
  getAboutTimeline,
  getBrandStory,
  getCategories,
  getFlowerById,
  getFlowers,
  getRelatedFlowers,
  getShopInfo,
  getSiteConfig,
  getTeamMembers,
  submitContact,
};
