import { BarChart3, Flower2, Globe, Settings } from "lucide-react";

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
    description: "更新首页、门店与品牌故事",
    icon: Settings,
  },
] as const;

export const adminPublicLink = {
  path: "/",
  label: "查看网站",
  icon: Globe,
};

export const adminPageMeta = {
  "/admin": {
    eyebrow: "Overview",
    title: "运营总览",
    description: "先看网站状态，再进入作品与内容编辑。",
  },
  "/admin/flowers": {
    eyebrow: "Catalog",
    title: "作品管理",
    description: "筛选、整理与更新作品内容，保持前台展示一致。",
  },
  "/admin/settings": {
    eyebrow: "Content",
    title: "站点配置",
    description: "维护首页表达、门店信息与品牌故事内容。",
  },
} as const;
