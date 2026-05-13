import { API_BASE_URL } from "../config/api";
import type { BrandStory, Category, ContactForm, Flower, FlowerQuery, PaginatedResult, ShopInfo, SiteConfig, TeamMember } from "../types";

function withQuery(path: string, query: Record<string, unknown> = {}) {
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
    .join("&");
  return queryString ? `${path}?${queryString}` : path;
}

function request<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data?: unknown): Promise<T> {
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
          resolve(response.data as T);
          return;
        }
        const errorData = response.data as { message?: string };
        reject(new Error(errorData?.message ?? "请求失败"));
      },
      fail: (error) => reject(new Error(error.errMsg)),
    });
  });
}

export function getFlowers(query: FlowerQuery = {}) {
  return request<PaginatedResult<Flower>>(withQuery("/api/flowers", query));
}

export function getFlowerById(id: string) {
  return request<Flower>(`/api/flowers/${id}`).catch(() => null);
}

export function getRelatedFlowers(flower: Flower, limit = 3) {
  return request<Flower[]>(withQuery(`/api/flowers/${flower.id}/related`, { limit }));
}

export function getSiteConfig() {
  return request<SiteConfig>("/api/site-config");
}

export function getCategories() {
  return request<Category[]>("/api/categories");
}

export function getShopInfo() {
  return request<ShopInfo>("/api/shop-info");
}

export function getBrandStory() {
  return request<BrandStory>("/api/brand-story");
}

export function getTeamMembers() {
  return request<TeamMember[]>("/api/team");
}

export function submitContact(form: ContactForm) {
  return request<{ success: boolean }>("/api/contact", "POST", form);
}
