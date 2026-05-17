import type { ContactMessage, PaginatedResult } from "@/types";
import { buildBatchMutationSummary, buildSelectedTableRows } from "@/utils/admin-table";

export type ContactStatusFilter = "all" | "read" | "unread";
export type ContactDeletedFilter = "active" | "deleted";

interface ContactFilterState {
  keyword: string;
  status: ContactStatusFilter;
  deletedFilter: ContactDeletedFilter;
}

export function hasContactActiveFilters(state: ContactFilterState) {
  return Boolean(state.keyword.trim()) || state.status !== "all" || state.deletedFilter !== "active";
}

export function buildContactFilterSummary(state: ContactFilterState) {
  const parts: string[] = [];
  if (state.deletedFilter === "deleted") parts.push("已删除数据");
  if (state.keyword.trim()) parts.push(`关键词“${state.keyword.trim()}”`);
  if (state.status === "read") parts.push("仅看已读");
  if (state.status === "unread") parts.push("仅看未读");
  return parts;
}

export function buildContactPageStats(list: ContactMessage[]) {
  const unreadCount = list.filter((item) => !item.readAt).length;
  const readCount = list.length - unreadCount;
  return { unreadCount, readCount };
}

export function buildContactMetricsSource(data: PaginatedResult<ContactMessage> | null) {
  const list = data?.list ?? [];
  const latest = list[0] ?? null;
  const { unreadCount, readCount } = buildContactPageStats(list);
  return {
    total: data?.total ?? 0,
    latest,
    unreadCount,
    readCount,
  };
}

export function buildSelectedContacts(list: ContactMessage[], selectedRowKeys: string[]) {
  return buildSelectedTableRows(list, selectedRowKeys);
}

export function buildContactBatchMutationSummary(
  list: ContactMessage[],
  results: PromiseSettledResult<unknown>[],
) {
  return buildBatchMutationSummary(list, results);
}
