import { BarChart3, ClipboardList, Flower2, Globe, HardDriveDownload, MessageSquareMore, Settings, Sparkles } from "lucide-react";
import type { SiteConfig } from "@/types";

export const adminNavItems = [
  {
    key: "dashboard",
    path: "/admin",
    label: "运营总览",
    description: "查看站点与作品状态",
    icon: BarChart3,
  },
  {
    key: "flowers",
    path: "/admin/flowers",
    label: "作品管理",
    description: "维护花束内容与封面",
    icon: Flower2,
  },
  {
    key: "settings",
    path: "/admin/settings",
    label: "站点配置",
    description: "统一维护首页、门店信息与关于我们",
    icon: Settings,
  },
  {
    key: "ai-settings",
    path: "/admin/ai-settings",
    label: "AI 生图配置",
    description: "维护生图开关、密钥、模型与接口参数",
    icon: Sparkles,
  },
  {
    key: "contacts",
    path: "/admin/contacts",
    label: "用户留言",
    description: "查看访客提交的预约与咨询内容",
    icon: MessageSquareMore,
  },
  {
    key: "system",
    path: "/admin/system",
    label: "运维中心",
    description: "统一查看状态、备份、巡检与配置迁移",
    icon: HardDriveDownload,
  },
  {
    key: "operation-logs",
    path: "/admin/operation-logs",
    label: "操作日志",
    description: "查看后台写操作记录并按快照恢复",
    icon: ClipboardList,
  },
] as const;

export const adminPublicLink = {
  path: "/",
  label: "查看网站",
  icon: Globe,
};

export const adminPageMeta = {
  "/admin": {
    eyebrow: "后台概览",
    title: "运营总览",
    description: "先看网站状态，再进入作品与内容编辑。",
  },
  "/admin/flowers": {
    eyebrow: "作品目录",
    title: "作品管理",
    description: "筛选、整理与更新作品内容，保持前台展示一致。",
  },
  "/admin/settings": {
    eyebrow: "动态配置",
    title: "站点配置",
    description: "统一维护站点首页、门店信息、品牌故事与关于我们内容。",
  },
  "/admin/ai-settings": {
    eyebrow: "AI 工作台",
    title: "AI 生图配置",
    description: "统一维护 AI 生图与作品信息建议能力所需的开关、密钥、模型和接口参数。",
  },
  "/admin/contacts": {
    eyebrow: "访客留言",
    title: "用户留言",
    description: "查看访客提交的预约、咨询与定制需求。",
  },
  "/admin/system": {
    eyebrow: "运维状态",
    title: "运维中心",
    description: "统一查看系统状态，并执行备份、巡检和配置迁移。",
  },
  "/admin/operation-logs": {
    eyebrow: "审计恢复",
    title: "操作日志",
    description: "记录后台写操作和登录行为，并支持按历史快照恢复误操作数据。",
  },
} as const;

export function resolveAdminPageMeta(pathname: string, siteConfig?: SiteConfig | null) {
  const fallback = adminPageMeta["/admin"];
  switch (pathname) {
    case "/admin":
      return {
        eyebrow: siteConfig?.adminDashboardEyebrow || fallback.eyebrow,
        title: siteConfig?.adminDashboardTitle || adminPageMeta["/admin"].title,
        description: siteConfig?.adminDashboardDescription || adminPageMeta["/admin"].description,
      };
    case "/admin/flowers":
      return {
        eyebrow: siteConfig?.adminFlowersEyebrow || adminPageMeta["/admin/flowers"].eyebrow,
        title: siteConfig?.adminFlowersTitle || adminPageMeta["/admin/flowers"].title,
        description: siteConfig?.adminFlowersDescription || adminPageMeta["/admin/flowers"].description,
      };
    case "/admin/settings":
      return {
        eyebrow: siteConfig?.adminSettingsEyebrow || adminPageMeta["/admin/settings"].eyebrow,
        title: siteConfig?.adminSettingsTitle || adminPageMeta["/admin/settings"].title,
        description: siteConfig?.adminSettingsDescription || adminPageMeta["/admin/settings"].description,
      };
    case "/admin/ai-settings":
      return {
        eyebrow: siteConfig?.adminAiEyebrow || adminPageMeta["/admin/ai-settings"].eyebrow,
        title: siteConfig?.adminAiTitle || adminPageMeta["/admin/ai-settings"].title,
        description: siteConfig?.adminAiDescription || adminPageMeta["/admin/ai-settings"].description,
      };
    case "/admin/contacts":
      return {
        eyebrow: siteConfig?.adminContactsEyebrow || adminPageMeta["/admin/contacts"].eyebrow,
        title: siteConfig?.adminContactsTitle || adminPageMeta["/admin/contacts"].title,
        description: siteConfig?.adminContactsDescription || adminPageMeta["/admin/contacts"].description,
      };
    case "/admin/system":
      return {
        eyebrow: siteConfig?.adminSystemEyebrow || adminPageMeta["/admin/system"].eyebrow,
        title: siteConfig?.adminSystemTitle || adminPageMeta["/admin/system"].title,
        description: siteConfig?.adminSystemDescription || adminPageMeta["/admin/system"].description,
      };
    case "/admin/operation-logs":
      return {
        eyebrow: siteConfig?.adminOperationLogsEyebrow || adminPageMeta["/admin/operation-logs"].eyebrow,
        title: siteConfig?.adminOperationLogsTitle || adminPageMeta["/admin/operation-logs"].title,
        description: siteConfig?.adminOperationLogsDescription || adminPageMeta["/admin/operation-logs"].description,
      };
    default:
      return adminPageMeta[pathname as keyof typeof adminPageMeta] ?? fallback;
  }
}
