import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Drawer, Empty, Grid, Input, Modal, Popconfirm, Select, Space, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircle2, ClipboardList, Copy, Download, RefreshCw, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { downloadAdminOperationLogs, getAdminOperationLogDetail, getAdminOperationLogs, isAbortError, restoreAdminOperationLog } from "@/services/api";
import type { OperationLogDetail, OperationLogItem, OperationLogQuery, PaginatedResult } from "@/types";
import { ADMIN_PAGE_SIZE_OPTIONS } from "@/utils/admin-table";
import {
  ADMIN_ACTION_OPTIONS,
  ADMIN_MODULE_OPTIONS,
  formatAdminActionLabel,
  formatAdminModuleLabel,
  formatAdminTargetTypeLabel,
} from "@/utils/admin-display";
import { formatDateTimeWithSeconds, getTimestamp } from "@/utils/datetime";
import { copyTextToClipboard } from "@/utils/clipboard";
import { shouldIgnoreTableRowClick } from "@/utils/dom";
import { renderAdminCurrentViewTag, renderAdminRestoreRecordTag, renderAdminSuccessTag } from "@/utils/admin-status";
import {
  buildDefaultOperationLogFilterState,
  buildOperationLogFilterState,
  buildOperationLogQuery,
  buildOperationLogSearchParams,
  buildSnapshotDiff,
  buildOperationLogFilterSummary,
  buildOperationLogMetrics,
  buildOperationLogModuleStats,
  buildOperationLogPresetState,
  buildOperationLogQuickViewState,
  formatTargetIdentifier,
  hasOperationLogActiveFilters,
  resolveOperationLogPreset,
  resolveQuickView,
  type FilterPreset,
  type QuickView,
  type ResultFilter,
} from "./operation-log.helpers";
import { buildOperationLogColumns, buildRestoreConfirmationState } from "./operation-log.view";

async function copyText(value: string, successText: string) {
  if (!value.trim()) {
    message.warning("当前没有可复制的内容");
    return;
  }

  try {
    await copyTextToClipboard(value);
    message.success(successText);
  } catch {
    message.error("复制失败，请稍后重试");
  }
}

export function AdminOperationLogs() {
  const screens = Grid.useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResult<OperationLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreReason, setRestoreReason] = useState("");
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [pendingRestoreId, setPendingRestoreId] = useState<number | null>(null);
  const [pendingRestoreContext, setPendingRestoreContext] = useState<OperationLogItem | OperationLogDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<OperationLogDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [module, setModule] = useState<string | undefined>(searchParams.get("module") ?? undefined);
  const [operatorName, setOperatorName] = useState(searchParams.get("operatorName") ?? "");
  const initialSuccess = searchParams.get("success");
  const initialAction = searchParams.get("action");
  const initialRestorable = searchParams.get("restorable");
  const initialCreatedFrom = searchParams.get("createdFrom") ?? "";
  const initialCreatedTo = searchParams.get("createdTo") ?? "";
  const [success, setSuccess] = useState<ResultFilter>(
    initialSuccess === "true" || initialSuccess === "false" ? initialSuccess : "all",
  );
  const [action, setAction] = useState<string | undefined>(initialAction ?? undefined);
  const [restorable, setRestorable] = useState<boolean | undefined>(
    initialRestorable === "true" ? true : initialRestorable === "false" ? false : undefined,
  );
  const [createdFrom, setCreatedFrom] = useState(initialCreatedFrom);
  const [createdTo, setCreatedTo] = useState(initialCreatedTo);
  const listRequestControllerRef = useRef<AbortController | null>(null);
  const detailRequestControllerRef = useRef<AbortController | null>(null);
  const filterState = useMemo(
    () => buildOperationLogFilterState({ keyword, module, operatorName, success, action, restorable, createdFrom, createdTo }),
    [action, createdFrom, createdTo, keyword, module, operatorName, restorable, success],
  );

  const load = async (
    nextPage = page,
    nextPageSize = pageSize,
    nextState = filterState,
  ) => {
    listRequestControllerRef.current?.abort();
    const controller = new AbortController();
    listRequestControllerRef.current = controller;
    setLoading(true);
    try {
      const query: OperationLogQuery = buildOperationLogQuery(nextState, nextPage, nextPageSize);
      const result = await getAdminOperationLogs(query, { signal: controller.signal });
      setData(result);
      setPage(result.page);
      setPageSize(result.limit);
    } catch (error) {
      if (isAbortError(error)) return;
      message.error(error instanceof Error ? error.message : "操作日志加载失败");
    } finally {
      if (listRequestControllerRef.current === controller) {
        listRequestControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load(1, 10, filterState);
    return () => {
      listRequestControllerRef.current?.abort();
      detailRequestControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const next = buildOperationLogSearchParams(filterState);
    setSearchParams(next, { replace: true });
  }, [filterState, setSearchParams]);

  const currentQuickView = useMemo<QuickView>(
    () => resolveQuickView({ action: filterState.action, restorable: filterState.restorable, success: filterState.success }),
    [filterState.action, filterState.restorable, filterState.success],
  );

  const metrics = useMemo(() => {
    const list = data?.list ?? [];
    const { total, successCount, failedCount, restorableCount } = buildOperationLogMetrics(list);
    return [
      { label: "当前页日志", value: total, note: "展示当前筛选条件下的日志数量", icon: ClipboardList },
      { label: "成功操作", value: successCount, note: "已成功写入的后台操作与登录行为", icon: CheckCircle2 },
      { label: "失败操作", value: failedCount, note: "优先排查失败请求与异常链路", icon: ShieldAlert },
      { label: "可恢复记录", value: restorableCount, note: "具备变更前快照，可单条恢复", icon: RotateCcw },
    ];
  }, [data]);

  const timelineLogs = useMemo(() => {
    if (!activeDetail) return [];
    const merged = [activeDetail, ...(activeDetail.relatedLogs ?? [])];
    const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
    return unique.sort((left, right) => {
      const leftTime = getTimestamp(left.createdAt);
      const rightTime = getTimestamp(right.createdAt);
      if (leftTime !== rightTime) return leftTime - rightTime;
      return left.id - right.id;
    });
  }, [activeDetail]);

  const moduleStats = useMemo(
    () => buildOperationLogModuleStats(data?.list ?? [], formatAdminModuleLabel),
    [data],
  );

  const filterSummary = useMemo(
    () =>
      buildOperationLogFilterSummary(
        filterState,
        formatAdminModuleLabel,
        formatAdminActionLabel,
      ),
    [filterState],
  );

  const hasActiveFilters = hasOperationLogActiveFilters(filterState);

  const currentPreset = useMemo<FilterPreset>(
    () => resolveOperationLogPreset(filterState),
    [filterState],
  );

  const snapshotDiff = useMemo(
    () => buildSnapshotDiff(activeDetail?.beforeSnapshot, activeDetail?.afterSnapshot),
    [activeDetail?.afterSnapshot, activeDetail?.beforeSnapshot],
  );

  const openDetail = async (id: number) => {
    detailRequestControllerRef.current?.abort();
    const controller = new AbortController();
    detailRequestControllerRef.current = controller;
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getAdminOperationLogDetail(id, { signal: controller.signal });
      setActiveDetail(detail);
    } catch (error) {
      if (isAbortError(error)) return;
      message.error(error instanceof Error ? error.message : "日志详情加载失败");
    } finally {
      if (detailRequestControllerRef.current === controller) {
        detailRequestControllerRef.current = null;
        setDetailLoading(false);
      }
    }
  };

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      const detail = await restoreAdminOperationLog(id, restoreReason.trim());
      message.success("已按日志快照恢复数据");
      setActiveDetail(detail);
      setRestoreModalOpen(false);
      setRestoreReason("");
      setPendingRestoreId(null);
      await load(page, pageSize);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setRestoringId(null);
    }
  };

  const openRestoreModal = (id: number) => {
    setPendingRestoreId(id);
    setRestoreReason("");
    setRestoreConfirmText("");
    setRestoreModalOpen(true);
  };

  const openRestoreModalWithContext = (item: OperationLogItem | OperationLogDetail) => {
    setPendingRestoreId(item.id);
    setPendingRestoreContext(item);
    setRestoreReason("");
    setRestoreConfirmText("");
    setRestoreModalOpen(true);
  };

  const restoreConfirmation = useMemo(
    () =>
      buildRestoreConfirmationState({
        pendingRestoreId,
        restoringId,
        restoreReason,
        restoreConfirmText,
      }),
    [pendingRestoreId, restoreConfirmText, restoreReason, restoringId],
  );

  const applyQuickView = (view: QuickView) => {
    const nextState = buildOperationLogQuickViewState(view, filterState);
    setSuccess(nextState.success);
    setAction(nextState.action);
    setRestorable(nextState.restorable);
    void load(1, pageSize, nextState);
  };

  const applyPreset = (preset: FilterPreset) => {
    const nextState = buildOperationLogPresetState(preset);
    setKeyword(nextState.keyword);
    setModule(nextState.module);
    setOperatorName(nextState.operatorName);
    setSuccess(nextState.success);
    setAction(nextState.action);
    setRestorable(nextState.restorable);
    setCreatedFrom(nextState.createdFrom);
    setCreatedTo(nextState.createdTo);
    void load(1, pageSize, nextState);
  };

  const resetFilters = () => {
    const nextState = buildDefaultOperationLogFilterState();
    setKeyword(nextState.keyword);
    setModule(nextState.module);
    setOperatorName(nextState.operatorName);
    setSuccess(nextState.success);
    setAction(nextState.action);
    setRestorable(nextState.restorable);
    setCreatedFrom(nextState.createdFrom);
    setCreatedTo(nextState.createdTo);
    void load(1, pageSize, nextState);
  };

  const handleExport = async () => {
    try {
      await downloadAdminOperationLogs(buildOperationLogQuery(filterState));
      message.success("操作日志导出成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导出失败");
    }
  };

  const columns: ColumnsType<OperationLogItem> = useMemo(
    () =>
      buildOperationLogColumns({
        restoringId,
        onOpenDetail: (id) => {
          void openDetail(id);
        },
        onOpenRestore: openRestoreModalWithContext,
      }),
    [restoringId],
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-stat-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf4eb] text-forest">
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="admin-toolbar admin-sticky-toolbar p-5">
        <div>
          <p className="section-eyebrow">日志筛选</p>
          <h3 className="admin-section-title mt-2 text-xl">操作日志工作台</h3>
          <p className="admin-shell-copy mt-2 text-sm">集中排查后台写操作、登录异常与可恢复数据变更，适合定位误操作与恢复依据。</p>
        </div>
        <div className="mt-5">
          <p className="admin-filter-caption">快捷视图</p>
        </div>
        <div className="admin-quick-filters">
          <Button type={currentQuickView === "all" ? "primary" : "default"} onClick={() => applyQuickView("all")}>
            全部日志
          </Button>
          <Button type={currentQuickView === "failed" ? "primary" : "default"} onClick={() => applyQuickView("failed")}>
            仅失败
          </Button>
          <Button type={currentQuickView === "restorable" ? "primary" : "default"} onClick={() => applyQuickView("restorable")}>
            仅可恢复
          </Button>
          <Button type={currentQuickView === "restore" ? "primary" : "default"} onClick={() => applyQuickView("restore")}>
            恢复记录
          </Button>
        </div>
        <div className="mt-5">
          <p className="admin-filter-caption">常用预设</p>
        </div>
        <div className="admin-filter-presets">
          <Button type={currentPreset === "todayFailed" ? "primary" : "default"} onClick={() => applyPreset("todayFailed")}>
            今日失败
          </Button>
          <Button type={currentPreset === "todayRestore" ? "primary" : "default"} onClick={() => applyPreset("todayRestore")}>
            今日恢复
          </Button>
          <Button type={currentPreset === "flowerOps" ? "primary" : "default"} onClick={() => applyPreset("flowerOps")}>
            作品变更
          </Button>
          <Button type={currentPreset === "contactOps" ? "primary" : "default"} onClick={() => applyPreset("contactOps")}>
            留言处理
          </Button>
          <Button type={currentPreset === "aiOps" ? "primary" : "default"} onClick={() => applyPreset("aiOps")}>
            AI 配置
          </Button>
        </div>
        <div className="admin-filter-grid admin-operation-log-filter-grid">
          <Input
            className="min-w-0 admin-operation-log-filter-grid__search"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => void load(1, pageSize)}
            placeholder="按记录标识、错误信息或请求摘要搜索"
            prefix={<Search size={16} className="text-muted" />}
          />
          <Select
            allowClear
            value={module}
            onChange={(value) => setModule(value)}
            placeholder="筛选模块"
            options={ADMIN_MODULE_OPTIONS.filter((item) => item.value !== "AUDIT")}
          />
          <Input
            className="min-w-0"
            allowClear
            value={operatorName}
            onChange={(event) => setOperatorName(event.target.value)}
            placeholder="筛选操作人"
          />
          <Select
            allowClear
            value={action}
            onChange={(value) => setAction(value)}
            placeholder="筛选动作"
            options={ADMIN_ACTION_OPTIONS}
          />
          <Select
            value={success}
            onChange={setSuccess}
            options={[
              { label: "全部结果", value: "all" },
              { label: "仅成功", value: "true" },
              { label: "仅失败", value: "false" },
            ]}
          />
          <Input
            className="min-w-0"
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
            placeholder="开始日期"
          />
          <Input
            className="min-w-0"
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
            placeholder="结束日期"
          />
          <div className="admin-operation-log-filter-grid__actions">
            <Button
              className="w-full sm:w-auto"
              type="primary"
              icon={<RefreshCw size={16} />}
              onClick={() => void load(1, pageSize)}
            >
              刷新日志
            </Button>
            <Button className="w-full sm:w-auto" icon={<Download size={16} />} onClick={() => void handleExport()}>
              导出 CSV
            </Button>
          </div>
        </div>
        <div className="admin-filter-summary">
          <div className="admin-filter-summary-copy">
            <p>当前结果 {data?.total ?? 0} 条</p>
            <span>
              {hasActiveFilters
                ? `已应用 ${filterSummary.join(" · ")}`
                : "已展示最近的后台写操作、登录行为与恢复记录。"}
            </span>
          </div>
          {hasActiveFilters ? <Button onClick={resetFilters}>清空筛选</Button> : null}
        </div>
      </section>

      <section className="admin-panel admin-shell-card p-5">
        <Alert
          showIcon
          type="warning"
          message="恢复仅针对结构化数据快照"
          description="作品、站点配置、关于页、时间轴、团队、留言已读状态和 AI 配置支持按单条日志恢复。上传图片文件仍建议通过备份目录兜底。"
        />
        {moduleStats.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {moduleStats.map((item) => (
              <div key={item.key} className="admin-subpanel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">模块分布</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[#1b281e]">{item.label}</p>
                    <p className="mt-1 text-sm text-muted">当前页相关日志 {item.count} 条</p>
                  </div>
                  <Tag color="green">{item.count}</Tag>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="admin-panel overflow-hidden p-0">
        <Table<OperationLogItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data?.list ?? []}
          locale={{
            emptyText: (
              <div className="admin-empty-state min-h-[220px]">
                <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                <h4>当前还没有符合条件的操作日志</h4>
                <p>后台写操作和登录行为会在这里持续沉淀，便于排查问题和恢复数据。</p>
              </div>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            size: screens.sm ? undefined : "small",
            pageSizeOptions: ADMIN_PAGE_SIZE_OPTIONS,
            showTotal: (total) => `共 ${total} 条日志`,
            onChange: (nextPage, nextPageSize) => void load(nextPage, nextPageSize),
          }}
          onRow={(record) => ({
            onClick: (event) => {
              if (shouldIgnoreTableRowClick(event.target)) return;
              void openDetail(record.id);
            },
          })}
          scroll={{ x: 1240 }}
        />
      </section>

      <Drawer
        className="admin-mobile-drawer"
        title={
          <div className="admin-drawer-title">
            <p>日志详情</p>
            <h3>{activeDetail ? `${formatAdminModuleLabel(activeDetail.module)} / ${formatAdminActionLabel(activeDetail.action)}` : "日志详情"}</h3>
            <span>查看完整请求、前后快照、异常信息与恢复入口。</span>
          </div>
        }
        width={screens.lg ? 720 : "100%"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveDetail(null);
        }}
        extra={
          activeDetail?.restorable ? (
            <Popconfirm
              title="确认按该日志快照恢复数据？"
              description="下一步需要填写恢复原因，并会新增一条恢复日志。"
              onConfirm={() => openRestoreModalWithContext(activeDetail)}
            >
              <Button
                type="primary"
                icon={<RotateCcw size={14} />}
                loading={restoringId === activeDetail.id}
                block={!screens.sm}
              >
                按快照恢复
              </Button>
            </Popconfirm>
          ) : null
        }
      >
        {detailLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : !activeDetail ? (
          <div className="admin-empty-state min-h-[240px]">
            <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <h4>暂无日志详情</h4>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="admin-subpanel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">基础信息</p>
              <div className="mt-3 space-y-2 text-muted">
                <p>模块：{formatAdminModuleLabel(activeDetail.module)}</p>
                <p>动作：{formatAdminActionLabel(activeDetail.action)}</p>
                <p>目标：{formatAdminTargetTypeLabel(activeDetail.targetType, { archiveLabel: "操作日志归档" })} / {formatTargetIdentifier(activeDetail.targetId)}</p>
                <p>操作人：{activeDetail.operatorName || "系统"}</p>
                <p>结果：{activeDetail.success ? "成功" : "失败"}</p>
                <p>时间：{formatDateTimeWithSeconds(activeDetail.createdAt, activeDetail.createdAt)}</p>
                <p>来源 IP：{activeDetail.ipAddress || "暂无"}</p>
                <p>UA：{activeDetail.userAgent || "暂无"}</p>
                {activeDetail.restoredFromLogId ? (
                  <p>
                    恢复来源日志：
                    <button
                      type="button"
                      className="ml-2 text-sm font-semibold text-forest underline-offset-4 transition hover:underline"
                      onClick={() => void openDetail(activeDetail.restoredFromLogId ?? 0)}
                    >
                      #{activeDetail.restoredFromLogId}
                    </button>
                  </p>
                ) : null}
              </div>
            </div>

            {timelineLogs.length ? (
              <div className="admin-subpanel px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">恢复链路</p>
                    <p className="admin-cell-note mt-2">按时间顺序展示来源记录、当前节点和恢复记录，便于定位本次查看日志在整条链路中的位置。</p>
                  </div>
                  <Tag color="green">{timelineLogs.length} 个链路节点</Tag>
                </div>
                <div className="admin-timeline mt-4">
                  {timelineLogs.map((item) => {
                    const isCurrent = item.id === activeDetail.id;
                    return (
                    <button
                      key={item.id}
                      type="button"
                      className={`admin-timeline-item${isCurrent ? " is-active" : ""}`}
                      onClick={() => void openDetail(item.id)}
                    >
                      <span className="admin-timeline-dot" />
                      <div className="admin-timeline-card">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#1b281e]">
                              #{item.id} · {formatAdminActionLabel(item.action)}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {formatAdminModuleLabel(item.module)} / {formatAdminTargetTypeLabel(item.targetType, { archiveLabel: "操作日志归档" })} / {formatDateTimeWithSeconds(item.createdAt, item.createdAt)}
                            </p>
                          </div>
                          <Space size={[8, 8]} wrap>
                            {isCurrent ? renderAdminCurrentViewTag() : null}
                            {item.restoredFromLogId ? renderAdminRestoreRecordTag() : null}
                            {renderAdminSuccessTag(item.success)}
                          </Space>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                          {item.errorMessage || item.requestSummary || formatTargetIdentifier(item.targetId)}
                        </p>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {!activeDetail.success && activeDetail.errorMessage ? (
              <div className="admin-subpanel px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4b45]">失败原因</p>
                    <p className="mt-3 whitespace-pre-wrap break-all text-sm leading-7 text-[#7d3d37]">{activeDetail.errorMessage}</p>
                  </div>
                  <Button
                    type="text"
                    icon={<Copy size={16} />}
                    onClick={() => void copyText(activeDetail.errorMessage ?? "", "失败原因已复制")}
                  />
                </div>
              </div>
            ) : null}

            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">请求摘要</p>
                  <p className="admin-cell-note mt-2">用于回放请求意图，敏感字段已自动脱敏。</p>
                </div>
                <Button
                  type="text"
                  icon={<Copy size={16} />}
                  onClick={() => void copyText(activeDetail.requestSummary || "", "请求摘要已复制")}
                />
              </div>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.requestSummary || "暂无"}</pre>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">变更前快照</p>
                  <p className="admin-cell-note mt-2">可作为恢复依据，适用于结构化数据字段。</p>
                </div>
                <Button
                  type="text"
                  icon={<Copy size={16} />}
                  onClick={() => void copyText(activeDetail.beforeSnapshot || "", "变更前快照已复制")}
                />
              </div>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.beforeSnapshot || "暂无"}</pre>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">变更后快照</p>
                  <p className="admin-cell-note mt-2">便于核对本次提交最终落库的结构化数据。</p>
                </div>
                <Button
                  type="text"
                  icon={<Copy size={16} />}
                  onClick={() => void copyText(activeDetail.afterSnapshot || "", "变更后快照已复制")}
                />
              </div>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.afterSnapshot || "暂无"}</pre>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">字段差异</p>
                  <p className="admin-cell-note mt-2">自动比对前后快照的结构化字段，便于快速确认本次改动范围。</p>
                </div>
                {snapshotDiff.changes.length ? (
                  <Tag color="green">{snapshotDiff.changes.length} 项变更</Tag>
                ) : null}
              </div>
              {snapshotDiff.changes.length ? (
                <div className="admin-diff-list mt-4">
                  {snapshotDiff.changes.map((item) => (
                    <div key={`${item.path}-${item.status}`} className="admin-diff-item">
                      <div className="admin-diff-item-head">
                        <p>{item.path}</p>
                        <Tag color={item.status === "added" ? "success" : item.status === "removed" ? "error" : "gold"}>
                          {item.status === "added" ? "新增" : item.status === "removed" ? "移除" : "变更"}
                        </Tag>
                      </div>
                      <div className="admin-diff-item-grid">
                        <div>
                          <span>变更前</span>
                          <pre>{item.before}</pre>
                        </div>
                        <div>
                          <span>变更后</span>
                          <pre>{item.after}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-inline mt-4">
                  <p>{snapshotDiff.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="填写恢复原因"
        open={restoreModalOpen}
        onCancel={() => {
          if (restoringId) return;
          setRestoreModalOpen(false);
          setRestoreReason("");
          setRestoreConfirmText("");
          setPendingRestoreId(null);
          setPendingRestoreContext(null);
        }}
        onOk={() => {
          if (!pendingRestoreId) return;
          if (!restoreReason.trim()) {
            message.warning("请填写恢复原因");
            return;
          }
          if (!restoreConfirmation.restoreConfirmPhrase || restoreConfirmation.disabled) {
            message.warning("请输入正确的确认短语后再执行恢复");
            return;
          }
          void handleRestore(pendingRestoreId);
        }}
        okText="确认恢复"
        cancelText="取消"
        confirmLoading={restoreConfirmation.confirmLoading}
        okButtonProps={{
          danger: true,
          disabled: restoreConfirmation.disabled,
        }}
      >
        <div className="space-y-3">
          <Alert
            showIcon
            type="warning"
            message="该操作会按历史快照回写数据"
            description="恢复会立即覆盖当前结构化数据状态，并新增一条恢复日志。建议先确认影响对象、时间点和恢复原因。"
          />
          {pendingRestoreContext ? (
            <div className="admin-restore-risk-panel">
              <div className="admin-restore-risk-grid">
                <div>
                  <p>模块</p>
                  <strong>{formatAdminModuleLabel(pendingRestoreContext.module)}</strong>
                </div>
                <div>
                  <p>动作</p>
                  <strong>{formatAdminActionLabel(pendingRestoreContext.action)}</strong>
                </div>
                <div>
                  <p>目标</p>
                  <strong>{formatAdminTargetTypeLabel(pendingRestoreContext.targetType, { archiveLabel: "操作日志归档" })}</strong>
                </div>
                <div>
                  <p>记录标识</p>
                  <strong>{formatTargetIdentifier(pendingRestoreContext.targetId)}</strong>
                </div>
                <div>
                  <p>原日志时间</p>
                  <strong>{formatDateTimeWithSeconds(pendingRestoreContext.createdAt, pendingRestoreContext.createdAt)}</strong>
                </div>
                <div>
                  <p>原日志结果</p>
                  <strong>{pendingRestoreContext.success ? "成功" : "失败"}</strong>
                </div>
              </div>
              <p className="admin-cell-note mt-3">
                恢复来源日志 ID：#{pendingRestoreContext.id}
                {pendingRestoreContext.restoredFromLogId ? ` · 上级恢复来源 #${pendingRestoreContext.restoredFromLogId}` : ""}
              </p>
            </div>
          ) : null}
          <p className="text-sm leading-6 text-muted">恢复原因会写入新的恢复日志，便于后续排查、追责和恢复链路回放。</p>
          <Input.TextArea
            value={restoreReason}
            onChange={(event) => setRestoreReason(event.target.value)}
            placeholder="请填写本次恢复的原因、影响范围或处理背景"
            rows={4}
            maxLength={200}
            showCount
          />
          <div className="space-y-2">
            <p className="text-sm leading-6 text-muted">
              请输入确认短语后才能恢复：
              <span className="ml-2 inline-flex rounded-md bg-[#f4ece3] px-2 py-1 font-semibold text-[#7a4d28]">
                {restoreConfirmation.restoreConfirmPhrase || "恢复"}
              </span>
            </p>
            <Input
              value={restoreConfirmText}
              onChange={(event) => setRestoreConfirmText(event.target.value)}
              placeholder={
                restoreConfirmation.restoreConfirmPhrase
                  ? `请输入 ${restoreConfirmation.restoreConfirmPhrase}`
                  : "请输入确认短语"
              }
              maxLength={32}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
