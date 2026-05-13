import type { BrandStory, Category, ContactForm, Flower, FlowerQuery, PaginatedResult, ShopInfo, SiteConfig, TeamMember } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const ADMIN_TOKEN_KEY = "flower_shop_admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "请求失败" }));
    throw new Error(error.message ?? "请求失败");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function withQuery(path: string, query: object) {
  const params = new URLSearchParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function getFlowers(query: FlowerQuery = {}) {
  return request<PaginatedResult<Flower>>(withQuery("/api/flowers", query));
}

export function getFlowerById(id: string) {
  return request<Flower>(`/api/flowers/${id}`).catch((error) => {
    if (error instanceof Error && error.message === "作品不存在") return null;
    throw error;
  });
}

export function getRelatedFlowers(flower: Flower, limit = 3) {
  return request<Flower[]>(withQuery(`/api/flowers/${flower.id}/related`, { limit }));
}

export async function loginAdmin(username: string, password: string) {
  const result = await request<{ token: string; username: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAdminToken(result.token);
  return result;
}

export function getCurrentAdmin() {
  return request<{ username: string }>("/api/admin/me");
}

export function getSiteConfig() {
  return request<SiteConfig>("/api/site-config");
}

export function updateSiteConfig(payload: SiteConfig & Partial<ShopInfo> & {
  storyTitle?: string;
  storySubtitle?: string;
  storyContent?: string;
  storyImages?: string[] | string;
}) {
  return request<{ siteConfig: SiteConfig; shopInfo: ShopInfo; brandStory: BrandStory }>("/api/site-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createFlower(flower: Flower) {
  return request<Flower>("/api/flowers", {
    method: "POST",
    body: JSON.stringify(flower),
  });
}

export function updateFlower(id: string, flower: Flower) {
  return request<Flower>(`/api/flowers/${id}`, {
    method: "PUT",
    body: JSON.stringify(flower),
  });
}

export function deleteFlower(id: string) {
  return request<void>(`/api/flowers/${id}`, { method: "DELETE" });
}

export async function uploadFlowerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ url: string }>("/api/uploads", {
    method: "POST",
    body: formData,
  });
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
  return request<{ success: boolean }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(form),
  });
}
