export function formatTargetIdentifier(value?: string) {
  return value?.trim() ? value : "系统级记录";
}

export function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatRangeBoundary(value?: string, mode: "start" | "end" = "start") {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (mode === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.toISOString().slice(0, 19);
}

function formatDiffValue(value: unknown) {
  if (value === undefined) return "未提供";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function flattenSnapshot(value: unknown, prefix = "", result: Map<string, string> = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenSnapshot(item, `${prefix}[${index}]`, result);
    });
    if (!value.length && prefix) result.set(prefix, "[]");
    return result;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length && prefix) result.set(prefix, "{}");
    entries.forEach(([key, item]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      flattenSnapshot(item, nextKey, result);
    });
    return result;
  }

  if (prefix) {
    result.set(prefix, formatDiffValue(value));
  }
  return result;
}

export function buildSnapshotDiff(beforeSnapshot?: string, afterSnapshot?: string) {
  if (!beforeSnapshot && !afterSnapshot) {
    return { changes: [], error: "当前日志没有可对比的结构化快照。" };
  }

  try {
    const beforeParsed = beforeSnapshot ? JSON.parse(beforeSnapshot) : undefined;
    const afterParsed = afterSnapshot ? JSON.parse(afterSnapshot) : undefined;
    const beforeMap = flattenSnapshot(beforeParsed);
    const afterMap = flattenSnapshot(afterParsed);
    const keys = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()])).sort();
    const changes = keys
      .map((path) => {
        const before = beforeMap.get(path) ?? "未提供";
        const after = afterMap.get(path) ?? "未提供";
        return {
          path,
          before,
          after,
          status: before === "未提供" ? "added" : after === "未提供" ? "removed" : before === after ? "same" : "changed",
        };
      })
      .filter((item) => item.status !== "same");

    return {
      changes,
      error: changes.length ? "" : "当前日志的前后快照没有结构化字段差异。",
    };
  } catch {
    return {
      changes: [],
      error: "当前快照不是标准 JSON，无法自动生成差异对比。",
    };
  }
}

export type ResultFilter = "all" | "true" | "false";
export type QuickView = "all" | "failed" | "restorable" | "restore";
export type FilterPreset = "todayFailed" | "todayRestore" | "flowerOps" | "contactOps" | "aiOps" | "none";

interface OperationLogFilterState {
  keyword: string;
  module?: string;
  operatorName: string;
  success: ResultFilter;
  action?: string;
  restorable?: boolean;
  createdFrom: string;
  createdTo: string;
}

interface OperationLogListItem {
  success: boolean;
  restorable?: boolean;
  module: string;
}

export function resolveQuickView(state: Pick<OperationLogFilterState, "action" | "restorable" | "success">): QuickView {
  if (state.action === "RESTORE") return "restore";
  if (state.restorable === true) return "restorable";
  if (state.success === "false") return "failed";
  return "all";
}

export function hasOperationLogActiveFilters(state: OperationLogFilterState) {
  return (
    Boolean(state.keyword.trim()) ||
    Boolean(state.module) ||
    Boolean(state.operatorName.trim()) ||
    Boolean(state.action) ||
    state.success !== "all" ||
    state.restorable !== undefined ||
    Boolean(state.createdFrom) ||
    Boolean(state.createdTo)
  );
}

export function resolveOperationLogPreset(state: OperationLogFilterState): FilterPreset {
  const today = getTodayDateValue();
  if (
    state.success === "false" &&
    !state.module &&
    !state.action &&
    state.restorable === undefined &&
    !state.keyword.trim() &&
    !state.operatorName.trim() &&
    state.createdFrom === today &&
    state.createdTo === today
  ) {
    return "todayFailed";
  }
  if (
    state.success === "all" &&
    state.action === "RESTORE" &&
    !state.module &&
    state.restorable === undefined &&
    !state.keyword.trim() &&
    !state.operatorName.trim() &&
    state.createdFrom === today &&
    state.createdTo === today
  ) {
    return "todayRestore";
  }
  if (
    state.module === "FLOWER" &&
    !state.keyword.trim() &&
    !state.operatorName.trim() &&
    !state.action &&
    state.success === "all" &&
    state.restorable === undefined &&
    !state.createdFrom &&
    !state.createdTo
  ) {
    return "flowerOps";
  }
  if (
    state.module === "CONTACT" &&
    !state.keyword.trim() &&
    !state.operatorName.trim() &&
    !state.action &&
    state.success === "all" &&
    state.restorable === undefined &&
    !state.createdFrom &&
    !state.createdTo
  ) {
    return "contactOps";
  }
  if (
    state.module === "AI" &&
    !state.keyword.trim() &&
    !state.operatorName.trim() &&
    !state.action &&
    state.success === "all" &&
    state.restorable === undefined &&
    !state.createdFrom &&
    !state.createdTo
  ) {
    return "aiOps";
  }
  return "none";
}

export function buildOperationLogFilterState(state: OperationLogFilterState) {
  return state;
}

export function buildOperationLogQuickViewState(
  view: QuickView,
  currentState: OperationLogFilterState,
): OperationLogFilterState {
  if (view === "all") {
    return {
      ...currentState,
      success: "all",
      action: undefined,
      restorable: undefined,
    };
  }
  if (view === "failed") {
    return {
      ...currentState,
      success: "false",
      action: undefined,
      restorable: undefined,
    };
  }
  if (view === "restorable") {
    return {
      ...currentState,
      success: "all",
      action: undefined,
      restorable: true,
    };
  }
  return {
    ...currentState,
    success: "all",
    action: "RESTORE",
    restorable: undefined,
  };
}

export function buildOperationLogPresetState(preset: FilterPreset): OperationLogFilterState {
  const today = getTodayDateValue();

  if (preset === "todayFailed") {
    return {
      keyword: "",
      module: undefined,
      operatorName: "",
      success: "false",
      action: undefined,
      restorable: undefined,
      createdFrom: today,
      createdTo: today,
    };
  }

  if (preset === "todayRestore") {
    return {
      keyword: "",
      module: undefined,
      operatorName: "",
      success: "all",
      action: "RESTORE",
      restorable: undefined,
      createdFrom: today,
      createdTo: today,
    };
  }

  if (preset === "flowerOps") {
    return {
      keyword: "",
      module: "FLOWER",
      operatorName: "",
      success: "all",
      action: undefined,
      restorable: undefined,
      createdFrom: "",
      createdTo: "",
    };
  }

  if (preset === "contactOps") {
    return {
      keyword: "",
      module: "CONTACT",
      operatorName: "",
      success: "all",
      action: undefined,
      restorable: undefined,
      createdFrom: "",
      createdTo: "",
    };
  }

  return {
    keyword: "",
    module: "AI",
    operatorName: "",
    success: "all",
    action: undefined,
    restorable: undefined,
    createdFrom: "",
    createdTo: "",
  };
}

export function buildDefaultOperationLogFilterState(): OperationLogFilterState {
  return {
    keyword: "",
    module: undefined,
    operatorName: "",
    success: "all",
    action: undefined,
    restorable: undefined,
    createdFrom: "",
    createdTo: "",
  };
}

export function buildOperationLogFilterSummary(
  state: OperationLogFilterState,
  formatModuleLabel: (value?: string, fallback?: string) => string,
  formatActionLabel: (value?: string, fallback?: string) => string,
) {
  const parts: string[] = [];
  if (state.keyword.trim()) parts.push(`关键词“${state.keyword.trim()}”`);
  if (state.module) parts.push(formatModuleLabel(state.module));
  if (state.operatorName.trim()) parts.push(`操作人 ${state.operatorName.trim()}`);
  if (state.action) parts.push(`动作 ${formatActionLabel(state.action)}`);
  if (state.success === "true") parts.push("仅成功");
  if (state.success === "false") parts.push("仅失败");
  if (state.restorable === true) parts.push("仅可恢复");
  if (state.restorable === false) parts.push("仅不可恢复");
  if (state.createdFrom || state.createdTo) parts.push(`时间 ${state.createdFrom || "开始"} 至 ${state.createdTo || "结束"}`);
  return parts;
}

export function buildOperationLogModuleStats(
  list: OperationLogListItem[],
  formatModuleLabel: (value?: string, fallback?: string) => string,
) {
  const counts = new Map<string, number>();
  list.forEach((item) => {
    counts.set(item.module, (counts.get(item.module) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: formatModuleLabel(key), count }))
    .sort((left, right) => right.count - left.count);
}

export function buildOperationLogMetrics(list: OperationLogListItem[]) {
  const successCount = list.filter((item) => item.success).length;
  const failedCount = list.length - successCount;
  const restorableCount = list.filter((item) => item.restorable).length;
  return {
    total: list.length,
    successCount,
    failedCount,
    restorableCount,
  };
}
