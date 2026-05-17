const CATEGORY_PAGE_URL = "/pages/category/index";
const ABOUT_PAGE_URL = "/pages/about/index";
const CONTACT_PAGE_URL = "/pages/contact/index";

export function switchToCategoryTab(categoryId = "all") {
  wx.setStorageSync("activeCategoryId", categoryId);
  wx.switchTab({ url: CATEGORY_PAGE_URL });
}

export function switchToAboutTab() {
  wx.switchTab({ url: ABOUT_PAGE_URL });
}

export function switchToContactTab() {
  wx.switchTab({ url: CONTACT_PAGE_URL });
}

export function openFlowerDetail(flowerId: string) {
  if (!flowerId) {
    return;
  }
  wx.navigateTo({
    url: `/pages/flower-detail/index?id=${flowerId}`,
  });
}
