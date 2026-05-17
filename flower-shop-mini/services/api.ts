import { API_BASE_URL } from "../config/api";
import * as mockApi from "../shared/api";
import type {
  BrandStory,
  Category,
  ContactForm,
  Flower,
  FlowerQuery,
  PaginatedResult,
  ShopInfo,
  SiteConfig,
  TeamMember,
} from "../types";

const DEFAULT_REQUEST_TIMEOUT = 12000;

function withQuery(path: string, query: Record<string, unknown> = {}) {
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
    .join("&");
  return queryString ? `${path}?${queryString}` : path;
}

function normalizeErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

function request<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data?: unknown): Promise<T> {
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
          resolve(response.data as T);
          return;
        }
        const errorData = response.data as { message?: string };
        reject(new Error(errorData?.message ?? "请求失败"));
      },
      fail: (error) => reject(new Error(error.errMsg || "网络请求失败")),
    });
  });
}

async function withMockFallback<T>(remoteTask: () => Promise<T>, mockTask: () => Promise<T>) {
  try {
    return await remoteTask();
  } catch (error) {
    console.warn("[mini] remote request failed, fallback to mock:", error);
    return mockTask();
  }
}

export function getFlowers(query: FlowerQuery = {}) {
  return withMockFallback(
    () => request<PaginatedResult<Flower>>(withQuery("/api/flowers", query)),
    () => mockApi.getFlowers(query),
  );
}

export async function getFlowerById(id: string) {
  try {
    const result = await withMockFallback(
      () => request<Flower>(`/api/flowers/${id}`),
      () => mockApi.getFlowerById(id),
    );
    return result ?? null;
  } catch {
    return null;
  }
}

export function getRelatedFlowers(flower: Flower, limit = 3) {
  return withMockFallback(
    () => request<Flower[]>(withQuery(`/api/flowers/${flower.id}/related`, { limit })),
    () => mockApi.getRelatedFlowers(flower, limit),
  );
}

export function getSiteConfig() {
  return withMockFallback(
    () => request<SiteConfig>("/api/site-config"),
    async () =>
      ({
        brandName: "花语时光",
        heroEyebrow: "自然温暖",
        heroTitle: "让花束像一封慢慢抵达的信",
        heroDescription: "以季节花材和克制表达，为赠礼、婚礼和空间场景提供更耐看的花艺作品。",
        heroImage: "",
        primaryCtaText: "浏览作品",
        secondaryCtaText: "联系门店",
        stats: [],
        homeStorySectionTitle: "品牌故事",
        homeStorySectionIntro: "了解花语时光的花艺表达、服务方式与门店气质。",
        homeFeaturedSectionTitle: "热门花束",
        homeFeaturedSectionIntro: "优先展示门店当前主推和高关注作品",
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
      }) as SiteConfig,
  );
}

export function getCategories() {
  return withMockFallback(
    () => request<Category[]>("/api/categories"),
    () => mockApi.getCategories(),
  );
}

export function getShopInfo() {
  return withMockFallback(
    () => request<ShopInfo>("/api/shop-info"),
    () => mockApi.getShopInfo(),
  );
}

export function getBrandStory() {
  return withMockFallback(
    () => request<BrandStory>("/api/brand-story"),
    () => mockApi.getBrandStory(),
  );
}

export function getTeamMembers() {
  return withMockFallback(
    () => request<TeamMember[]>("/api/team"),
    () => mockApi.getTeamMembers(),
  );
}

export async function submitContact(form: ContactForm) {
  try {
    return await request<{ success: boolean }>("/api/contact", "POST", form);
  } catch (error) {
    return mockApi.submitContact(form).catch((mockError) => {
      throw new Error(normalizeErrorMessage(mockError ?? error, "提交留言失败"));
    });
  }
}
