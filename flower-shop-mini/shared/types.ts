export interface Flower {
  id: string;
  code: string;
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

export interface SiteConfig {
  brandName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  heroSlides?: string[];
  contactImages?: string[];
  primaryCtaText: string;
  secondaryCtaText: string;
  stats: SiteStat[];
  homeStorySectionTitle?: string;
  homeStorySectionIntro?: string;
  homeFeaturedSectionTitle?: string;
  homeFeaturedSectionIntro?: string;
  aboutStorySectionEyebrow?: string;
  aboutTeamSectionEyebrow?: string;
  aboutTeamSectionTitle?: string;
  aboutTeamSectionIntro?: string;
  galleryPageTitle?: string;
  galleryPageIntro?: string;
  gallerySearchPlaceholder?: string;
  galleryEmptyText?: string;
  galleryLoadErrorText?: string;
  contactPageTitle?: string;
  contactPageSubmitText?: string;
  contactSubmitSuccessText?: string;
  consultButtonText?: string;
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
