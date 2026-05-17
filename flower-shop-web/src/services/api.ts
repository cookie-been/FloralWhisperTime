import type {
  AdminBackupFileList,
  AdminOpsTask,
  AdminOpsTaskList,
  AdminLoginResult,
  AdminPasswordChangeResult,
  AdminSession,
  AboutPageContent,
  AboutTimelineEntry,
  AiSettings,
  BrandStory,
  Category,
  ContactForm,
  ContactMessage,
  OperationLogArchiveFile,
  OperationLogDetail,
  OperationLogArchiveResult,
  OperationLogItem,
  OperationLogQuery,
  Flower,
  FlowerQuery,
  PaginatedResult,
  ShopInfo,
  SiteConfig,
  SystemStatus,
  TeamMember,
} from "@/types";
import { safeReadJsonStorage, safeReadStorage, safeRemoveStorage, safeWriteStorage } from "@/utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ADMIN_TOKEN_KEY = "flower_shop_admin_token";
const ADMIN_SESSION_KEY = "flower_shop_admin_session";
const inFlightMutations = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_RETRY_COUNT = 1;

type CachePolicy = {
  key: string;
  ttlMs: number;
};

type RequestOptions = RequestInit & {
  timeoutMs?: number;
  retryCount?: number;
};

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function mergeAbortSignals(...signals: Array<AbortSignal | null | undefined>) {
  const availableSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  if (availableSignals.length <= 1) {
    return availableSignals[0];
  }

  const controller = new AbortController();
  const abort = () => {
    controller.abort();
    cleanup();
  };
  const cleanup = () => {
    availableSignals.forEach((signal) => signal?.removeEventListener("abort", abort));
  };
  availableSignals.forEach((signal) => {
    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }
  });
  return controller.signal;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getAdminToken() {
  return safeReadStorage(ADMIN_TOKEN_KEY);
}

export function getAdminSession() {
  return safeReadJsonStorage<AdminSession | null>(ADMIN_SESSION_KEY, null);
}

export function clearAdminToken() {
  safeRemoveStorage(ADMIN_TOKEN_KEY);
  safeRemoveStorage(ADMIN_SESSION_KEY);
}

function setAdminToken(token: string) {
  safeWriteStorage(ADMIN_TOKEN_KEY, token);
}

function setAdminSession(session: AdminSession) {
  safeWriteStorage(ADMIN_SESSION_KEY, JSON.stringify(session));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAdminToken();
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, retryCount = DEFAULT_RETRY_COUNT, signal, ...fetchOptions } = options;

  const execute = async () => {
    const timeoutController = new AbortController();
    const mergedSignal = mergeAbortSignals(signal, timeoutController.signal);
    const timeout = window.setTimeout(() => timeoutController.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        signal: mergedSignal,
        headers: {
          ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "请求失败" }));
        throw new Error(error.message ?? "请求失败");
      }

      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    } catch (error) {
      if (isAbortError(error)) {
        if (signal?.aborted) {
          throw error;
        }
        throw new Error("请求超时，请稍后重试");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await execute();
    } catch (error) {
      if (isAbortError(error) || attempt >= retryCount) {
        throw error;
      }
      await delay(250 * (attempt + 1));
    }
  }
}

async function requestCached<T>(path: string, cache: CachePolicy, options: RequestOptions = {}): Promise<T> {
  const now = Date.now();
  const cached = responseCache.get(cache.key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = await request<T>(path, options);
  responseCache.set(cache.key, {
    expiresAt: now + cache.ttlMs,
    value,
  });
  return value;
}

function invalidateCache(...keys: string[]) {
  keys.forEach((key) => responseCache.delete(key));
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

export function getFlowers(query: FlowerQuery = {}, options: RequestOptions = {}) {
  return request<PaginatedResult<Flower>>(withQuery("/api/flowers", query), options);
}

export async function listAllFlowers(baseQuery: Omit<FlowerQuery, "page" | "limit"> = {}, options: RequestOptions = {}) {
  const pageSize = 200;
  const firstPage = await getFlowers({ ...baseQuery, page: 1, limit: pageSize }, options);
  const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize));
  const remainingPages = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          getFlowers({ ...baseQuery, page: index + 2, limit: pageSize }, options),
        ),
      )
    : [];

  return [firstPage, ...remainingPages].flatMap((page) => page.list);
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
    request<AdminLoginResult>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  );
  setAdminToken(result.token);
  setAdminSession({
    username: result.username,
    requirePasswordChange: result.requirePasswordChange,
    passwordChangedAt: result.passwordChangedAt,
  });
  return result;
}

export function getCurrentAdmin() {
  return request<AdminSession>("/api/admin/me").then((result) => {
    setAdminSession(result);
    return result;
  });
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return withMutationGuard("admin:change-password", () =>
    request<AdminPasswordChangeResult>("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then((result) => {
      setAdminSession({
        username: result.username,
        requirePasswordChange: result.requirePasswordChange,
        passwordChangedAt: result.changedAt,
      });
      return result;
    }),
  );
}

export function getAdminSystemStatus(options: RequestOptions = {}) {
  return request<SystemStatus>("/api/admin/system/status", options);
}

export function getAdminOpsTasks(options: RequestOptions = {}) {
  return request<AdminOpsTaskList>("/api/admin/system/ops-tasks", options);
}

export function getAdminBackups(options: RequestOptions = {}) {
  return request<AdminBackupFileList>("/api/admin/system/backups", options);
}

export function createAdminBackupTask() {
  return withMutationGuard("admin:ops-task:backup", () =>
    request<AdminOpsTask>("/api/admin/system/ops-tasks/backup", {
      method: "POST",
      timeoutMs: 30_000,
      retryCount: 0,
    }),
  );
}

export function createAdminInspectionTask() {
  return withMutationGuard("admin:ops-task:inspection", () =>
    request<AdminOpsTask>("/api/admin/system/ops-tasks/inspection", {
      method: "POST",
      timeoutMs: 30_000,
      retryCount: 0,
    }),
  );
}

export function archiveAdminOperationLogs(before: string) {
  return withMutationGuard(`admin:operation-logs:archive:${before}`, () =>
    request<OperationLogArchiveResult>(withQuery("/api/admin/system/operation-logs/archive", { before }), {
      method: "POST",
    }),
  );
}

export function getAdminOperationLogArchiveFiles(options: RequestOptions = {}) {
  return request<OperationLogArchiveFile[]>("/api/admin/system/operation-logs/archive-files", options);
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

export async function downloadAdminFile(downloadUrl: string, fallbackFilename: string) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("请先登录管理后台");
  }

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
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export async function downloadAdminConfigExport() {
  const token = getAdminToken();
  if (!token) {
    throw new Error("请先登录管理后台");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/system/config-export`, {
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
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `site-config-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export function importAdminConfig(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return withMutationGuard(`admin:config-import:${file.name}:${file.size}`, () =>
    request<{
      version: string;
      importedAt: string;
      timelineCount: number;
      teamCount: number;
      includedAiSettings: boolean;
    }>("/api/admin/system/config-import", {
      method: "POST",
      body: formData,
      headers: {},
      timeoutMs: 30_000,
      retryCount: 0,
    }).then((result) => {
      invalidateCache(
        "public:site-config",
        "admin:site-config",
        "public:shop-info",
        "public:brand-story",
        "public:about-page",
        "public:about-timeline",
        "public:team",
        "admin:about-page",
        "admin:about-timeline",
        "admin:team",
        "admin:ai-settings",
        "dashboard:data",
      );
      return result;
    }),
  );
}

export function getAdminContacts(
  query: { page?: number; limit?: number; keyword?: string; status?: "all" | "read" | "unread"; deleted?: "active" | "deleted" | "all" } = {},
  options: RequestOptions = {},
) {
  return request<PaginatedResult<ContactMessage>>(withQuery("/api/admin/contacts", query), options);
}

export function markAdminContactRead(id: string) {
  return withMutationGuard(`admin:contact:read:${id}`, () =>
    request<ContactMessage>(`/api/admin/contacts/${id}/read`, {
      method: "PATCH",
    }),
  );
}

export function deleteAdminContact(id: string) {
  return withMutationGuard(`admin:contact:delete:${id}`, () =>
    request<void>(`/api/admin/contacts/${id}`, {
      method: "DELETE",
    }),
  );
}

export function restoreAdminContact(id: string) {
  return withMutationGuard(`admin:contact:restore:${id}`, () =>
    request<ContactMessage>(`/api/admin/contacts/${id}/restore`, {
      method: "POST",
    }),
  );
}

export function getAdminOperationLogs(query: OperationLogQuery = {}, options: RequestOptions = {}) {
  return request<PaginatedResult<OperationLogItem>>(withQuery("/api/admin/operation-logs", query), options);
}

export async function downloadAdminOperationLogs(query: OperationLogQuery = {}) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("请先登录管理后台");
  }

  const path = withQuery("/api/admin/operation-logs/export", query);
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `operation-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export function getAdminOperationLogDetail(id: number, options: RequestOptions = {}) {
  return request<OperationLogDetail>(`/api/admin/operation-logs/${id}`, options);
}

export function restoreAdminOperationLog(id: number, reason?: string) {
  return withMutationGuard(`admin:operation-log:restore:${id}`, () =>
    request<OperationLogDetail>(`/api/admin/operation-logs/${id}/restore`, {
      method: "POST",
      body: JSON.stringify({ reason: reason ?? "" }),
    }),
  );
}

export function getSiteConfig(options: RequestOptions = {}) {
  return requestCached<SiteConfig>("/api/site-config", {
    key: "public:site-config",
    ttlMs: 60_000,
  }, options);
}

export function getAdminSiteConfig(options: RequestOptions = {}) {
  return requestCached<SiteConfig>("/api/admin/site-config", {
    key: "admin:site-config",
    ttlMs: 30_000,
  }, options);
}

export function getAboutPage(options: RequestOptions = {}) {
  return requestCached<AboutPageContent>("/api/about-page", {
    key: "public:about-page",
    ttlMs: 60_000,
  }, options);
}

export function getAboutTimeline(options: RequestOptions = {}) {
  return requestCached<AboutTimelineEntry[]>("/api/about-timeline", {
    key: "public:about-timeline",
    ttlMs: 60_000,
  }, options);
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
    }).then((result) => {
      invalidateCache(
        "public:site-config",
        "admin:site-config",
        "public:shop-info",
        "public:brand-story",
        "dashboard:data",
      );
      return result;
    }),
  );
}

export function getAdminAiSettings(options: RequestOptions = {}) {
  return requestCached<AiSettings>("/api/admin/system/ai-settings", {
    key: "admin:ai-settings",
    ttlMs: 30_000,
  }, options);
}

export function updateAdminAiSettings(payload: AiSettings) {
  return withMutationGuard("admin:ai-settings:update", () =>
    request<AiSettings>("/api/admin/system/ai-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((result) => {
      invalidateCache("admin:ai-settings");
      return result;
    }),
  );
}

export function createFlower(flower: Flower) {
  return withMutationGuard(`admin:flower:create:${flower.id}`, () =>
    request<Flower>("/api/flowers", {
      method: "POST",
      body: JSON.stringify(flower),
    }).then((result) => {
      invalidateCache("dashboard:data");
      return result;
    }),
  );
}

export function updateFlower(id: string, flower: Flower) {
  return withMutationGuard(`admin:flower:update:${id}`, () =>
    request<Flower>(`/api/flowers/${id}`, {
      method: "PUT",
      body: JSON.stringify(flower),
    }).then((result) => {
      invalidateCache("dashboard:data");
      return result;
    }),
  );
}

export function deleteFlower(id: string) {
  return withMutationGuard(`admin:flower:delete:${id}`, () =>
    request<void>(`/api/flowers/${id}`, { method: "DELETE" }).then((result) => {
      invalidateCache("dashboard:data");
      return result;
    }),
  );
}

export function getAdminFlowers(
  query: FlowerQuery & { deleted?: "active" | "deleted" | "all" } = {},
  options: RequestOptions = {},
) {
  return request<PaginatedResult<Flower>>(withQuery("/api/admin/flowers", query), options);
}

export async function listAllAdminFlowers(
  baseQuery: Omit<FlowerQuery, "page" | "limit"> & { deleted?: "active" | "deleted" | "all" } = {},
  options: RequestOptions = {},
) {
  const pageSize = 200;
  const firstPage = await getAdminFlowers({ ...baseQuery, page: 1, limit: pageSize }, options);
  const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize));
  const remainingPages = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          getAdminFlowers({ ...baseQuery, page: index + 2, limit: pageSize }, options),
        ),
      )
    : [];

  return [firstPage, ...remainingPages].flatMap((page) => page.list);
}

export function restoreFlower(id: string) {
  return withMutationGuard(`admin:flower:restore:${id}`, () =>
    request<Flower>(`/api/admin/flowers/${id}/restore`, {
      method: "POST",
    }).then((result) => {
      invalidateCache("dashboard:data");
      return result;
    }),
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

export function getCategories(options: RequestOptions = {}) {
  return requestCached<Category[]>("/api/categories", {
    key: "public:categories",
    ttlMs: 60_000,
  }, options);
}

export function getShopInfo(options: RequestOptions = {}) {
  return requestCached<ShopInfo>("/api/shop-info", {
    key: "public:shop-info",
    ttlMs: 60_000,
  }, options);
}

export function getBrandStory(options: RequestOptions = {}) {
  return requestCached<BrandStory>("/api/brand-story", {
    key: "public:brand-story",
    ttlMs: 60_000,
  }, options);
}

export async function getDashboardData(options: RequestOptions = {}) {
  const cached = responseCache.get("dashboard:data");
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as {
      flowers: Flower[];
      categories: Category[];
      siteConfig: SiteConfig;
      shopInfo: ShopInfo;
      brandStory: BrandStory;
    };
  }

  const flowers = await listAllFlowers({ sortBy: "featured" }, options);

  const [categories, siteConfig, shopInfo, brandStory] = await Promise.all([
    getCategories(options),
    getSiteConfig(options),
    getShopInfo(options),
    getBrandStory(options),
  ]);

  const value = {
    flowers,
    categories,
    siteConfig,
    shopInfo,
    brandStory,
  };
  responseCache.set("dashboard:data", {
    expiresAt: Date.now() + 30_000,
    value,
  });
  return value;
}

export function getTeamMembers(options: RequestOptions = {}) {
  return requestCached<TeamMember[]>("/api/team", {
    key: "public:team",
    ttlMs: 60_000,
  }, options);
}

export function getAdminAboutPage(options: RequestOptions = {}) {
  return requestCached<AboutPageContent>("/api/admin/about-page", {
    key: "admin:about-page",
    ttlMs: 30_000,
  }, options);
}

export function updateAdminAboutPage(payload: AboutPageContent) {
  return withMutationGuard("admin:about-page:update", () =>
    request<AboutPageContent>("/api/admin/about-page", {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((result) => {
      invalidateCache("admin:about-page", "public:about-page");
      return result;
    }),
  );
}

export function getAdminAboutTimeline(options: RequestOptions = {}) {
  return requestCached<AboutTimelineEntry[]>("/api/admin/about-timeline", {
    key: "admin:about-timeline",
    ttlMs: 30_000,
  }, options);
}

export function getAdminAboutTimelineByDeleted(
  deleted: "active" | "deleted" | "all" = "active",
  options: RequestOptions = {},
) {
  return request<AboutTimelineEntry[]>(withQuery("/api/admin/about-timeline", { deleted }), options);
}

export function createAdminAboutTimeline(entry: Omit<AboutTimelineEntry, "id"> & { id?: string }) {
  return withMutationGuard(`admin:about-timeline:create:${entry.id ?? entry.yearLabel}`, () =>
    request<AboutTimelineEntry>("/api/admin/about-timeline", {
      method: "POST",
      body: JSON.stringify(entry),
    }).then((result) => {
      invalidateCache("admin:about-timeline", "public:about-timeline");
      return result;
    }),
  );
}

export function updateAdminAboutTimeline(id: string, entry: Omit<AboutTimelineEntry, "id">) {
  return withMutationGuard(`admin:about-timeline:update:${id}`, () =>
    request<AboutTimelineEntry>(`/api/admin/about-timeline/${id}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    }).then((result) => {
      invalidateCache("admin:about-timeline", "public:about-timeline");
      return result;
    }),
  );
}

export function deleteAdminAboutTimeline(id: string) {
  return withMutationGuard(`admin:about-timeline:delete:${id}`, () =>
    request<void>(`/api/admin/about-timeline/${id}`, {
      method: "DELETE",
    }).then((result) => {
      invalidateCache("admin:about-timeline", "public:about-timeline");
      return result;
    }),
  );
}

export function restoreAdminAboutTimeline(id: string) {
  return withMutationGuard(`admin:about-timeline:restore:${id}`, () =>
    request<AboutTimelineEntry>(`/api/admin/about-timeline/${id}/restore`, {
      method: "POST",
    }).then((result) => {
      invalidateCache("admin:about-timeline", "public:about-timeline");
      return result;
    }),
  );
}

export function getAdminTeamMembers(options: RequestOptions = {}) {
  return requestCached<TeamMember[]>("/api/admin/team", {
    key: "admin:team",
    ttlMs: 30_000,
  }, options);
}

export function getAdminTeamMembersByDeleted(
  deleted: "active" | "deleted" | "all" = "active",
  options: RequestOptions = {},
) {
  return request<TeamMember[]>(withQuery("/api/admin/team", { deleted }), options);
}

export function createAdminTeamMember(member: TeamMember) {
  return withMutationGuard(`admin:team:create:${member.id}`, () =>
    request<TeamMember>("/api/admin/team", {
      method: "POST",
      body: JSON.stringify(member),
    }).then((result) => {
      invalidateCache("admin:team", "public:team");
      return result;
    }),
  );
}

export function updateAdminTeamMember(id: string, member: TeamMember) {
  return withMutationGuard(`admin:team:update:${id}`, () =>
    request<TeamMember>(`/api/admin/team/${id}`, {
      method: "PUT",
      body: JSON.stringify(member),
    }).then((result) => {
      invalidateCache("admin:team", "public:team");
      return result;
    }),
  );
}

export function deleteAdminTeamMember(id: string) {
  return withMutationGuard(`admin:team:delete:${id}`, () =>
    request<void>(`/api/admin/team/${id}`, {
      method: "DELETE",
    }).then((result) => {
      invalidateCache("admin:team", "public:team");
      return result;
    }),
  );
}

export function restoreAdminTeamMember(id: string) {
  return withMutationGuard(`admin:team:restore:${id}`, () =>
    request<TeamMember>(`/api/admin/team/${id}/restore`, {
      method: "POST",
    }).then((result) => {
      invalidateCache("admin:team", "public:team");
      return result;
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
