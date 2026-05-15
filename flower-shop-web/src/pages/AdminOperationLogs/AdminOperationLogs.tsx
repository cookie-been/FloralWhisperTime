import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Drawer, Empty, Input, Popconfirm, Select, Space, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClipboardList, History, RefreshCw, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { getAdminOperationLogDetail, getAdminOperationLogs, restoreAdminOperationLog } from "@/services/api";
import type { OperationLogDetail, OperationLogItem, PaginatedResult } from "@/types";

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

export function AdminOperationLogs() {
  const [data, setData] = useState<PaginatedResult<OperationLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<OperationLogDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [module, setModule] = useState<string>();
  const [success, setSuccess] = useState<"all" | "true" | "false">("all");

  const load = async (
    nextPage = page,
    nextPageSize = pageSize,
    nextKeyword = keyword,
    nextModule = module,
    nextSuccess = success,
  ) => {
    setLoading(true);
    try {
      const result = await getAdminOperationLogs({
        page: nextPage,
        limit: nextPageSize,
        keyword: nextKeyword.trim() || undefined,
        module: nextModule || undefined,
        success: nextSuccess === "all" ? undefined : nextSuccess === "true",
      });
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
    void load(1, 10);
  }, []);

  const metrics = useMemo(() => {
    const list = data?.list ?? [];
    const successCount = list.filter((item) => item.success).length;
    const failedCount = list.length - successCount;
    const restorableCount = list.filter((item) => item.restorable).length;
    return [
      { label: "当前页日志", value: list.length, note: "展示当前筛选条件下的日志数量", icon: ClipboardList },
      { label: "成功操作", value: successCount, note: "已成功落库的后台写操作与登录行为", icon: History },
      { label: "失败操作", value: failedCount, note: "可用于排查失败请求与误操作链路", icon: ShieldAlert },
      { label: "可恢复记录", value: restorableCount, note: "具备变更前快照，可执行单条恢复", icon: RotateCcw },
    ];
  }, [data]);

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
      await load(page, pageSize, keyword, module, success);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setRestoringId(null);
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
      render: (value: string) => <Tag color="default">{formatAction(value)}</Tag>,
    },
    {
      title: "目标",
      key: "target",
      render: (_: unknown, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{record.targetType}</p>
          <p className="mt-1 text-xs text-muted">{record.targetId}</p>
        </div>
      ),
    },
    {
      title: "操作人",
      dataIndex: "operatorName",
      width: 140,
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
      render: (value: string) => <p className="line-clamp-2 text-sm leading-6 text-muted">{value || "暂无"}</p>,
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
              title="确认按该日志的变更前快照恢复数据？"
              description="恢复后会再生成一条新的恢复日志。"
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

      <section className="admin-panel p-5">
        <div className="flex flex-col gap-4">
          <Alert
            showIcon
            type="warning"
            message="恢复仅针对结构化数据快照"
            description="作品、配置、关于页、团队、时间轴、留言已读和 AI 配置支持单条恢复。上传图片文件仍建议通过备份目录兜底。"
          />
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.7fr_auto]">
            <Input
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
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
              value={success}
              onChange={setSuccess}
              options={[
                { label: "全部结果", value: "all" },
                { label: "仅成功", value: "true" },
                { label: "仅失败", value: "false" },
              ]}
            />
            <Button
              type="primary"
              icon={<RefreshCw size={16} />}
              onClick={() => void load(1, pageSize, keyword, module, success)}
            >
              刷新日志
            </Button>
          </div>
        </div>
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
                <p>后台写操作和登录行为会在这里持续沉淀，便于排查与恢复。</p>
              </div>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => void load(nextPage, nextPageSize, keyword, module, success),
          }}
        />
      </section>

      <Drawer
        width={720}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveDetail(null);
        }}
        title="日志详情"
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
              <p className="font-semibold text-[#1b281e]">基础信息</p>
              <div className="mt-3 space-y-2 text-muted">
                <p>模块：{formatModule(activeDetail.module)}</p>
                <p>动作：{formatAction(activeDetail.action)}</p>
                <p>目标：{activeDetail.targetType} / {activeDetail.targetId}</p>
                <p>操作人：{activeDetail.operatorName}</p>
                <p>时间：{formatDateTime(activeDetail.createdAt)}</p>
                <p>来源 IP：{activeDetail.ipAddress || "暂无"}</p>
                <p>UA：{activeDetail.userAgent || "暂无"}</p>
              </div>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">请求摘要</p>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.requestSummary || "暂无"}</pre>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">变更前快照</p>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.beforeSnapshot || "暂无"}</pre>
            </div>

            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">变更后快照</p>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-4 py-4 text-xs leading-6 text-[#33463a]">{activeDetail.afterSnapshot || "暂无"}</pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
