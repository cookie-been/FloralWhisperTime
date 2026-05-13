const { API_BASE_URL } = require("../config/api");

function withQuery(path, query = {}) {
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
    .join("&");
  return queryString ? `${path}?${queryString}` : path;
}

function request(path, method = "GET", data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method,
      data,
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
      fail: (error) => reject(new Error(error.errMsg)),
    });
  });
}

function getFlowers(query = {}) {
  return request(withQuery("/api/flowers", query));
}

function getFlowerById(id) {
  return request(`/api/flowers/${id}`).catch(() => null);
}

function getRelatedFlowers(flower, limit = 3) {
  return request(withQuery(`/api/flowers/${flower.id}/related`, { limit }));
}

function getSiteConfig() {
  return request("/api/site-config");
}

function getCategories() {
  return request("/api/categories");
}

function getShopInfo() {
  return request("/api/shop-info");
}

function getBrandStory() {
  return request("/api/brand-story");
}

function getTeamMembers() {
  return request("/api/team");
}

function submitContact(form) {
  return request("/api/contact", "POST", form);
}

module.exports = {
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
