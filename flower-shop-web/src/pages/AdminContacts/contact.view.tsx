import { Button, Popconfirm, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ContactMessage } from "@/types";
import { formatDateTime } from "@/utils/datetime";
import { renderAdminPendingTag, renderAdminReadStatusTag } from "@/utils/admin-status";
import { truncateText } from "@/utils/text";

interface BuildContactColumnsOptions {
  deletedFilter: "active" | "deleted";
  deletingId: string | null;
  onOpenDetail: (record: ContactMessage) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function buildContactColumns({
  deletedFilter,
  deletingId,
  onOpenDetail,
  onMarkRead,
  onDelete,
  onRestore,
}: BuildContactColumnsOptions): ColumnsType<ContactMessage> {
  return [
    {
      title: "访客",
      dataIndex: "name",
      width: 180,
      render: (name: string, record) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#1b281e]">{name}</p>
            {!record.readAt ? renderAdminPendingTag() : null}
          </div>
          <p className="mt-1 text-xs text-muted">提交于 {formatDateTime(record.createdAt)}</p>
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
      render: (readAt?: string | null) => renderAdminReadStatusTag(readAt),
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
      width: 220,
      render: (_: unknown, record) => (
        <Space>
          <Button
            size="small"
            className="admin-action-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(record);
            }}
          >
            查看详情
          </Button>
          {deletedFilter === "active" ? (
            <>
              {record.readAt ? (
                <span className="text-sm text-muted">已处理</span>
              ) : (
                <Button
                  size="small"
                  className="admin-action-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkRead(record.id);
                  }}
                >
                  标记已读
                </Button>
              )}
              <Popconfirm title="确认删除该留言？" okText="删除" cancelText="取消" onConfirm={() => onDelete(record.id)}>
                <Button
                  size="small"
                  danger
                  className="admin-action-button"
                  loading={deletingId === record.id}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Button
              size="small"
              type="primary"
              className="admin-action-button"
              loading={deletingId === record.id}
              onClick={(event) => {
                event.stopPropagation();
                onRestore(record.id);
              }}
            >
              恢复
            </Button>
          )}
        </Space>
      ),
    },
  ];
}
