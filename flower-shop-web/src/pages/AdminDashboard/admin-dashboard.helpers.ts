import type { BrandStory, Category, ContactMessage, Flower, OperationLogItem, PaginatedResult, ShopInfo, SiteConfig } from "@/types";
import { formatAdminActionLabel, formatAdminModuleLabel, formatAdminTargetTypeLabel } from "@/utils/admin-display";
import { formatDate, getTimestamp } from "@/utils/datetime";

export interface DashboardData {
  flowers: Flower[];
  categories: Category[];
  siteConfig: SiteConfig;
  shopInfo: ShopInfo;
  brandStory: BrandStory;
  latestContacts: PaginatedResult<ContactMessage>;
  unreadContacts: PaginatedResult<ContactMessage>;
  failedOperationLogs: PaginatedResult<OperationLogItem>;
  restorableOperationLogs: PaginatedResult<OperationLogItem>;
}

export function buildDashboardSummary(data: DashboardData) {
  const categoryNameMap = new Map(
    data.categories
      .filter((item) => item.id !== "all")
      .map((item) => [item.id, item.name]),
  );

  const categoryCount = data.categories.filter((item) => item.id !== "all").length;
  const featuredCount = data.flowers.filter((item) => item.featured).length;
  const latestFlower = [...data.flowers].sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))[0];
  const latestContact = data.latestContacts.list[0];
  const attentionFlowers = data.flowers
    .filter((item) => !item.featured)
    .sort((a, b) => b.sort - a.sort)
    .slice(0, 4);
  const recentFlowers = [...data.flowers]
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
    .slice(0, 4);
  const categoryDistribution = data.categories
    .filter((item) => item.id !== "all")
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: data.flowers.filter((flower) => flower.categoryId === category.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const featuredRate = data.flowers.length ? Math.round((featuredCount / data.flowers.length) * 100) : 0;
  const latestFailedLog = data.failedOperationLogs.list[0];
  const latestRestorableLog = data.restorableOperationLogs.list[0];

  return {
    categoryCount,
    categoryNameMap,
    featuredCount,
    unreadContacts: data.unreadContacts.total,
    normalCount: data.flowers.length - featuredCount,
    latestFlower,
    latestContact,
    attentionFlowers,
    recentFlowers,
    categoryDistribution,
    featuredRate,
    latestFailedLog,
    latestRestorableLog,
  };
}

export function buildDashboardStats(data: DashboardData, summary: ReturnType<typeof buildDashboardSummary>) {
  return [
    { label: "作品总数", value: data.flowers.length, note: "当前已发布到前台的全部作品", to: "/admin/flowers" },
    { label: "待补精选", value: summary.normalCount, note: "仍可继续筛选为精选展示的普通作品", to: "/admin/flowers?featured=normal" },
    {
      label: "未读留言",
      value: summary.unreadContacts,
      note: summary.latestContact ? `最近一条来自 ${summary.latestContact.name}` : "优先处理访客咨询与预约内容",
      to: "/admin/contacts?status=unread",
    },
    { label: "最近上新", value: formatDate(summary.latestFlower?.createdAt), note: summary.latestFlower?.name ?? "尚未发现作品记录", to: "/admin/flowers" },
  ];
}

export function buildDashboardAuditCards(data: DashboardData, summary: ReturnType<typeof buildDashboardSummary>) {
  return [
    {
      label: "失败操作",
      value: data.failedOperationLogs.total,
      note: summary.latestFailedLog
        ? `${formatAdminModuleLabel(summary.latestFailedLog.module)} · ${formatAdminActionLabel(summary.latestFailedLog.action)}`
        : "当前没有失败日志",
      to: "/admin/operation-logs?success=false",
      tone: "text-[#9f4b45]",
      iconBg: "bg-[#f7e5e3]",
    },
    {
      label: "可恢复日志",
      value: data.restorableOperationLogs.total,
      note: summary.latestRestorableLog
        ? `${formatAdminTargetTypeLabel(summary.latestRestorableLog.targetType)} · ${summary.latestRestorableLog.targetId || "可恢复记录"}`
        : "当前没有可恢复日志",
      to: "/admin/operation-logs?restorable=true",
      tone: "text-forest",
      iconBg: "bg-[#edf4eb]",
    },
  ];
}
