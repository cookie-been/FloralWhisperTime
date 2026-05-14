import { BarChart3, Flower2, Globe, HardDriveDownload, MessageSquareMore, Settings } from "lucide-react";

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
    label: "内容配置",
    description: "统一维护站点首页、门店信息与关于我们",
    icon: Settings,
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
    label: "系统状态",
    description: "查看版本、备份与 AI 配置状态",
    icon: HardDriveDownload,
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
    title: "内容配置",
    description: "统一维护站点首页、门店信息、品牌故事与关于我们内容。",
  },
  "/admin/contacts": {
    eyebrow: "访客留言",
    title: "用户留言",
    description: "查看访客提交的预约、咨询与定制需求。",
  },
  "/admin/system": {
    eyebrow: "运维状态",
    title: "系统状态",
    description: "快速确认版本、备份、AI 配置和上传目录是否正常。",
  },
} as const;
