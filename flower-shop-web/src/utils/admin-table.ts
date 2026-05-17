export const ADMIN_PAGE_SIZE_OPTIONS = ["10", "20", "50"];

interface IdentifiableRow {
  id: string;
}

export function buildSelectedTableRows<T extends IdentifiableRow>(list: T[], selectedRowKeys: string[]) {
  if (!list.length || !selectedRowKeys.length) {
    return [];
  }

  const selectedIdSet = new Set(selectedRowKeys);
  return list.filter((item) => selectedIdSet.has(item.id));
}

export function omitSelectedRowKeys(selectedRowKeys: string[], removedIds: string[]) {
  if (!selectedRowKeys.length || !removedIds.length) {
    return selectedRowKeys;
  }

  const removedIdSet = new Set(removedIds);
  return selectedRowKeys.filter((item) => !removedIdSet.has(item));
}

export function buildBatchMutationSummary<T extends IdentifiableRow>(
  list: T[],
  results: PromiseSettledResult<unknown>[],
) {
  const succeededIds = list.flatMap((item, index) => (results[index]?.status === "fulfilled" ? [item.id] : []));
  return {
    succeededIds,
    failedCount: results.length - succeededIds.length,
  };
}
