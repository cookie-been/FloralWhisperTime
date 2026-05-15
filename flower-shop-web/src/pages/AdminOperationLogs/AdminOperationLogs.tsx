import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Drawer, Empty, Grid, Input, Popconfirm, Select, Space, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircle2, ClipboardList, Copy, Download, RefreshCw, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { downloadAdminOperationLogs, getAdminOperationLogDetail, getAdminOperationLogs, restoreAdminOperationLog } from "@/services/api";
import type { OperationLogDetail, OperationLogItem, OperationLogQuery, PaginatedResult } from "@/types";

function formatDateTime(value?: string) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatModule(value: string) {
  const mapping: Record<string, string> = {
    AUTH: "登录鉴权",
    FLOWER: "作品管理",
    CONTACT: "用户留言",
    SITE: "站点配置",
    ABOUT: "关于我们",
    TEAM: "团队成员",
    AI: "AI 配置",
  };
  return mapping[value] ?? value;
}

function formatAction(value: string) {
  const mapping: Record<string, string> = {
    LOGIN: "登录",
    CREATE: "新增",
    UPDATE: "修改",
    DELETE: "删除",
    MARK_READ: "标记已读",
    RESTORE: "恢复",
  };
  return mapping[value] ?? value;
}

function formatTargetType(value: string) {
  const mapping: Record<string, string> = {
    FLOWER: "作品",
    CONTACT: "留言",
    SITE_CONFIG: "站点配置",
    ABOUT_PAGE: "关于页",
    ABOUT_TIMELINE: "时间轴",
    TEAM_MEMBER: "团队成员",
    AI_SETTINGS: "AI 配置",
    AUTH: "鉴权",
  };
  return mapping[value] ?? value;
}

function shouldIgnoreRowClick(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, .ant-btn, .ant-popover, .ant-popconfirm"));
}

async function copyText(value: string, successText: string) {
  if (!value.trim()) {
    message.warning("当前没有可复制的内容");
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    message.success(successText);
  } catch {
    message.error("复制失败，请稍后重试");
  }
}

type ResultFilter = "all" | "true" | "false";
type QuickView = "all" | "failed" | "restorable" | "restore";

function formatRangeBoundary(value?: string, mode: "start" | "end" = "start") {
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

export function AdminOperationLogs() {
  const screens = Grid.useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResult<OperationLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<OperationLogDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [module, setModule] = useState<string | undefined>(searchParams.get("module") ?? undefined);
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

  const load = async (
    nextPage = page,
    nextPageSize = pageSize,
    nextKeyword = keyword,
    nextModule = module,
    nextSuccess = success,
    nextAction = action,
    nextRestorable = restorable,
    nextCreatedFrom = createdFrom,
    nextCreatedTo = createdTo,
  ) => {
    setLoading(true);
    try {
      const query: OperationLogQuery = {
        page: nextPage,
        limit: nextPageSize,
        keyword: nextKeyword.trim() || undefined,
        module: nextModule || undefined,
        action: nextAction || undefined,
        success: nextSuccess === "all" ? undefined : nextSuccess === "true",
        restorable: nextRestorable,
        createdFrom: formatRangeBoundary(nextCreatedFrom, "start"),
        createdTo: formatRangeBoundary(nextCreatedTo, "end"),
      };
      const result = await getAdminOperationLogs(query);
      setData(result);
      setPage(result.page);
      setPageSize(result.limit);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作日志加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10, keyword, module, success, action, restorable, createdFrom, createdTo);
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (keyword.trim()) next.set("keyword", keyword.trim());
    if (module) next.set("module", module);
    if (success !== "all") next.set("success", success);
    if (action) next.set("action", action);
    if (restorable !== undefined) next.set("restorable", String(restorable));
    if (createdFrom) next.set("createdFrom", createdFrom);
    if (createdTo) next.set("createdTo", createdTo);
    setSearchParams(next, { replace: true });
  }, [action, createdFrom, createdTo, keyword, module, restorable, setSearchParams, success]);

  const currentQuickView = useMemo<QuickView>(() => {
    if (action === "RESTORE") return "restore";
    if (restorable === true) return "restorable";
    if (success === "false") return "failed";
    return "all";
  }, [action, restorable, success]);

  const metrics = useMemo(() => {
    const list = data?.list ?? [];
    const successCount = list.filter((item) => item.success).length;
    const failedCount = list.length - successCount;
    const restorableCount = list.filter((item) => item.restorable).length;
    return [
      { label: "当前页日志", value: list.length, note: "展示当前筛选条件下的日志数量", icon: ClipboardList },
      { label: "成功操作", value: successCount, note: "已成功写入的后台操作与登录行为", icon: CheckCircle2 },
      { label: "失败操作", value: failedCount, note: "优先排查失败请求与异常链路", icon: ShieldAlert },
      { label: "可恢复记录", value: restorableCount, note: "具备变更前快照，可单条恢复", icon: RotateCcw },
    ];
  }, [data]);

  const moduleStats = useMemo(() => {
    const counts = new Map<string, number>();
    (data?.list ?? []).forEach((item) => {
      counts.set(item.module, (counts.get(item.module) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, label: formatModule(key), count }))
      .sort((left, right) => right.count - left.count);
  }, [data]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (keyword.trim()) parts.push(`关键词“${keyword.trim()}”`);
    if (module) parts.push(formatModule(module));
    if (action) parts.push(`动作 ${formatAction(action)}`);
    if (success === "true") parts.push("仅成功");
    if (success === "false") parts.push("仅失败");
    if (restorable === true) parts.push("仅可恢复");
    if (restorable === false) parts.push("仅不可恢复");
    if (createdFrom || createdTo) parts.push(`时间 ${createdFrom || "开始"} 至 ${createdTo || "结束"}`);
    return parts;
  }, [action, createdFrom, createdTo, keyword, module, restorable, success]);

  const hasActiveFilters = Boolean(keyword.trim()) || Boolean(module) || Boolean(action) || success !== "all" || restorable !== undefined || Boolean(createdFrom) || Boolean(createdTo);

  const openDetail = async (id: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getAdminOperationLogDetail(id);
      setActiveDetail(detail);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "日志详情加载失败");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      const detail = await restoreAdminOperationLog(id, "后台人工确认恢复");
      message.success("已按日志快照恢复数据");
      setActiveDetail(detail);
      await load(page, pageSize, keyword, module, success, action, restorable, createdFrom, createdTo);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setRestoringId(null);
    }
  };

  const applyQuickView = (view: QuickView) => {
    if (view === "all") {
      setSuccess("all");
      setAction(undefined);
      setRestorable(undefined);
      void load(1, pageSize, keyword, module, "all", undefined, undefined, createdFrom, createdTo);
      return;
    }
    if (view === "failed") {
      setSuccess("false");
      setAction(undefined);
      setRestorable(undefined);
      void load(1, pageSize, keyword, module, "false", undefined, undefined, createdFrom, createdTo);
      return;
    }
    if (view === "restorable") {
      setSuccess("all");
      setAction(undefined);
      setRestorable(true);
      void load(1, pageSize, keyword, module, "all", undefined, true, createdFrom, createdTo);
      return;
    }
    setSuccess("all");
    setAction("RESTORE");
    setRestorable(undefined);
    void load(1, pageSize, keyword, module, "all", "RESTORE", undefined, createdFrom, createdTo);
  };

  const resetFilters = () => {
    setKeyword("");
    setModule(undefined);
    setSuccess("all");
    setAction(undefined);
    setRestorable(undefined);
    setCreatedFrom("");
    setCreatedTo("");
    void load(1, pageSize, "", undefined, "all", undefined, undefined, "", "");
  };

  const handleExport = async () => {
    try {
      await downloadAdminOperationLogs({
        keyword: keyword.trim() || undefined,
        module: module || undefined,
        action: action || undefined,
        success: success === "all" ? undefined : success === "true",
        restorable,
        createdFrom: formatRangeBoundary(createdFrom, "start"),
        createdTo: formatRangeBoundary(createdTo, "end"),
      });
      message.success("操作日志导出成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导出失败");
    }
  };

  const columns: ColumnsType<OperationLogItem> = [
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => <span className="text-sm text-muted">{formatDateTime(value)}</span>,
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 140,
      render: (value: string) => <Tag color="green">{formatModule(value)}</Tag>,
    },
    {
      title: "动作",
      dataIndex: "action",
      width: 120,
      render: (value: string) => <Tag color={value === "RESTORE" ? "gold" : "default"}>{formatAction(value)}</Tag>,
    },
    {
      title: "目标",
      key: "target",
      width: 220,
      render: (_: unknown, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{formatTargetType(record.targetType)}</p>
          <p className="mt-1 break-all text-xs text-muted">{record.targetId || "暂无"}</p>
        </div>
      ),
    },
    {
      title: "操作人",
      dataIndex: "operatorName",
      width: 140,
      render: (value: string) => value || "系统",
    },
    {
      title: "结果",
      dataIndex: "success",
      width: 120,
      render: (value: boolean) => (value ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>),
    },
    {
      title: "摘要",
      dataIndex: "requestSummary",
      render: (value: string, record) => (
        <div>
          <p className="line-clamp-2 text-sm leading-6 text-muted">{value || "暂无"}</p>
          {!record.success && record.errorMessage ? (
            <p className="admin-cell-note break-all text-[#9f4b45]">失败原因：{record.errorMessage}</p>
          ) : null}
        </div>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_: unknown, record) => (
        <Space>
          <Button className="admin-action-button" size="small" onClick={() => void openDetail(record.id)}>
            查看详情
          </Button>
          {record.restorable ? (
            <Popconfirm
              title="确认按该日志快照恢复数据？"
              description="恢复后会新增一条恢复日志，请确认当前变更需要回退。"
              onConfirm={() => void handleRestore(record.id)}
            >
              <Button
                size="small"
                className="admin-action-button"
                loading={restoringId === record.id}
                icon={<RotateCcw size={14} />}
              >
                恢复
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

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
          <p className="mt-2 text-sm leading-6 text-muted">集中排查后台写操作、登录异常与可恢复数据变更，适合定位误操作与恢复依据。</p>
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
        <div className="admin-filter-grid lg:grid-cols-[minmax(0,1.1fr)_180px_180px_180px_150px_150px_auto_auto]">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => void load(1, pageSize, keyword, module, success, action, restorable, createdFrom, createdTo)}
            placeholder="按目标 ID、错误信息或请求摘要搜索"
            prefix={<Search size={16} className="text-muted" />}
          />
          <Select
            allowClear
            value={module}
            onChange={(value) => setModule(value)}
            placeholder="筛选模块"
            options={[
              { label: "登录鉴权", value: "AUTH" },
              { label: "作品管理", value: "FLOWER" },
              { label: "用户留言", value: "CONTACT" },
              { label: "站点配置", value: "SITE" },
              { label: "关于我们", value: "ABOUT" },
              { label: "团队成员", value: "TEAM" },
              { label: "AI 配置", value: "AI" },
            ]}
          />
          <Select
            allowClear
            value={action}
            onChange={(value) => setAction(value)}
            placeholder="筛选动作"
            options={[
              { label: "登录", value: "LOGIN" },
              { label: "新增", value: "CREATE" },
              { label: "修改", value: "UPDATE" },
              { label: "删除", value: "DELETE" },
              { label: "标记已读", value: "MARK_READ" },
              { label: "恢复", value: "RESTORE" },
            ]}
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
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
            placeholder="开始日期"
          />
          <Input
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
            placeholder="结束日期"
          />
          <Button
            type="primary"
            icon={<RefreshCw size={16} />}
            onClick={() => void load(1, pageSize, keyword, module, success, action, restorable, createdFrom, createdTo)}
          >
            刷新日志
          </Button>
          <Button icon={<Download size={16} />} onClick={() => void handleExport()}>
            导出 CSV
          </Button>
        </div>
        <div className="admin-filter-summary">
          <div className="admin-filter-summary-copy">
            <p>当前结果 {data?.list.length ?? 0} 条</p>
            <span>
              {hasActiveFilters
                ? `已应用 ${filterSummary.join(" · ")}`
                : "已展示最近的后台写操作、登录行为与恢复记录。"}
            </span>
          </div>
          {hasActiveFilters ? <Button onClick={resetFilters}>清空筛选</Button> : null}
        </div>
      </section>

      <section className="admin-panel p-5">
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
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `共 ${total} 条日志`,
            onChange: (nextPage, nextPageSize) => void load(nextPage, nextPageSize, keyword, module, success, action, restorable, createdFrom, createdTo),
          }}
          onRow={(record) => ({
            onClick: (event) => {
              if (shouldIgnoreRowClick(event.target)) return;
              void openDetail(record.id);
            },
          })}
          scroll={{ x: 1240 }}
        />
      </section>

      <Drawer
        title={
          <div className="admin-drawer-title">
            <p>日志详情</p>
            <h3>{activeDetail ? `${formatModule(activeDetail.module)} / ${formatAction(activeDetail.action)}` : "日志详情"}</h3>
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
              description="恢复后会新增一条恢复日志，请确认当前变更需要回退。"
              onConfirm={() => void handleRestore(activeDetail.id)}
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
                <p>模块：{formatModule(activeDetail.module)}</p>
                <p>动作：{formatAction(activeDetail.action)}</p>
                <p>目标：{formatTargetType(activeDetail.targetType)} / {activeDetail.targetId || "暂无"}</p>
                <p>操作人：{activeDetail.operatorName || "系统"}</p>
                <p>结果：{activeDetail.success ? "成功" : "失败"}</p>
                <p>时间：{formatDateTime(activeDetail.createdAt)}</p>
                <p>来源 IP：{activeDetail.ipAddress || "暂无"}</p>
                <p>UA：{activeDetail.userAgent || "暂无"}</p>
                {activeDetail.restoredFromLogId ? <p>恢复来源日志：#{activeDetail.restoredFromLogId}</p> : null}
              </div>
            </div>

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
          </div>
        )}
      </Drawer>
    </div>
  );
}
