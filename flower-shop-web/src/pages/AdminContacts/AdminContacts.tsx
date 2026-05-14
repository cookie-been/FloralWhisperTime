import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Select, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Inbox, MailCheck, MessageSquareMore, Phone, Search, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getAdminContacts, markAdminContactRead } from "@/services/api";
import type { ContactMessage, PaginatedResult } from "@/types";

function formatDateTime(value?: string) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

export function AdminContacts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResult<ContactMessage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const initialStatus = searchParams.get("status");
  const [status, setStatus] = useState<"all" | "read" | "unread">(
    initialStatus === "read" || initialStatus === "unread" ? initialStatus : "all",
  );
  const hasActiveFilters = Boolean(keyword.trim()) || status !== "all";

  const load = async (
    nextPage = page,
    nextPageSize = pageSize,
    nextKeyword = keyword,
    nextStatus = status,
  ) => {
    setLoading(true);
    try {
      const result = await getAdminContacts({
        page: nextPage,
        limit: nextPageSize,
        keyword: nextKeyword.trim() || undefined,
        status: nextStatus,
      });
      setData(result);
      setPage(result.page);
      setPageSize(result.limit);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "留言加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, 10, keyword, status).catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (keyword.trim()) next.set("keyword", keyword.trim());
    if (status !== "all") next.set("status", status);
    setSearchParams(next, { replace: true });
  }, [keyword, setSearchParams, status]);

  const metrics = useMemo(() => {
    const list = data?.list ?? [];
    const latest = list[0];
    const readCount = list.filter((item) => Boolean(item.readAt)).length;
    const unreadCount = list.length - readCount;
    return [
      { label: "留言总数", value: data?.total ?? 0, note: "当前已收录的全部用户留言", icon: Inbox },
      { label: "当前页未读", value: unreadCount, note: "这一页仍需处理的留言数量", icon: MessageSquareMore },
      { label: "当前页已读", value: readCount, note: "这一页已经确认过的留言数量", icon: MailCheck },
      { label: "最近留言", value: latest?.name ?? "暂无", note: latest ? formatDateTime(latest.createdAt) : "还没有访客提交留言", icon: UserRound },
      { label: "联系电话", value: latest?.phone ?? "暂无", note: "最近一条留言中留下的联系方式", icon: Phone },
    ];
  }, [data]);

  const filterSummary = useMemo(() => {
    const parts = [];
    if (keyword.trim()) parts.push(`关键词“${keyword.trim()}”`);
    if (status === "read") parts.push("仅看已读");
    if (status === "unread") parts.push("仅看未读");
    return parts;
  }, [keyword, status]);

  const pageStats = useMemo(() => {
    const list = data?.list ?? [];
    const unreadCount = list.filter((item) => !item.readAt).length;
    const readCount = list.length - unreadCount;
    return { unreadCount, readCount };
  }, [data]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAdminContactRead(id);
      message.success("已标记为已读");
      await load(page, pageSize, keyword, status);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatus("all");
    load(1, pageSize, "", "all").catch(() => undefined);
  };

  const columns: ColumnsType<ContactMessage> = [
    {
      title: "访客",
      dataIndex: "name",
      width: 180,
      render: (name: string, record) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#1b281e]">{name}</p>
            {!record.readAt ? <Tag color="green">待处理</Tag> : null}
          </div>
          <p className="mt-1 text-xs text-muted">{record.id}</p>
        </div>
      ),
    },
    {
      title: "电话",
      dataIndex: "phone",
      width: 160,
      render: (phone: string) => <Tag color="green">{phone}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "readAt",
      width: 120,
      render: (readAt?: string | null) =>
        readAt ? <Tag color="default">已读</Tag> : <Tag color="green">未读</Tag>,
    },
    {
      title: "留言内容",
      dataIndex: "message",
      render: (content: string) => (
        <div>
          <p className="leading-7 text-[#33463a]">{truncateText(content, 86)}</p>
          {content.length > 86 ? <p className="admin-cell-note">完整留言请结合行内容继续查看。</p> : null}
        </div>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => <span className="text-sm text-muted">{formatDateTime(value)}</span>,
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      render: (_: unknown, record) =>
        record.readAt ? (
          <span className="text-sm text-muted">已处理</span>
        ) : (
          <Button size="small" className="admin-action-button" onClick={() => handleMarkRead(record.id)}>
            标记已读
          </Button>
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

      <section className="admin-toolbar p-5">
        <div>
          <p className="section-eyebrow">Inbox Filters</p>
          <h3 className="admin-section-title mt-2 text-xl">留言筛选</h3>
          <p className="mt-2 text-sm leading-6 text-muted">按访客、联系方式和已读状态快速定位需要优先处理的留言。</p>
        </div>
        <div className="mt-5">
          <p className="admin-filter-caption">Filter Controls</p>
        </div>
        <div className="admin-quick-filters">
          <Button type={status === "unread" ? "primary" : "default"} onClick={() => {
            setStatus("unread");
            load(1, pageSize, keyword, "unread").catch(() => undefined);
          }}>
            未读优先
          </Button>
          <Button type={status === "read" ? "primary" : "default"} onClick={() => {
            setStatus("read");
            load(1, pageSize, keyword, "read").catch(() => undefined);
          }}>
            只看已读
          </Button>
          <Button type={!keyword.trim() && status === "all" ? "primary" : "default"} onClick={resetFilters}>
            查看全部
          </Button>
        </div>
        <div className="admin-filter-grid lg:grid-cols-[minmax(0,1fr)_220px_140px]">
          <Input
            allowClear
            value={keyword}
            prefix={<Search size={16} />}
            placeholder="搜索姓名、电话或留言内容"
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => load(1, pageSize, keyword, status).catch(() => undefined)}
          />
          <Select
            value={status}
            options={[
              { label: "全部状态", value: "all" },
              { label: "未读", value: "unread" },
              { label: "已读", value: "read" },
            ]}
            onChange={(value: "all" | "read" | "unread") => {
              setStatus(value);
              load(1, pageSize, keyword, value).catch(() => undefined);
            }}
          />
          <Button type="primary" onClick={() => load(1, pageSize, keyword, status).catch(() => undefined)}>
            筛选留言
          </Button>
        </div>
        <div className="admin-filter-summary">
          <div className="admin-filter-summary-copy">
            <p>当前结果 {data?.list.length ?? 0} 条</p>
            <span>
              {hasActiveFilters
                ? `已应用 ${filterSummary.join(" · ")}`
                : `当前页未读 ${pageStats.unreadCount} 条，已读 ${pageStats.readCount} 条。`}
            </span>
          </div>
          {hasActiveFilters ? (
            <Button onClick={resetFilters}>清空筛选</Button>
          ) : null}
        </div>
      </section>

      <section className="admin-panel overflow-hidden p-0">
        <Table<ContactMessage>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={loading}
          locale={{
            emptyText: (
              <div className="admin-empty-state min-h-[220px]">
                <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                <h4>暂时还没有用户留言</h4>
                <p>当前还没有访客提交咨询或预约内容，后续会在这里集中查看。</p>
              </div>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `共 ${total} 条留言`,
            onChange: (nextPage, nextPageSize) => {
              load(nextPage, nextPageSize, keyword, status).catch(() => undefined);
            },
          }}
          rowClassName={(record) => (!record.readAt ? "admin-row-unread" : "")}
          scroll={{ x: 1080 }}
        />
      </section>
    </div>
  );
}
