import { BarChart3, BookOpenText, Flower2, Globe, MessageSquareMore, Settings } from "lucide-react";

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
  {
    key: "about",
    path: "/admin/about",
    label: "关于我们",
    description: "维护 About 页首图、故事、时间轴与团队",
    icon: BookOpenText,
  },
  {
    key: "contacts",
    path: "/admin/contacts",
    label: "用户留言",
    description: "查看访客提交的预约与咨询内容",
    icon: MessageSquareMore,
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
  "/admin/about": {
    eyebrow: "About",
    title: "关于我们",
    description: "维护 About 页首图、品牌故事、发展时间轴与团队成员。",
  },
  "/admin/contacts": {
    eyebrow: "Messages",
    title: "用户留言",
    description: "查看访客提交的预约、咨询与定制需求。",
  },
} as const;
