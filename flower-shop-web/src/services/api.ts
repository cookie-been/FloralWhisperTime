import type {
  AboutPageContent,
  AboutTimelineEntry,
  AiSettings,
  BrandStory,
  Category,
  ContactForm,
  ContactMessage,
  Flower,
  FlowerQuery,
  PaginatedResult,
  ShopInfo,
  SiteConfig,
  SystemStatus,
  TeamMember,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ADMIN_TOKEN_KEY = "flower_shop_admin_token";
const inFlightMutations = new Map<string, Promise<unknown>>();

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

function withMutationGuard<T>(key: string, action: () => Promise<T>) {
  if (inFlightMutations.has(key)) {
    return Promise.reject(new Error("请求正在处理中，请勿重复提交"));
  }

  const promise = action().finally(() => {
    inFlightMutations.delete(key);
  });

  inFlightMutations.set(key, promise);
  return promise;
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
  const result = await withMutationGuard("admin:login", () =>
    request<{ token: string; username: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  );
  setAdminToken(result.token);
  return result;
}

export function getCurrentAdmin() {
  return request<{ username: string }>("/api/admin/me");
}

export function getAdminSystemStatus() {
  return request<SystemStatus>("/api/admin/system/status");
}

export async function downloadLatestAdminBackup(downloadUrl: string) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("请先登录管理后台");
  }
  const link = document.createElement("a");
  link.href = `${API_BASE_URL}${downloadUrl}`;
  link.style.display = "none";
  link.setAttribute("download", "");

  const response = await fetch(`${API_BASE_URL}${downloadUrl}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "下载失败" }));
    throw new Error(error.message ?? "下载失败");
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  link.href = blobUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export function getAdminContacts(query: { page?: number; limit?: number; keyword?: string; status?: "all" | "read" | "unread" } = {}) {
  return request<PaginatedResult<ContactMessage>>(withQuery("/api/admin/contacts", query));
}

export function markAdminContactRead(id: string) {
  return withMutationGuard(`admin:contact:read:${id}`, () =>
    request<ContactMessage>(`/api/admin/contacts/${id}/read`, {
      method: "PATCH",
    }),
  );
}

export function getSiteConfig() {
  return request<SiteConfig>("/api/site-config");
}

export function getAboutPage() {
  return request<AboutPageContent>("/api/about-page");
}

export function getAboutTimeline() {
  return request<AboutTimelineEntry[]>("/api/about-timeline");
}

export function updateSiteConfig(payload: SiteConfig & Partial<ShopInfo> & {
  storyTitle?: string;
  storySubtitle?: string;
  storyContent?: string;
  storyImages?: string[] | string;
}) {
  return withMutationGuard("admin:site-config:update", () =>
    request<{ siteConfig: SiteConfig; shopInfo: ShopInfo; brandStory: BrandStory }>("/api/site-config", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

export function getAdminAiSettings() {
  return request<AiSettings>("/api/admin/system/ai-settings");
}

export function updateAdminAiSettings(payload: AiSettings) {
  return withMutationGuard("admin:ai-settings:update", () =>
    request<AiSettings>("/api/admin/system/ai-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

export function createFlower(flower: Flower) {
  return withMutationGuard(`admin:flower:create:${flower.id}`, () =>
    request<Flower>("/api/flowers", {
      method: "POST",
      body: JSON.stringify(flower),
    }),
  );
}

export function updateFlower(id: string, flower: Flower) {
  return withMutationGuard(`admin:flower:update:${id}`, () =>
    request<Flower>(`/api/flowers/${id}`, {
      method: "PUT",
      body: JSON.stringify(flower),
    }),
  );
}

export function deleteFlower(id: string) {
  return withMutationGuard(`admin:flower:delete:${id}`, () =>
    request<void>(`/api/flowers/${id}`, { method: "DELETE" }),
  );
}

export async function uploadFlowerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return withMutationGuard(`admin:upload:${file.name}:${file.size}`, () =>
    request<{ url: string }>("/api/uploads", {
      method: "POST",
      body: formData,
    }),
  );
}

export async function generateAdminAiImage(prompt: string, files: File[]) {
  const formData = new FormData();
  formData.append("prompt", prompt);
  files.forEach((file) => formData.append("referenceFiles", file));
  return withMutationGuard(`admin:ai-image:${prompt}:${files.map((file) => `${file.name}:${file.size}`).join("|")}`, () =>
    request<{ success: boolean; imageUrl: string; source: string; mode: string }>("/api/admin/ai/images/generate", {
      method: "POST",
      body: formData,
    }),
  );
}

export interface AdminAiFlowerSuggestion {
  name: string;
  categoryId: string;
  description: string;
  materials: string[];
  tags: string[];
  meaning: string;
}

export function generateAdminAiFlowerSuggestion(payload: {
  prompt: string;
  imageUrl?: string;
  mode?: string;
}) {
  return withMutationGuard(
    `admin:ai-flower-suggestion:${payload.prompt}:${payload.imageUrl ?? ""}:${payload.mode ?? ""}`,
    () =>
      request<AdminAiFlowerSuggestion>("/api/admin/ai/flowers/suggestions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  );
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

export async function getDashboardData() {
  const [flowers, categories, siteConfig, shopInfo, brandStory] = await Promise.all([
    getFlowers({ limit: 200 }),
    getCategories(),
    getSiteConfig(),
    getShopInfo(),
    getBrandStory(),
  ]);

  return {
    flowers: flowers.list,
    categories,
    siteConfig,
    shopInfo,
    brandStory,
  };
}

export function getTeamMembers() {
  return request<TeamMember[]>("/api/team");
}

export function getAdminAboutPage() {
  return request<AboutPageContent>("/api/admin/about-page");
}

export function updateAdminAboutPage(payload: AboutPageContent) {
  return withMutationGuard("admin:about-page:update", () =>
    request<AboutPageContent>("/api/admin/about-page", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

export function getAdminAboutTimeline() {
  return request<AboutTimelineEntry[]>("/api/admin/about-timeline");
}

export function createAdminAboutTimeline(entry: Omit<AboutTimelineEntry, "id"> & { id?: string }) {
  return withMutationGuard(`admin:about-timeline:create:${entry.id ?? entry.yearLabel}`, () =>
    request<AboutTimelineEntry>("/api/admin/about-timeline", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  );
}

export function updateAdminAboutTimeline(id: string, entry: Omit<AboutTimelineEntry, "id">) {
  return withMutationGuard(`admin:about-timeline:update:${id}`, () =>
    request<AboutTimelineEntry>(`/api/admin/about-timeline/${id}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    }),
  );
}

export function deleteAdminAboutTimeline(id: string) {
  return withMutationGuard(`admin:about-timeline:delete:${id}`, () =>
    request<void>(`/api/admin/about-timeline/${id}`, {
      method: "DELETE",
    }),
  );
}

export function getAdminTeamMembers() {
  return request<TeamMember[]>("/api/admin/team");
}

export function createAdminTeamMember(member: TeamMember) {
  return withMutationGuard(`admin:team:create:${member.id}`, () =>
    request<TeamMember>("/api/admin/team", {
      method: "POST",
      body: JSON.stringify(member),
    }),
  );
}

export function updateAdminTeamMember(id: string, member: TeamMember) {
  return withMutationGuard(`admin:team:update:${id}`, () =>
    request<TeamMember>(`/api/admin/team/${id}`, {
      method: "PUT",
      body: JSON.stringify(member),
    }),
  );
}

export function deleteAdminTeamMember(id: string) {
  return withMutationGuard(`admin:team:delete:${id}`, () =>
    request<void>(`/api/admin/team/${id}`, {
      method: "DELETE",
    }),
  );
}

export function submitContact(form: ContactForm) {
  return withMutationGuard(`public:contact:${form.phone}:${form.name}`, () =>
    request<{ success: boolean }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(form),
    }),
  );
}
