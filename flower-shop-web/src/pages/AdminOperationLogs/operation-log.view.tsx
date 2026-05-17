import { Button, Popconfirm, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { RotateCcw } from "lucide-react";
import type { OperationLogItem } from "@/types";
import { formatAdminActionLabel, formatAdminModuleLabel, formatAdminTargetTypeLabel } from "@/utils/admin-display";
import { formatDateTimeWithSeconds } from "@/utils/datetime";
import { renderAdminSuccessTag } from "@/utils/admin-status";
import { formatTargetIdentifier } from "./operation-log.helpers";

interface BuildOperationLogColumnsOptions {
  restoringId: number | null;
  onOpenDetail: (id: number) => void;
  onOpenRestore: (item: OperationLogItem) => void;
}

export function buildOperationLogColumns({
  restoringId,
  onOpenDetail,
  onOpenRestore,
}: BuildOperationLogColumnsOptions): ColumnsType<OperationLogItem> {
  return [
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => <span className="text-sm text-muted">{formatDateTimeWithSeconds(value, value)}</span>,
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 140,
      render: (value: string) => <Tag color="green">{formatAdminModuleLabel(value)}</Tag>,
    },
    {
      title: "动作",
      dataIndex: "action",
      width: 120,
      render: (value: string) => <Tag color={value === "RESTORE" ? "gold" : "default"}>{formatAdminActionLabel(value)}</Tag>,
    },
    {
      title: "目标",
      key: "target",
      width: 220,
      render: (_: unknown, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{formatAdminTargetTypeLabel(record.targetType, { archiveLabel: "操作日志归档" })}</p>
          <p className="mt-1 break-all text-xs text-muted">{formatTargetIdentifier(record.targetId)}</p>
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
      render: (value: boolean) => renderAdminSuccessTag(value),
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
        <Space wrap>
          <Button className="admin-action-button" size="small" onClick={() => onOpenDetail(record.id)}>
            查看详情
          </Button>
          {record.restorable ? (
            <Popconfirm
              title="确认按该日志快照恢复数据？"
              description="下一步需要填写恢复原因，并会新增一条恢复日志。"
              onConfirm={() => onOpenRestore(record)}
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
}

export function buildRestoreConfirmationState(options: {
  pendingRestoreId: number | null;
  restoringId: number | null;
  restoreReason: string;
  restoreConfirmText: string;
}) {
  const restoreConfirmPhrase = options.pendingRestoreId ? `恢复${options.pendingRestoreId}` : "";
  const disabled =
    !options.restoreReason.trim() ||
    !restoreConfirmPhrase ||
    options.restoreConfirmText.trim() !== restoreConfirmPhrase;

  return {
    restoreConfirmPhrase,
    confirmLoading: options.pendingRestoreId !== null && options.restoringId === options.pendingRestoreId,
    disabled,
  };
}
