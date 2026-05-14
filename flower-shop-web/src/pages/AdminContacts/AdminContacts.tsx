import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Select, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Inbox, MailCheck, MessageSquareMore, Phone, Search, UserRound } from "lucide-react";
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

export function AdminContacts() {
  const [data, setData] = useState<PaginatedResult<ContactMessage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");

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
    load(1, 10, "", "all").catch(() => undefined);
  }, []);

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

  const handleMarkRead = async (id: string) => {
    try {
      await markAdminContactRead(id);
      message.success("已标记为已读");
      await load(page, pageSize, keyword, status);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const columns: ColumnsType<ContactMessage> = [
    {
      title: "访客",
      dataIndex: "name",
      width: 180,
      render: (name: string, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{name}</p>
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
      render: (content: string) => <p className="whitespace-pre-wrap leading-7 text-[#33463a]">{content}</p>,
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
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
          scroll={{ x: 1080 }}
        />
      </section>
    </div>
  );
}
