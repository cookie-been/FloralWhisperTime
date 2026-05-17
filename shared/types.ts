export interface Flower {
  id: string;
  name: string;
  categoryId: string;
  images: string[];
  price: number;
  description: string;
  materials: string[];
  meaning: string;
  tags: string[];
  featured: boolean;
  sort: number;
  createdAt: string;
  deleted?: boolean;
}

export interface FlowerQuery {
  categoryId?: string;
  tag?: string;
  keyword?: string;
  sortBy?: "featured" | "latest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  sort: number;
}

export interface ShopInfo {
  name: string;
  phone: string;
  wechat?: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: BusinessHours;
}

export interface BusinessHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

export interface TimeRange {
  open: string;
  close: string;
  off?: boolean;
}

export interface BrandStory {
  title: string;
  subtitle?: string;
  content: string;
  images: string[];
}

export interface AboutPageContent {
  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  storyTitle: string;
  storyContent: string;
}

export interface AboutTimelineEntry {
  id: string;
  yearLabel: string;
  content: string;
  sort: number;
  deleted?: boolean;
}

export interface SiteStat {
  value: string;
  label: string;
}

export interface AiSettings {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  apiKeyConfigured?: boolean;
  apiKeyMasked?: string;
  model: string;
  baseUrl: string;
  generatePath: string;
  size: string;
  textModel?: string;
  textGeneratePath?: string;
  textTemperature?: number;
  textMaxTokens?: number;
}

export interface ProtectionSnapshot {
  enabled: boolean;
  publicReadCapacity: number;
  publicWriteCapacity: number;
  adminCapacity: number;
  heavyCapacity: number;
  aiMaxConcurrent: number;
  uploadMaxConcurrent: number;
  configImportMaxConcurrent: number;
  rateLimitedCount: number;
  busyRejectedCount: number;
}

export interface SecurityOverview {
  adminPasswordInitialized: boolean;
  usingDefaultAdminPassword: boolean;
  jwtSecretCustomized: boolean;
  dataEncryptionKeyCustomized: boolean;
  aiKeyEncryptedAtRest: boolean;
  securityLevel: "good" | "warning" | "risk" | string;
  securitySummary: string;
}

export interface SiteConfig {
  brandName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  brandLogo?: string;
  heroSlides?: string[];
  adminLoginSlides?: string[];
  contactImages?: string[];
  adminBrandTitle?: string;
  adminBrandSubtitle?: string;
  adminBrandDescription?: string;
  homeStorySectionTitle?: string;
  homeStorySectionIntro?: string;
  homeStoryPrimaryLabel?: string;
  homeStoryPrimaryTitle?: string;
  homeStoryPrimaryDescription?: string;
  homeStoryServiceLabel?: string;
  homeStoryServiceDescription?: string;
  homeStoryExperienceLabel?: string;
  homeStoryExperienceDescription?: string;
  homeStoryStoreLabel?: string;
  homeStoryDetailLinkText?: string;
  homeFeaturedSectionEyebrow?: string;
  homeFeaturedSectionTitle?: string;
  homeFeaturedSectionIntro?: string;
  homeFeaturedSectionLinkText?: string;
  homeServiceSectionEyebrow?: string;
  homeServiceSectionTitle?: string;
  homeServiceSectionIntro?: string;
  homeServiceSectionLinkText?: string;
  aboutStorySectionEyebrow?: string;
  aboutTimelineSectionEyebrow?: string;
  aboutTimelineSectionTitle?: string;
  aboutTeamSectionEyebrow?: string;
  aboutTeamSectionTitle?: string;
  aboutTeamSectionIntro?: string;
  galleryPageEyebrow?: string;
  galleryPageTitle?: string;
  galleryPageIntro?: string;
  gallerySearchPlaceholder?: string;
  galleryEmptyText?: string;
  galleryLoadErrorText?: string;
  contactPageTitle?: string;
  contactPageSubmitText?: string;
  contactSubmitSuccessText?: string;
  consultButtonText?: string;
  adminDashboardEyebrow?: string;
  adminDashboardTitle?: string;
  adminDashboardDescription?: string;
  adminFlowersEyebrow?: string;
  adminFlowersTitle?: string;
  adminFlowersDescription?: string;
  adminSettingsEyebrow?: string;
  adminSettingsTitle?: string;
  adminSettingsDescription?: string;
  adminAiEyebrow?: string;
  adminAiTitle?: string;
  adminAiDescription?: string;
  adminContactsEyebrow?: string;
  adminContactsTitle?: string;
  adminContactsDescription?: string;
  adminSystemEyebrow?: string;
  adminSystemTitle?: string;
  adminSystemDescription?: string;
  adminOperationLogsEyebrow?: string;
  adminOperationLogsTitle?: string;
  adminOperationLogsDescription?: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  contactIntro: string;
  businessHoursText: string;
  footerDescription: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio?: string;
  sort: number;
  deleted?: boolean;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactForm {
  name: string;
  phone: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  deleted?: boolean;
}

export interface SystemStatus {
  service: string;
  version: string;
  deploymentEnvironment: string;
  gitRevision: string;
  buildTime: string;
  deployedAt: string;
  databaseConnected: boolean;
  databaseVersion: string;
  databaseSize: string;
  diskTotal: string;
  diskUsable: string;
  diskUsageRate: string;
  uploadDirectoryReady: boolean;
  uploadDirectoryPath: string;
  uploadFileCount: number;
  uploadDirectorySize: string;
  uptimeLabel: string;
  aiEnabled: boolean;
  aiKeyConfigured: boolean;
  aiProvider: string;
  aiImageModel: string;
  aiTextModel: string;
  latestBackupName: string;
  latestBackupPath: string;
  latestBackupModifiedAt: string;
  latestBackupDownloadUrl: string;
  latestBackupPresent: boolean;
  adminPasswordChangedAt: string;
  operationLogCount: number;
  operationLogRetentionDays: number;
  operationLogArchiveBefore: string;
  requirePasswordChange: boolean;
  deliveryInitialized: boolean;
  protection?: ProtectionSnapshot;
  security?: SecurityOverview;
}

export interface AdminOpsTask {
  id: number;
  taskType: "backup" | "inspection" | string;
  taskLabel: string;
  commandName?: string;
  commandPreview?: string;
  status: "running" | "success" | "failed" | string;
  triggerSource: "admin_ui" | string;
  operatorName: string;
  requestPayload: string;
  resultSummary: string;
  resultData: Record<string, unknown>;
  logExcerpt: string;
  errorMessage: string;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOpsTaskList {
  list: AdminOpsTask[];
  total: number;
}

export interface AdminBackupFile {
  backupName: string;
  path: string;
  modifiedAt: string;
  size: string;
  downloadUrl: string;
  latest: boolean;
}

export interface AdminBackupFileList {
  list: AdminBackupFile[];
  total: number;
}

export interface AdminSession {
  username: string;
  requirePasswordChange: boolean;
  passwordChangedAt: string;
}

export interface AdminLoginResult extends AdminSession {
  token: string;
}

export interface AdminPasswordChangeResult extends AdminSession {
  changedAt: string;
}

export interface OperationLogArchiveResult {
  archivedCount: number;
  archiveFilename: string;
  archivePath: string;
  archiveBefore: string;
}

export interface OperationLogArchiveFile {
  filename: string;
  path: string;
  modifiedAt: string;
  size: string;
  downloadUrl: string;
}

export interface OperationLogItem {
  id: number;
  module: string;
  action: string;
  targetType: string;
  targetId: string;
  operatorName: string;
  requestSummary: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  restoredFromLogId?: number | null;
  restorable: boolean;
  createdAt: string;
}

export interface OperationLogDetail extends OperationLogItem {
  beforeSnapshot: string;
  afterSnapshot: string;
  userAgent?: string;
  relatedLogs?: OperationLogItem[];
}

export interface OperationLogQuery {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  operatorName?: string;
  success?: boolean;
  keyword?: string;
  restorable?: boolean;
  createdFrom?: string;
  createdTo?: string;
}
